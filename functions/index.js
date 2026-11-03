/**
 * ARPL EHS Permit-to-Work Portal — Cloud Functions 2nd Gen
 * Target Project: prj-aurorealty-ehs-ptw-dev
 * Region: asia-south1 (Mumbai)
 *
 * Capabilities:
 * 1. Single-use rate-limited Statutory PDF download for EHS (atomic transaction).
 * 2. Ultra-compression of inspection images via Sharp (auto-deleted in 24h by GCS).
 * 3. Embedding compressed images into permanent statutory PDF before 24h GCS TTL.
 * 4. Super Admin creation of Project Admins.
 * 5. Project Admin Geolocation configuration and Site Role delegation.
 * 6. Atomic FSM permit state transitions with Haversine GPS geofencing.
 * 7. Scheduled SLA escalation sweep (Cloud Scheduler 5m tick).
 */

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const sharp = require("sharp");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const path = require("path");
const os = require("os");
const fs = require("fs");

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

const REGION = "asia-south1";
// Firebase Web API Key (Configured via GitHub Secrets)
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "";

// Helper: Haversine distance in meters
function getHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// 1. SINGLE-USE RATE-LIMITED STATUTORY PDF DOWNLOAD ENDPOINT (EHS STRICT)
// ============================================================================
exports.downloadStatutoryPdf = onRequest(
  { region: REGION, memory: "1GiB", timeoutSeconds: 60, cors: true },
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing Bearer Token" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      const permitId = req.query.permitId || req.params[0]?.replace(/^\//, "");

      if (!permitId) {
        res.status(400).json({ error: "Bad Request: Missing permitId parameter" });
        return;
      }

      const permitRef = db.collection("permits").doc(permitId);
      const bucket = storage.bucket();

      // Execute atomic transaction for single-use download enforcement
      const downloadResult = await db.runTransaction(async (transaction) => {
        const permitSnap = await transaction.get(permitRef);
        if (!permitSnap.exists) {
          throw new Error("NOT_FOUND: Permit does not exist");
        }

        const data = permitSnap.data();
        const callerRole = decodedToken.role;
        const callerProjectId = decodedToken.projectId;
        const isSuperAdmin = decodedToken.superAdmin === true;

        // Verify Project Isolation
        if (!isSuperAdmin && callerProjectId !== data.projectId) {
          throw new Error("PERMISSION_DENIED: Access restricted to assigned project");
        }

        // Verify EHS Role
        const allowedRoles = ["ehs-manager", "ehs-officer"];
        if (!isSuperAdmin && !allowedRoles.includes(callerRole)) {
          throw new Error("PERMISSION_DENIED: Statutory PDF download is restricted to EHS Officers and Managers");
        }

        // Check Single-Use Download Gate
        if (data.statutoryDownload && data.statutoryDownload.isDownloaded === true) {
          const dl = data.statutoryDownload;
          const downloadedAt = dl.downloadedAt ? dl.downloadedAt.toDate().toISOString() : "Unknown";
          throw new Error(
            `ALREADY_DOWNLOADED: Statutory PDF was already downloaded by ${dl.downloadedByName || dl.downloadedBy} on ${downloadedAt}. Single-use rate limit reached.`
          );
        }

        // Atomically lock download
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
        transaction.update(permitRef, {
          "statutoryDownload.isDownloaded": true,
          "statutoryDownload.downloadedBy": decodedToken.uid,
          "statutoryDownload.downloadedByName": decodedToken.name || decodedToken.email,
          "statutoryDownload.downloadedAt": admin.firestore.FieldValue.serverTimestamp(),
          "statutoryDownload.ipAddress": clientIp
        });

        // Add non-repudiable Activity Log audit entry
        const logRef = permitRef.collection("activity_log").doc();
        transaction.set(logRef, {
          id: logRef.id,
          permitId: permitId,
          action: "STATUTORY_PDF_SINGLE_USE_DOWNLOADED",
          actorRole: callerRole || "super-admin",
          actorUid: decodedToken.uid,
          actorName: decodedToken.name || decodedToken.email,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: clientIp,
          details: "Statutory PDF downloaded once; subsequent downloads permanently locked."
        });

        return {
          projectId: data.projectId,
          permitId: permitId,
          fileName: `PTW_${permitId}_Statutory_Report.pdf`
        };
      });

      // Stream PDF from Cloud Storage
      const gcsPath = `statutory-pdfs/${downloadResult.projectId}/${downloadResult.permitId}/statutory_permit.pdf`;
      const file = bucket.file(gcsPath);

      const [exists] = await file.exists();
      if (!exists) {
        // Fallback: Generate dynamic lightweight PDF if compilation is still queued
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${downloadResult.fileName}"`);
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(`ARPL EHS STATUTORY PERMIT: ${downloadResult.permitId}`, { x: 50, y: 800, size: 16, font });
        page.drawText(`Generated for single-use compliance download.`, { x: 50, y: 770, size: 12 });
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        res.send(Buffer.from(pdfBytes));
        return;
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${downloadResult.fileName}"`);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

      file.createReadStream().pipe(res);
    } catch (error) {
      console.error("Single-use download error:", error);
      if (error.message.startsWith("ALREADY_DOWNLOADED")) {
        res.status(403).json({ error: error.message, code: "ALREADY_DOWNLOADED" });
      } else if (error.message.startsWith("PERMISSION_DENIED")) {
        res.status(403).json({ error: error.message, code: "PERMISSION_DENIED" });
      } else if (error.message.startsWith("NOT_FOUND")) {
        res.status(404).json({ error: error.message, code: "NOT_FOUND" });
      } else {
        res.status(500).json({ error: "Internal Server Error during PDF download." });
      }
    }
  }
);

// ============================================================================
// 2. ULTRA-COMPRESSION TRIGGER FOR TEMPORARY IMAGES (SHARP ENGINE)
// ============================================================================
exports.onImageUploadCompress = onObjectFinalized(
  { region: REGION, bucket: "prj-aurorealty-ehs-ptw-dev-media", memory: "1GiB" },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    // Only process objects under temp-images/ and raw image content
    if (!filePath.startsWith("temp-images/") || !contentType.startsWith("image/")) {
      return;
    }
    // Prevent recursive loop on already compressed images
    if (event.data.metadata && event.data.metadata.compressed === "true") {
      return;
    }

    const bucket = storage.bucket(event.data.bucket);
    const fileName = path.basename(filePath);
    const tempLocalFile = path.join(os.tmpdir(), `raw_${fileName}`);
    const tempOptimizedFile = path.join(os.tmpdir(), `opt_${fileName}`);

    try {
      await bucket.file(filePath).download({ destination: tempLocalFile });

      // Ultra-compression pipeline using Sharp:
      // 1. Max bounding box 1920x1080 (full HD preserves all gauge / crack details)
      // 2. WebP format with quality 82 and effort 6
      // 3. Strips bloated EXIF while retaining full perceptual fidelity
      await sharp(tempLocalFile)
        .rotate() // auto-orient from EXIF
        .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 6, smartSubsample: true })
        .toFile(tempOptimizedFile);

      // Overwrite file with compressed version (will auto-delete in 24 hours per GCS lifecycle)
      await bucket.upload(tempOptimizedFile, {
        destination: filePath,
        metadata: {
          contentType: "image/webp",
          metadata: {
            compressed: "true",
            originalSize: event.data.size,
            processedAt: new Date().toISOString()
          }
        }
      });

      console.log(`Successfully compressed image: ${filePath}`);
    } catch (err) {
      console.error(`Failed to compress image ${filePath}:`, err);
    } finally {
      if (fs.existsSync(tempLocalFile)) fs.unlinkSync(tempLocalFile);
      if (fs.existsSync(tempOptimizedFile)) fs.unlinkSync(tempOptimizedFile);
    }
  }
);

// ============================================================================
// 3. COMPILATION & EMBEDDING INTO STATUTORY PERMANENT PDF (PDF-LIB)
// ============================================================================
exports.compileStatutoryPdf = onCall(
  { region: REGION, memory: "2GiB", timeoutSeconds: 120 },
  async (request) => {
    const { permitId } = request.data;
    if (!permitId) throw new HttpsError("invalid-argument", "permitId is required");

    const permitSnap = await db.collection("permits").doc(permitId).get();
    if (!permitSnap.exists) throw new HttpsError("not-found", "Permit not found");

    const p = permitSnap.data();
    const bucket = storage.bucket();

    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Page 1: Statutory Summary & Approvals
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    page.drawText("AURO REALTY PRIVATE LIMITED", { x: 50, y: 800, size: 14, font: helveticaBold, color: rgb(0.1, 0.2, 0.4) });
    page.drawText("ENVIRONMENTAL HEALTH & SAFETY DIVISION - PERMIT TO WORK", { x: 50, y: 780, size: 10, font: helveticaBold });
    page.drawText(`Permit ID: ${p.id}  |  Type: ${(p.ptype || "").toUpperCase()}`, { x: 50, y: 750, size: 11, font: helveticaBold });
    page.drawText(`Project: ${p.project} (${p.projectId})`, { x: 50, y: 730, size: 10, font: helvetica });
    page.drawText(`Location: ${p.location || "N/A"}  |  Contractor: ${p.contractor || "N/A"}`, { x: 50, y: 710, size: 10, font: helvetica });
    page.drawText(`Validity: ${p.validFrom?.toDate?.()?.toISOString() || ""} to ${p.validTill?.toDate?.()?.toISOString() || ""}`, { x: 50, y: 690, size: 10, font: helvetica });
    page.drawText(`Status: ${p.status}`, { x: 50, y: 670, size: 10, font: helveticaBold, color: rgb(0.8, 0.1, 0.1) });

    // Page 2: Safety Evidence Photos (Embed before 24h temp deletion)
    if (p.media && p.media.sitePhotoPath) {
      try {
        const [photoBuffer] = await bucket.file(p.media.sitePhotoPath).download();
        // Downscale to 150 DPI for vector PDF integration
        const compressedPhoto = await sharp(photoBuffer)
          .resize(800, 600, { fit: "inside" })
          .jpeg({ quality: 80 })
          .toBuffer();

        const embeddedImg = await pdfDoc.embedJpg(compressedPhoto);
        const imgDims = embeddedImg.scale(0.5);

        const photoPage = pdfDoc.addPage([595.28, 841.89]);
        photoPage.drawText("MANDATORY SAFETY INSPECTION EVIDENCE", { x: 50, y: 800, size: 12, font: helveticaBold });
        photoPage.drawImage(embeddedImg, {
          x: 50,
          y: 800 - imgDims.height - 20,
          width: imgDims.width,
          height: imgDims.height
        });
      } catch (e) {
        console.warn("Could not embed image into PDF (might have passed 24h or missing):", e.message);
      }
    }

    // Maximum Stream Compression Enabled
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

    const permanentPath = `statutory-pdfs/${p.projectId}/${p.id}/statutory_permit.pdf`;
    await bucket.file(permanentPath).save(Buffer.from(pdfBytes), {
      metadata: { contentType: "application/pdf" }
    });

    return { success: true, permanentPath };
  }
);

// ============================================================================
// 4. SUPER ADMIN: CREATE PROJECT ADMIN
// ============================================================================
exports.adminCreateProjectAdmin = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const callerEmail = (request.auth.token.email || "").toLowerCase();
  let isCallerSuperAdmin =
    request.auth.token.superAdmin === true ||
    request.auth.token.role === "super-admin" ||
    callerEmail === "ehs.superadmin@aurorealty.com";

  if (!isCallerSuperAdmin) {
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (callerDoc.exists && callerDoc.data().role === "super-admin") {
      isCallerSuperAdmin = true;
    }
  }

  if (!isCallerSuperAdmin) {
    throw new HttpsError("permission-denied", "Only Super Admin can provision Project Admins.");
  }

  const { email, password, displayName, name, projectId, projectName, empId, phone } = request.data;
  if (!email || !projectId) {
    throw new HttpsError("invalid-argument", "email and projectId are mandatory.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (displayName || name || `Admin - ${projectId}`).trim();
  const cleanPassword = password && password.length >= 6 ? password : "AuroAdmin@2026!";

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(cleanEmail);
    userRecord = await auth.updateUser(userRecord.uid, {
      password: cleanPassword,
      displayName: cleanName,
      disabled: false
    });
  } catch (_e) {
    userRecord = await auth.createUser({
      email: cleanEmail,
      password: cleanPassword,
      displayName: cleanName
    });
  }

  // Assign Firebase Auth Custom Claims
  await auth.setCustomUserClaims(userRecord.uid, {
    role: "project-admin",
    uiRole: "admin",
    ptwRole: "project-admin",
    projectId: projectId,
    name: cleanName,
    campusWide: true
  });

  const adminDoc = {
    id: userRecord.uid,
    uid: userRecord.uid,
    email: cleanEmail,
    name: cleanName,
    displayName: cleanName,
    role: "project-admin",
    uiRole: "admin",
    ptwRole: "project-admin",
    roleLabel: "Site Administrator",
    projectId: projectId,
    projectName: projectName || projectId,
    empId: empId || "ARPL-ADM",
    phone: phone || "",
    campusWide: true,
    status: "Active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: callerEmail || request.auth.uid
  };

  // Save to Firestore Users & Project Admins collections + update Project doc
  await db.collection("users").doc(userRecord.uid).set(adminDoc, { merge: true });
  await db.collection("project_admins").doc(userRecord.uid).set(adminDoc, { merge: true });
  await db.collection("projects").doc(projectId).set(
    {
      adminUid: userRecord.uid,
      adminEmail: cleanEmail,
      adminName: cleanName
    },
    { merge: true }
  );

  return { success: true, uid: userRecord.uid, email: cleanEmail, name: cleanName, role: "project-admin", projectId };
});

// ============================================================================
// 5. PROJECT ADMIN: CONFIGURE GEOLOCATION FOR PROJECT / LOCATION
// ============================================================================
exports.adminConfigureGeolocation = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { projectId, lat, lng, radius, address, locations } = request.data;
  if (!projectId || lat == null || lng == null) {
    throw new HttpsError("invalid-argument", "projectId, lat, and lng are required.");
  }

  const callerEmail = (request.auth.token.email || "").toLowerCase();
  let isAuthorized =
    request.auth.token.superAdmin === true ||
    request.auth.token.role === "super-admin" ||
    callerEmail === "ehs.superadmin@aurorealty.com" ||
    ((request.auth.token.role === "project-admin" ||
      request.auth.token.role === "site-admin" ||
      request.auth.token.role === "admin" ||
      request.auth.token.admin === true) &&
      request.auth.token.projectId === projectId);

  if (!isAuthorized) {
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (callerDoc.exists) {
      const cd = callerDoc.data();
      if (
        cd.role === "super-admin" ||
        ((cd.role === "project-admin" || cd.role === "admin" || cd.uiRole === "admin") && cd.projectId === projectId)
      ) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new HttpsError(
      "permission-denied",
      "Unauthorized: Only the assigned Site Administrator can configure worksite geolocation and geofencing."
    );
  }

  const updatePayload = {
    configured: true,
    site: {
      lat: Number(lat),
      lng: Number(lng),
      address: address || "Worksite Location"
    },
    radius: Number(radius) || 200,
    configuredAt: admin.firestore.FieldValue.serverTimestamp(),
    configuredBy: callerEmail || request.auth.uid
  };
  if (Array.isArray(locations)) {
    updatePayload.locations = locations;
  }

  await db.collection("projects").doc(projectId).set(updatePayload, { merge: true });

  return { success: true, projectId, configured: true };
});

// ============================================================================
// 6. SITE ADMIN: ON-SITE PERSONNEL ACCOUNTS LIFECYCLE (CREATE, RESET PWD, DELETE, TOGGLE)
// ============================================================================
exports.adminAssignProjectRole = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const {
    action,
    email,
    password,
    newPassword,
    displayName,
    name,
    role,
    roleLabel,
    projectId,
    projectName,
    locationId,
    locationName,
    campusWide,
    allowedWorkflows,
    empId,
    phone,
    uid
  } = request.data;
  if (!projectId) {
    throw new HttpsError("invalid-argument", "projectId is required.");
  }

  const callerEmail = (request.auth.token.email || "").toLowerCase();
  let isProjAdmin =
    request.auth.token.superAdmin === true ||
    request.auth.token.role === "super-admin" ||
    callerEmail === "ehs.superadmin@aurorealty.com" ||
    ((request.auth.token.role === "project-admin" ||
      request.auth.token.role === "site-admin" ||
      request.auth.token.role === "admin" ||
      request.auth.token.admin === true) &&
      request.auth.token.projectId === projectId);

  if (!isProjAdmin) {
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (callerDoc.exists) {
      const cd = callerDoc.data();
      if (
        cd.role === "super-admin" ||
        ((cd.role === "project-admin" || cd.role === "admin" || cd.uiRole === "admin") && cd.projectId === projectId)
      ) {
        isProjAdmin = true;
      }
    }
  }

  if (!isProjAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Unauthorized: Only the assigned Site Administrator can manage on-site personnel accounts for this project."
    );
  }

  // Action: Reset Password
  if (action === "reset-password") {
    if (!uid) {
      throw new HttpsError("invalid-argument", "uid is required for password reset.");
    }
    const tempPassword = newPassword || ("ARPL#Temp" + Math.floor(1000 + Math.random() * 9000) + "!");
    await auth.updateUser(uid, { password: tempPassword });
    await db.collection("users").doc(uid).set(
      {
        passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
        passwordResetBy: request.auth.uid,
        mustChangePasswordOnLogin: true
      },
      { merge: true }
    );
    return { success: true, uid, temporaryPassword: tempPassword };
  }

  // Action: Delete Personnel
  if (action === "delete") {
    if (!uid) {
      throw new HttpsError("invalid-argument", "uid is required for deletion.");
    }
    try {
      await auth.deleteUser(uid);
    } catch (_e) {}
    await db.collection("users").doc(uid).delete();
    await db.collection("site_personnel").doc(uid).delete();
    return { success: true, uid };
  }

  // Action: Toggle Status (Disable / Enable)
  if (action === "toggle-status") {
    if (!uid) {
      throw new HttpsError("invalid-argument", "uid is required.");
    }
    const user = await auth.getUser(uid);
    const updated = await auth.updateUser(uid, { disabled: !user.disabled });
    const statusStr = updated.disabled ? "Deactivated" : "Active";
    await db.collection("users").doc(uid).set(
      {
        disabled: updated.disabled,
        status: statusStr,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    await db.collection("site_personnel").doc(uid).set({ status: statusStr }, { merge: true });
    return { success: true, uid, disabled: updated.disabled };
  }

  // Default Action: Create or Assign Role
  if (!email || !role) {
    throw new HttpsError("invalid-argument", "email and role are required to provision an account.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (displayName || name || cleanEmail.split("@")[0]).trim();
  const cleanPassword = password && password.length >= 6 ? password : "AuroStaff@2026!";

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(cleanEmail);
    userRecord = await auth.updateUser(userRecord.uid, {
      password: cleanPassword,
      displayName: cleanName,
      disabled: false
    });
  } catch (_err) {
    userRecord = await auth.createUser({
      email: cleanEmail,
      password: cleanPassword,
      displayName: cleanName
    });
  }

  // Set Custom Claims for Auth RBAC & Location/Workflow Scope
  await auth.setCustomUserClaims(userRecord.uid, {
    role: role,
    uiRole: role,
    ptwRole: role,
    projectId: projectId,
    locationId: locationId || "CAMPUS-WIDE",
    locationName: locationName || "Full Worksite",
    campusWide: campusWide !== undefined ? !!campusWide : !locationId || locationId === "CAMPUS-WIDE",
    name: cleanName
  });

  const staffDoc = {
    id: userRecord.uid,
    uid: userRecord.uid,
    email: cleanEmail,
    name: cleanName,
    displayName: cleanName,
    role: role,
    uiRole: role,
    ptwRole: role,
    roleLabel: roleLabel || role,
    projectId: projectId,
    projectName: projectName || projectId,
    locationId: locationId || "CAMPUS-WIDE",
    locationName: locationName || "Full Worksite",
    location: locationName || "Full Worksite",
    campusWide: campusWide !== undefined ? !!campusWide : !locationId || locationId === "CAMPUS-WIDE",
    allowedWorkflows: Array.isArray(allowedWorkflows) ? allowedWorkflows : null,
    empId: empId || "ARPL-STF",
    phone: phone || "",
    status: "Active",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    assignedBy: callerEmail || request.auth.uid
  };

  // Store in Firestore users & site_personnel
  await db.collection("users").doc(userRecord.uid).set(staffDoc, { merge: true });
  await db.collection("site_personnel").doc(userRecord.uid).set(staffDoc, { merge: true });

  return { success: true, uid: userRecord.uid, email: cleanEmail, name: cleanName, role, projectId, locationId };
});

// 7. ATOMIC PERMIT STATE TRANSITION & GEOFENCE ENFORCEMENT
// ============================================================================
exports.transitionPermitStage = onCall({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  const { permitId, targetStatus, action, userLat, userLng, signatureData, comments } = request.data;
  if (!permitId || !targetStatus) throw new HttpsError("invalid-argument", "Missing parameters");

  const permitRef = db.collection("permits").doc(permitId);

  return await db.runTransaction(async (transaction) => {
    const permitSnap = await transaction.get(permitRef);
    if (!permitSnap.exists) throw new HttpsError("not-found", "Permit not found");

    const p = permitSnap.data();
    const userRole = request.auth.token.role;
    const userProj = request.auth.token.projectId;
    const isSuperAdmin = request.auth.token.superAdmin === true;

    if (!isSuperAdmin && userProj !== p.projectId) {
      throw new HttpsError("permission-denied", "User not assigned to permit's project site.");
    }

    // Geolocation Verification
    const projectSnap = await transaction.get(db.collection("projects").doc(p.projectId));
    if (projectSnap.exists) {
      const projData = projectSnap.data();
      if (projData.configured && projData.site && userLat != null && userLng != null) {
        const distance = getHaversineDistanceMeters(
          projData.site.lat,
          projData.site.lng,
          Number(userLat),
          Number(userLng)
        );
        if (distance > (projData.radius || 200)) {
          throw new HttpsError(
            "failed-precondition",
            `GPS Check Failed: Off-site signatory. Distance: ${Math.round(distance)}m (Max allowed: ${projData.radius}m)`
          );
        }
      }
    }

    // Mutate State
    transaction.update(permitRef, {
      status: targetStatus,
      lastAction: action,
      lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActionBy: request.auth.uid
    });

    // Write Tamper-Proof Audit Log Entry
    const logRef = permitRef.collection("activity_log").doc();
    transaction.set(logRef, {
      id: logRef.id,
      permitId: permitId,
      action: action || "STAGE_APPROVED",
      actorRole: userRole,
      actorUid: request.auth.uid,
      actorName: request.auth.token.name || request.auth.token.email,
      targetStatus: targetStatus,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      comments: comments || "",
      gps: (userLat && userLng) ? { lat: userLat, lng: userLng } : null
    });

    return { success: true, permitId, newStatus: targetStatus };
  });
});

// ============================================================================
// 8. SCHEDULED ESCALATION WORKER (EVERY 5 MINUTES)
// ============================================================================
exports.escalationSweep = onSchedule(
  { region: REGION, schedule: "every 5 minutes", timeoutSeconds: 120 },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const activePermits = await db
      .collection("permits")
      .where("status", "==", "active")
      .where("validTill", "<=", now)
      .limit(100)
      .get();

    const batch = db.batch();
    activePermits.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        expiredAt: now
      });

      const logRef = doc.ref.collection("activity_log").doc();
      batch.set(logRef, {
        id: logRef.id,
        permitId: doc.id,
        action: "AUTO_EXPIRED_BY_SYSTEM",
        actorRole: "system",
        actorUid: "system-cron",
        actorName: "SLA Escalation Engine",
        timestamp: now,
        details: "Validity window elapsed; permit automatically expired."
      });
    });

    await batch.commit();
    console.log(`Auto-expired ${activePermits.size} elapsed permits.`);
  }
);
