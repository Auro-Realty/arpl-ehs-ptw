# Drift Detection Report: Design Documents vs Codebase

**Date:** 2026-11-10  
**Target Repository:** `arpl-ehs-ptw`  
**Inspected Design Documents:** `design_draft.md`, `SPECIFICATION.md`, `IMPLEMENTATION_PLAN.md`, `README.md`  
**Inspected Source Files:** `index.html`, `public/index.html`, `functions/index.js`, `firestore.rules`, `storage.rules`, `public/config.projects.json`

---

## design_draft.md

No drift detected.

---

## SPECIFICATION.md

* **Architectural Compute Layer Divergence (Section 2 Non-Functional Requirements):**
  * `SPECIFICATION.md` specifies a "Hybrid Firebase + Cloud Run Architecture" utilizing a containerized Cloud Run REST API (`<250ms warm API`, container auto-scaling `80 req/instance`, `roleCanActOnChain` transition API, and Admin Cloud Run API). The actual implementation runs a 100% native Firebase serverless stack (`functions/index.js` using Cloud Functions 2nd Gen `onCall` and `onSchedule`) with zero external Cloud Run microservices.
* **Worksite Portfolio & Scale Model Divergence (Section 2 & FR-021):**
  * `SPECIFICATION.md` models a fixed operational baseline of "6 projects, 360 unique users". The active platform governs 3 authoritative construction mega-sites (`PRJ-PEARL`, `PRJ-REGENT`, `PRJ-SANSA`) with authoritative towers per site (`AUTHORITATIVE_PROJECT_TOWERS`) and dynamic, unlimited user provisioning.
* **Role Taxonomy & Administrative Hierarchy Divergence (Section 3 User Roles):**
  * `SPECIFICATION.md` defines `admin` as generic "Administrator" and lacks the architectural separation between enterprise `super-admin` (`aic1176@aurogroup.com`) and site-level `project-admin` (**Project Admin**).
  * `SPECIFICATION.md` uses legacy technical labels (`Site Supervisor`, `Permittee Electrician`, `P and M Engineer`, `IT Engineer`, `EHS Manager`, `EHS Officer`, `Excavation Head`) instead of the standardized platform taxonomy: `Permittee (Initiator)`, `Electrician (Specialist Permittee)`, `P&M (Plant & Machinery Approver)`, `IT in charge (Technical Approver)`, `EHS Head (Statutory Endorser / Issuer)`, `EHS supervisor (Safety Endorser)`, `Section Head (Civil Approver)`, `Tower In charge (Section Approver)`, and `Project Admin (Worksite Administrator)`.
* **Absence of Dual-Deletion & Auth Lifecycle Specifications:**
  * `SPECIFICATION.md` contains no specification for user offboarding via atomic dual-deletion (`adminDeleteUser`), permanent Firebase Authentication account removal (`auth.deleteUser`), one-click orphaned Auth account purging (`adminSyncAndPurgeOrphanAuthUsers`), or `auth/email-already-in-use` automatic profile recovery.
* **Absence of Multi-Role & Multi-Location Dynamic Switcher Specifications:**
  * `SPECIFICATION.md` binds users to a single scalar role and location. It lacks specifications for the multi-assignment schema (`assignments[]`), header Role Switcher (`#headerRoleSwitcher`), header Location Switcher (`#headerLocationSwitcher`), and the `switchActiveRole` Cloud Function.
* **Missing Direct Client Deletion Security Lockout:**
  * `SPECIFICATION.md` does not document the mandatory `allow delete: if false;` security constraint on `/users`, `/project_admins`, and `/site_personnel` in `firestore.rules`.
* **Outdated Code Metrics (Header Note):**
  * `SPECIFICATION.md` cites `index.html (~21,450 LOC)` and `25 master test suites`. The actual codebase has expanded to ~28,777 LOC validated across 28 master test suites (100% pass rate).

---

## IMPLEMENTATION_PLAN.md

* **Core Backend Architecture Divergence (Section 4.2):**
  * `IMPLEMENTATION_PLAN.md` blueprints a dedicated Google Cloud Run containerized Express REST API service (`arpl-ehs-api`) with `min-instances = 1`, Google Cloud Tasks rate-limited queues, Google Artifact Registry container scanning, and Secret Manager in-memory injection. The actual implementation runs exclusively on native Firebase Cloud Functions 2nd Gen (`functions/index.js` in `asia-south1`) with zero Cloud Run containers and zero Cloud Tasks queues.
* **Hypothetical Worksite Portfolio Drift (Section 3 Workload Specification):**
  * `IMPLEMENTATION_PLAN.md` models 6 hypothetical projects (`PRJ-AGR`, `PRJ-ABP`, `PRJ-ART`, `PRJ-AB2`, `PRJ-AVC`, `PRJ-AHT`) with a rigid 360-user capacity model (60 users/site). The active production platform operates across 3 real construction sites (`PRJ-PEARL`, `PRJ-REGENT`, `PRJ-SANSA`) with dynamic, unlimited user provisioning.
* **Asynchronous Queueing & Processing Divergence (Section 4.2 & 6):**
  * `IMPLEMENTATION_PLAN.md` specifies Cloud Tasks for asynchronous PDF rendering and Cloud Scheduler calling the Cloud Run REST container for SLA escalations. In reality, statutory PDFs are generated client-side via jsPDF (with fallback Cloud Functions) and SLA escalation sweeps are scheduled via native `firebase-functions/v2/scheduler`.
* **Missing User Lifecycle & Dual-Deletion Deliverables (Section 6 WBS):**
  * `IMPLEMENTATION_PLAN.md` contains no work packages or deliverables for atomic dual-deletion from Firebase Auth (`adminDeleteUser`), ghost Auth account scanning/purging (`adminSyncAndPurgeOrphanAuthUsers`), or in-session active role context switching (`switchActiveRole`).
* **Role Taxonomy & Administrative Hierarchy Drift:**
  * `IMPLEMENTATION_PLAN.md` uses "Site Administrator" rather than the standardized Indian site terminology **Project Admin** (`project-admin`), and lacks specifications for dynamic in-session role and location switchers.

---

## README.md

* **Statutory Approval Topology Inaccuracies (Section 3 Table):**
  * **PTW-002 (Hot Work):** `README.md` lists `Site Supervisor → Site Engineer → EHS Officer → Safety Lead`. The actual topology enforced by code and tests is `Site Supervisor (Permittee) → Site Engineer → Tower Incharge (hw-section-head) → EHS Head / EHS Officer`.
  * **PTW-003 (Guard Rail Removal):** `README.md` lists `Site Supervisor → Safety Inspector → EHS Officer → Construction Lead`. The actual topology enforced by code and tests is `Site Supervisor (Permittee) → Site Engineer → Tower Incharge (hw-section-head) → EHS Head / EHS Officer`.
  * **PTW-005 (Shaft Work):** `README.md` lists `Equipment Supervisor → Mechanical Engineer → EHS Officer → Project Admin`. The actual topology enforced by code and tests is `Site Supervisor (Permittee) → Site Engineer → MEP Engineer → Tower Incharge (hw-section-head) → EHS Head / EHS Officer`.
  * **PTW-007 (Drilling & Blasting):** `README.md` lists `Certified Blasting Master → Mining Engineer → EHS Manager → Worksite VP`. The actual topology enforced by code and tests is `Blasting Incharge → Site Engineer → Tower Incharge (hw-section-head) → EHS Manager`.
* **Incomplete Authorization Matrix (Section 4 Table):**
  * `README.md` lists only 9 operational roles in the Section 4 summary table, omitting `hw-section-head` (Tower In charge), `excavation-head` (Section Head), `mep` (MEP), `pm` (P&M), `it` (IT in charge), `lift-supervisor` (Lifting Supervisor), `blasting-incharge` (Blasting Incharge), and `quality-engineer` (Quality Engineer).
* **Missing Header Switchers & Active Context Transition Documentation:**
  * `README.md` does not document `#headerRoleSwitcher` or `#headerLocationSwitcher` for multi-role and multi-location personnel, nor the `switchActiveRole` Cloud Function.
* **Missing Dual-Deletion & Ghost Auth Purge Governance:**
  * `README.md` does not document `adminDeleteUser`, `adminSyncAndPurgeOrphanAuthUsers`, or the `allow delete: if false;` direct Firestore deletion lockout.
* **Outdated Master Test Suite Count (Section 11):**
  * `README.md` does not reflect the current test suite count; the master test runner now executes 28 comprehensive test suites (with Suite 27 validating atomic dual-deletion and Suite 28 validating role switchers and Project Admin taxonomy).
