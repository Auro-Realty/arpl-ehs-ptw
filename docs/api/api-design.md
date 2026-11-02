# API Design — ARPL EHS Permit-to-Work System

> **Architecture**: Hybrid Firebase Client Data Layer + Google Cloud Run Core API (`asia-south1`)  
> **Auth**: Firebase Auth (Email/Password with Custom Claims)  
> **Transport**: Cloud Run REST API (`/api/v1/...`) for Authoritative FSM Transitions & PDFs + Cloud Functions for Reactive Triggers  
> **Scope**: All 10 Permit Types + Sunday Work Tile | 6 Business Projects · 360 Unique Users · 300 Permits/Day  

---

## 1. Authentication & Security Context

All API calls require a valid Firebase Auth Bearer JWT token obtained via `signInWithEmailAndPassword()`.

Users are pre-assigned to projects by the Administrator — self-registration is disabled.

**Client-side call pattern** (Cloud Run REST API via standard Fetch / Axios):
```javascript
// Retrieve current Firebase Auth JWT with custom claims
const idToken = await firebase.auth().currentUser.getIdToken();

// Invoke authoritative Cloud Run Core Backend API
const response = await fetch('https://api.arpl-ehs.internal/api/v1/permits/' + permitId + '/transition', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({ action: 'approve_stage', stage: currentStage, signatureUrl, gpsCoords })
});
const result = await response.json();
```

**Server-side validation** (inside Cloud Run Express/Fastify Middleware):
```typescript
// Verify Firebase Auth ID token and extract cryptographically signed claims
const decodedToken = await admin.auth().verifyIdToken(bearerToken);
const role = decodedToken.role; // e.g. "site-engineer"
const projectIds = decodedToken.projectIds || []; // e.g. ["PRJ-AGR"]
```

### Admin User Management Functions
| Function | Purpose | Authorization |
|---|---|---|
| `createUser` | Create new user with role and project assignment | Admin only |
| `assignUserToProject` | Update user's project assignments | Admin only |
| `updateUserRole` | Change user's functional role | Admin only |
| `disableUser` | Deactivate a user account | Admin only |

---

## 2. Permit CRUD Operations

### POST /api/permits (createPermit)
Create a new permit draft.

| Field | Type | Required | Notes |
|---|---|---|---|
| ptype | string | Yes | One of 11 permit types |
| project | string | Yes | Must be configured project ID |
| locationMode | string | Yes | tower, basement, or manual |
| location | object | Yes | Per mode: tower+floor, level, or manual text |
| contractor | string | Yes | Min 2 chars |
| supervisor | string | Yes | Min 2 chars |
| workerCount | integer | Yes | Min 1 |
| validFrom | string | Yes | ISO date |
| validTill | string | Yes | ISO datetime |
| startTime | string | Yes | HH:MM |
| checklist | array | Yes | Per-type checklist responses |
| sitePhoto | string | Yes | GCS/Firebase Storage path |
| signature | object | Yes | { dataUrl, signerName, consent, timestamp, gps } |
| typeSpecific | object | Yes | Permit-type-specific parameters |

**Response**: `{ permitId: string, status: "Draft" }`

### GET /api/permits (listPermits)
List permits visible to the current user's role.

**Query Parameters**:
- status (optional): Filter by status
- project (optional): Filter by project
- ptype (optional): Filter by permit type
- q (optional): Search query (tokenized across ID, contractor, location, tower)
- limit (optional): Page size (default 50)
- cursor (optional): Pagination cursor

**Response**: `{ permits: Permit[], nextCursor: string }`

### GET /api/permits/:id (getPermit)
Get single permit detail.

**Authorization**: User role must be in permit's stakeholder list.

**Response**: `{ permit: Permit }`

### POST /api/permits/:id/submit (submitPermit)
Submit a draft permit for approval.

**Authorization**: Permit creator only.
**Precondition**: Permit status must be "Draft".
**Processing**: Validates all required fields, sets status based on permit type routing, records submittedAt.

### POST /api/permits/:id/approve (approvePermitStage)
Approve the current stage of a permit.

| Field | Type | Required | Notes |
|---|---|---|---|
| comment | string | No | Approval comment |
| gps | object | Yes | { lat, lng } |
| signature | object | Yes | { dataUrl, signerName, consent } |
| declarations | object | No | Type-specific statutory declarations |

**Authorization**: `roleCanActOnChain(permit.approvals, userRole)` must be true.
**Processing**: Execute `actOnChain()`, advance state, emit notifications.

### POST /api/permits/:id/reject (rejectPermitStage)
Reject the current stage and return for correction.

| Field | Type | Required |
|---|---|---|
| comment | string | Yes |
| gps | object | Yes |
| signature | object | Yes |

**Processing**: Set status to "Returned for Correction", record rejection origin, emit notifications.

### POST /api/permits/:id/close (closeAndSurrenderPermit)
Close and surrender an active or expired permit.

| Field | Type | Required | Notes |
|---|---|---|---|
| comment | string | No | Closure comment |
| gps | object | Yes | Must be within geofence |
| signature | object | Yes | Permittee signature |
| photo | string | No | Closure photo path |
| closureDeclarations | object | Yes | Per-type mandatory declarations |

**Authorization**: Strictly the original permittee role (Site Supervisor for civil, Electrician for PTW-006, etc.)

---

## 3. Observation Operations

### POST /api/permits/:id/observation/raise
Raise a safety observation on an active permit.

**Authorization**: Strictly `ehs-manager` or `ehs-officer`.

| Field | Type | Required |
|---|---|---|
| comment | string | Yes |
| severity | string | Yes (deviation or stop_work) |
| gps | object | Yes |

### POST /api/permits/:id/observation/respond
Respond to an observation with rectification evidence.

**Authorization**: Strictly `site-supervisor`.

| Field | Type | Required |
|---|---|---|
| comment | string | Yes |
| photo | string | Yes (mandatory) |
| gps | object | Yes |

### POST /api/permits/:id/observation/ack-engineer
Engineer acknowledges rectification.

**Authorization**: Strictly `site-engineer`.

### POST /api/permits/:id/observation/review-section-head
Section Head reviews rectification.

**Authorization**: Appropriate section head role.

### POST /api/permits/:id/observation/resolve
EHS resolves the observation.

**Authorization**: `ehs-manager` or `ehs-officer`.

### POST /api/permits/:id/observation/reject
EHS rejects the rectification.

**Authorization**: `ehs-manager` or `ehs-officer`.

---

## 4. Extension Operations

### POST /api/permits/:id/extension/request
Request a permit extension.

**Authorization**: Original permittee.
**Preconditions**: Before 18:30 IST; no open observations; permit is Active.

| Field | Type | Required |
|---|---|---|
| requestedMinutes | integer | Yes |
| reason | string | Yes |
| gps | object | Yes |
| signature | object | Yes |

### POST /api/permits/:id/extension/approve
Approve an extension request at the current stage.

**Authorization**: Stage-appropriate role.

### POST /api/permits/:id/extension/reject
Reject an extension request.

### POST /api/permits/:id/extension/revise
Revise a rejected extension request.

---

## 5. Notification Operations

### GET /api/notifications (getNotifications)
Get notifications for the current user's role.

**Query Parameters**:
- limit (optional, default 50)
- unreadOnly (optional, boolean)

### POST /api/notifications/mark-read (markAllRead)
Mark all notifications as read for the current user.

---

## 6. Admin Operations

### GET /api/projects (listProjects)
List all projects with geofence configuration.

### POST /api/projects/:id/configure (configureGeofence)
Configure or update geofence for a project.

**Authorization**: Strictly `admin`.

| Field | Type | Required |
|---|---|---|
| lat | number | Yes |
| lng | number | Yes |
| radius | number | Yes |
| signature | object | Yes |

---

## 7. PDF Operations

### GET /api/permits/:id/pdf (generatePermitPDF)
Generate and download the statutory PDF report.

**Authorization**: Strictly `ehs-manager` or `ehs-officer`.
**Precondition**: Permit must be in Active, Expired, Closed, or Cancelled state.

---

## 8. Dashboard Operations

### GET /api/dashboard (getDashboard)
Get role-specific dashboard data with KPI cards and permit feeds.

**Response**:
```json
{
  "kpiCards": [
    { "label": "Active Permits", "value": 12 },
    { "label": "Pending My Approval", "value": 3 }
  ],
  "recentPermits": [...],
  "pendingActions": [...]
}
```

---

## 9. Error Responses

All errors follow this structure:
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

### Error Codes
| Code | HTTP Status | Description |
|---|---|---|
| AUTH_REQUIRED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Role not authorized for this action |
| NOT_FOUND | 404 | Permit or resource not found |
| STATE_CONFLICT | 409 | Invalid state transition |
| VALIDATION_ERROR | 400 | Missing or invalid input fields |
| GEOFENCE_VIOLATION | 400 | GPS outside project geofence |
| SLA_VIOLATION | 400 | Extension request outside allowed window |
| SERVER_ERROR | 500 | Internal server error |
