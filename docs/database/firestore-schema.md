# Database Schema — Firestore Design

## Collection Architecture

```
arpl-ehs-db/
├── permits/              # Primary permit documents
│   └── {permitId}/       # e.g., "EXC-2026-000001"
├── notifications/        # Role-targeted notifications
│   └── {notifId}/        # Auto-generated ID
├── projects/             # Project site registry
│   └── {projectId}/      # e.g., "PRJ-AGR"
├── users/                # User profiles and role assignments
│   └── {uid}/            # Firebase Auth UID
├── counters/             # Permit sequence counters
│   └── {ptype}/          # One counter per permit type
└── config/               # System configuration
    └── app/              # APP_CONFIG equivalent
```

---

## Collection: permits

### Document Schema

```typescript
interface Permit {
  // Identity
  id: string;                     // "EXC-2026-000001"
  ptype: PermitType;              // "excavation" | "hotwork" | etc.
  
  // Project Context
  project: string;                // "Auro Grand Residency"
  projectId: string;              // "PRJ-AGR"
  
  // Location
  locationMode: "tower" | "basement" | "manual";
  location: string;               // Formatted location string
  locationData: {
    tower?: string;               // Tower name (if tower mode)
    floor?: string;               // Floor (if tower mode)
    level?: string;               // Level (if basement mode)
    manualLocation?: string;      // Manual text (if manual mode)
    manualArea?: string;          // Manual area (if manual mode)
  };
  
  // Work Details
  contractor: string;
  supervisor: string;
  workerCount: number;
  
  // Validity Window
  validFrom: Timestamp;
  validTill: Timestamp;
  startTime: string;              // "HH:MM"
  
  // State Machine
  status: string;                 // One of 27 operational states
  submittedAt: Timestamp | null;
  activatedAt: Timestamp | null;
  stageEnteredAt: Timestamp | null;
  
  // Approval Chain (varies by permit type)
  approvals: ApprovalChain;
  
  // Digital Signatures
  signatories: {
    [roleKey: string]: SignatoryRecord;
  };
  
  // Safety Checklist
  checklist: ChecklistItem[];
  
  // Media References (Cloud Storage paths)
  media: {
    sitePhoto: string | null;     // "gs://bucket/permits/id/site-photo.jpg"
    drawing: string | null;       // PTW-001 only
    closurePhoto: string | null;
    extensionPhoto: string | null;
  };
  
  // Sub-State Machines
  observation: Observation | null;
  extension: Extension | null;
  
  // Escalation State
  escalation: {
    stage1: boolean;
    stage2: boolean;
  };
  warn30: boolean;
  
  // Type-Specific Parameters (varies by ptype)
  typeParams: ExcavationParams | HotWorkParams | ConfinedParams | 
              ElectricalParams | BlastingParams | LiftingParams | 
              GeneralParams | ShaftParams | GuardrailParams | NightShiftParams;
  
  // Audit Trail
  activityLog: ActivityLogEntry[];
  
  // Weekend Governance
  sundayWork: boolean;
  originTile: "PTW" | "SUN";
  
  // Access Control Helper
  stakeholders: string[];         // Pre-computed list of role keys for security rules
  
  // Metadata
  createdBy: string;              // Firebase Auth UID
  createdByRole: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Type-Specific Parameters

```typescript
interface ExcavationParams {
  depth: number;
  slopeRatio: string;
  soilType: string;
  equipment: string[];
  undergroundDrawings: boolean;
}

interface HotWorkParams {
  hotworkTypes: string[];
  welderName: string;
  welderSubcontractor: string;
  fireWatch: boolean;             // Required true for closure
}

interface ConfinedParams {
  confinedActivity: string;
  numPersonnel: number;
  confinedDeclaration: boolean;
  gasReadings: {
    o2: number;
    lel: number;
    co: number;
    h2s: number;
  };
  confinedClosure: boolean;       // Entrant evacuation declaration
}

interface ElectricalParams {
  facilityScope: "site" | "batching_plant";
  shutdownWhy: string;
  electricalApparatus: string[];
  shutdownFrom: string;
  shutdownTo: string;
  electricalSafeToWork: boolean;
  lotoRegisterNo: string;
  lotoDateTime: string;
  electricalStatutoryDecl: boolean;
  electricalClosureConfirmed: boolean;
}

interface BlastingParams {
  operationCategory: "blasting" | "drilling";
  dbDateTime: string;
  dbChargeAmount: number;
  dbBlastDiameter: number;
  dbBlastDepth: number;
  dbHolesCount: number;
  dbExplosiveType: string;
  dbMachineType: string;
  dbDrillDiameter: number;
  dbDrillDepth: number;
  dbOtherPrecautions: string;
  blastingRigHolesLoaded: number;
  blastingRigHoleDepthM: number;
  blastingMufflerLayers: number;
  blastingSafeDistance: number;
  blastingStatutoryDecl: boolean;
  blastingInchargePhoto: string;
  blastingClearanceConfirmed: boolean;
}

interface LiftingParams {
  liftType: "routine" | "critical";
  loadDescription: string;
  loadWeight: number;
  craneType: string;
  craneCapacity: number;
  craneRadius: number;
  slingType: string;
  slingCount: number;
  slingSWL: number;
  slingAngle: number;
  calculatedStress: number;
  isTandemLift: boolean;
  riggingEquipment: string[];
  liftingGear: string[];
  operatorSignature: SignatoryRecord;
  signalerSignature: SignatoryRecord;
  liftingSpecialPrecautions: string;
  liftingDemobilization: boolean;
}

interface GeneralParams {
  generalWorkCategory: string;
  generalWorkDescription: string;
  generalHousekeeping: boolean;
}

interface ShaftParams {
  shaftType: string;
  floorFrom: string;
  floorTo: string;
  numPersonnel: number;
  scaffTagVerified: boolean;
  shaftDeclaration: boolean;
}

interface GuardrailParams {
  guardrailActivities: string[];
  guardrailOtherDetail: string;
  guardrailReFix: boolean;
}

interface NightShiftParams {
  linkedPermitId: string;
  nightSupervisor: string;
  nightSupervisorQualified: boolean;
  pmAuthorization: string;
  ptwTrainingDate: string;
  handoverTime: string;
  nightPhaseStatus: "day" | "night" | "morning";
}
```

### Sub-Entity Schemas

```typescript
interface SignatoryRecord {
  name: string;
  role: string;
  roleLabel: string;
  at: Timestamp;
  gps: { lat: number; lng: number; distance: number };
  signature: string;              // GCS path to signature image
  consent: boolean;
}

interface ChecklistItem {
  question: string;
  ans: "yes" | "no" | "na";
  comment: string;
  photo: string | null;          // GCS path
  gps: { lat: number; lng: number } | null;
}

interface Observation {
  id: string;
  raisedAt: Timestamp;
  raisedBy: string;
  role: string;
  severity: "deviation" | "stop_work";
  comment: string;
  gps: { lat: number; lng: number };
  status: "Open" | "Rectified - Awaiting Engineer Ack" | 
          "Pending Section Head Review" | "Pending EHS Clearance" | "Resolved";
  response: { comment: string; photo: string; gps: object; at: Timestamp } | null;
  engineerAck: { by: string; comment: string; gps: object; at: Timestamp } | null;
  sectionHeadReview: { by: string; comment: string; at: Timestamp } | null;
}

interface Extension {
  requestedAt: Timestamp;
  requestedMinutes: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  stage: "siteEngineer" | "sectionHead" | "ehs";
  approvals: {
    siteEngineer: { status: string; at: Timestamp } | null;
    sectionHead: { status: string; at: Timestamp } | null;
    ehs: { status: string; at: Timestamp } | null;
  };
}

interface ActivityLogEntry {
  at: Timestamp;
  text: string;
  by: string;
  role: string;
}
```

---

## Collection: notifications

```typescript
interface Notification {
  id: string;
  roles: string[];                // Target role keys
  message: string;
  severity: "info" | "warn" | "error";
  permitId: string;
  category: "approval" | "escalation" | "warning" | "alert" | "reminder";
  createdAt: Timestamp;
  readBy: string[];               // UIDs that have read this notification
}
```

---

## Collection: projects

```typescript
interface Project {
  id: string;                     // "PRJ-AGR"
  name: string;
  towers: string[];
  site: { lat: number; lng: number; address: string };
  radius: number;                 // Geofence radius in meters
  configured: boolean;
  tagMethod: string;
  configuredBy: string;           // UID
  configuredAt: Timestamp;
}
```

---

## Collection: users

```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  displayName: string;
  email: string;                  // Email/password login (confirmed auth method)
  role: string;                   // Primary role key (one of 16 roles)
  projectIds: string[];           // Admin pre-assigned project IDs (NOT self-selected)
  assignedBy: string;             // UID of the Administrator who assigned projects
  assignedAt: Timestamp;          // When projects were last assigned/updated
  org: string;                    // Organization (e.g., "ARPL")
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

> **Admin-Assigned Model**: Users cannot self-select projects. The `projectIds[]` array is managed exclusively by the Administrator via the `createUser` and `assignUserToProject` Cloud Functions, which simultaneously update the Firestore document and Firebase Auth custom claims.

---

## Collection: counters

Used for generating sequential permit IDs per type:

```typescript
interface PermitCounter {
  current: number;                // Auto-incremented
  prefix: string;                 // "EXC", "HW", "GR", etc.
  lastUpdated: Timestamp;
}
```

Implemented via Firestore transactions to prevent duplicate IDs:
```javascript
const counterRef = doc(db, 'counters', ptype);
await runTransaction(db, async (transaction) => {
  const counterDoc = await transaction.get(counterRef);
  const newSeq = (counterDoc.data().current || 0) + 1;
  transaction.update(counterRef, { current: newSeq, lastUpdated: serverTimestamp() });
  return `${prefix}-${year}-${String(newSeq).padStart(6, '0')}`;
});
```

---

## Indexes

### Composite Indexes (Firestore)

```
permits: [status ASC, updatedAt DESC]
permits: [projectId ASC, status ASC, updatedAt DESC]
permits: [ptype ASC, status ASC, updatedAt DESC]
permits: [stakeholders ARRAY_CONTAINS, updatedAt DESC]
permits: [status ASC, validTill ASC]  // For escalation engine
notifications: [roles ARRAY_CONTAINS, createdAt DESC]
```

---

## Data Migration Strategy (from LocalStorage)

### Phase 1: Schema Mapping
Current `PERMITS[]` array maps directly to Firestore `permits` collection documents. The existing JSON schema requires minimal transformation:
1. Base64 media fields (sitePhoto, drawing, signatures) must be extracted and uploaded to Cloud Storage, replaced with GCS paths
2. Timestamps must be converted from ISO strings to Firestore Timestamps
3. `stakeholders` array must be pre-computed and stored for security rule queries

### Phase 2: Migration Script
```javascript
// Pseudocode for migration
const localState = JSON.parse(localStorage.getItem('arpl_ehs_ptw_state_v16_prod'));
for (const permit of localState.permits) {
  // 1. Upload media to Cloud Storage
  // 2. Convert timestamps
  // 3. Compute stakeholders array
  // 4. Write to Firestore
  await setDoc(doc(db, 'permits', permit.id), transformedPermit);
}
```
