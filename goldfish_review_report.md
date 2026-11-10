# Goldfish Annotated Review Report: Resolution & Verification

**Target:** `functions/index.js`, `public/index.html`, `index.html`  
**Commit:** `7a5af53` (`fix(auth): fix purge ghost users projectId requirement and standardize Project Admin nomenclature`)  
**Deployment Target:** `prj-aurorealty-ehs-ptw-dev` (`asia-south1`)  
**Status:** Resolved  

---

## Executive Summary of Resolved Deficiencies

In response to the user screenshot showing:
1. Red toast error: **`Purge failed: internal`** when clicking **`[Sync Auth & Purge Ghost Users]`** as Super Admin.
2. The Users Directory table displaying `Site Administrator` instead of `Project Admin` for user `Gnanaprakasam.S`.
3. Navigation, banners, and provisioning cards still referencing legacy "Site Administrator / Site Admin" nomenclature.

A comprehensive root-cause analysis was conducted, and the full serverless stack was patched, tested, and synchronized across root `index.html`, `public/index.html`, and `functions/index.js`.

---

## Detailed Root Causes & Implemented Fixes

### 1. `Purge failed: internal` Resolution

- **Root Cause**:
  1. In `public/index.html`, `handlePurgeGhostUsers()` invoked `adminSyncAndPurgeOrphanAuthUsers` with fallback to `adminAssignProjectRole({ action: 'purge_orphan_auth_users' })`.
  2. In `functions/index.js`, `adminAssignProjectRole` had a strict validation gate:
     ```javascript
     if (action !== "delete") {
       if (!effectiveProjectId || !validateProjectId(effectiveProjectId)) {
         throw new HttpsError("invalid-argument", "Valid projectId is required.");
       }
     }
     ```
     Because `action === "purge_orphan_auth_users"` is global across all construction sites and did not specify `projectId`, this gate threw `invalid-argument: Valid projectId is required`.
  3. Furthermore, line 1055 contained a self-healing claims block `if (isProjAdmin && request.auth.uid)` which lacked `!isSuperAdminCaller`, risking Super Admin token disruption.
  4. Firebase callable SDK translated this unhandled error into `FirebaseError: internal`.

- **Fix Applied**:
  - In `functions/index.js`, explicitly exempted purge actions from the mandatory `projectId` requirement:
    ```javascript
    const isPurgeAction =
      action === "purge_orphan_auth_users" ||
      action === "adminSyncAndPurgeOrphanAuthUsers";

    if (action !== "delete" && !isPurgeAction) {
      if (!effectiveProjectId || !validateProjectId(effectiveProjectId)) {
        throw new HttpsError("invalid-argument", "Valid projectId is required.");
      }
    }
    ```
  - Added `!isSuperAdminCaller` to protect Super Admin custom claims:
    ```javascript
    if (isProjAdmin && request.auth.uid && !isSuperAdminCaller) { ... }
    ```
  - Added full `pageToken` pagination support and wrapped both `adminSyncAndPurgeOrphanAuthUsers` and `adminAssignProjectRole` in top-level `try / catch` blocks with detailed error logging.
  - In `public/index.html` (and root `index.html`), passed fallback parameter `projectId: 'PRJ-SANSA'` and converted generic `internal` error messages into clear, actionable UI guidance.

---

### 2. Standardized "Project Admin" Nomenclature & Table Display

- **Root Cause**:
  1. `renderUsersDirectoryView()` in `public/index.html` hardcoded `roleLabel: 'Site Administrator'` when populating `allUsers` from `PROJECT_ADMINS`.
  2. The table row generator directly rendered `u.roleLabel` without sanitizing legacy values to `Project Admin`.
  3. The sidebar navigation item at line 17031 still displayed `'Site Admins Provisioning'` instead of `'Project Admins Provisioning'`.
  4. The information banners and card titles retained legacy "Site Administrator" phrasing.

- **Fix Applied**:
  - Updated line 27956 to set `roleLabel: 'Project Admin'`.
  - Added dynamic role normalization in `renderUsersDirectoryView()` table row rendering:
    ```javascript
    let displayRole = u.roleLabel || u.role;
    if (u.role === 'admin' || u.role === 'project-admin' || (typeof displayRole === 'string' && (displayRole.toLowerCase().includes('site admin') || displayRole.toLowerCase().includes('site administrator')))) {
        displayRole = 'Project Admin';
    }
    ```
    This guarantees that any legacy Firestore document with `Site Administrator` or `Site Admin` will render with the clean `Project Admin` badge (`st-active` with `fa-user-gear`).
  - Standardized all navigation items, quick buttons, and provisioning forms from `Site Admin / Site Administrator` to `Project Admin / Project Admins`.
  - Updated notice banners to state:
    `Individual site personnel accounts (creation, deletion, password reset) are delegated exclusively to the assigned Project Admin.`

---

## Parity & Test Suite Verification

1. **Asset Parity**:
   - `index.html` <==> `public/index.html` confirmed **100% byte-identical** (`1,963,563 bytes`).
2. **Master Test Suite Execution**:
   - Executed `node tests/run_all_tests.js`.
   - **Result**: **28 / 28 test suites passed cleanly with 100% success rate**.
   - Suites verified include:
     - Suite 27: Atomic dual-deletion & ghost auth cleanup
     - Suite 28: Role switcher, location switcher & Project Admin standard
     - Suites 1–26: All 10 permit workflows (PTW-001 to PTW-010), SLA engine, geofencing, DPDP compliance, and approval engines.
3. **CI/CD Pipeline**:
   - Pushed commit `7a5af53` to `origin main` to trigger the automated GitHub Actions deployment.
