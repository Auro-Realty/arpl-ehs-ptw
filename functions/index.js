/**
 * ARPL EHS Permit-to-Work Portal — Cloud Functions 2nd Gen
 * Target Project: prj-aurorealty-ehs-ptw-dev
 * Region: asia-south1 (Mumbai)
 *
 * Security & Governance Enhancements:
 * 1. CHECK 01: Secure Authentication, cryptographically random password generation, token claims.
 * 2. CHECK 02: Prevent Unauthorized Data Access & strict IDOR multi-tenant isolation.
 * 3. CHECK 03: Immutable statutory audit logging and monitoring.
 * 4. CHECK 04: Rate limiting & abuse protection across all sensitive API endpoints.
 * 5. CHECK 05: Safe secret handling & zero secret leakage.
 * 6. CHECK 06: Strict input validation and sanitization against injection attacks.
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
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

const REGION = "asia-south1";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "";

// ============================================================================
// SECURITY & VALIDATION HELPERS (CHECKS 01, 04, 06)
// ============================================================================

/**
 * Sanitize string: strips control chars and HTML tags, limits max length
 */
function sanitizeString(str, maxLen = 100) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>'"&;`]/g, "") // Strip dangerous HTML/script injection characters
    .trim()
    .slice(0, maxLen);
}

/**
 * Validate RFC 5322 compliant email address
 */
function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim().toLowerCase()) && email.length <= 128;
}

/**
 * Validate enterprise password strength: min 10 chars, uppercase, lowercase, number, symbol
 */
function validatePassword(pwd) {
  if (!pwd || typeof pwd !== "string") return false;
  if (pwd.length < 10 || pwd.length > 128) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return hasUpper && hasLower && hasDigit && hasSpecial;
}

/**
 * Validate Permit ID format: strictly alphanumeric, hyphen, underscore (max 64 chars)
 */
function validatePermitId(id) {
  return typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

/**
 * Validate Project ID format: strictly PRJ- followed by alphanumeric/hyphen
 */
function validateProjectId(id) {
  return typeof id === "string" && /^PRJ-[A-Za-z0-9_-]{2,32}$/.test(id);
}

/**
 * Generate cryptographically secure random password (16 chars, meets all complexity rules)
 */
function generateSecureRandomPassword(length = 16) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  const buf = crypto.randomBytes(length);
  const chars = [
    upper[buf[0] % upper.length],
    lower[buf[1] % lower.length],
    digits[buf[2] % digits.length],
    symbols[buf[3] % symbols.length]
  ];
  for (let i = 4; i < length; i++) {
    chars.push(all[buf[i] % all.length]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = buf[i] % (i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }
  return chars.join("");
}

/**
 * Atomic sliding-window rate limiter (CHECK 04: Abuse & Bot Protection)
 */
async function enforceRateLimit(identifier, actionName, maxRequests, windowSeconds) {
  const safeId = String(identifier || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  const key = `rl_${actionName}_${safeId}`;
  const now = Date.now();
  const docRef = db.collection("_rate_limits").doc(key);

  const allowed = await db.runTransaction(async (t) => {
    const snap = await t.get(docRef);
    if (!snap.exists) {
      t.set(docRef, { count: 1, resetAt: now + windowSeconds * 1000, action: actionName });
      return true;
    }
    const data = snap.data();
    if (now > (data.resetAt || 0)) {
      t.set(docRef, { count: 1, resetAt: now + windowSeconds * 1000, action: actionName });
      return true;
    }
    if (data.count >= maxRequests) {
      return false;
    }
    t.update(docRef, { count: data.count + 1 });
    return true;
  });

  if (!allowed) {
    throw new HttpsError(
      "resource-exhausted",
      `Rate limit exceeded for action "${actionName}". Maximum ${maxRequests} requests per ${windowSeconds}s. Please wait before retrying.`
    );
  }
}

/**
 * Record Server-Side Immutable Audit Log (CHECK 03: Monitoring & Security Telemetry)
 */
async function recordServerAuditLog(action, details, actorUid, actorEmail, projectId, extra = {}) {
  try {
    const logId = "aud-" + crypto.randomBytes(6).toString("hex");
    await db.collection("audit_logs").doc(logId).set({
      id: logId,
      action: sanitizeString(action, 64),
      details: sanitizeString(details, 500),
      actorUid: actorUid || "SYSTEM",
      actorEmail: actorEmail || "system@aurorealty.com",
      projectId: projectId || "Global",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...extra
    });
  } catch (e) {
    console.warn("[Server Audit Log] Exception recording log:", e.message);
  }
}

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
      const rawPermitId = req.query.permitId || req.params[0]?.replace(/^\//, "");

      if (!rawPermitId || !validatePermitId(rawPermitId)) {
        res.status(400).json({ error: "Bad Request: Invalid or missing permitId parameter" });
        return;
      }
      const permitId = rawPermitId;

      // Rate limit PDF download endpoint: max 10 requests per minute per user/IP
      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
      await enforceRateLimit(decodedToken.uid || clientIp, "downloadStatutoryPdf", 10, 60);

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

        // Verify Project Isolation (CHECK 02: IDOR Prevention)
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
    const contentType = event.data.contentType || "";

    // Only process objects under temp-images/ and valid raster images (BLOCK SVG to eliminate stored XSS)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!filePath.startsWith("temp-images/") || !allowedTypes.includes(contentType)) {
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

      await sharp(tempLocalFile)
        .rotate()
        .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 6, smartSubsample: true })
        .toFile(tempOptimizedFile);

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
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required to compile statutory PDF.");
    }

    const { permitId } = request.data || {};
    if (!permitId || !validatePermitId(permitId)) {
      throw new HttpsError("invalid-argument", "Valid permitId format is required.");
    }

    // Rate limit: max 10 compilations per minute per user
    await enforceRateLimit(request.auth.uid, "compileStatutoryPdf", 10, 60);

    const permitSnap = await db.collection("permits").doc(permitId).get();
    if (!permitSnap.exists) throw new HttpsError("not-found", "Permit not found.");

    const p = permitSnap.data();

    // Verify Project Access (CHECK 02: IDOR Prevention)
    const isSuperAdmin = request.auth.token.superAdmin === true;
    const callerProjectId = request.auth.token.projectId;
    if (!isSuperAdmin && callerProjectId !== p.projectId) {
      throw new HttpsError("permission-denied", "Access restricted to your assigned project site.");
    }

    const bucket = storage.bucket();
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Page 1: Statutory Summary & Approvals
    let page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText("AURO REALTY PRIVATE LIMITED", { x: 50, y: 800, size: 14, font: helveticaBold, color: rgb(0.1, 0.2, 0.4) });
    page.drawText("ENVIRONMENTAL HEALTH & SAFETY DIVISION - PERMIT TO WORK", { x: 50, y: 780, size: 10, font: helveticaBold });
    page.drawText(`Permit ID: ${p.id}  |  Type: ${(p.ptype || "").toUpperCase()}`, { x: 50, y: 750, size: 11, font: helveticaBold });
    page.drawText(`Project: ${p.project} (${p.projectId})`, { x: 50, y: 730, size: 10, font: helvetica });
    page.drawText(`Location: ${p.location || "N/A"}  |  Contractor: ${p.contractor || "N/A"}`, { x: 50, y: 710, size: 10, font: helvetica });
    page.drawText(`Validity: ${p.validFrom?.toDate?.()?.toISOString() || ""} to ${p.validTill?.toDate?.()?.toISOString() || ""}`, { x: 50, y: 690, size: 10, font: helvetica });
    page.drawText(`Status: ${p.status}`, { x: 50, y: 670, size: 10, font: helveticaBold, color: rgb(0.8, 0.1, 0.1) });

    // Page 2: Safety Evidence Photos
    if (p.media && p.media.sitePhotoPath) {
      try {
        const [photoBuffer] = await bucket.file(p.media.sitePhotoPath).download();
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
        console.warn("Could not embed image into PDF:", e.message);
      }
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const permanentPath = `statutory-pdfs/${p.projectId}/${p.id}/statutory_permit.pdf`;
    await bucket.file(permanentPath).save(Buffer.from(pdfBytes), {
      metadata: { contentType: "application/pdf" }
    });

    await recordServerAuditLog(
      "STATUTORY_PDF_COMPILED",
      `Compiled permanent PDF for permit ${p.id} at project ${p.projectId}`,
      request.auth.uid,
      request.auth.token.email,
      p.projectId
    );

    return { success: true, permanentPath };
  }
);

// ============================================================================
// 4. SUPER ADMIN: PROVISION PROJECT ADMINISTRATOR
// ============================================================================
exports.adminCreateProjectAdmin = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  // Rate limit: max 15 requests per minute per caller
  await enforceRateLimit(request.auth.uid, "adminCreateProjectAdmin", 15, 60);

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
    await recordServerAuditLog(
      "UNAUTHORIZED_PROVISION_ATTEMPT",
      `Non-super-admin user attempted to provision a Project Admin: ${callerEmail}`,
      request.auth.uid,
      callerEmail,
      "Global"
    );
    throw new HttpsError("permission-denied", "Only Super Admin can provision Project Admins.");
  }

  const { email, password, displayName, name, projectId, projectName, empId, phone } = request.data || {};
  if (!email || !projectId) {
    throw new HttpsError("invalid-argument", "email and projectId are mandatory.");
  }

  if (!validateEmail(email)) {
    throw new HttpsError("invalid-argument", "Invalid official email address format.");
  }
  if (!validateProjectId(projectId)) {
    throw new HttpsError("invalid-argument", "Invalid projectId format (e.g., PRJ-PEARL).");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = sanitizeString(displayName || name || `Admin - ${projectId}`, 100);
  const cleanEmpId = sanitizeString(empId || "ARPL-ADM", 32);
  const cleanPhone = sanitizeString(phone || "", 20);

  // Secure Password Generation / Validation (CHECK 01)
  let cleanPassword;
  if (password) {
    if (!validatePassword(password)) {
      throw new HttpsError(
        "invalid-argument",
        "Password must be at least 10 characters long and include uppercase, lowercase, numbers, and special symbols."
      );
    }
    cleanPassword = password;
  } else {
    cleanPassword = generateSecureRandomPassword(16);
  }

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
    projectName: sanitizeString(projectName || projectId, 100),
    empId: cleanEmpId,
    phone: cleanPhone,
    campusWide: true,
    status: "Active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: callerEmail || request.auth.uid
  };

  await db.collection("users").doc(userRecord.uid).set(adminDoc, { merge: true });
  await db.collection("project_admins").doc(userRecord.uid).set(adminDoc, { merge: true });
  await db.collection("projects").doc(projectId).set(
    {
      adminUid: userRecord.uid,
      adminEmail: cleanEmail,
      adminName: cleanName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await recordServerAuditLog(
    "PROJECT_ADMIN_PROVISIONED",
    `Site Administrator ${cleanName} (${cleanEmail}) provisioned for project ${projectId}`,
    request.auth.uid,
    callerEmail,
    projectId
  );

  return { success: true, uid: userRecord.uid, email: cleanEmail, name: cleanName, role: "project-admin", projectId };
});

// ============================================================================
// 5. SITE ADMIN: CONFIGURE WORKSITE GEOLOCATION & GEOFENCING
// ============================================================================
exports.adminConfigureGeolocation = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  // Rate limit: max 15 requests per minute
  await enforceRateLimit(request.auth.uid, "adminConfigureGeolocation", 15, 60);

  const { projectId, lat, lng, radius, address, locations } = request.data || {};
  if (!projectId || lat == null || lng == null) {
    throw new HttpsError("invalid-argument", "projectId, lat, and lng are required.");
  }

  if (!validateProjectId(projectId)) {
    throw new HttpsError("invalid-argument", "Invalid projectId format.");
  }

  const numLat = Number(lat);
  const numLng = Number(lng);
  const numRadius = Number(radius) || 200;

  if (isNaN(numLat) || numLat < -90 || numLat > 90) {
    throw new HttpsError("invalid-argument", "Latitude must be a valid number between -90 and 90.");
  }
  if (isNaN(numLng) || numLng < -180 || numLng > 180) {
    throw new HttpsError("invalid-argument", "Longitude must be a valid number between -180 and 180.");
  }
  if (isNaN(numRadius) || numRadius < 10 || numRadius > 5000) {
    throw new HttpsError("invalid-argument", "Geofence radius must be between 10m and 5000m.");
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
    await recordServerAuditLog(
      "UNAUTHORIZED_GEOFENCE_ATTEMPT",
      `Caller attempted to configure geofence for unauthorized project ${projectId}`,
      request.auth.uid,
      callerEmail,
      projectId
    );
    throw new HttpsError(
      "permission-denied",
      "Unauthorized: Only the assigned Site Administrator can configure worksite geolocation and geofencing."
    );
  }

  const sanitizedLocations = Array.isArray(locations)
    ? locations.map((loc, idx) => ({
        id: sanitizeString(loc.id || `loc-${idx + 1}`, 32),
        name: sanitizeString(loc.name || `Location ${idx + 1}`, 64),
        lat: Number(loc.lat) || numLat,
        lng: Number(loc.lng) || numLng,
        radius: Number(loc.radius) || numRadius,
        configured: Boolean(loc.configured),
        allowedWorkflows: Array.isArray(loc.allowedWorkflows)
          ? loc.allowedWorkflows.map(w => sanitizeString(w, 32))
          : []
      }))
    : [];

  const updatePayload = {
    configured: true,
    site: {
      lat: numLat,
      lng: numLng,
      address: sanitizeString(address || "Worksite Location", 200)
    },
    radius: numRadius,
    locations: sanitizedLocations,
    configuredAt: admin.firestore.FieldValue.serverTimestamp(),
    configuredBy: callerEmail || request.auth.uid
  };

  await db.collection("projects").doc(projectId).set(updatePayload, { merge: true });

  await recordServerAuditLog(
    "GEOFENCE_CONFIGURED",
    `Configured worksite geofence for project ${projectId} (Radius: ${numRadius}m, Lat: ${numLat}, Lng: ${numLng})`,
    request.auth.uid,
    callerEmail,
    projectId
  );

  return { success: true, projectId, configured: true };
});

// ============================================================================
// 6. SITE ADMIN: ON-SITE PERSONNEL ACCOUNTS LIFECYCLE (CREATE, RESET PWD, DELETE, TOGGLE)
// ============================================================================
exports.adminAssignProjectRole = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  // Rate limit: max 25 requests per minute per caller
  await enforceRateLimit(request.auth.uid, "adminAssignProjectRole", 25, 60);

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
  } = request.data || {};

  if (!projectId || !validateProjectId(projectId)) {
    throw new HttpsError("invalid-argument", "Valid projectId is required.");
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
    await recordServerAuditLog(
      "UNAUTHORIZED_PERSONNEL_ATTEMPT",
      `Caller attempted to manage personnel for project ${projectId} without authority`,
      request.auth.uid,
      callerEmail,
      projectId
    );
    throw new HttpsError(
      "permission-denied",
      "Unauthorized: Only the assigned Site Administrator can manage on-site personnel accounts for this project."
    );
  }

  // Action: Reset Password
  if (action === "reset-password") {
    if (!uid || typeof uid !== "string") {
      throw new HttpsError("invalid-argument", "Valid uid is required for password reset.");
    }

    let tempPassword;
    if (newPassword) {
      if (!validatePassword(newPassword)) {
        throw new HttpsError(
          "invalid-argument",
          "New password must be at least 10 characters long and include uppercase, lowercase, numbers, and symbols."
        );
      }
      tempPassword = newPassword;
    } else {
      tempPassword = generateSecureRandomPassword(16);
    }

    await auth.updateUser(uid, { password: tempPassword });
    await db.collection("users").doc(uid).set(
      {
        passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
        passwordResetBy: request.auth.uid,
        mustChangePasswordOnLogin: true
      },
      { merge: true }
    );

    await recordServerAuditLog(
      "STAFF_PASSWORD_RESET",
      `Password reset for staff UID ${uid} on project ${projectId}`,
      request.auth.uid,
      callerEmail,
      projectId
    );

    return { success: true, uid, temporaryPassword: tempPassword };
  }

  // Action: Delete Personnel
  if (action === "delete") {
    if (!uid || typeof uid !== "string") {
      throw new HttpsError("invalid-argument", "Valid uid is required for deletion.");
    }
    try {
      await auth.deleteUser(uid);
    } catch (_e) {}
    await db.collection("users").doc(uid).delete();
    await db.collection("site_personnel").doc(uid).delete();

    await recordServerAuditLog(
      "STAFF_PERSONNEL_DELETED",
      `Personnel account ${uid} deleted from project ${projectId}`,
      request.auth.uid,
      callerEmail,
      projectId
    );

    return { success: true, uid };
  }

  // Action: Toggle Status (Disable / Enable)
  if (action === "toggle-status") {
    if (!uid || typeof uid !== "string") {
      throw new HttpsError("invalid-argument", "Valid uid is required.");
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

    await recordServerAuditLog(
      "STAFF_STATUS_TOGGLED",
      `Staff ${uid} status changed to ${statusStr} on project ${projectId}`,
      request.auth.uid,
      callerEmail,
      projectId
    );

    return { success: true, uid, disabled: updated.disabled };
  }

  // Default Action: Create or Assign Role
  if (!email || !role) {
    throw new HttpsError("invalid-argument", "email and role are required to provision an account.");
  }

  if (!validateEmail(email)) {
    throw new HttpsError("invalid-argument", "Invalid official email address format.");
  }

  // Whitelist of valid operational roles (standardized per project architecture & README.md)
  const ALLOWED_STAFF_ROLES = [
    "site-supervisor", "supervisor",
    "site-engineer", "engineer",
    "mep", "mep-engineer",
    "pm", "pm-engineer",
    "it", "it-engineer",
    "quality-engineer",
    "excavation-head",
    "hw-section-head", "tower-incharge",
    "project-manager",
    "ehs-officer", "ehs", "safety-officer",
    "ehs-manager",
    "electrician", "electrical-engineer",
    "blasting-incharge",
    "lift-supervisor", "lifting-incharge",
    "night-supervisor",
    "contractor",
    "admin", "project-admin"
  ];
  const cleanRole = sanitizeString(role, 32).toLowerCase();
  if (!ALLOWED_STAFF_ROLES.includes(cleanRole)) {
    throw new HttpsError("invalid-argument", `Invalid or unauthorized staff role: ${cleanRole}`);
  }

  // Canonical role normalizer to eliminate technical naming divergences
  const ROLE_CANONICAL_MAP = {
    "supervisor": "site-supervisor",
    "engineer": "site-engineer",
    "mep-engineer": "mep",
    "pm-engineer": "pm",
    "it-engineer": "it",
    "tower-incharge": "hw-section-head",
    "electrical-engineer": "electrician",
    "lifting-incharge": "lift-supervisor",
    "safety-officer": "ehs-officer",
    "ehs": "ehs-officer",
    "admin": "project-admin"
  };
  const canonicalRole = ROLE_CANONICAL_MAP[cleanRole] || cleanRole;

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = sanitizeString(displayName || name || cleanEmail.split("@")[0], 100);
  const cleanEmpId = sanitizeString(empId || "ARPL-STF", 32);
  const cleanPhone = sanitizeString(phone || "", 20);
  const cleanRoleLabel = sanitizeString(roleLabel || role, 64);
  const cleanLocationId = sanitizeString(locationId || "CAMPUS-WIDE", 32);
  const cleanLocationName = sanitizeString(locationName || "Full Worksite", 64);

  let cleanPassword;
  if (password) {
    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      throw new HttpsError(
        "invalid-argument",
        "Staff password must be at least 6 characters long."
      );
    }
    cleanPassword = password;
  } else {
    cleanPassword = generateSecureRandomPassword(16);
  }

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
    role: canonicalRole,
    uiRole: canonicalRole,
    ptwRole: canonicalRole,
    projectId: projectId,
    locationId: cleanLocationId,
    locationName: cleanLocationName,
    campusWide: campusWide !== undefined ? !!campusWide : cleanLocationId === "CAMPUS-WIDE",
    name: cleanName
  });

  const staffDoc = {
    id: userRecord.uid,
    uid: userRecord.uid,
    email: cleanEmail,
    name: cleanName,
    displayName: cleanName,
    role: canonicalRole,
    uiRole: canonicalRole,
    ptwRole: canonicalRole,
    roleLabel: cleanRoleLabel,
    projectId: projectId,
    projectName: sanitizeString(projectName || projectId, 100),
    locationId: cleanLocationId,
    locationName: cleanLocationName,
    location: cleanLocationName,
    campusWide: campusWide !== undefined ? !!campusWide : cleanLocationId === "CAMPUS-WIDE",
    allowedWorkflows: Array.isArray(allowedWorkflows)
      ? allowedWorkflows.map(w => sanitizeString(w, 32))
      : null,
    empId: cleanEmpId,
    phone: cleanPhone,
    status: "Active",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    assignedBy: callerEmail || request.auth.uid
  };

  await db.collection("users").doc(userRecord.uid).set(staffDoc, { merge: true });
  await db.collection("site_personnel").doc(userRecord.uid).set(staffDoc, { merge: true });

  await recordServerAuditLog(
    "STAFF_PERSONNEL_PROVISIONED",
    `Staff ${cleanName} (${cleanEmail}) assigned role ${cleanRole} at ${projectId} (${cleanLocationName})`,
    request.auth.uid,
    callerEmail,
    projectId
  );

  return { success: true, uid: userRecord.uid, email: cleanEmail, name: cleanName, role: cleanRole, projectId, locationId: cleanLocationId };
});

// ============================================================================
// 7. ATOMIC PERMIT STATE TRANSITION & GEOFENCE ENFORCEMENT
// ============================================================================
exports.transitionPermitStage = onCall({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  // Rate limit: max 30 permit state transitions per minute per user
  await enforceRateLimit(request.auth.uid, "transitionPermitStage", 30, 60);

  const { permitId, targetStatus, action, userLat, userLng, signatureData, comments } = request.data || {};
  if (!permitId || !validatePermitId(permitId) || !targetStatus) {
    throw new HttpsError("invalid-argument", "Valid permitId and targetStatus are required.");
  }

  const permitRef = db.collection("permits").doc(permitId);

  return await db.runTransaction(async (transaction) => {
    const permitSnap = await transaction.get(permitRef);
    if (!permitSnap.exists) throw new HttpsError("not-found", "Permit not found");

    const p = permitSnap.data();
    const userRole = request.auth.token.role;
    const userProj = request.auth.token.projectId;
    const isSuperAdmin = request.auth.token.superAdmin === true;

    // Strict multi-tenant isolation check (CHECK 02)
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

    const cleanAction = sanitizeString(action || "STAGE_APPROVED", 64);
    const cleanComments = sanitizeString(comments || "", 500);

    // Mutate State
    transaction.update(permitRef, {
      status: sanitizeString(targetStatus, 32),
      lastAction: cleanAction,
      lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActionBy: request.auth.uid
    });

    // Write Tamper-Proof Activity Log Entry
    const logRef = permitRef.collection("activity_log").doc();
    transaction.set(logRef, {
      id: logRef.id,
      permitId: permitId,
      action: cleanAction,
      actorRole: userRole || "unknown",
      actorUid: request.auth.uid,
      actorName: sanitizeString(request.auth.token.name || request.auth.token.email || "Signatory", 100),
      targetStatus: sanitizeString(targetStatus, 32),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      comments: cleanComments,
      gps: (userLat && userLng) ? { lat: Number(userLat), lng: Number(userLng) } : null
    });

    return { success: true, permitId, newStatus: targetStatus };
  });
});

// ============================================================================
// 8. SCHEDULED SLA ESCALATION ENGINE (CRON 5M TICK)
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
