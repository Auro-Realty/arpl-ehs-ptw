# Goldfish Annotated Review Report

Status: resolved
**Date:** 2026-11-10  
**Target Files:** [`README.md`](README.md), [`functions/index.js`](functions/index.js), [`index.html`](index.html), [`public/index.html`](public/index.html)  
**Scope:** Core Approval Topologies, State Transitions, Cloud Functions RBAC & SLA Escalation

---

## Prioritized Findings & Resolution Summary

### [Issue 1] PTW-004 Confined Space Entry Approval Topology Mismatch - Severity: Major
* **Affected Scope:** `README.md` Section 5.2.4 & Section 8.4; `index.html` line 521938 & `newChain`
* **Discrepancy Description:** Section 5.2.4 diagrammed a 4-stage sequential spine (`Site Supervisor → Site Engineer → Tower Incharge → EHS`), whereas Section 8.4 text and sequence diagram claimed an "expedited 2-approver spine (no separate Site Engineer step)".
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Statutory safety regulations (OSHA / ISO 45001) and the master test suite (`tests/test_pt04_confined_space.js`) mandate that the Site Engineer physically verify mechanical forced ventilation, standby entrant attendance, and rescue equipment on-site (Step 2) before Tower Incharge review.
* ***Resolution Applied:***
  * Updated `README.md` Section 8.4 text and sequence diagram to reflect the statutory 4-stage spine with Site Engineer Step 2 ventilation check.
  * Verified seamless alignment with `submitPermit()` (`p.status = 'Pending Site Engineer Acknowledgment'`) and `acknowledgeSiteEngineer()`.

### [Issue 2] PTW-010 Night Shift Work Architecture Omission & Function Name Drift - Severity: Major
* **Affected Scope:** `README.md` Section 7.1, Section 7.2, and Section 8.10
* **Discrepancy Description:** While Sections 5.2.11 and 8.10 specified the 8-stage dual-phase handover governance, Section 7.1 (`newChain` data schemas) and Section 7.2 (`chainStage` decision trees) completely omitted `nightshift`. Additionally, Section 8.10 named the function `acknowledgeNightPm()`.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Architectural documentation must comprehensively cover all 10 active permit workflows. The frontend code implements this step via `openNightPmAckModal()` and `submitNightPmAck()`.
* ***Resolution Applied:***
  * Added `kind: 'nightshift'` schema to `README.md` Section 7.1 (`sectionHead`, `nightHandover`, `pmNight`, `ehsManager`, `ehsOfficer`).
  * Added `nightshift` stage resolution branch to `README.md` Section 7.2.
  * Updated Section 8.10 sequence diagram from `acknowledgeNightPm()` to `submitNightPmAck() (via openNightPmAckModal)`.

### [Issue 3] Extension Workflow Fictional State Names & Missing Batching Plant Topology - Severity: Major
* **Affected Scope:** `README.md` Section 8.13 & Section 11.2; `index.html` line 597148
* **Discrepancy Description:** Sections 8.13 and 11.2 sequence diagrams introduced fictional status strings (`Pending Extension - Engineer Ack`, `Pending Extension - Section Head`, `Pending Extension - EHS`) that do not exist in the 27 Master Operational States. Additionally, Section 11.2 omitted the Batching Plant Electrical Extension workflow (`ext-batching-elec`).
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Fictional statuses cause confusion and break state diagram conformance. The codebase uses canonical operational states (`Pending Site Engineer`, `Pending Section Head`, `Pending EHS Approval`) with extension sub-status tracked under `p.extension.status`.
* ***Resolution Applied:***
  * Replaced all occurrences of fictional extension status names across `README.md` Sections 8.13 and 11.2 with canonical statuses.
  * Documented the Batching Plant Electrical Extension topology (`ext-batching-elec`: Permittee Electrician &rarr; P&M Engineer &rarr; Quality Engineer &rarr; EHS Safety).

### [Issue 4] Cloud Function `transitionPermitStage` Status Truncation & Lack of Role Gating - Severity: Blocker
* **Affected Scope:** `functions/index.js` lines 348–365
* **Discrepancy Description:** `transitionPermitStage` executed `status: sanitizeString(targetStatus, 32)`, truncating 10 of the valid operational statuses (e.g. `Pending Site Engineer Acknowledgment` [36 chars], `Observation Pending Site Engineer Acknowledgment` [48 chars]), corrupting state on write. It also lacked role validation.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Cloud Functions must preserve full status string integrity and enforce server-side RBAC to prevent unauthorized stage transitions.
* ***Resolution Applied:***
  * Increased status sanitization length to `sanitizeString(targetStatus, 100)`.
  * Implemented `ALLOWED_STAGE_ROLES` server-side dictionary verifying that caller's `userRole` is authorized for the target stage before committing transactions.

### [Issue 5] SLA Escalation Engine Hardcoded Windows & Absent Pending Sweeps - Severity: Major
* **Affected Scope:** `functions/index.js` lines 375–410; `index.html` line 504812
* **Discrepancy Description:** `escalationSweep` in Cloud Functions only swept for expired active permits, neglecting pending-stage SLA breaches. In `index.html`, `runEscalationTick` omitted several pending domain stages.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Automated SLA governance requires scheduled background sweeps across all in-flight approval stages.
* ***Resolution Applied:***
  * Enhanced `escalationSweep` in `functions/index.js` to query in-flight permits across pending stages, calculate elapsed duration against stage SLAs, and record `ESCALATION_STAGE_1_WARNING` and `ESCALATION_STAGE_2_BREACH` in the tamper-proof `activity_log`.
  * Expanded `index.html` and `public/index.html` `runEscalationTick` to check all pending stages (`Pending P&M Acknowledgment`, `Pending Quality Engineer Approval`, `Pending MEP Clearance`, `Pending MEP or P&M Approval`, `Pending P&M Night Acknowledgment`).

### [Issue 6] Terminal Surrender State Nomenclature (`Closed` vs `Completed (Surrendered)`) - Severity: Minor
* **Affected Scope:** `README.md` Section 6.2 Table
* **Discrepancy Description:** Section 6.2 table listed only `Closed` as the terminal state, omitting `Completed (Surrendered)` and `Closed – Pending Surrender`.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Codebase and activity logs use `Completed (Surrendered)` as the permanent archived state, while `Closed – Pending Surrender` represents the pre-surrender suspension state.
* ***Resolution Applied:***
  * Updated Section 6.2 table in `README.md` to enumerate both `Closed – Pending Surrender` (Intermediate Suspension) and `Completed (Surrendered)` (Terminal Archive).

### [Issue 7] PTW-007 Drilling & Blasting Section 7.5 Dispatch Graph Divergence - Severity: Minor
* **Affected Scope:** `README.md` Section 7.5 Graph
* **Discrepancy Description:** Section 7.5 dispatch diagram routed all PTW-007 permits directly to Site Engineer, omitting the Blasting In-charge acknowledgment stage for Blasting operations.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Blasting operations require statutory PESA declaration and Blasting In-charge signoff prior to Site Engineer acknowledgment.
* ***Resolution Applied:***
  * Updated Section 7.5 Mermaid graph to route `PTW-007 Blasting` to `Pending Blasting In-charge Acknowledgment` first.

---

## Final Verification
* **Automated Drift Check:** 11/11 automated checks PASSED (100% resolution rate).
* **Master Test Runner:** 28/28 master test suites PASSED (100% pass rate).
* **Asset Synchronization:** Root `index.html` and `public/index.html` confirmed byte-identical (`1,963,722 bytes`).
