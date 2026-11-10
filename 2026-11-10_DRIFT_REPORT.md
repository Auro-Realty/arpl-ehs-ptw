# Drift Detection Report: Design Documents vs Codebase

**Date:** 2026-11-10  
**Target Repository:** `arpl-ehs-ptw`  
**Inspected Design Documents:** `SPECIFICATION.md`, `IMPLEMENTATION_PLAN.md`  
**Inspected Source Files:** `index.html`, `public/index.html`, `functions/index.js`

---

## SPECIFICATION.md

* **Missing Super Admin Role in RBAC Table (Section 3):**
  * `SPECIFICATION.md` Section 3 lists only 16 roles and omits `super-admin` entirely, designating `admin` as the sole administrative role with global view scope. In reality, `public/index.html` and `functions/index.js` split administration into global `super-admin` (`aic1176@aurogroup.com`) and project-scoped `project-admin` / `admin` (Site Admin).
* **Role Taxonomy & Canonical Role Naming Divergence (Section 3):**
  * `SPECIFICATION.md` uses legacy technical titles (`Permittee Electrician`, `P and M Engineer`, `IT Engineer`, `EHS Manager`, `EHS Officer`, `Tower Incharge`, `Administrator`). The live application (`public/index.html` `#empanelRoleSelect`) has transitioned to management's 15 canonical role titles: `Permittee` (`site-supervisor`), `Site Engineer` (`site-engineer`), `MEP` (`mep`), `P&M` (`pm`), `Lifting Supervisor` (`lift-supervisor`), `Blasting Incharge` (`blasting-incharge`), `IT in charge` (`it`), `Electrician` (`electrician`), `Tower In charge` (`section-head`/`hw-section-head`), `Section Head` (`excavation-head`), `EHS supervisor` (`ehs-officer`), `EHS Head` (`ehs-manager`), `Project Manager` (`project-manager`), `Site admin` (`project-admin`), and `Super admin` (`super-admin`).
  * `SPECIFICATION.md` maps Section Head for non-excavation permits strictly to `hw-section-head`, whereas `public/index.html` binds `section-head` to "Tower In charge" in the empanelment dropdown.
* **User Provisioning Mechanism Divergence (Section 2 & 5):**
  * `SPECIFICATION.md` specifies that 60 users/site are pre-assigned by Admin via a Cloud Run Admin API (`arpl-ehs-api`) setting `projectIds[]` on user documents and custom claims. The codebase implements this via 2nd-Gen Firebase Cloud Functions (`adminCreateProjectAdmin` and `adminAssignProjectRole`) with dynamic, unlimited user provisioning.
  * `SPECIFICATION.md` lacks specifications for the Unified Empanelment Form (`#newStaffProject`), post-assignment user editing (`editStaffEmpanelment`), and project-specific authoritative tower validation (`AUTHORITATIVE_PROJECT_TOWERS`).
* **Absence of Firebase Authentication Deletion & Lifecycle Specifications:**
  * `SPECIFICATION.md` contains no specification for user offboarding, dual-deletion (`adminDeleteUser`), Firebase Authentication user deletion (`auth.deleteUser`), orphaned Auth account scanning/purging (`adminSyncAndPurgeOrphanAuthUsers`), or `auth/email-already-in-use` recovery.

---

## IMPLEMENTATION_PLAN.md

* **Architectural Compute Drift — Cloud Run REST API vs Cloud Functions 2nd Gen (Section 4.2):**
  * `IMPLEMENTATION_PLAN.md` specifies a dedicated Cloud Run containerized Express REST API service (`arpl-ehs-api`) with `min-instances = 1` for FSM state transitions, user provisioning, and statutory compute. The actual implementation uses Firebase Cloud Functions 2nd Gen (`functions/index.js`) deployed as event and callable functions alongside client-side Firestore operations.
* **Asynchronous Queueing Architecture Drift (Section 4.2 & 6):**
  * `IMPLEMENTATION_PLAN.md` specifies Google Cloud Tasks for asynchronous PDF rendering and Cloud Scheduler calling the Cloud Run REST container for SLA escalation sweeps. The actual implementation generates statutory PDFs client-side using jsPDF (with fallback to `downloadStatutoryPdf`/`compileStatutoryPdf`) and runs `escalationSweep` via `firebase-functions/v2/scheduler`.
* **Static 360-User Baseline vs Dynamic Unlimited Provisioning (Section 3):**
  * `IMPLEMENTATION_PLAN.md` models a fixed operational baseline of 360 unique authenticated users (60 users/site across 6 business projects: `PRJ-AGR`, `PRJ-ABP`, `PRJ-ART`, `PRJ-AB2`, `PRJ-AVC`, `PRJ-AHT`). The active codebase provisions dynamic users across 3 active worksites (`PRJ-PEARL`, `PRJ-REGENT`, `PRJ-SANSA`) without a 60-user ceiling.
* **Missing Firebase Authentication Account Deletion Work Packages (Section 6 WBS):**
  * `IMPLEMENTATION_PLAN.md` contains no WBS tasks or deliverables for atomic dual-deletion from Firebase Auth, ghost account reconciliation, or live directory synchronization (`initUsersLiveSnapshot`).

---

## Codebase Findings: public/index.html & functions/index.js

* **Missing `super-admin` Option in User Provisioning Dropdown (`public/index.html`):**
  * While `super-admin` is recognized in `ROLES` (line 8852) and in `functions/index.js`, it is absent from the `#empanelRoleSelect` dropdown in `public/index.html` (lines 5964-5980). A Super Admin cannot provision another Super Admin through the empanelment UI.
* **Role Key Binding Asymmetry in Empanelment Dropdown (`public/index.html`):**
  * In `public/index.html` `#empanelRoleSelect`, "Tower In charge" is bound to `value="section-head"` (line 5972) and "Section Head" is bound to `value="excavation-head"` (line 5973). In the canonical `ROLES` table (line 8826), "Tower Incharge" is keyed as `hw-section-head`. While `functions/index.js` handles this via `ROLE_CANONICAL_MAP`, the UI dropdown option values remain legacy-aliased.
* **Parity between root `index.html` and `public/index.html`:**
  * No drift detected. Root `index.html` and `public/index.html` are 100% byte-identical (`19,51,709` bytes).
