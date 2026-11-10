# ARPL EHS Permit-to-Work (PTW) Platform Architecture Specification
*Unified Provisioning, Multi-Role RBAC, Dual-Deletion, and Worksite Isolation*

*   **Author:** Mohith, Prasanna, Abigna (Lead Full-Stack Architecture Team)
*   **Status:** In Review (Goldfish Review Remediated)
*   **Date:** 2026-11-10
*   **Target Repository:** `arpl-ehs-ptw`
*   **Platform Stack:** 100% Native Firebase Serverless Stack:
    *   **Firebase Authentication**: Identity management, email/password credentials, and minimal custom claims (`role`, `projectId`, `superAdmin`, `roles[]`, `projectIds[]`).
    *   **Cloud Firestore**: Multi-tenant document database, offline IndexedDB persistence, live `onSnapshot` subscriptions, and granular security rules (`firestore.rules`).
    *   **Cloud Functions for Firebase (2nd Gen / Node.js 22)**: Serverless callable endpoints (`onCall`), scheduled background tasks (`onSchedule`), and storage triggers (`onObjectFinalized`) in `asia-south1` (Mumbai).
    *   **Firebase Cloud Storage**: Statutory inspection photo evidence, canvas digital signatures, and PDF storage with strict path security (`storage.rules`).
    *   **Firebase Hosting**: Global CDN edge distribution for client SPA assets (`public/index.html`, `public/firebase-config.js`).
*   **Target Files:** `public/index.html`, `index.html`, `functions/index.js`, `firestore.rules`, `storage.rules`, `public/config.projects.json`

---

## Overview

This specification defines the enterprise architecture for the Auro Realty Environmental Health & Safety (EHS) Digital Permit-to-Work platform (`arpl-ehs-ptw`), built purely on native Firebase services. The system governs statutory permitting workflows (PTW-001 through PTW-010) across three construction worksites: The Pearl (`PRJ-PEARL`), The Regent (`PRJ-REGENT`), and Sansa County (`PRJ-SANSA`).

This architecture standardizes user empanelment, establishes a multi-role and multi-location user schema with dynamic header switchers, enforces atomic dual-deletion across Firebase Authentication and Cloud Firestore, standardizes the statutory role taxonomy with Indian site conventions (Project Admin), enforces strict data scoping for Project Admins, and guarantees byte parity between root and `/public` assets for Firebase deployments.

---

## Problem

*   **P-01 (Dual Provisioning Divergence)**: Super Admin and Project Admin operated through separate empanelment interfaces, causing inconsistent payload structures, missing fields, and inability to edit provisioned staff post-creation.
*   **P-02 (Single-Role / Flat-Location Limitation)**: The legacy schema bound a user document to a single scalar `role` and single `locationId`, preventing cross-tower personnel (e.g., an engineer covering Tower 4 and Tower 5, or a safety officer assigned across multiple zones) from executing duties without multiple logins.
*   **P-03 (Orphaned Ghost Auth Accounts)**: Previous user deletions only removed Firestore documents (`/users/{uid}`), leaving credentials active in Firebase Authentication. This caused auth-store desynchronization and blocked account re-creation with `auth/email-already-in-use` collisions.
*   **P-04 (Role Taxonomy Inconsistency)**: Approval topologies across PTW-001 through PTW-010 referenced legacy titles (e.g., "Hot Work Section Head", conflated Site Engineer and Section Head roles, ambiguous "Site Admin" terminology) that created confusion on Indian construction sites and caused approval flow deadlocks.
*   **P-05 (Project Admin Scope Leakage)**: Project Admins could view global aggregated metrics or unassigned site permits if queries lacked strict `projectId` scoping.
*   **P-06 (Split-Brain Source Divergence)**: The repository maintained duplicate copies of `index.html`, `404.html`, and `firebase-config.js` in both `/` and `/public/`, risking production regressions when edits were made to only one copy.

---

## Goals

*   **G-01 (Unified Provisioning Form)**: Implement a single, unified empanelment form in `public/index.html` shared by Super Admin and Project Admin, with Super Admin selecting any project and Project Admin locked to their assigned `projectId`.
*   **G-02 (Post-Assignment Editability)**: Enable full editing of existing user profiles, passwords, role assignments, and tower allocations directly within the User Directory table.
*   **G-03 (Multi-Role & Multi-Location Schema & Dynamic Switchers)**: Support multiple operational roles and tower allocations per user via an `assignments[]` array, with dynamic Header Role & Location switchers, validated in `functions/index.js` against `AUTHORITATIVE_PROJECT_TOWERS` and secured by `firestore.rules`.
*   **G-04 (Atomic Dual-Deletion & Ghost Auth Cleanup)**: Ensure user removal permanently deletes accounts from both Firebase Authentication (`auth.deleteUser`) and Cloud Firestore (`/users`, `/site_personnel`, `/project_admins`), backed by a one-click ghost account purge tool (`adminSyncAndPurgeOrphanAuthUsers`).
*   **G-05 (Standardized 16-Role Taxonomy & Project Admin Standard)**: Standardize role nomenclature to Indian site practices (`Project Admin` replacing `Site admin`), separate Site Engineer from Section Head, eliminate "Hot Work Section Head", and enforce the `Role Name (Permittee/Approver/Issuer/Admin)` format across the frontend and Cloud Functions for all 16 platform roles (15 field/site roles + 1 global Super Admin).
*   **G-06 (Strict Project Admin Data Scoping)**: Restrict Project Admin access across permits (PTW-001 to PTW-010), MIS dashboards, and report logs strictly to their assigned `projectId`.
*   **G-07 (Asset Parity & Automated Firebase CI/CD)**: Guarantee 100% byte parity between root and `/public` assets before test runs and deployment to Firebase Hosting and Cloud Functions.

---

## Non-Goals

*   **NG-01 (Statutory Safety Core)**: Modifying statutory checklist questions or safety rules defined for PTW-001 through PTW-010.
*   **NG-02 (Delegated Admin Elevation)**: Allowing Project Admins to provision other Project Admins or Super Admins (restricted to Super Admin).
*   **NG-03 (Self-Registration Gate)**: Self-registration or open public signup (closed enterprise empanelment model only).
*   **NG-04 (UI Super Admin Empanelment)**: Creating Super Admin accounts through the UI empanelment form (Super Admin accounts remain strictly database/bootstrap-level managed).
*   **NG-05 (External Compute Avoidance)**: Introducing non-Firebase external compute services or third-party infrastructure.

---

## Resolved Decisions

*   **D-01 (Super Admin Provisioning Boundary)**: Super Admin creation is strictly prohibited from the UI form. Only the pre-configured bootstrap credential (`aic1176@aurogroup.com`) and database-level seeding manage Super Admin access.
*   **D-02 (Multi-Role Header Switcher)**: Multi-role users are provided a dynamic **Role Switcher dropdown** (`#headerRoleSwitcher`) in the top navigation bar. Selecting an active role invokes `switchActiveRole` to update custom claims, refresh the Auth ID token, and re-render dashboard KPIs and approval queues without full re-authentication.
*   **D-03 (Multi-Location Header Switcher)**: Users assigned to multiple towers or zones across a worksite are provided a dynamic **Location Switcher dropdown** (`#headerLocationSwitcher`) in the top navigation bar. Selecting an active location re-scopes GPS proximity checks and permit registers to that specific tower/zone.
*   **D-04 (Terminology Alignment)**: The administrative role at the worksite is officially designated as **Project Admin** (mapped to canonical key `project-admin`), reflecting standard Indian construction site management hierarchy and preventing confusion with Site Safety In-charges.
*   **D-05 (Firestore Direct Deletion Lockdown)**: Direct client deletion on `/users`, `/site_personnel`, and `/project_admins` is blocked in `firestore.rules` (`allow delete: if false;`), forcing all user removals through the atomic `adminDeleteUser` Cloud Function.

---

## Technical Plan

### 1. Unified User Provisioning Architecture

The empanelment interface in `public/index.html` standardizes user onboarding through a single unified DOM structure (`#empanelSiteRoleForm`) shared between Super Admin and Project Admin.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        UNIFIED USER PROVISIONING FORM ARCHITECTURE                     │
│                                                                                        │
│   Super Admin Mode (aic1176@aurogroup.com)       Project Admin Mode (Site Operations)   │
│   ┌─────────────────────────────────────┐       ┌─────────────────────────────────────┐│
│   │ [1. Project Select: UNLOCKED       ]│       │ [1. Project Select: HIDDEN / LOCKED ]││
│   │     PRJ-PEARL | REGENT | SANSA      │       │     Fixed to currentUser.projectId  ││
│   │ [2. Operational Role: 16 Roles     ]│       │ [2. Operational Role: Site Roles    ]││
│   │     Project Admin + Field Staff     │       │     Operational Roles Only          ││
│   │ [3. Tower / Zone Select            ]│       │ [3. Tower / Zone Select             ]││
│   │     Dynamic per selected project    │       │     Authoritative Towers of Site    ││
│   │ [4. Name, Email, Password, EmpId   ]│       │ [4. Name, Email, Password, EmpId    ]││
│   │ [5. Digital Signature (Canvas/File)]│       │ [5. Digital Signature (Canvas/File) ]││
│   │ [6. Submit / Edit User Action      ]│       │ [6. Submit / Edit User Action       ]││
│   └─────────────────────────────────────┘       └─────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Form Controls and Data Flow
1. **Dynamic Project Selection (`#newStaffProject`)**:
   * **Super Admin**: Rendered visible as a dropdown populated with all registered projects (`PRJ-PEARL`, `PRJ-REGENT`, `PRJ-SANSA`). Changing project dynamically updates `#empanelTowerSelect` with that project's authoritative towers.
   * **Project Admin**: Form element is hidden and locked to `currentUser.projectId`.
2. **Post-Assignment Edit Workflow (`editStaffEmpanelment(uid)`)**:
   * Selecting "Edit" in the User Directory table loads the existing user record into `#empanelSiteRoleForm`.
   * Form title changes to "Edit Personnel Profile", submit button switches to "Update User Profile & Assignments", and a "Cancel Edit" button appears.
   * Password input is optional during edit: if left blank, existing credentials remain untouched.
3. **Dual Signature Upload & Draw Option**:
   * Provides both an HTML5 Canvas draw pad and a file upload button (`<input type="file" accept="image/*">`), saving signatures to `signatures/{projectId}/users/{userId}.png`.

---

### 2. Multi-Role & Multi-Location User Schema and Header Switchers

#### Cloud Firestore Document Model (`/users/{uid}`)

```json
{
  "uid": "aBcD1234EfGh5678",
  "email": "engineer.rajesh@aurogroup.com",
  "displayName": "Rajesh Sharma",
  "empId": "ARPL-SANSA-014",
  "phone": "+91 98765 43210",
  "primaryRole": "site-engineer",
  "primaryRoleLabel": "Site Engineer (Field Verifier)",
  "activeRole": "site-engineer",
  "roles": ["site-engineer", "site-supervisor"],
  "projectId": "PRJ-SANSA",
  "projectName": "Sansa County",
  "projectIds": ["PRJ-SANSA"],
  "locationId": "SANSA-SEC1-Z12",
  "locationName": "Sector 1 - Zone 1 & 2",
  "activeLocationId": "SANSA-SEC1-Z12",
  "assignments": [
    {
      "projectId": "PRJ-SANSA",
      "projectName": "Sansa County",
      "locationId": "SANSA-SEC1-Z12",
      "locationName": "Sector 1 - Zone 1 & 2",
      "role": "site-engineer",
      "roleLabel": "Site Engineer (Field Verifier)",
      "isPrimary": true
    },
    {
      "projectId": "PRJ-SANSA",
      "projectName": "Sansa County",
      "locationId": "SANSA-SEC1-Z03",
      "locationName": "Sector 1 - Zone 03",
      "role": "site-supervisor",
      "roleLabel": "Permittee (Initiator)",
      "isPrimary": false
    }
  ],
  "status": "Active",
  "disabled": false,
  "signatureUrl": "gs://prj-aurorealty-ehs-ptw-dev.appspot.com/signatures/PRJ-SANSA/users/aBcD1234EfGh5678.png",
  "createdAt": "2026-11-10T12:00:00Z",
  "updatedAt": "2026-11-10T12:00:00Z"
}
```

#### Custom Claims Optimization (< 1,000 Bytes Guard)
To prevent exceeding Firebase Authentication's 1,000-byte claim ceiling, custom claims are strictly trimmed to scalar keys:
```javascript
{
  role: "site-engineer",           // Active operational role
  projectId: "PRJ-SANSA",          // Active worksite
  roles: ["site-engineer", "site-supervisor"], // Allowed role keys
  projectIds: ["PRJ-SANSA"],       // Allowed worksites
  superAdmin: false
}
```
All rich assignment metadata (tower labels, dates, vendor codes) is stored exclusively in Cloud Firestore `/users/{uid}`.

---

### 3. Callable API Specifications & Input/Output Contracts

#### Endpoint: `adminDeleteUser`
*   **Trigger**: `httpsCallable('adminDeleteUser')`
*   **Security**: Rate-limited (30 req / 60s). Caller must be `super-admin` or `project-admin` matching target's `projectId`. Self-deletion and deletion of Super Admin by Project Admin are blocked.
*   **Input Schema**:
    | Parameter | Type | Required | Description |
    |---|---|---|---|
    | `uid` | string | Yes | Firebase Auth UID or Firestore document ID |
    | `email` | string | Optional | Email fallback for orphan lookup |
*   **Output Schema**:
    | Field | Type | Description |
    |---|---|---|
    | `success` | boolean | True if deletion succeeded |
    | `deleted` | boolean | Confirmation of dual removal |
    | `uid` | string | Deleted UID |
    | `email` | string | Deleted email |

#### Endpoint: `adminSyncAndPurgeOrphanAuthUsers`
*   **Trigger**: `httpsCallable('adminSyncAndPurgeOrphanAuthUsers')`
*   **Security**: Super Admin exclusive (`aic1176@aurogroup.com`).
*   **Input Schema**: `{}` (Empty payload)
*   **Output Schema**:
    | Field | Type | Description |
    |---|---|---|
    | `success` | boolean | True if sync and purge completed |
    | `totalScanned` | number | Total Auth accounts evaluated across pages |
    | `purgedCount` | number | Number of orphaned ghost accounts removed |
    | `purgedUsers` | array | List of `{ uid, email }` objects purged |

#### Endpoint: `adminAssignProjectRole`
*   **Trigger**: `httpsCallable('adminAssignProjectRole')`
*   **Security**: Rate-limited (25 req / 60s). Scoped by `projectId`.
*   **Input Schema**:
    | Parameter | Type | Required | Description |
    |---|---|---|---|
    | `action` | string | Optional | `'delete'`, `'toggle-status'`, `'reset-password'`, `'purge_orphan_auth_users'` |
    | `email` | string | Conditional | User official email address |
    | `role` | string | Conditional | Canonical role key or title alias |
    | `projectId` | string | Yes | Worksite ID (`PRJ-PEARL`, `PRJ-REGENT`, `PRJ-SANSA`) |
    | `locationName`| string | Yes | Authoritative tower/zone name |
    | `password` | string | Optional | Optional for edits; min 6 chars if provided |
    | `displayName` | string | Optional | Full name of staff member |
    | `uid` | string | Optional | Existing UID for profile updates |

---

### 4. Standardized 16-Role Taxonomy (Project Admin Standard)

The platform establishes 16 canonical operational roles categorized into five functional tiers:

| Canonical Role Key | Display Title (Standardized Format) | Functional Tier | Workflow Authority |
|---|---|---|---|
| `site-supervisor` | Permittee (Initiator) | Tier 1 · Permittee | PTW-001 to PTW-005, PTW-008 |
| `electrician` | Electrician (Specialist Permittee) | Tier 1 · Permittee | PTW-006 (Electrical Work) |
| `blasting-incharge` | Blasting Incharge (Specialist Permittee) | Tier 1 · Permittee | PTW-007 (Drilling & Blasting) |
| `lift-supervisor` | Lifting Supervisor (Specialist Permittee) | Tier 1 · Permittee | PTW-009A/B (Lifting Operations) |
| `site-engineer` | Site Engineer (Field Verifier) | Tier 2 · Approver | Field Verification & Physical Safety Check across all permits |
| `mep` | MEP (Technical Approver) | Tier 2 · Approver | Domain Clearance (PTW-001, PTW-005, PTW-006) |
| `pm` | P&M (Plant & Machinery Approver) | Tier 2 · Approver | Mechanical & LOTO Clearance (PTW-001, PTW-006, PTW-009) |
| `it` | IT in charge (Technical Approver) | Tier 2 · Approver | Parallel Infrastructure Clearance (PTW-001) |
| `quality-engineer` | Quality Engineer (Technical Approver) | Tier 2 · Approver | Batching Plant Quality Review (PTW-006 BP) |
| `hw-section-head` | Tower In charge (Section Approver) | Tier 3 · Approver | Tower & Structural Clearance (PTW-002 to PTW-005, 007, 008, 009) |
| `excavation-head` | Section Head (Civil Approver) | Tier 3 · Approver | Civil & Earthwork Clearance (PTW-001) |
| `ehs-officer` | EHS supervisor (Safety Endorser) | Tier 4 · Approver | Surveillance & Joint Field Endorsement |
| `ehs-manager` | EHS Head (Statutory Endorser / Issuer) | Tier 4 · Approver / Issuer | Final Statutory Activation, Stop-Work, & A4 PDF Generation |
| `project-manager` | Project Manager (Executive Approver) | Tier 4 · Approver | Critical Lift (PTW-009B) & Statutory Escalation |
| `project-admin` | Project Admin (Worksite Administrator) | Tier 5 · Administrator | Worksite Geofence, Tower Setup & Staff Empanelment |
| `super-admin` | Super admin (Global Administrator) | Tier 5 · Administrator | System-wide Configuration, Project Admin Provisioning, Auth Purge |

*   **Project Admin Nomenclature**: Renamed to **Project Admin** across the UI, badges, and headers, ensuring Indian worksite personnel clearly distinguish the operational project administrator from safety in-charges.
*   **Strict Separation**: `site-engineer` (Step 2 Field Verification) and `hw-section-head` / `excavation-head` (Step 3 Domain / Section Approval) are strictly separated. A Site Engineer cannot approve as Section Head.
*   **Removal of Legacy Terms**: "Hot Work Section Head" is permanently replaced with "Tower In charge (Section Approver)".

---

### 5. Project Admin Data Scoping & Multi-Tenant Isolation

1. **Permits Register Gating**:
   * The Worksite Permits Register (`#view-permits-register`) queries permits filtering strictly by `where('projectId', '==', currentUser.projectId)`.
   * Cross-project permit cards and counters are blocked from client memory.
2. **EHS Management Information System (MIS) Reports**:
   * Compliance rates, turnaround times, and Sunday adherence statistics are calculated exclusively from permits matching `currentUser.projectId`.
   * CSV export (`Export Statutory MIS`) only serializes permits belonging to the Project Admin's worksite.
3. **Geofence & Tower Configuration**:
   * Project Admins can only view and update GPS coordinates, radius sliders, and tower allocations for their assigned project.

---

### 6. Canonical Asset Parity & Firebase CI/CD Pipeline

```text
Repository Root (/)                            Hosting Public (/public)
┌──────────────────────┐                       ┌──────────────────────┐
│ index.html           │◄───── 100% PARITY ───►│ public/index.html    │
│ firebase-config.js   │  (scripts/sync_public) │ public/firebase-config│
│ 404.html             │                       │ public/404.html      │
│ config.projects.json │                       │ public/config.projects│
└──────────────────────┘                       └──────────────────────┘
```

*   **Automated Sync Guard**: `package.json` wires `node scripts/sync_public.js` into `pretest` and `predeploy`. `tests/run_all_tests.js` asserts 100% byte parity before running test suites.
*   **CI/CD Workflow (`.github/workflows/deploy.yml`)**:
    *   Step 1: Check out repository and set up Node.js 22 LTS.
    *   Step 2: Authenticate to Google Cloud via Keyless Workload Identity Federation.
    *   Step 3: Execute `node scripts/sync_public.js`.
    *   Step 4: Inject Firebase API keys into client configs.
    *   Step 5: Deploy Firestore rules, composite indexes, storage rules, and Firebase Hosting (`--only firestore,storage,hosting`) with strict exit code zero enforcement.
    *   Step 6: Deploy Cloud Functions (`--only functions`).

---

## Alternatives Considered

### Alternative 1: Multiple Isolated Accounts per Personnel Role / Worksite

*   **Description**: Requiring field personnel to maintain multiple independent login accounts (e.g. `rajesh.eng@aurogroup.com` and `rajesh.sup@aurogroup.com`) to operate across different roles or towers.
*   **Pros**: Keeps the user document schema strictly scalar (single `role`, single `locationId`); eliminates the need for dynamic client-side role switchers and complex session state.
*   **Cons**: Imposes severe friction on Indian site operations; forces workers to log in and out repeatedly across shifts; increases password reset volume and credential confusion; risks missed statutory approval deadlines.
*   **Reason for Rejection**: Field operations mandate a single login identity per staff member. Implementing multi-role assignments with dynamic in-session header switchers (`#headerRoleSwitcher` and `#headerLocationSwitcher`) provides operational fluidity while preserving statutory non-repudiation and immutable audit logs.

### Alternative 2: Soft Deletion via Firestore Status Flag Only

*   **Description**: Deactivating user documents by setting `status = "Deactivated"` or deleting only the Cloud Firestore document `/users/{uid}`, leaving the account intact in Firebase Authentication.
*   **Pros**: Avoids backend administrative functions; simple client-side Firestore document deletion.
*   **Cons**: Leaves ghost accounts in Firebase Authentication; prevents re-empanelling the user's official email due to `auth/email-already-in-use` exceptions; violates DPDP Act 2023 statutory right-to-erasure guidelines.
*   **Reason for Rejection**: This was the direct root cause of the orphan account blocker. Permanent atomic dual-deletion via `adminDeleteUser` ensures complete synchronization across identity and database layers.

### Alternative 3: External Microservices / Cloud Run Express Containers

*   **Description**: Running a traditional Node.js Express microservice on Google Cloud Run to process RBAC validation, user management, and PDF rendering.
*   **Pros**: Familiar centralized REST architecture with traditional Express middleware.
*   **Cons**: Violates the mandated 100% pure Firebase serverless architecture; introduces container lifecycle overhead, cold starts during morning shift rushes, and deployment IAM permission barriers in automated CI/CD pipelines.
*   **Reason for Rejection**: The platform is strictly constrained to native Firebase services. Cloud Functions 2nd Gen (`onCall`, `onSchedule`, `onObjectFinalized`) integrates natively with Firebase Authentication and Firestore security rules without external server infrastructure.
