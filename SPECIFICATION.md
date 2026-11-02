# ARPL EHS Permit-to-Work — Normalized Specification

> **Source of truth**: [README.md](README.md), [index.html](index.html) (~21,450 LOC), [ptw_swimlanes.html](ptw_swimlanes.html), 25 master test suites (100% pass rate).

---

## 1. Functional Requirements

### FR-001 — Permit Lifecycle State Machine
| Field | Value |
|---|---|
| **ID** | FR-001 |
| **Description** | Enforce a finite-state machine (FSM) governing the complete permit lifecycle from Draft through multi-stage approvals to Active to Close/Surrender/Cancel/Expire |
| **Actors** | All 16 roles |
| **Preconditions** | User is authenticated with a valid role |
| **Inputs** | Permit form data, checklist responses, digital signatures, GPS coordinates, photos |
| **Processing** | State transitions validated by chainStage(), roleCanActOnChain(), and approvePermitStage() |
| **Outputs** | Status mutation, audit log entry, stakeholder notifications |
| **Business Rules** | 27 distinct operational states; transitions are strictly gated by role authorization |
| **Exceptions** | Invalid role = Access Denied; Missing signature = Blocked; Off-site GPS = Warning |
| **Dependencies** | GPS Engine (FR-011), Signature Engine (FR-012), Notification Engine (FR-010) |
| **Acceptance** | Every state transition documented in section 6 is enforceable; 1,090+ automated assertions confirm |

### FR-002 — 10 Permit Type Modules
Support 10 distinct permit types: PTW-001 Excavation, PTW-002 Hot Work, PTW-003 Guard Rail, PTW-004 Confined Space, PTW-005 Shaft Work, PTW-006 Electrical (HT/LT) with dual topology, PTW-007 Drilling and Blasting, PTW-008 General Work, PTW-009A Routine Lifting, PTW-009B Critical Lift Plan, PTW-010 Night Shift. Each type has unique checklist (9-21 items), unique approval chain topology (3-8 stages), unique closure/surrender declarations, and unique location mode restrictions.

### FR-003 — Role-Based Access Control (RBAC)
Implement 16 distinct functional roles with strict permission boundaries covering form activation matrix, visibility isolation matrix, and approval-flow gating.

### FR-004 — Multi-Stage Approval Chains
Support parallel gates (3-way for PTW-001), sequential spines, either/or gates (PTW-006 Site), and first-wins gates (EHS Manager OR Officer). Stale-approval retention and fast-track re-routing on rejection.

### FR-005 — Safety Observation Workflow
EHS can raise safety observations on active permits; observations block extension and closure until resolved through 4-stage rectification. Unresolved observation at expiry triggers emergency auto-cancel.

### FR-006 — Permit Extension Workflow
Permittees can request extensions within operational windows; 3-stage approval: Site Engineer to Section Head to EHS. 18:30 IST request cutoff; 20:30 IST max ceiling; PTW-007 Blasting extensions completely disabled.

### FR-007 — Escalation and Auto-Expiry Engine
Real-time tick engine (5s interval) monitoring SLA breaches and permit validity. Dynamic Stage 1 SLA (45s demo / 2h prod), Stage 2 SLA (120s demo / 4h prod), T-30 min warning, auto-expire, auto-cancel on open observation.

### FR-008 — 4-Step Permit Creation Wizard
Guided wizard: Step 1 General Info, Step 2 Safety Checklist, Step 3 Permit Validity, Step 4 Review and Sign. Dynamic form fields per permit type; checklist gating; GPS captured on final submission.

### FR-009 — Statutory PDF Generation
Generate comprehensive A4 statutory PDF reports via jsPDF. Strictly restricted to EHS Manager/Officer across all 10 permit types and lifecycle states. Includes full signatory chain, technical sub-tables (PTW-009 rigging stress calculations & Part A/B checklists), observations, extensions, and activity log.

### FR-010 — Notification Engine
Role-targeted in-app notification dispatch with severity levels (info, warn, error). Max 250 notifications; role-scoped filtering; mark-all-read; broadcast capability.

### FR-011 — GPS Geofencing and Proximity Verification
Haversine-based proximity verification ensuring signatories are within configured project site radius. 3 pre-configured projects. Admin can configure coordinates and radius. Canvas radar visualization.

### FR-012 — Digital Signature Engine
Canvas-based PointerEvents signature capture with High-DPI scaling, Bezier smoothing, file upload alternative, and auto-sign simulation. DPDP Act 2023 consent required; dynamic name binding; 10 cross-process signature points.

### FR-013 — Role-Specific Dashboards and KPIs
Dynamic dashboard per role with KPI cards, quick actions, and scoped permit feeds. Zero-state resilient; empty array safe; role-scoped filtering.

### FR-014 — Permit Register and Advanced Filtering
Tabular permit register with multi-field tokenized search, status/project/type filters, and newest-first sorting. Unified heading across all roles; approval-flow visibility isolation.

### FR-015 — Configuration-Driven Architecture (APP_CONFIG)
Centralized Single Source of Truth (`APP_CONFIG`) governing all dynamic UI, workflows, statuses, form definitions, navigation, dashboards, SLA timings, weather options, and contractor directory.

### FR-016 — Confined Space Multi-Gas Detection
4-parameter atmospheric testing engine for PTW-004. O2: 19.5-21.0%, LEL: less than 10%, CO: less than 25 PPM, H2S: 5 PPM or less.

### FR-017 — Sling Stress Calculation Engine
Automated rigging geometry calculator for PTW-009. T = (W x L)/(H x N); N=2 safety clamping; greater than 80% SWL triggers auto-promotion to PTW-009B.

### FR-018 — Weekend Operations Governance (Sunday Work Tile)
Saturday advance preparation tile plus Sunday zero-creation lockout engine. PTW-010 hard exclusion from Sunday tile; IST calendar-driven activation; 3-layer enforcement.

### FR-019 — PTW-010 Night Shift Dual-Phase Handover
8-stage dual-phase governance: Day approval, Linked activity permit, 20:30 Night handover, PM inspection, EHS activation, Morning closure. Night supervisor qualification gate; 21:00 cutoff auto-cancel; strict prohibitions.

### FR-020 — Location Selection Mode and Safety Restriction Matrix
3-mode location selection (Tower, Basement/Podium, Manual) with per-permit-type restrictions. Excavation: no Tower; Guard Rail/Shaft: no Manual; Blasting: Manual only; Electrical BP: Manual only.

### FR-021 — Dynamic Project Structural Hierarchy & Accessor Layer
Project-level structural hierarchies defining custom building towers, basement levels, floor counts, and approved contractors per construction site. Structural accessors (`getProjectTowers`, `getProjectBasements`, `getProjectFloors`, `getProjectContractors`) dynamically populate wizard choices when projects switch.

### FR-022 — Enterprise Contractor Directory & Datalist Auto-Suggest
Centralized approved contractor catalog (`APP_CONFIG.contractorDirectory`) featuring vendor codes, trade categories, safety ratings, and empanelment status. Wizard provides real-time `<datalist id="contractorDatalist">` auto-suggest while supporting unlisted agencies.

### FR-023 — Configurable SLA Escalation Policy & Operating Windows
Administrative control over escalation thresholds: Fast Demo Mode (Stage 1: 45s, Stage 2: 120s) and Enterprise Production Mode (Stage 1: 2h, Stage 2: 4h). Configurable validity expiry warning offsets (default 30 min) and statutory cutoff hours.

### FR-024 — Multi-Panel Administrative Governance Center
Multi-tab Administration Center (`view-admin-config`) featuring 5 dedicated control panels:
1. Worksite GPS & Geofencing (on-site tagging, slider, radar preview)
2. Projects & Structural Hierarchies (register new project, add towers, configure basements)
3. Approved Contractor Directory (empanel vendor, assign trade, set safety rating)
4. SLA Timers & Operating Windows (mode toggle, threshold tuning)
5. Permit Types & Weekend Rules (enable/disable permit types, toggle Sunday Work tile)

## 2. Non-Functional Requirements

| Category | Requirement | Implementation (Hybrid Firebase + Cloud Run Architecture) |
|---|---|---|
| **Performance** | Sub-second render for dashboards and register | Firestore real-time listeners + client-side rendering; Cloud Run <250ms warm API |
| **Scalability** | Baseline: 6 projects, 360 unique users, 300 permits/day (9,000/mo, 109.5k/yr) | Cloud Run container auto-scaling (80 req/instance); Firestore multi-tenant partitioning |
| **Availability** | Offline-capable with automatic sync on reconnect | CONFIRMED: Firestore offline persistence via `enableIndexedDbPersistence(db)` |
| **Reliability** | Zero data loss on connectivity loss; 1-min RPO | Firestore offline queue + Point-in-Time Recovery (PITR 7-day continuous) + weekly GCS export |
| **Security** | XSS prevention & Device Attestation | `escapeHtml()` + Firestore Security Rules + Firebase App Check + Secret Manager |
| **Authentication** | CONFIRMED: Closed-registration Email/Password login | Firebase Auth `signInWithEmailAndPassword()` with custom claims (`role`, `projectIds[]`) |
| **Authorization** | 16-role RBAC with authoritative server-side gating | Cloud Run transition API (`roleCanActOnChain`) + Firestore Security Rules |
| **User-Project Binding** | CONFIRMED: 60 users/site pre-assigned by Admin | Admin Cloud Run API sets `projectIds[]` on user document and Firebase custom claims |
| **Auditability** | Immutable activity log per permit; DPDP Act 2023 | Append-only subcollection (`permits/{id}/activity_log/{logId}`); tamper-proof rules |
| **Accessibility** | WCAG 2.1 AA tap targets | 44px minimum; focus-visible outlines |
| **Mobile Responsiveness** | 6-tier responsive breakpoints | 360px to 4K; bottom-sheet modals; safe-area insets |
| **Compliance** | DPDP Act 2023 & Indian DGFASLI Statutory Standards | Explicit consent; dynamic identity binding; continuous 7-day PITR; statutory A4 PDFs |
| **Timezone** | IST strict enforcement (server-side validated) | `Asia/Kolkata` enforced in client and Cloud Run backend |
| **Implementation Scope** | CONFIRMED: All 10 permit types + Sunday Work Tile | PTW-001 through PTW-010 + Weekend Governance simultaneously |

---

## 3. User Roles (16 Roles)

| Role | Key | Create | Approve | Cancel | View Scope |
|---|---|---|---|---|---|
| Site Supervisor | site-supervisor | PTW-001-05, 08 | No | No | Own flow |
| Permittee Electrician | electrician | PTW-006 | No | No | Own flow |
| Blasting In-charge | blasting-incharge | PTW-007 | No | No | Own flow |
| Lifting Supervisor | lift-supervisor | PTW-009A/B | No | No | Own flow |
| Night Site Supervisor | night-supervisor | No | Handover | No | Own flow |
| Site Engineer | site-engineer | No | Ack Step 2 | No | All except BP |
| MEP Engineer | mep | No | Domain clearance | No | PTW-001,05,06S |
| P and M Engineer | pm | No | Domain/LOTO | No | PTW-001,06,09 |
| IT Engineer | it | No | Parallel clearance | No | PTW-001 only |
| Quality Engineer | quality-engineer | No | Quality clearance | No | PTW-006 BP |
| Excavation Head | excavation-head | No | Section Head PTW-001 | Cancel | PTW-001 |
| Tower Incharge | hw-section-head | No | Section Head multi | Cancel | Multi-type |
| Project Manager | project-manager | No | Executive PTW-009B | No | PTW-009B |
| EHS Manager | ehs-manager | No | Final all | Cancel | All |
| EHS Officer | ehs-officer | No | Final all | Cancel | All |
| Administrator | admin | No | No | No | All + User/Project mgmt |

---

## 4. Core Data Entities

### Entity: Permit
Key fields: id, ptype, project, projectId (logical partition), status (27 states), locationMode, location, contractor, supervisor, workerCount, validFrom, validTill, startTime, submittedAt, activatedAt, approvals (chain object per type), signatories, checklist (array), observation (nullable), extension (nullable), mediaPaths (photos, signatures, drawings), sundayWork flag, type-specific parameters.

### Entity: ActivityLogEntry (Subcollection: `permits/{permitId}/activity_log/{logId}`)
Key fields: id, permitId, action, actorRole, actorUid, actorName, stage, timestamp (IST), gps, details. Append-only, immutable.

### Entity: Notification
Key fields: id, roles (array), message, severity (info/warn/error), permitId, projectId, createdAt, readBy (array)

### Entity: Project
Key fields: id, name, towers (array), site.lat, site.lng, radius (meters), configured (boolean), tagMethod

### Entity: User
Key fields: uid (Firebase Auth UID), displayName, email, role (primary role key), projectIds (array — admin-assigned), org, createdAt, lastLogin

---

## 5. Confirmed Design Decisions

| Decision | Confirmed Choice | Impact |
|---|---|---|
| **Architecture** | Hybrid Firebase + Cloud Run | Firebase Client Data Layer + Cloud Run Core Backend API & Statutory Compute |
| **Authentication** | Email/Password + Custom Claims | Firebase Auth `signInWithEmailAndPassword()`; custom claims for role and project isolation |
| **User-Project Assignment** | Admin pre-assigns (60 users/site)| Cloud Run Admin API manages `projectIds[]` on user documents and custom claims |
| **Offline Support** | Enabled | Firestore `enableIndexedDbPersistence(db)` for full offline CRUD and background queue |
| **Compute Backbone** | Google Cloud Run (`asia-south1`)| Authoritative 27-state FSM transitions, statutory A4 PDF rendering, SLA escalation engine |
| **Async Architecture** | Cloud Tasks + Cloud Scheduler | Rate-limited background task queues and 5-min cron SLA sweeps |
| **Implementation Scope** | All 10 permits + Sunday Work | PTW-001 to PTW-010, Weekend Governance, Night Shift — simultaneous |

---

## 6. Resolved Gap Analysis

### Previously Open — Now Resolved

| # | Original Gap | Resolution |
|---|---|---|
| 1 | Workload baseline scale | RESOLVED: 6 business projects, 360 unique users (60/proj), 300 permits/day (9,000/mo, 109.5k/yr) |
| 2 | Cloud Run necessity | RESOLVED: Cloud Run required for Core API, statutory PDF generation, and SLA escalation worker |
| 3 | Multi-project isolation | RESOLVED: 1 GCP/Firebase project with logical `projectId` partitioning and security rules |
| 4 | Offline data loss risk | RESOLVED: Activity log decoupled into append-only subcollection (`permits/{id}/activity_log`) |
| 5 | Media storage architecture | RESOLVED: Direct client uploads to Firebase Storage (wrapping GCS); URLs only in Firestore |
| 6 | Currency & pricing standard | RESOLVED: Direct INR and live FX rate 1 USD = ₹95.90 INR (Mumbai `asia-south1` catalog) |
| 7 | Regulatory disaster recovery | RESOLVED: Firestore 7-day continuous PITR + automated weekly GCS bucket snapshots |
| 8 | Asynchronous queueing | RESOLVED: Cloud Tasks for background PDF rendering; Cloud Scheduler for SLA escalation |
| 9 | Tax & commercial quoting | RESOLVED: Google Cloud India Pvt Ltd (SAC 998315), 18% GST with full B2B ITC creditability |
| 10 | AI integration scope | RESOLVED: Deterministic safety rules for core; optional Vertex AI Gemini 1.5 Flash for hazard OCR |

### Technical Decisions (Finalized)
1. Production system maintains authoritative state transitions in Cloud Run (`arpl-ehs-api`)
2. IST timezone enforcement is both client-side and server-side validated
3. GPS proximity verification utilizes Haversine formula against configured site coordinates
4. All 10 permit types and Sunday Work Tile operate simultaneously within the unified data model
5. Primary region is Google Cloud `asia-south1` (Mumbai, Maharashtra, India)

