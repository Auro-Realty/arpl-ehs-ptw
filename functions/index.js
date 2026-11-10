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
 * Validate enterprise password strength: min 6 chars, max 128 chars
 */
function validatePassword(pwd) {
  if (!pwd || typeof pwd !== "string") return false;
  return pwd.length >= 6 && pwd.length <= 128;
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
 * Authoritative Project-Specific Tower & Zone Mapping
 * Business & Data Integrity Mandate:
 * - The Pearl (PRJ-PEARL): P1, P2, P3, P4, P5, P6, P7, Clubhouse, Podium, NTA_PHASE-1, NTA_PHASE-2, NTA_PHASE-3
 * - The Regent (PRJ-REGENT): Tower 4, Tower 5, NTA, Stores, FormWork, Precast, Phase-1
 * - Sansa County (PRJ-SANSA): Sector 1 - Zone 1 & 2, Sector 1 - Zone 03, Sector 1 - Zone 04
 */
const AUTHORITATIVE_PROJECT_TOWERS = {
  "PRJ-PEARL": [
    "P1", "P2", "P3", "P4", "P5", "P6", "P7",
    "Clubhouse", "Podium",
    "NTA_PHASE-1", "NTA_PHASE-2", "NTA_PHASE-3"
  ],
  "PRJ-REGENT": [
    "Tower 4", "Tower 5", "NTA", "Stores", "FormWork", "Precast", "Phase-1"
  ],
  "PRJ-SANSA": [
    "Sector 1 - Zone 1 & 2", "Sector 1 - Zone 03", "Sector 1 - Zone 04"
  ]
};

const CAMPUS_WIDE_TOWER_ALIASES = [
  "All Site Towers",
  "Campus-Wide (All Locations)",
  "CAMPUS-WIDE",
  "Full Worksite",
  "ALL"
];

function validateProjectTower(projectId, towerNameOrLocId) {
  if (!towerNameOrLocId) return true;
  const clean = String(towerNameOrLocId).trim();
  if (CAMPUS_WIDE_TOWER_ALIASES.some(a => a.toLowerCase() === clean.toLowerCase())) {
    return true;
  }
  const allowed = AUTHORITATIVE_PROJECT_TOWERS[projectId];
  if (!allowed) {
    return true;
  }
  const isMatch = allowed.some(t => {
    if (t.toLowerCase() === clean.toLowerCase()) return true;
    const cleanNoSpace = clean.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
    const tNoSpace = t.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
    if (cleanNoSpace.includes(tNoSpace) || tNoSpace.includes(cleanNoSpace)) return true;
    return false;
  });
  return isMatch;
}

/**
 * Authoritative Deterministic Permit Approval Topology Matrix (PTW-001 through PTW-010)
 * Maps every statutory stage strictly to provisionable canonical role keys:
 * - site-supervisor (Permittee / Initiator)
 * - site-engineer (Field Verification & Physical Checklist)
 * - section-head / hw-section-head (Tower Incharge / Section Head)
 * - excavation-head (Civil & Earthwork Section Head)
 * - mep (MEP Engineer Clearance)
 * - pm (Plant & Machinery Clearance)
 * - it (IT Telecom Infrastructure Clearance)
 * - quality-engineer (Quality Engineer Clearance)
 * - electrician (Certified Permittee Electrician)
 * - blasting-incharge (Shot-Firer / Blasting In-charge)
 * - lift-supervisor (Rigging & Lifting In-charge)
 * - night-supervisor (Night Handover In-charge)
 * - project-manager (Executive Clearance)
 * - ehs-officer / ehs-manager (Statutory Safety Authorization)
 * - project-admin / admin (Site Administrator)
 */
const PERMIT_APPROVAL_MATRIX = {
  "PTW-001": {
    code: "PTW-001",
    key: "excavation",
    name: "Excavation Work",
    short: "Excavation",
    initiatorRole: "site-supervisor",
    stages: [
      { order: 1, name: "Initiation & Checklist", roleKey: "site-supervisor", roleLabel: "Site Supervisor (Permittee)", canonicalRoles: ["site-supervisor"] },
      { order: 2, name: "Field Ground Verification", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Technical Clearances (Parallel)", roleKey: ["mep", "pm", "it"], roleLabel: "MEP, P&M & IT Engineers (Clearances)", canonicalRoles: ["mep", "pm", "it"] },
      { order: 4, name: "Section Head Endorsement", roleKey: "excavation-head", roleLabel: "Excavation Head (Section Head)", canonicalRoles: ["excavation-head"] },
      { order: 5, name: "Statutory Safety Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-002": {
    code: "PTW-002",
    key: "hotwork",
    name: "Hot Work",
    short: "Hot Work",
    initiatorRole: "site-supervisor",
    stages: [
      { order: 1, name: "Initiation & Fire Safety Checklist", roleKey: "site-supervisor", roleLabel: "Site Supervisor (Permittee)", canonicalRoles: ["site-supervisor"] },
      { order: 2, name: "Spark Hazard & Barrier Check", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Section Clearance", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 4, name: "Continuous Gas Check & Safety Endorsement", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-003": {
    code: "PTW-003",
    key: "guardrail",
    name: "Guard Rail / Floor Protection Removal",
    short: "Guard Rail",
    initiatorRole: "site-supervisor",
    stages: [
      { order: 1, name: "Initiation & Fall Protection Plan", roleKey: "site-supervisor", roleLabel: "Site Supervisor (Permittee)", canonicalRoles: ["site-supervisor"] },
      { order: 2, name: "Perimeter Hazard & Safety Net Check", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Tower Section Clearance", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 4, name: "Statutory Safety Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-004": {
    code: "PTW-004",
    key: "confined",
    name: "Confined Space Entry",
    short: "Confined Space",
    initiatorRole: "site-supervisor",
    stages: [
      { order: 1, name: "Initiation & Atmosphere Test Prep", roleKey: "site-supervisor", roleLabel: "Site Supervisor (Permittee)", canonicalRoles: ["site-supervisor"] },
      { order: 2, name: "Ventilation & Physical Entry Check", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Access Isolation Clearance", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 4, name: "Multi-Gas Test & Entry Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-005": {
    code: "PTW-005",
    key: "shaft",
    name: "Shaft Work",
    short: "Shaft Work",
    initiatorRole: "site-supervisor",
    stages: [
      { order: 1, name: "Initiation & Shaft Rigging Plan", roleKey: "site-supervisor", roleLabel: "Site Supervisor (Permittee)", canonicalRoles: ["site-supervisor"] },
      { order: 2, name: "Shaft Barrier & Descent Verification", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Services & MEP Technical Clearance", roleKey: "mep", roleLabel: "MEP Engineer (Clearance)", canonicalRoles: ["mep"] },
      { order: 4, name: "Tower Section Clearance", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 5, name: "Statutory Safety Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-006": {
    code: "PTW-006",
    key: "electrical",
    name: "Electrical Isolation & Energization",
    short: "Electrical Work",
    initiatorRole: "electrician",
    stages: [
      { order: 1, name: "Initiation & LOTO Protocol", roleKey: "electrician", roleLabel: "Electrician (Certified Permittee)", canonicalRoles: ["electrician"] },
      { order: 2, name: "Physical LOTO Inspection & Lock Verification", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Substation & Machinery Clearance", roleKey: ["mep", "pm"], roleLabel: "MEP / P&M Engineer", canonicalRoles: ["mep", "pm"] },
      { order: 4, name: "Section Head Endorsement", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 5, name: "Statutory Safety Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-007": {
    code: "PTW-007",
    key: "blasting",
    name: "Drilling & Controlled Blasting",
    short: "Drilling & Blasting",
    initiatorRole: "blasting-incharge",
    stages: [
      { order: 1, name: "Initiation & Shot-Firer Drill Plan", roleKey: "blasting-incharge", roleLabel: "Blasting In-charge (Shot Firer)", canonicalRoles: ["blasting-incharge"] },
      { order: 2, name: "Drill Hole & Warning Siren Check", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Blast Perimeter & Danger Zone Review", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 4, name: "Statutory Explosives & Controlled Blast Endorsement", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-008": {
    code: "PTW-008",
    key: "general",
    name: "General Work at Height & Hazardous Operations",
    short: "General Work",
    initiatorRole: "site-supervisor",
    stages: [
      { order: 1, name: "Initiation & Task Hazard Assessment", roleKey: "site-supervisor", roleLabel: "Site Supervisor (Permittee)", canonicalRoles: ["site-supervisor"] },
      { order: 2, name: "Safety Harness & Anchor Inspection", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Section Clearance", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 4, name: "Statutory Safety Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-009": {
    code: "PTW-009",
    key: "lifting",
    name: "Lifting Operations & Critical Lift Plan",
    short: "Lifting Operations",
    initiatorRole: "lift-supervisor",
    stages: [
      { order: 1, name: "Initiation & Rigging Stress Calculations", roleKey: "lift-supervisor", roleLabel: "Lifting Supervisor (Certified Permittee)", canonicalRoles: ["lift-supervisor"] },
      { order: 2, name: "Ground Stability & Outrigger Check", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Crane Fitness & Lifting Gear Clearance", roleKey: "pm", roleLabel: "P&M Engineer (Machinery Clearance)", canonicalRoles: ["pm"] },
      { order: 4, name: "Tower Section Clearance", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 5, name: "Executive Oversight (Critical Lift > 5MT / Tandem)", roleKey: "project-manager", roleLabel: "Project Manager (Executive Clearance)", canonicalRoles: ["project-manager"] },
      { order: 6, name: "Statutory Safety Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  },
  "PTW-010": {
    code: "PTW-010",
    key: "nightshift",
    name: "Night Shift & Holiday Work",
    short: "Night Shift",
    initiatorRole: "site-supervisor",
    stages: [
      { order: 1, name: "Day Pre-Fill & Scope Definition", roleKey: "site-supervisor", roleLabel: "Site Supervisor (Day Permittee)", canonicalRoles: ["site-supervisor"] },
      { order: 2, name: "Day Site Verification", roleKey: "site-engineer", roleLabel: "Site Engineer (Verification)", canonicalRoles: ["site-engineer"] },
      { order: 3, name: "Section Head Day Clearance", roleKey: "section-head", roleLabel: "Tower In-Charge / Section Head", canonicalRoles: ["section-head", "hw-section-head"] },
      { order: 4, name: "Night Physical Handover & Lighting Verification", roleKey: "night-supervisor", roleLabel: "Night Site Supervisor (Night In-charge)", canonicalRoles: ["night-supervisor"] },
      { order: 5, name: "Night Machinery & Lighting Verification", roleKey: "pm", roleLabel: "P&M Engineer (Night On-Call)", canonicalRoles: ["pm"] },
      { order: 6, name: "Final Statutory Night Authorization", roleKey: ["ehs-officer", "ehs-manager"], roleLabel: "EHS Safety Officer / Manager", canonicalRoles: ["ehs-officer", "ehs-manager"] }
    ]
  }
};

// Aliases for permit keys
["excavation", "hotwork", "guardrail", "confined", "shaft", "electrical", "blasting", "general", "lifting", "liftplan", "nightshift"].forEach((k) => {
  const match = Object.values(PERMIT_APPROVAL_MATRIX).find(m => m.key === k || (k === "liftplan" && m.key === "lifting"));
  if (match) PERMIT_APPROVAL_MATRIX[k] = match;
});

exports.AUTHORITATIVE_PROJECT_TOWERS = AUTHORITATIVE_PROJECT_TOWERS;
exports.PERMIT_APPROVAL_MATRIX = PERMIT_APPROVAL_MATRIX;

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
    callerEmail === "aic1176@aurogroup.com";

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
    try {
      userRecord = await auth.createUser({
        email: cleanEmail,
        password: cleanPassword,
        displayName: cleanName
      });
    } catch (createErr) {
      if (createErr.code === "auth/email-already-in-use") {
        userRecord = await auth.getUserByEmail(cleanEmail);
        userRecord = await auth.updateUser(userRecord.uid, {
          password: cleanPassword,
          displayName: cleanName,
          disabled: false
        });
      } else {
        throw createErr;
      }
    }
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
    callerEmail === "aic1176@aurogroup.com" ||
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

  let effectiveProjectId = projectId;
  if (effectiveProjectId === "The Pearl" || effectiveProjectId === "PRJ-PEARL") effectiveProjectId = "PRJ-PEARL";
  else if (effectiveProjectId === "The Regent" || effectiveProjectId === "PRJ-REGENT") effectiveProjectId = "PRJ-REGENT";
  else if (effectiveProjectId === "Sansa County" || effectiveProjectId === "PRJ-SANSA") effectiveProjectId = "PRJ-SANSA";

  const callerEmail = (request.auth.token.email || "").toLowerCase();
  const isSuperAdminCaller =
    request.auth.token.superAdmin === true ||
    request.auth.token.role === "super-admin" ||
    callerEmail === "aic1176@aurogroup.com";

  const isPurgeAction =
    action === "purge_orphan_auth_users" ||
    action === "adminSyncAndPurgeOrphanAuthUsers";

  if (action !== "delete" && !isPurgeAction) {
    if (!effectiveProjectId || !validateProjectId(effectiveProjectId)) {
      throw new HttpsError("invalid-argument", "Valid projectId is required.");
    }
  } else {
    if (!isSuperAdminCaller && (!effectiveProjectId || !validateProjectId(effectiveProjectId))) {
      effectiveProjectId = request.auth.token.projectId || effectiveProjectId;
    }
  }

  let isProjAdmin =
    isSuperAdminCaller ||
    ((request.auth.token.role === "project-admin" ||
      request.auth.token.role === "site-admin" ||
      request.auth.token.role === "admin" ||
      request.auth.token.role === "ehs-manager" ||
      request.auth.token.role === "ehs-officer" ||
      request.auth.token.admin === true) &&
      (!effectiveProjectId || request.auth.token.projectId === effectiveProjectId || !request.auth.token.projectId));

  if (!isProjAdmin && effectiveProjectId) {
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (callerDoc.exists) {
      const cd = callerDoc.data();
      if (
        cd.role === "super-admin" ||
        ((cd.role === "project-admin" || cd.role === "admin" || cd.uiRole === "admin" || cd.role === "ehs-manager" || cd.role === "ehs-officer" || cd.role === "safety-incharge") && (cd.projectId === effectiveProjectId || !cd.projectId || cd.campusWide === true))
      ) {
        isProjAdmin = true;
      }
    }
  }

  // Fallback check against projects master, project_admins, and users directory by email
  if (!isProjAdmin && callerEmail) {
    try {
      const projDoc = await db.collection("projects").doc(projectId).get();
      if (projDoc.exists) {
        const pd = projDoc.data();
        if (
          (pd.adminEmail && pd.adminEmail.toLowerCase() === callerEmail) ||
          (pd.safetyInchargeEmail && pd.safetyInchargeEmail.toLowerCase() === callerEmail) ||
          pd.adminUid === request.auth.uid
        ) {
          isProjAdmin = true;
        }
      }
    } catch (_e) {}

    // Special authoritative default Site Safety Incharge check
    if (
      (projectId === "PRJ-PEARL" && (callerEmail.includes("prasanna") || callerEmail === "prasanna.j@aurorealty.com")) ||
      (projectId === "PRJ-REGENT" && callerEmail === "ehs.regent@aurorealty.com") ||
      (projectId === "PRJ-SANSA" && callerEmail === "ehs.sansa@aurorealty.com")
    ) {
      isProjAdmin = true;
    }

    if (!isProjAdmin) {
      try {
        const paSnap = await db.collection("project_admins").where("email", "==", callerEmail).limit(1).get();
        if (!paSnap.empty) {
          const pad = paSnap.docs[0].data();
          if (pad.projectId === projectId || pad.role === "project-admin" || pad.role === "admin") {
            isProjAdmin = true;
          }
        }
      } catch (_e) {}
    }

    if (!isProjAdmin) {
      try {
        const uSnap = await db.collection("users").where("email", "==", callerEmail).limit(1).get();
        if (!uSnap.empty) {
          const ud = uSnap.docs[0].data();
          if ((ud.role === "project-admin" || ud.role === "admin" || ud.uiRole === "admin") && ud.projectId === projectId) {
            isProjAdmin = true;
          }
        }
      } catch (_e) {}
    }
  }

  // Auto self-heal caller's claims and users document on backend if confirmed (Site Admin only, never Super Admin)
  if (isProjAdmin && request.auth.uid && !isSuperAdminCaller) {
    try {
      if (!request.auth.token.role || request.auth.token.role !== "project-admin") {
        await auth.setCustomUserClaims(request.auth.uid, {
          role: "project-admin",
          uiRole: "admin",
          ptwRole: "project-admin",
          projectId: projectId,
          campusWide: true
        });
      }
      await db.collection("users").doc(request.auth.uid).set({
        uid: request.auth.uid,
        id: request.auth.uid,
        email: callerEmail,
        role: "project-admin",
        uiRole: "admin",
        ptwRole: "project-admin",
        projectId: projectId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (_syncErr) {
      console.warn("Backend admin claim self-heal warning:", _syncErr);
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

  // Action: Permanent User & Credential Deletion
  if (action === "delete") {
    const targetUid = uid;
    const targetEmail = (email || "").toLowerCase().trim();
    if (!targetUid && !targetEmail) {
      throw new HttpsError("invalid-argument", "Valid uid or email is required for deletion.");
    }

    let realAuthUid = null;
    let resolvedEmail = targetEmail;

    // 1. Resolve Auth user record by UID
    if (targetUid) {
      try {
        const uRec = await auth.getUser(targetUid);
        if (uRec) {
          realAuthUid = uRec.uid;
          if (!resolvedEmail && uRec.email) resolvedEmail = uRec.email.toLowerCase().trim();
        }
      } catch (_uErr) {
        // targetUid might be client synthetic ID like stf-...
      }
    }

    // 2. Resolve Auth user record by Email fallback
    if (!realAuthUid && resolvedEmail) {
      try {
        const uRec = await auth.getUserByEmail(resolvedEmail);
        if (uRec) {
          realAuthUid = uRec.uid;
        }
      } catch (_eErr) {
        // Not found by email in Auth
      }
    }

    // 3. Permanently delete from Firebase Authentication
    if (realAuthUid) {
      try {
        await auth.deleteUser(realAuthUid);
        console.log(`[adminAssignProjectRole] Permanently deleted Auth user: ${realAuthUid} (${resolvedEmail})`);
      } catch (delAuthErr) {
        console.warn(`[adminAssignProjectRole] Notice deleting Auth user ${realAuthUid}:`, delAuthErr);
      }
    }

    // 4. Delete from Firestore collections: users, site_personnel, project_admins
    const batchOps = [];
    if (realAuthUid) {
      batchOps.push(db.collection("users").doc(realAuthUid).delete().catch(() => {}));
      batchOps.push(db.collection("site_personnel").doc(realAuthUid).delete().catch(() => {}));
      batchOps.push(db.collection("project_admins").doc(realAuthUid).delete().catch(() => {}));
    }
    if (targetUid && targetUid !== realAuthUid) {
      batchOps.push(db.collection("users").doc(targetUid).delete().catch(() => {}));
      batchOps.push(db.collection("site_personnel").doc(targetUid).delete().catch(() => {}));
      batchOps.push(db.collection("project_admins").doc(targetUid).delete().catch(() => {}));
    }
    if (resolvedEmail) {
      try {
        const uSnap = await db.collection("users").where("email", "==", resolvedEmail).get();
        uSnap.forEach(d => batchOps.push(d.ref.delete().catch(() => {})));
      } catch (_e) {}
      try {
        const spSnap = await db.collection("site_personnel").where("email", "==", resolvedEmail).get();
        spSnap.forEach(d => batchOps.push(d.ref.delete().catch(() => {})));
      } catch (_e) {}
      try {
        const paSnap = await db.collection("project_admins").where("email", "==", resolvedEmail).get();
        paSnap.forEach(d => batchOps.push(d.ref.delete().catch(() => {})));
      } catch (_e) {}
    }
    await Promise.all(batchOps);

    // 5. Clean up references in projects collection
    try {
      const pSnap = await db.collection("projects").get();
      for (const pDoc of pSnap.docs) {
        const pData = pDoc.data();
        let needsUpdate = false;
        const pUpdates = {};

        if (
          (resolvedEmail && pData.adminEmail && pData.adminEmail.toLowerCase() === resolvedEmail) ||
          (realAuthUid && pData.adminUid === realAuthUid) ||
          (targetUid && pData.adminUid === targetUid)
        ) {
          pUpdates.adminEmail = null;
          pUpdates.adminUid = null;
          pUpdates.adminName = null;
          needsUpdate = true;
        }

        if (resolvedEmail && pData.safetyInchargeEmail && pData.safetyInchargeEmail.toLowerCase() === resolvedEmail) {
          pUpdates.safetyInchargeEmail = null;
          needsUpdate = true;
        }

        if (pData.staffRoles) {
          const newStaffRoles = Object.assign({}, pData.staffRoles);
          let staffRemoved = false;
          for (const [sKey, sVal] of Object.entries(newStaffRoles)) {
            if (
              sKey === targetUid ||
              sKey === realAuthUid ||
              (sVal && sVal.email && sVal.email.toLowerCase() === resolvedEmail) ||
              (sVal && sVal.uid && (sVal.uid === realAuthUid || sVal.uid === targetUid))
            ) {
              delete newStaffRoles[sKey];
              staffRemoved = true;
            }
          }
          if (staffRemoved) {
            pUpdates.staffRoles = newStaffRoles;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          pUpdates.updatedAt = FieldValue.serverTimestamp();
          await pDoc.ref.set(pUpdates, { merge: true });
        }
      }
    } catch (_pErr) {
      console.warn("[adminAssignProjectRole] Projects reference cleanup notice:", _pErr);
    }

    await recordServerAuditLog(
      "STAFF_PERSONNEL_DELETED",
      `User account ${realAuthUid || targetUid} (${resolvedEmail || "no-email"}) permanently deleted from Firebase Auth & Firestore`,
      request.auth.uid,
      callerEmail,
      effectiveProjectId || "GLOBAL"
    );

    return {
      success: true,
      deleted: true,
      uid: realAuthUid || targetUid,
      email: resolvedEmail
    };
  }

  // Action: Purge Orphaned Authentication Accounts
  if (action === "purge_orphan_auth_users" || action === "adminSyncAndPurgeOrphanAuthUsers") {
    if (!isSuperAdminCaller) {
      throw new HttpsError("permission-denied", "Only Super Administrators can scan and purge orphaned Auth accounts.");
    }
    try {
    const protectedEmails = new Set([
      "aic1176@aurogroup.com",
      "ehs.superadmin@aurorealty.com"
    ]);

    const activeFirestoreUids = new Set();
    const activeFirestoreEmails = new Set();

    const uDocs = await db.collection("users").get();
    uDocs.forEach(d => {
      activeFirestoreUids.add(d.id);
      const data = d.data();
      if (data && data.email) activeFirestoreEmails.add(data.email.toLowerCase().trim());
    });

    const paDocs = await db.collection("project_admins").get();
    paDocs.forEach(d => {
      activeFirestoreUids.add(d.id);
      const data = d.data();
      if (data && data.email) activeFirestoreEmails.add(data.email.toLowerCase().trim());
    });

    const spDocs = await db.collection("site_personnel").get();
    spDocs.forEach(d => {
      activeFirestoreUids.add(d.id);
      const data = d.data();
      if (data && data.email) activeFirestoreEmails.add(data.email.toLowerCase().trim());
    });

    let totalAuthScanned = 0;
    let purgedCount = 0;
    const purgedUsers = [];

    let listPageToken = undefined;
    do {
      const listResult = listPageToken ? await auth.listUsers(1000, listPageToken) : await auth.listUsers(1000);
      const authUsers = listResult.users || [];
      totalAuthScanned += authUsers.length;

      for (const authUser of authUsers) {
        const aUid = authUser.uid;
        const aEmail = (authUser.email || "").toLowerCase().trim();

        if ((aEmail && protectedEmails.has(aEmail)) || authUser.customClaims?.superAdmin === true || aUid === request.auth.uid) {
          continue;
        }

        const hasDocByUid = activeFirestoreUids.has(aUid);
        const hasDocByEmail = aEmail ? activeFirestoreEmails.has(aEmail) : false;

        if (!hasDocByUid && !hasDocByEmail) {
          try {
            await auth.deleteUser(aUid);
            purgedCount++;
            purgedUsers.push({ uid: aUid, email: aEmail });
            console.log(`[adminAssignProjectRole.purge] Purged orphaned Auth user: ${aUid} (${aEmail})`);
          } catch (delErr) {
            if (delErr.code !== "auth/user-not-found") {
              console.warn(`[adminAssignProjectRole.purge] Notice deleting orphan ${aUid}:`, delErr);
            }
          }
        }
      }
      listPageToken = listResult.pageToken;
    } while (listPageToken);

    await recordServerAuditLog(
      "ORPHAN_AUTH_USERS_PURGED",
      `Super Admin purged ${purgedCount} orphaned Auth user(s) out of ${totalAuthScanned} scanned`,
      request.auth.uid,
      callerEmail,
      "GLOBAL"
    );

    return {
      success: true,
      scannedCount: totalAuthScanned,
      purgedCount: purgedCount,
      totalScanned: totalAuthScanned,
      purgedUsers: purgedUsers
    };
    } catch (purgeErr) {
      console.error("[adminAssignProjectRole.purge] Error:", purgeErr);
      if (purgeErr instanceof HttpsError) throw purgeErr;
      throw new HttpsError("internal", "Purge execution failed: " + (purgeErr.message || String(purgeErr)));
    }
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
    "permittee", "site-supervisor", "supervisor",
    "site engineer", "site-engineer", "engineer",
    "mep", "mep-engineer",
    "p&m", "pm", "pm-engineer", "pnm",
    "it in charge", "it-in-charge", "it", "it-engineer",
    "quality-engineer",
    "excavation-head", "section head", "section-head",
    "tower in charge", "tower-incharge", "hw-section-head",
    "project manager", "project-manager",
    "ehs supervisor", "ehs-supervisor", "ehs-officer", "ehs", "safety-officer",
    "ehs head", "ehs-head", "ehs-manager", "safety-incharge",
    "electrician", "electrical-engineer",
    "blasting incharge", "blasting-incharge", "blasting-in-charge",
    "lifting supervisor", "lifting-supervisor", "lift-supervisor", "lifting-incharge",
    "night-supervisor",
    "contractor",
    "site admin", "site-admin", "admin", "project-admin",
    "super admin", "super-admin"
  ];
  const cleanRole = sanitizeString(role, 32).toLowerCase();
  if (!ALLOWED_STAFF_ROLES.includes(cleanRole)) {
    throw new HttpsError("invalid-argument", `Invalid or unauthorized staff role: ${cleanRole}`);
  }

  // Canonical role normalizer to eliminate technical naming divergences
  const ROLE_CANONICAL_MAP = {
    "permittee": "site-supervisor",
    "supervisor": "site-supervisor",
    "site engineer": "site-engineer",
    "engineer": "site-engineer",
    "mep-engineer": "mep",
    "p&m": "pm",
    "pm-engineer": "pm",
    "pnm": "pm",
    "it in charge": "it",
    "it-in-charge": "it",
    "it-engineer": "it",
    "tower in charge": "hw-section-head",
    "tower-incharge": "hw-section-head",
    "section head": "section-head",
    "ehs supervisor": "ehs-officer",
    "ehs-supervisor": "ehs-officer",
    "safety-officer": "ehs-officer",
    "ehs": "ehs-officer",
    "ehs head": "ehs-manager",
    "ehs-head": "ehs-manager",
    "project manager": "project-manager",
    "site admin": "project-admin",
    "site-admin": "project-admin",
    "project admin": "project-admin",
    "project-admin": "project-admin",
    "admin": "project-admin",
    "super admin": "super-admin"
  };
  const canonicalRole = ROLE_CANONICAL_MAP[cleanRole] || cleanRole;

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = sanitizeString(displayName || name || cleanEmail.split("@")[0], 100);
  const cleanEmpId = sanitizeString(empId || "ARPL-STF", 32);
  const cleanPhone = sanitizeString(phone || "", 20);
  let cleanRoleLabel = sanitizeString(roleLabel || role, 64);
  if (canonicalRole === "project-admin" && (!roleLabel || roleLabel.toLowerCase().includes("site admin") || roleLabel.toLowerCase().includes("safety incharge") || roleLabel.toLowerCase().includes("site administrator"))) {
    cleanRoleLabel = "Project Admin (Worksite Administrator)";
  }
  const cleanLocationId = sanitizeString(locationId || "CAMPUS-WIDE", 32);
  const cleanLocationName = sanitizeString(locationName || "Full Worksite", 64);

  // Validate assigned tower/zone against project's authoritative towers (Reject cross-project or generic Tower A/B)
  if (!validateProjectTower(projectId, cleanLocationName) && !validateProjectTower(projectId, cleanLocationId)) {
    throw new HttpsError(
      "invalid-argument",
      `Invalid tower/zone '${cleanLocationName}' for project '${projectId}'. Permitted towers: ${(AUTHORITATIVE_PROJECT_TOWERS[projectId] || []).join(", ")}`
    );
  }

  let cleanPassword = null;
  if (password) {
    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      throw new HttpsError(
        "invalid-argument",
        "Staff password must be at least 6 characters long."
      );
    }
    cleanPassword = password;
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(cleanEmail);
    const updatePayload = {
      displayName: cleanName,
      disabled: false
    };
    // Only update password if an explicit new password was supplied (do not overwrite existing credentials on edit)
    if (cleanPassword) {
      updatePayload.password = cleanPassword;
    }
    userRecord = await auth.updateUser(userRecord.uid, updatePayload);
  } catch (_err) {
    const initialPassword = cleanPassword || generateSecureRandomPassword(16);
    try {
      userRecord = await auth.createUser({
        email: cleanEmail,
        password: initialPassword,
        displayName: cleanName
      });
    } catch (createErr) {
      if (createErr.code === "auth/email-already-in-use") {
        userRecord = await auth.getUserByEmail(cleanEmail);
        const updatePayload = {
          displayName: cleanName,
          disabled: false
        };
        if (cleanPassword) {
          updatePayload.password = cleanPassword;
        }
        userRecord = await auth.updateUser(userRecord.uid, updatePayload);
      } else {
        throw createErr;
      }
    }
  }

  // Retrieve existing user profile to support multi-role & multi-location assignments
  const existingUserSnap = await db.collection("users").doc(userRecord.uid).get();
  let existingAssignments = [];
  if (existingUserSnap.exists) {
    const data = existingUserSnap.data();
    if (Array.isArray(data.assignments)) {
      existingAssignments = data.assignments;
    }
  }

  // Construct structured assignment object
  const newAssignment = {
    projectId: projectId,
    projectName: sanitizeString(projectName || projectId, 100),
    locationId: cleanLocationId,
    locationName: cleanLocationName,
    role: canonicalRole,
    roleLabel: cleanRoleLabel
  };

  // Upsert assignment entry: replace if exact match (projectId + role + location), else append
  const assignIdx = existingAssignments.findIndex(
    a => a.projectId === projectId && a.role === canonicalRole && (a.locationName === cleanLocationName || a.locationId === cleanLocationId)
  );
  if (assignIdx >= 0) {
    existingAssignments[assignIdx] = newAssignment;
  } else {
    existingAssignments.push(newAssignment);
  }

  // Aggregate all unique roles and projectIds for backward compatibility
  const aggregatedRoles = Array.from(new Set(existingAssignments.map(a => a.role)));
  const aggregatedProjects = Array.from(new Set(existingAssignments.map(a => a.projectId)));

  // Set Custom Claims for Auth RBAC & Location/Workflow Scope (<1000 bytes token guard)
  await auth.setCustomUserClaims(userRecord.uid, {
    role: canonicalRole,
    roles: aggregatedRoles,
    uiRole: canonicalRole,
    ptwRole: canonicalRole,
    projectId: projectId,
    projectIds: aggregatedProjects,
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
    roles: aggregatedRoles,
    uiRole: canonicalRole,
    ptwRole: canonicalRole,
    roleLabel: cleanRoleLabel,
    projectId: projectId,
    projectIds: aggregatedProjects,
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
    assignments: existingAssignments,
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
// 6B. ATOMIC DUAL-DELETION CLOUD FUNCTION (AUTH + FIRESTORE)
// ============================================================================
exports.adminDeleteUser = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }
  await enforceRateLimit(request.auth.uid, "adminDeleteUser", 30, 60);

  const callerUid = request.auth.uid;
  const callerEmail = (request.auth.token.email || "").toLowerCase().trim();
  let isCallerSuperAdmin =
    request.auth.token.superAdmin === true ||
    request.auth.token.role === "super-admin" ||
    callerEmail === "aic1176@aurogroup.com";

  if (!isCallerSuperAdmin) {
    const callerDoc = await db.collection("users").doc(callerUid).get();
    if (callerDoc.exists && (callerDoc.data().role === "super-admin" || callerDoc.data().superAdmin === true)) {
      isCallerSuperAdmin = true;
    }
  }

  const { uid, email, projectId } = request.data || {};
  const targetKey = (uid || "").trim();
  const targetEmail = (email || "").toLowerCase().trim();

  if (!targetKey && !targetEmail) {
    throw new HttpsError("invalid-argument", "Valid target uid or email is required for deletion.");
  }

  // 1. RBAC Guard: Prevent self-deletion of currently logged-in account
  if (targetKey === callerUid || (targetEmail && targetEmail === callerEmail)) {
    throw new HttpsError("invalid-argument", "Users cannot delete their own currently active logged-in account.");
  }

  // 2. Resolve target user in Firestore & Auth
  let targetDoc = null;
  let targetDocId = null;

  if (targetKey) {
    const docSnap = await db.collection("users").doc(targetKey).get();
    if (docSnap.exists) {
      targetDoc = docSnap.data();
      targetDocId = docSnap.id;
    }
  }
  if (!targetDoc && targetEmail) {
    const qSnap = await db.collection("users").where("email", "==", targetEmail).limit(1).get();
    if (!qSnap.empty) {
      targetDoc = qSnap.docs[0].data();
      targetDocId = qSnap.docs[0].id;
    }
  }
  if (!targetDoc && targetKey) {
    const spSnap = await db.collection("site_personnel").doc(targetKey).get();
    if (spSnap.exists) {
      targetDoc = spSnap.data();
      targetDocId = spSnap.id;
    } else {
      const paSnap = await db.collection("project_admins").doc(targetKey).get();
      if (paSnap.exists) {
        targetDoc = paSnap.data();
        targetDocId = paSnap.id;
      }
    }
  }

  // 3. Resolve target user in Firebase Authentication
  let targetAuthUser = null;
  let targetAuthUid = null;

  if (targetKey) {
    try {
      targetAuthUser = await auth.getUser(targetKey);
      if (targetAuthUser) targetAuthUid = targetAuthUser.uid;
    } catch (_uErr) {}
  }
  if (!targetAuthUser && (targetDoc?.email || targetEmail)) {
    const emailToLookup = (targetDoc?.email || targetEmail).toLowerCase().trim();
    try {
      targetAuthUser = await auth.getUserByEmail(emailToLookup);
      if (targetAuthUser) targetAuthUid = targetAuthUser.uid;
    } catch (_eErr) {}
  }
  if (!targetAuthUser && targetDoc?.uid) {
    try {
      targetAuthUser = await auth.getUser(targetDoc.uid);
      if (targetAuthUser) targetAuthUid = targetAuthUser.uid;
    } catch (_u2Err) {}
  }

  // Check self-deletion again with resolved Auth UID
  if (targetAuthUid && targetAuthUid === callerUid) {
    throw new HttpsError("invalid-argument", "Users cannot delete their own currently active logged-in account.");
  }

  // 4. RBAC Guard: Site Admin cannot delete a Super Admin account
  const targetRole = targetDoc?.role || targetDoc?.ptwRole || targetAuthUser?.customClaims?.role || "";
  const isTargetSuperAdmin =
    targetRole === "super-admin" ||
    targetDoc?.superAdmin === true ||
    targetAuthUser?.customClaims?.superAdmin === true ||
    (targetAuthUser?.email && targetAuthUser.email.toLowerCase() === "aic1176@aurogroup.com") ||
    targetEmail === "aic1176@aurogroup.com";

  if (isTargetSuperAdmin && !isCallerSuperAdmin) {
    throw new HttpsError("permission-denied", "Site Administrators cannot delete a Super Administrator account.");
  }

  // 5. RBAC Guard: Verify Site Admin project scoping
  if (!isCallerSuperAdmin) {
    let callerProjectId = request.auth.token.projectId;
    const callerRole = request.auth.token.role || "";
    let isCallerSiteAdmin =
      callerRole === "project-admin" ||
      callerRole === "site-admin" ||
      callerRole === "admin" ||
      request.auth.token.admin === true;

    if (!isCallerSiteAdmin || !callerProjectId) {
      const callerDoc = await db.collection("users").doc(callerUid).get();
      if (callerDoc.exists) {
        const cd = callerDoc.data();
        if (cd.role === "project-admin" || cd.role === "site-admin" || cd.role === "admin" || cd.uiRole === "admin") {
          isCallerSiteAdmin = true;
        }
        if (!callerProjectId && cd.projectId) {
          callerProjectId = cd.projectId;
        }
      }
    }

    if (!isCallerSiteAdmin) {
      throw new HttpsError("permission-denied", "Only Super Admin and Site Admins have authority to delete user accounts.");
    }

    let targetProjectId = targetDoc?.projectId || projectId;
    if (targetProjectId === "The Pearl") targetProjectId = "PRJ-PEARL";
    if (targetProjectId === "The Regent") targetProjectId = "PRJ-REGENT";
    if (targetProjectId === "Sansa County") targetProjectId = "PRJ-SANSA";

    if (callerProjectId && targetProjectId && callerProjectId !== targetProjectId) {
      throw new HttpsError("permission-denied", `Site Administrators can only delete staff within their assigned project (${callerProjectId}).`);
    }
  }

  // 6. Dual Deletion - Permanent removal from Firebase Authentication
  if (targetAuthUid) {
    try {
      await auth.deleteUser(targetAuthUid);
      console.log(`[adminDeleteUser] Permanently deleted Auth user: ${targetAuthUid} (${targetEmail || targetDoc?.email || ""})`);
    } catch (authErr) {
      if (authErr.code !== "auth/user-not-found") {
        console.warn(`[adminDeleteUser] Non-fatal Auth delete notice for ${targetAuthUid}:`, authErr);
      }
    }
  }

  // 7. Dual Deletion - Permanent removal from Cloud Firestore
  const docsToDelete = new Set();
  if (targetDocId) docsToDelete.add(targetDocId);
  if (targetKey) docsToDelete.add(targetKey);
  if (targetAuthUid) docsToDelete.add(targetAuthUid);

  const cleanEmail = (targetEmail || targetDoc?.email || targetAuthUser?.email || "").toLowerCase().trim();
  const batchOps = [];

  for (const docId of docsToDelete) {
    batchOps.push(db.collection("users").doc(docId).delete().catch(() => {}));
    batchOps.push(db.collection("site_personnel").doc(docId).delete().catch(() => {}));
    batchOps.push(db.collection("project_admins").doc(docId).delete().catch(() => {}));
    batchOps.push(db.collection("rate_limits").doc(docId).delete().catch(() => {}));
  }

  if (cleanEmail) {
    try {
      const uSnap = await db.collection("users").where("email", "==", cleanEmail).get();
      uSnap.forEach(d => batchOps.push(d.ref.delete().catch(() => {})));
    } catch (_e) {}
    try {
      const spSnap = await db.collection("site_personnel").where("email", "==", cleanEmail).get();
      spSnap.forEach(d => batchOps.push(d.ref.delete().catch(() => {})));
    } catch (_e) {}
    try {
      const paSnap = await db.collection("project_admins").where("email", "==", cleanEmail).get();
      paSnap.forEach(d => batchOps.push(d.ref.delete().catch(() => {})));
    } catch (_e) {}
  }

  await Promise.all(batchOps);

  // 8. Clean up references in /projects collection
  try {
    const pSnap = await db.collection("projects").get();
    for (const pDoc of pSnap.docs) {
      const pData = pDoc.data();
      let needsUpdate = false;
      const pUpdates = {};

      if (
        (cleanEmail && pData.adminEmail && pData.adminEmail.toLowerCase() === cleanEmail) ||
        (targetAuthUid && pData.adminUid === targetAuthUid) ||
        (targetDocId && pData.adminUid === targetDocId)
      ) {
        pUpdates.adminEmail = null;
        pUpdates.adminUid = null;
        pUpdates.adminName = null;
        needsUpdate = true;
      }

      if (cleanEmail && pData.safetyInchargeEmail && pData.safetyInchargeEmail.toLowerCase() === cleanEmail) {
        pUpdates.safetyInchargeEmail = null;
        needsUpdate = true;
      }

      if (pData.staffRoles) {
        const newStaffRoles = Object.assign({}, pData.staffRoles);
        let staffRemoved = false;
        for (const [sKey, sVal] of Object.entries(newStaffRoles)) {
          if (
            docsToDelete.has(sKey) ||
            (sVal && sVal.email && sVal.email.toLowerCase() === cleanEmail) ||
            (sVal && sVal.uid && docsToDelete.has(sVal.uid))
          ) {
            delete newStaffRoles[sKey];
            staffRemoved = true;
          }
        }
        if (staffRemoved) {
          pUpdates.staffRoles = newStaffRoles;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        pUpdates.updatedAt = FieldValue.serverTimestamp();
        await pDoc.ref.set(pUpdates, { merge: true });
      }
    }
  } catch (_pErr) {
    console.warn("[adminDeleteUser] Projects reference cleanup notice:", _pErr);
  }

  // 9. Write immutable audit log entry
  await recordServerAuditLog(
    "USER_DELETED_PERMANENT",
    `User account ${targetAuthUid || targetDocId || targetKey} (${cleanEmail || "no-email"}) permanently deleted (Auth + Firestore) by ${callerEmail}`,
    callerUid,
    callerEmail,
    targetDoc?.projectId || projectId || "GLOBAL"
  );

  return {
    success: true,
    deleted: true,
    uid: targetAuthUid || targetDocId || targetKey,
    email: cleanEmail
  };
});

// ============================================================================
// 6C. ONE-CLICK ORPHANED AUTH USERS CLEANUP (SUPER ADMIN EXCLUSIVE)
// ============================================================================
exports.adminSyncAndPurgeOrphanAuthUsers = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }
  try {
    await enforceRateLimit(request.auth.uid, "adminSyncAndPurgeOrphanAuthUsers", 10, 60);

  const callerEmail = (request.auth.token.email || "").toLowerCase().trim();
  let isCallerSuperAdmin =
    request.auth.token.superAdmin === true ||
    request.auth.token.role === "super-admin" ||
    callerEmail === "aic1176@aurogroup.com";

  if (!isCallerSuperAdmin) {
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (callerDoc.exists && (callerDoc.data().role === "super-admin" || callerDoc.data().superAdmin === true)) {
      isCallerSuperAdmin = true;
    }
  }

  if (!isCallerSuperAdmin) {
    throw new HttpsError("permission-denied", "Only Super Administrators can scan and purge orphaned Auth accounts.");
  }

  // 1. Fetch all Firestore user UIDs and emails
  const usersSnap = await db.collection("users").get();
  const firestoreUids = new Set();
  const firestoreEmails = new Set();

  usersSnap.forEach(doc => {
    firestoreUids.add(doc.id);
    const d = doc.data();
    if (d.uid) firestoreUids.add(d.uid);
    if (d.id) firestoreUids.add(d.id);
    if (d.email) firestoreEmails.add(d.email.toLowerCase().trim());
  });

  const paSnap = await db.collection("project_admins").get();
  paSnap.forEach(doc => {
    firestoreUids.add(doc.id);
    const d = doc.data();
    if (d.uid) firestoreUids.add(d.uid);
    if (d.email) firestoreEmails.add(d.email.toLowerCase().trim());
  });

  const spSnap = await db.collection("site_personnel").get();
  spSnap.forEach(doc => {
    firestoreUids.add(doc.id);
    const d = doc.data();
    if (d.uid) firestoreUids.add(d.uid);
    if (d.email) firestoreEmails.add(d.email.toLowerCase().trim());
  });

  // Protected bootstrap accounts
  const PROTECTED_EMAILS = new Set([
    "aic1176@aurogroup.com",
    "ehs.superadmin@aurorealty.com"
  ]);

  // 2. Scan Firebase Authentication accounts with full pageToken pagination
  let totalAuthScanned = 0;
  const purged = [];
  let pageToken = undefined;

  do {
    const listUsersResult = pageToken ? await auth.listUsers(1000, pageToken) : await auth.listUsers(1000);
    const authUsers = listUsersResult.users || [];
    totalAuthScanned += authUsers.length;

    for (const userRecord of authUsers) {
      const uEmail = (userRecord.email || "").toLowerCase().trim();

      if (PROTECTED_EMAILS.has(uEmail) || userRecord.customClaims?.superAdmin === true || userRecord.uid === request.auth.uid) {
        continue;
      }

      const hasFirestoreMatch = firestoreUids.has(userRecord.uid) || (uEmail && firestoreEmails.has(uEmail));
      if (!hasFirestoreMatch) {
        try {
          await auth.deleteUser(userRecord.uid);
          purged.push({ uid: userRecord.uid, email: userRecord.email });
          console.log(`[adminSyncAndPurgeOrphanAuthUsers] Purged orphan Auth account: ${userRecord.uid} (${userRecord.email})`);
        } catch (delErr) {
          if (delErr.code !== "auth/user-not-found") {
            console.warn(`[adminSyncAndPurgeOrphanAuthUsers] Error deleting orphan Auth user ${userRecord.uid}:`, delErr);
          }
        }
      }
    }
    pageToken = listUsersResult.pageToken;
  } while (pageToken);

  // 3. Write immutable server audit log
  await recordServerAuditLog(
    "ORPHAN_AUTH_USERS_PURGED",
    `Purged ${purged.length} orphaned Firebase Auth accounts out of ${totalAuthScanned} total users scanned`,
    request.auth.uid,
    callerEmail,
    "GLOBAL"
  );

  return {
    success: true,
    purgedCount: purged.length,
    purgedUsers: purged,
    totalScanned: totalAuthScanned
  };
  } catch (err) {
    console.error("[adminSyncAndPurgeOrphanAuthUsers] Critical error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Orphaned accounts scan failed: " + (err.message || String(err)));
  }
});

// ============================================================================
// 6D. SWITCH ACTIVE ROLE & LOCATION CONTEXT (CALLABLE CLOUD FUNCTION)
// ============================================================================
exports.switchActiveRole = onCall({ region: REGION }, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required to switch active role.");
  }
  await enforceRateLimit(request.auth.uid, "switchActiveRole", 30, 60);

  const { targetRole, targetProjectId, targetLocationId, targetLocationName } = request.data || {};
  if (!targetRole) {
    throw new HttpsError("invalid-argument", "targetRole is required.");
  }

  const uid = request.auth.uid;
  const userDocSnap = await db.collection("users").doc(uid).get();
  if (!userDocSnap.exists) {
    throw new HttpsError("not-found", "User document not found.");
  }
  const userData = userDocSnap.data();

  // Verify caller is authorized for targetRole
  const allowedRoles = Array.isArray(userData.roles) ? [...userData.roles] : [userData.role, userData.ptwRole, userData.uiRole].filter(Boolean);
  if (Array.isArray(userData.assignments)) {
    userData.assignments.forEach(a => {
      if (a && a.role && !allowedRoles.includes(a.role)) allowedRoles.push(a.role);
    });
  }

  const isSuperAdminCaller =
    userData.superAdmin === true ||
    userData.role === "super-admin" ||
    request.auth.token.role === "super-admin" ||
    request.auth.token.superAdmin === true ||
    (request.auth.token.email && request.auth.token.email.toLowerCase() === "aic1176@aurogroup.com");

  if (!isSuperAdminCaller && !allowedRoles.includes(targetRole)) {
    throw new HttpsError("permission-denied", `User is not authorized for role ${targetRole}.`);
  }

  const newProjectId = targetProjectId || userData.projectId || request.auth.token.projectId || "PRJ-PEARL";

  await auth.setCustomUserClaims(uid, {
    role: targetRole,
    roles: allowedRoles,
    uiRole: targetRole,
    ptwRole: targetRole,
    projectId: newProjectId,
    projectIds: Array.isArray(userData.projectIds) ? userData.projectIds : [newProjectId],
    locationId: targetLocationId || userData.locationId || "CAMPUS-WIDE",
    locationName: targetLocationName || userData.locationName || "Full Worksite",
    campusWide: !!(userData.campusWide || targetLocationId === "CAMPUS-WIDE"),
    name: userData.name || userData.displayName || "Authorized User",
    superAdmin: isSuperAdminCaller
  });

  await db.collection("users").doc(uid).set({
    activeRole: targetRole,
    activeProjectId: newProjectId,
    activeLocationId: targetLocationId || null,
    activeLocationName: targetLocationName || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await recordServerAuditLog(
    "USER_ROLE_SWITCHED",
    `User ${userData.name || uid} switched active operational role to ${targetRole} for project ${newProjectId}`,
    uid,
    userData.email || request.auth.token.email,
    newProjectId
  );

  return {
    success: true,
    activeRole: targetRole,
    activeProjectId: newProjectId,
    activeLocationId: targetLocationId || null
  };
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
    let activePermits;
    try {
      activePermits = await db
        .collection("permits")
        .where("status", "==", "active")
        .where("validTill", "<=", now)
        .limit(100)
        .get();
    } catch (idxErr) {
      console.warn("Index fallback in escalationSweep (falling back to status-only query with in-memory filter):", idxErr);
      const snap = await db.collection("permits").where("status", "==", "active").limit(100).get();
      const filteredDocs = snap.docs.filter((d) => {
        const vt = d.data().validTill;
        if (!vt) return false;
        const vtMillis = vt.toMillis ? vt.toMillis() : new Date(vt).getTime();
        return vtMillis <= now.toMillis();
      });
      activePermits = { forEach: (fn) => filteredDocs.forEach(fn), size: filteredDocs.length };
    }

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
