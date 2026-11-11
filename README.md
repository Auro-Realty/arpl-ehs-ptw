<div align="center">

# 🛡️ ARPL EHS Permit-to-Work Management System

### Enterprise-Grade Digital Safety Governance for Construction Operations

**PTW-001 Excavation · PTW-002 Hot Work · PTW-003 Guard Rail · PTW-004 Confined Space · PTW-005 Shaft Work · PTW-006 Electrical Work · PTW-007 Drilling & Blasting · PTW-008 General Work · PTW-009A/B Lifting Operations · PTW-010 Night Shift Work**

[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=for-the-badge)](/)
[![Tests](https://img.shields.io/badge/Tests-30%20Suites%20Passed-success?style=for-the-badge)](/)
[![Pass Rate](https://img.shields.io/badge/Pass_Rate-100%25-brightgreen?style=for-the-badge)](/)
[![Responsive](https://img.shields.io/badge/Responsive-Mobile_to_4K-orange?style=for-the-badge)](/)
[![DPDP](https://img.shields.io/badge/DPDP_Act_2023-Compliant-purple?style=for-the-badge)](/)

---

*A zero-dependency, single-page application implementing the complete Permit-to-Work (PTW) lifecycle — from form initiation through multi-stage parallel approvals, GPS-verified digital signatures, real-time escalation automation, statutory PDF generation, and formal closure & surrender — all enforced through a strict finite-state machine with role-based access control.*

</div>

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack & Design Decisions](#3-technology-stack--design-decisions)
   - 3.1 [Zero-Build Architecture](#31-zero-build-architecture)
   - 3.2 [External Dependencies](#32-external-dependencies)
   - 3.3 [Browser Support](#33-browser-support)
   - 3.4 [Configuration-Driven Architecture (APP_CONFIG)](#34-configuration-driven-architecture--master-single-source-of-truth-app_config)
4. [Role-Based Access Control (RBAC)](#4-role-based-access-control-rbac)
5. [Permit Types & Master Data](#5-permit-types--master-data)
   - 5.1 [Active Permit Types Matrix](#51-active-permit-types)
   - 5.2 [Approval Chain Topology per Permit Type](#52-approval-chain-topology-per-permit-type)
     - 5.2.1 [PTW-001 Excavation Work](#521-ptw-001-excavation-work-5-stages---3-way-parallel-clearance-gate)
     - 5.2.2 [PTW-002 Hot Work](#522-ptw-002-hot-work-4-stages---direct-spine-with-1-hour-fire-watch)
     - 5.2.3 [PTW-003 Guard Rail Removal](#523-ptw-003-guard-rail--floor-protection-removal-4-stages---direct-spine-with-re-fixing-gate)
     - 5.2.4 [PTW-004 Confined Space Entry](#524-ptw-004-confined-space-entry-4-stages---direct-spine-with-multi-gas-testing)
     - 5.2.5 [PTW-005 Shaft Work](#525-ptw-005-shaft-work-5-stages---sequential-spine-with-mep-clearance)
     - 5.2.6 [PTW-006 Electrical Work](#526-ptw-006-electrical-work-htlt-dual-topology-batching-plant-4-stage--site-5-stage)
     - 5.2.7 [PTW-007 Drilling & Blasting](#527-ptw-007-drilling--blasting-3-stages---direct-statutory-spine-to-ehs)
     - 5.2.8 [PTW-008 General Work](#528-ptw-008-general-work-4-stages---multi-tier-dynamic-safety-spine)
     - 5.2.9 [PTW-009A Routine Lifting Operations](#529-ptw-009a-routine-lifting-operations-5-stages---technical-pm-clearance-spine)
     - 5.2.10 [PTW-009B Critical Lift Plan](#5210-ptw-009b-critical-lift-plan--non-routine-lift-6-stages---project-manager-executive-review-spine)
     - 5.2.11 [PTW-010 Night Shift Work (Dual-Phase Handover Governance)](#5211-ptw-010-night-shift--holiday-work-dual-phase-handover-governance)
       - 5.2.11.1 [Phase 1: Stage 1 Daytime Approval Spine](#52111-phase-1-day-phase-stage-1-daytime-initiation--approval-spine-500-pm--630-pm-ist)
       - 5.2.11.2 [Phase 1: Stage 2 Linked Activity Approval Spine](#52112-phase-1-day-phase-sequential-stage-2-linked-activity-permit-approval-spine)
       - 5.2.11.3 [Phase 2: Night Handover & EHS Activation](#52113-phase-2-night-phase-830-pm-handover-gate-pm-inspection--ehs-final-activation)
       - 5.2.11.4 [Phase 3: Morning Closure & Surrender](#52114-phase-3-morning-statutory-closure--surrender-night-site-supervisor-exclusive)
   - 5.3 [PTW-001 Excavation Safety Checklist (12 Items)](#53-statutory-safety-checklist-ptw-001-excavation-work-12-items)
   - 5.4 [PTW-002 Hot Work Safety Checklist (20 Items)](#54-statutory-safety-checklist-ptw-002-hot-work-20-items)
   - 5.5 [PTW-003 Guard Rail Safety Checklist (9 Items)](#55-statutory-safety-checklist-ptw-003-guard-rail--floor-protection-removal-9-items)
   - 5.6 [PTW-004 Confined Space Safety Checklist & Multi-Gas Engine (15 Items)](#56-statutory-safety-checklist--multi-gas-detection-engine-ptw-004-confined-space-entry-15-items)
   - 5.7 [PTW-005 Shaft Work Safety Checklist (10 Items)](#57-statutory-safety-checklist-ptw-005-shaft-work-10-items)
   - 5.8 [PTW-006 Electrical Work Safety Checklist & Dual Topologies (14 Items)](#58-statutory-safety-checklist--dual-topologies-ptw-006-electrical-work-ht--lt-14-items)
   - 5.9 [PTW-007 Drilling & Blasting Safety Checklist & Specifications (15 Items)](#59-statutory-safety-checklist--technical-specifications-ptw-007-drilling--blasting-15-items)
   - 5.10 [PTW-008 General Work Safety Specifications & Multi-Tier Checklists](#510-statutory-safety-specifications--dynamic-checklists-ptw-008-general-work)
   - 5.11 [PTW-009A/B Lifting Operations Statutory Specifications, Sling Calculation Engine & Checklist (14 Items)](#511-statutory-safety-specifications-sling-calculation-engine--checklist-ptw-009ab-lifting-operations-14-items)
   - 5.12 [PTW-010 Night Shift Safety Checklist, Statutory Prohibitions & Qualification Gating (13 Items)](#512-statutory-safety-specifications--checklist-ptw-010-night-shift-13-items)
   - 5.13 [Universal Initiator Architecture & Role-Based Form Activation Matrix](#513-universal-initiator-architecture--role-based-form-activation-matrix)
   - 5.14 [Enterprise Projects Master Registry (`PROJECTS`)](#514-enterprise-project-master-data--worksite-registry-projects)
   - 5.15 [Master Constants & Configuration Registries](#515-master-constants--configuration-registries)
   - 5.16 [Location Selection Mode & Safety Restriction Matrix](#516-location-selection-mode--safety-restriction-matrix)
6. [Core Workflow: Permit Lifecycle State Machine](#6-core-workflow-permit-lifecycle-state-machine)cle-state-machine)
7. [Approval Chain Architecture](#7-approval-chain-architecture)
   - 7.1 [Chain Data Schema per Permit Type](#71-chain-data-schema-per-permit-type-newchain)
   - 7.2 [Stage Resolution Algorithm](#72-stage-resolution-algorithm-chainstage)
   - 7.3 [Role Authorization Evaluator](#73-role-authorization-evaluator-rolecanactonchain)
   - 7.4 [Stale Approval Retention & Fast-Track Routing](#74-stale-approval-retention--fast-track-routing-algorithm)
   - 7.5 [Core Operational Dispatch & Execution Engine](#75-core-operational-dispatch--execution-engine)
8. [Swimlane Diagrams](#8-swimlane-diagrams)
   - 8.1 [PTW-001 Excavation (3-Way Parallel Gate)](#81-ptw-001-excavation-end-to-end-approval--lifecycle-3-way-parallel-gate)
   - 8.2 [PTW-002 Hot Work (1-Hour Fire Watch Rule)](#82-ptw-002-hot-work-end-to-end-approval--1-hour-fire-watch-rule)
   - 8.3 [PTW-003 Guard Rail Removal (Re-Fixing Photo Gate)](#83-ptw-003-guard-rail--floor-protection-removal-re-fixing-verification)
   - 8.4 [PTW-004 Confined Space Entry (Gas Testing & Direct Spine)](#84-ptw-004-confined-space-entry-direct-to-ti-spine--atmospheric-testing)
   - 8.5 [PTW-005 Shaft Work (Dedicated MEP Clearance & Floor Dropdown)](#85-ptw-005-shaft-work-dedicated-mep-clearance--floor-dropdown)
   - 8.6 [PTW-006 Electrical Work (Dual-Topology & Statutory LOTO)](#86-ptw-006-electrical-work-htlt-dual-topology-approval--statutory-loto-lifecycle)
   - 8.7 [PTW-007 Drilling & Blasting (Statutory Approval Lifecycle)](#87-ptw-007-drilling--blasting-end-to-end-statutory-approval-lifecycle)
   - 8.8 [PTW-008 General Work (End-to-End Approval & Multi-Tier Safety Lifecycle)](#88-ptw-008-general-work-end-to-end-approval--multi-tier-safety-lifecycle)
   - 8.9 [PTW-009A & PTW-009B Lifting Operations & Critical Lift Plan Lifecycle](#89-ptw-009a--ptw-009b-lifting-operations--critical-lift-plan-lifecycle)
   - 8.10 [PTW-010 Night Shift & Dual-Phase Handover Lifecycle](#810-ptw-010-night-shift--holiday-work-dual-phase-handover--6-signatory-governance)
   - 8.11 [Rejection & Resubmission (Stale-Approval Rule)](#811-cross-cutting-workflow-rejection--resubmission-stale-approval-invalidation)
   - 8.12 [Safety Observation & Stop-Work Lifecycle](#812-cross-cutting-workflow-safety-observation--stop-work-lifecycle)
   - 8.13 [Permit Extension Lifecycle](#813-cross-cutting-workflow-permit-extension-lifecycle-630-pm-cutoff--830-pm-ceiling)
   - 8.14 [Work Completion, Housekeeping & Surrender Gate](#814-cross-cutting-workflow-work-completion-housekeeping--statutory-surrender-lifecycle-closure-gate)
   - 8.15 [4-Step Creation & Initiation Wizard Flow](#815-cross-cutting-workflow-4-step-permit-creation--initiation-wizard-flow-wiz_steps)
   - 8.16 [Administrative Site Geofencing & Worksite Radar Calibration Flow](#816-cross-cutting-workflow-administrative-site-geofencing--worksite-radar-calibration-flow-view-admin-config)
   - 8.17 [Application-Wide Deterministic Navigation & Consistency Architecture](#817-cross-cutting-architecture-application-wide-deterministic-navigation--consistency-engine)
9. [Escalation & Auto-Expiry Engine](#9-escalation--auto-expiry-engine)
10. [Safety Observation Workflow](#10-safety-observation-workflow)
11. [Extension Workflow](#11-extension-workflow)
12. [Notification Engine](#12-notification-engine)
13. [GPS Geofencing & Proximity Verification](#13-gps-geofencing--proximity-verification)
14. [Digital Signature Engine](#14-digital-signature-engine)
    - 14.1 [PointerEvents Canvas Architecture](#141-pointerevents-canvas-architecture)
    - 14.2 [High-DPI Scaling & Stroke Interpolation](#142-high-dpi-scaling--stroke-interpolation)
    - 14.3 [File Upload Alternative](#143-file-upload-alternative)
    - 14.4 [DPDP Act 2023 Identity Binding & Consent](#144-dpdp-act-2023-identity-binding--consent)
    - 14.5 [Viewport Anchoring & Signatory Re-Sign Flow](#145-viewport-anchoring--signatory-re-sign-flow)
    - 14.6 [Auto-Sign Simulation & Rapid Verification](#146-auto-sign-simulation--rapid-verification-simulatenamedsigpad)
    - 14.7 [In-Place Modal DOM Mutation & Canvas Preservation](#147-in-place-modal-dom-mutation--canvas-preservation)
    - 14.8 [Cross-Process Digital Signature Coverage Matrix](#148-cross-process-digital-signature-coverage-matrix)
15. [Statutory PDF Generation](#15-statutory-pdf-generation)
16. [Role-Specific Dashboards & KPIs](#16-role-specific-dashboards--kpis)
17. [Permit Register & Advanced Filtering](#17-permit-register--advanced-filtering)
   - 17.1 [Universal Common Register Heading Across All Roles](#171-universal-common-register-heading-across-all-roles)
   - 17.2 [Statutory Requested By & Section Head Actor Alignment](#172-statutory-requested-by--section-head-actor-alignment)
   - 17.3 [Approval-Flow Visibility Isolation Matrix](#173-approval-flow-visibility-isolation-matrix)
   - 17.4 [Multi-Field Tokenized Search](#174-multi-field-tokenized-search)
   - 17.5 [Chronological Newest-First Sorting](#175-chronological-newest-first-sorting)
18. [Responsive Design Architecture](#18-responsive-design-architecture)
19. [Data Persistence & State Management](#19-data-persistence--state-management)
   - 19.1 [Global Data Schema Dictionary](#191-global-data-schema-dictionary)
   - 19.2 [State Lifecycle & Persistence Engine](#192-state-lifecycle--persistence-engine)
   - 19.3 [Seed Data Generation Architecture](#193-seed-data-generation-architecture-seedpermits)
20. [Unified Component Library](#20-unified-component-library)
21. [Security & Compliance](#21-security--compliance)
22. [Testing & Quality Assurance](#22-testing--quality-assurance)
23. [Glossary](#23-glossary)
24. [Weekend Operations Governance & Sunday Work Tile Architecture](#24-weekend-operations-governance--sunday-work-tile-architecture)
   - 24.1 [Architectural Overview & Core Governance Philosophy](#241-architectural-overview--core-governance-philosophy)
   - 24.2 [Dual-Tile Dashboard: PTW vs Sunday Work Tile](#242-dual-tile-dashboard-ptw-vs-sunday-work-tile)
   - 24.3 [IST Calendar-Driven Activation Engine](#243-ist-calendar-driven-activation-engine)
   - 24.4 [Hard Exclusion of Night Shift Work (PTW-010)](#244-hard-exclusion-of-night-shift-work-ptw-010)
   - 24.5 [Sunday Zero-Creation Lockout Engine (System-Wide)](#245-sunday-zero-creation-lockout-engine-system-wide)
   - 24.6 [Sunday Permit Execution & Closure Governance](#246-sunday-permit-execution--closure-governance)
   - 24.7 [Permit Data Origin Tracking, Register Filtering & SUN Badge](#247-permit-data-origin-tracking-register-filtering--sun-badge)
   - 24.8 [Cross-Cutting Controls (RBAC, Notifications, Retention, PDF Audit)](#248-cross-cutting-controls-rbac-notifications-retention-pdf-audit)
   - 24.9 [Smooth Scrolling & Navigation Engineering](#249-smooth-scrolling--navigation-engineering)
25. [GitHub Pages Deployment](#25-github-pages-deployment)
26. [Authors & Engineering Team](#26-authors--engineering-team)

---

## 1. Executive Summary

The **ARPL EHS Permit-to-Work (PTW) Management System** digitises the entire high-risk work permitting process for large-scale construction projects. It replaces paper-based permit registers with an event-driven, state-machine-controlled web application that ensures:

| Concern | How the System Addresses It |
|---|---|
| **Safety Compliance** | Mandatory checklist verification, multi-gas detector readings, statutory forms |
| **Accountability** | Every action recorded with digital signature, GPS coordinates, and IST timestamp |
| **Speed** | Automated escalation prevents approvals from stalling beyond defined SLAs |
| **Auditability** | Comprehensive append-only activity log per permit; PDF reports with full signatory chain |
| **Accessibility** | Mobile-first responsive design — works on-site from a phone or tablet |

### Key Metrics

| Metric | Value |
|:---|:---|
| Permit Types (Active) | 10 (PTW-001 to PTW-008, PTW-009A/B, PTW-010 fully implemented & testable) |
| RBAC Roles | 16 distinct roles (including separate Excavation Head, Quality Engineer, Blasting In-charge, Lifting Supervisor, Project Manager, and Night Site Supervisor) |
| Approval Steps (PTW-010) | 8-stage Dual-Phase Handover Protocol (Day Approvals &rarr; Linked Activity Permit &rarr; 8:30 PM Qualification Gate &rarr; P&M Night Ack &rarr; EHS Verification) |
| Automated Test Assertions | 1,320+ assertions across 30 master test suites (100% pass rate) |
| User Lifecycle Governance | Atomic dual-deletion (Auth + Firestore), ghost Auth purge, and dynamic role/location switchers |
| Worksite Portfolio | 3 Authoritative Mega-Projects (The Pearl, The Regent, Sansa County) with multi-tower zone mapping |
| Total Codebase | Single `index.html` (~28,777 lines, 1.96 MB byte-identical with `public/index.html`) |
| External Dependencies | 2 (Font Awesome icons, jsPDF) |

---

## 2. System Architecture

> **Production Architecture, Implementation Plan & Cost Audit (2026-09-25)**:  
> • **Architecture**: [Final Architecture Blueprint](docs/architecture/final-architecture.md) & [Architectural Decision Records (ADRs)](docs/architecture/adr/)  
> • **Implementation**: [Enterprise Implementation Plan (16-Week Roadmap)](docs/implementation-plan.md)  
> • **Costing & Procurement**: [Procurement-Grade Final BOM](docs/costing/final-bom.md) & [Executive Cost Summary](docs/costing/final-cost-summary.md)  
> *(Confirmed Baseline: 6 Business Projects · 360 Unique Users · 300 Permits/Day Total)*

### 2.1 High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer - Browser"
        UI["Single-Page Application<br/>index.html"]
        CSS["CSS Design System<br/>Custom Properties + Media Queries"]
        JS["JavaScript Engine<br/>Event-Driven State Machine"]
    end

    subgraph "Core Engines"
        SM["Finite State Machine<br/>Permit Lifecycle Controller"]
        NE["Notification Engine<br/>Role-Targeted Dispatch"]
        EE["Escalation Engine<br/>Interval-Based Auto-Timer"]
        GE["GPS Geofencing Engine<br/>Haversine Distance Calculator"]
        SE["Digital Signature Engine<br/>Canvas Pointer Events + Upload"]
        PE["PDF Generation Engine<br/>jsPDF Statutory Reports"]
    end

    subgraph "Data Layer"
        PERMITS["PERMITS Array<br/>In-Memory Permit Store"]
        NOTIFS["NOTIFICATIONS Array<br/>Role-Scoped Message Queue"]
        PROJECTS["PROJECTS Array<br/>Site Configuration Registry"]
        LS["LocalStorage<br/>Persistence Layer"]
    end

    UI --> JS
    JS --> SM
    SM --> NE
    SM --> EE
    SM --> GE
    SM --> SE
    SM --> PE
    SM --> PERMITS
    NE --> NOTIFS
    PERMITS --> LS
    NOTIFS --> LS
    PROJECTS --> LS
```

### 2.2 Architectural Pattern: Event-Driven Render Loop

The system follows a **unidirectional data flow** pattern inspired by Flux/Redux, adapted for a zero-build, single-file deployment:

```
User Action → State Mutation → saveState() → render() → DOM Update
                                    ↓
                            LocalStorage Sync
```

| Concept | Implementation |
|---|---|
| **State Store** | Global arrays: `PERMITS[]`, `NOTIFICATIONS[]`, `PROJECTS[]` |
| **Actions** | Functions like `submitPermit()`, `approvePermitStage()`, `raiseObservation()` |
| **Reducers** | State mutation + `saveState()` within each action function |
| **Views** | `buildDashboard()`, `buildRegisterTable()`, `viewDetail()`, `renderWizard()` |
| **Router** | `goTo(view)` toggles `.active` class on view containers |

### 2.3 Component Interaction Map

### 2.4 Cloud Functions 2nd Gen Backend Services (`functions/index.js`)

The backend compute layer runs on native Google Cloud Functions (2nd Gen) in the `asia-south1` (Mumbai) region, enforcing strict least-privilege RBAC, multi-tenant site isolation, and atomic state transitions:

| Cloud Function | Trigger Type | Region / Runtime | Statutory Governance & Security Mandate |
|:---|:---|:---|:---|
| `adminAssignProjectRole` | `onCall` | `asia-south1` / Node.js 20 | Provisions and edits user accounts in both Firebase Auth and Firestore `/users/{uid}`; manages multi-role and multi-location `assignments[]`; auto-recovers existing accounts on `auth/email-already-in-use`; protected by Super Admin and Project Admin RBAC guards. |
| `adminDeleteUser` | `onCall` | `asia-south1` / Node.js 20 | **Atomic Dual-Deletion Engine**: Permanently deletes user account from Firebase Authentication (`auth.deleteUser`), removes Firestore documents (`/users/{uid}`, `/_rate_limits`), logs tamper-proof audit trail, and blocks self-deletion and Super Admin deletion. |
| `adminSyncAndPurgeOrphanAuthUsers` | `onCall` | `asia-south1` / Node.js 20 | **Ghost Auth Purge Tool**: Scans all Firebase Auth users via pagination against Firestore `/users`, identifies and purges orphaned ghost Auth accounts with zero database profiles, while strictly safeguarding bootstrap Super Admin accounts. |
| `switchActiveRole` | `onCall` | `asia-south1` / Node.js 20 | **In-Session Role Context Switcher**: Validates that target role exists in user's authorized `assignments[]`, updates Auth custom claims and Firestore active profile, allowing instant multi-role transitions without re-authenticating. |
| `transitionPermitStage` | `onCall` | `asia-south1` / Node.js 20 | **Server-Side Workflow Engine**: Enforces Haversine geofence validation ($r \le 200\text{m}$), 100-character status length safety (`cleanTargetStatus`), and server-side RBAC validation via `ALLOWED_STAGE_ROLES` before committing permit state mutations. |
| `escalationSweep` | `onSchedule` (`every 5 minutes`) | `asia-south1` / Node.js 20 | **Automated SLA Escalation Engine**: Automatically marks expired active permits (`validTill <= now`), and sweeps in-flight pending permits exceeding stage SLAs to record Stage 1 Warning and Stage 2 Breach events. |


```mermaid
graph LR
    A["Landing Page"] -->|"Role Select"| B["Dashboard"]
    B -->|"New Permit"| C["Permit Wizard<br/>4-Step Form"]
    B -->|"View Permits"| D["Permit Register"]
    D -->|"Click Row"| E["Permit Detail"]
    E -->|"Action Button"| F["Action Modal<br/>GPS + Signature"]
    E -->|"Download PDF"| G["PDF Engine"]
    B -->|"Bell Icon"| H["Notification Drawer"]
    B -->|"Admin Config"| I["Geofence Admin"]
    C -->|"Submit"| J["State Machine<br/>submitPermit"]
    F -->|"Approve/Reject"| J
```

---

## 3. Technology Stack & Design Decisions

### 3.1 Zero-Build Architecture

The system intentionally uses a **zero-build, zero-framework** architecture:

| Decision | Rationale |
|---|---|
| **Single HTML file** | Deployable by dropping one file onto any web server, intranet, or even a USB drive at a construction site with limited connectivity |
| **No Node.js / npm (Runtime)** | Site IT teams don't need to maintain build pipelines; zero production `node_modules` vulnerabilities. Automated headless tests run via Node.js during QA. |
| **No React/Vue/Angular** | Eliminates framework lock-in; any developer can read and modify the codebase |
| **CSS Custom Properties** | Centralised design tokens (`--navy`, `--orange`, `--radius`) enable theming without preprocessors |
| **Vanilla JavaScript** | Full ES6+ feature use (arrow functions, template literals, destructuring) without transpilation |

### 3.2 External Dependencies

| Dependency | Version | Purpose | Fallback |
|---|---|---|---|
| **Font Awesome** | 6.5.1 (CDN) | Icon library for UI elements | System renders without icons; all labels remain functional |
| **jsPDF** | 2.5.1 (CDN) | Client-side PDF generation | PDF button hidden; all other features remain functional |

### 3.3 Browser Support

| Browser | Minimum Version | Notes |
|---|---|---|
| Chrome / Edge | 88+ | Full support including Pointer Events, CSS Grid, `dvh` units |
| Safari / iOS Safari | 15+ | Safe area insets, `-webkit-overflow-scrolling` |
| Firefox | 85+ | Full support |

### 3.4 Configuration-Driven Architecture & Master Single Source of Truth (`APP_CONFIG`)

To eliminate hardcoded logic, repetitive `switch/case` branches, and coupled markup, the application establishes a centralised, declarative Single Source of Truth via `window.APP_CONFIG`. Every major visual, navigational, and workflow subsystem draws its state definitions, rules, and components from this master object:

```
                                  ┌──────────────────────────────┐
                                  │      window.APP_CONFIG       │
                                  │    (Single Source of Truth)   │
                                  └──────────────┬───────────────┘
                 ┌────────────────┬──────────────┼──────────────┬────────────────┐
                 ▼                ▼              ▼              ▼                ▼
          ┌─────────────┐  ┌─────────────┐ ┌───────────┐ ┌─────────────┐  ┌─────────────┐
          │ permitTypes │  │  workflows  │ │ statuses  │ │ wizardSteps │  │ navigation  │
          └──────┬──────┘  └──────┬──────┘ └─────┬─────┘ └──────┬──────┘  └──────┬──────┘
                 ▼                ▼              ▼              ▼                ▼
            Permit Bar,      Sequential &    CSS Classes,   4-Step Stepper,  Role-Scoped
            Card Catalog,   Parallel Stage  Badge Styles,   Dynamic Titles,  Views, Dynamic
            Register Rows     Execution      Empty States    Form Renderers   Tab Redirection
```

#### Core Master Subsystems Governed by `APP_CONFIG`:

1. **System & Statutory Context (`APP_CONFIG.system`)**:
   - Organization branding (`ARPL`), division (`High-Rise & Infra Safety Governance`), version (`3.0.0 Enterprise`).
   - Coordinated operational timezone (`Asia/Kolkata` - Indian Standard Time).
   - Statutory compliance declarations: `DPDP Act 2023`, `IST Strict Enforcement`, and `GPS Geofence Mandatory`.

2. **Enterprise Governance Stages (`APP_CONFIG.governanceStages`)**:
   - 4 fundamental governance pillars: `Initiation & Permittee Authority`, `Engineering & Discipline Clearance`, `Section Authority Endorsement`, and `Statutory EHS Safety Activation`.

3. **Status Mapping & Badge Engine (`APP_CONFIG.statuses`)**:
   - Complete declarative registry of **27 operational statuses** (e.g. `Draft`, `Pending Site Engineer Acknowledgment`, `Pending Parallel Approval`, `Pending Section Head`, `Active`, `Active – Observation Open`, `Closed – Pending Surrender`, `Completed (Surrendered)`).
   - Each status configuration encapsulates its specific semantic CSS class (`st-draft`, `st-pend`, `st-act`, `st-ret`, `st-obs`, etc.), category group, and human-readable title.

4. **Permit Modules Catalog (`APP_CONFIG.permitTypes`)**:
   - Declarative metadata for all 9 operational modules (`PTW-001` through `PTW-009A/B`) plus future roadmap module (`PTW-010`).
   - Includes form codes, Font Awesome icons, brand colors, allowed initiator roles (`allowedInitiatorRoles`), valid location modes (`allowedLocationModes`), linked workflow keys (`workflow`), and dynamic register column callback formatters (`detailsSummary(p)`).

5. **Approval Workflow Topologies (`APP_CONFIG.workflows`)**:
   - Declarative stage definitions across all 9 operational workflows:
     - `excavation_parallel`: 3-way concurrent gate (`mep`, `pm`, `it`) with `excavation-head` review.
     - `sequential_tower`: Direct civil/structural spine to `Tower Incharge`.
     - `shaft_mep_tower`: Dedicated single MEP clearance gate before Tower Incharge.
     - `electrical_site`: Dual either/or domain clearance (`mep` or `pm`) followed by Tower Incharge.
     - `electrical_batching`: Specialized batching plant sequence: `pm` &rarr; `quality-engineer` &rarr; `ehs`.
     - `blasting_operation`: Statutory PESO In-charge verification gate &rarr; Site Engineer &rarr; EHS.
     - `drilling_operation`: Fast-track drilling operation: Site Engineer &rarr; EHS.
     - `lifting_routine`: 5-stage sequential clearance: Lifting Supervisor &rarr; Site Engineer &rarr; P&M Engineer &rarr; Tower Incharge &rarr; EHS.
     - `critical_lift_plan`: 6-stage executive clearance with mandatory Project Manager review prior to EHS endorsement.

6. **Dynamic Empty States (`APP_CONFIG.emptyStates`)**:
   - Centralized icon, message, and layout definitions for empty/blank conditions (`notifications`, `noPermits`, `noPendingAck`, `allCaughtUp`, `noActivePermits`, `noFilterMatch`, `noActivities`).

7. **Permit Creation Stepper (`APP_CONFIG.wizardSteps`)**:
   - Declarative 4-stage wizard configuration (`General Information`, `Safety Checklist`, `Permit Validity`, `Review & Submit`) governing stepper navigation, titles, and step validation.

8. **Contextual Initiator Banners (`APP_CONFIG.initiatorBanners`)**:
   - Dynamic mode notice styling and statutory explanations rendered per persona (`electrician`, `blasting-incharge`, `site-supervisor`, and approver viewer mode).

9. **Role-Driven Dynamic Navigation (`APP_CONFIG.navigation`)**:
   - Centralized route registry defining view IDs, icons, RBAC role gating (`roles: '*' | [...]`), and dynamic label generators (e.g. `'My Permits'` for field roles vs. `'Permit Register'` for approvers/EHS).

10. **Role-Specific Dashboards & Dynamic KPI Panels (`APP_CONFIG.dashboards`)**:
    - Declarative registry configuring KPI cards (`title`, `icon`, `color`, `query(permits, user)` filter), quick-action buttons, and overview analytics across all personas (Permittees, Site Engineer, Section Heads, Approvers, and Admin).

11. **Declarative Form Field Schemas (`APP_CONFIG.formDefinitions`)**:
    - Schemas for common master data (`commonTop`) and permit-specific field structures (`excavation`, `hotwork`, `guardrail`, `confined`, `shaft`, `electrical`, `blasting`, `general`, `lifting`).
    - Rendered via generic UI generators `renderDynamicField(field, data, disAttr)` and `renderDynamicForm(fields, data, disAttr)`.

12. **Dynamic Action Definitions & Dispatcher (`APP_CONFIG.actionDefinitions` & `renderActionButton`)**:
    - Centralized metadata for all workflow transition buttons (`ack-blasting-incharge`, `ack-site-engineer`, `ack-pm-engineer`, `approve`, `reject`, `cancel`, observation clearances), standardizing button classes, icons, and labels.

13. **Dynamic Error State Engine (`APP_CONFIG.errorStates` & `renderErrorState`)**:
    - Consistent visual presentation and recovery controls for permission restrictions (`permissionDenied`), missing records (`notFound`), and local mode states.

14. **Configuration-Driven Register Columns (`APP_CONFIG.registerColumns`)**:
    - Declarative column metadata defining headers, sorting keys, and dynamic cell formatters for the master permit register table.

15. **Centralized RBAC Engine (`can(user, action, context)`) & Data Service (`StorageService`)**:
    - Unified permission engine governing `permit.create`, `permit.view`, `permit.extend`, `permit.surrender`, `permit.download_pdf`, `permit.approve`, and `admin.config`.
    - Pluggable data abstraction layer decoupling application state from raw browser `localStorage`.

16. **Centralized SLA Escalation Policy & Operating Windows (`APP_CONFIG.sla`)**:
    - Mode toggle between Fast Demo Mode (Stage 1: 45s, Stage 2: 120s) and Enterprise Production Mode (Stage 1: 2h, Stage 2: 4h).
    - Configurable validity expiry warning offsets (default 30 min) and statutory cutoff hours (18:30 IST request cutoff, 20:30 IST extension ceiling, 20:30 IST night handover gate, 21:00 IST night cutoff).

17. **Dynamic Approved Contractor Directory (`APP_CONFIG.contractorDirectory`)**:
    - Centralized vendor catalog tracking vendor code, company name, primary trade specialization, and safety audit rating (1.0 to 5.0).
    - Powers wizard `<datalist id="contractorDatalist">` auto-suggest while preserving freeform entry for unlisted subcontractors.

18. **Dynamic Meteorological & Weather Engine (`APP_CONFIG.weather`)**:
    - Real-time weather states with ambient wind speed (km/h) and temperature (°C).
    - Automatically enforces statutory crane lift bans (> 38 km/h wind speed) on PTW-009 Lifting Operations.

19. **Project Structural Hierarchy & Universal Accessors (`getProjectTowers`, `getProjectBasements`, `getProjectFloors`, `getProjectContractors`)**:
    - Decoupled structural hierarchy defining custom building towers/blocks, basement levels, floor counts, and approved contractors per project site.
    - Wizard location dropdowns rebuild dynamically when projects switch.

20. **Multi-Panel Administrative Governance Center (`view-admin-config`)**:
    - Comprehensive 5-panel administrative management workspace:
      * Worksite GPS & Geofencing (on-site tagging, slider, radar preview)
      * Projects & Structural Hierarchies (register new project, add towers, configure basements)
      * Approved Contractor Directory (empanel vendor, assign trade, set safety rating)
      * SLA Timers & Operating Windows (mode toggle, threshold tuning)
      * Permit Types & Weekend Rules (enable/disable permit types, toggle Sunday Work tile)

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Role Registry

The system implements **16 standardized functional roles** aligned to Indian construction site hierarchy and enterprise governance. Per **DPDP Act 2023** compliance, roles are functional authorizations with standardized nomenclature `Role Name (Functional Tag)`. Per **DPDP Act 2023** compliance, roles are functional authorizations — personal names are entered dynamically only at the moment of digital signature.

```mermaid
graph TB
    subgraph "Step 1 - Initiation & Permittee Authority"
        SS["Site Supervisor<br/>Permittee (PTW-001 to 05, PTW-008)"]
        BIC["Blasting / Drilling In-charge<br/>Exclusive Permittee (PTW-007) / Statutory PESO Compliance"]
        EL["Permittee Electrician<br/>Permittee (PTW-006 Electrical Work)"]
        LS["Lifting Supervisor<br/>Exclusive Permittee (PTW-009A Routine & PTW-009B Critical Lift Plan)"]
    end
    subgraph "Step 2 - Technical Acknowledgment"
        SiteEng["Site Engineer<br/>On-Site Verification (PTW-001–05, PTW-006 Site, PTW-007, PTW-008, PTW-009A/B)"]
        PMAck["P&M Engineer<br/>Batching Plant Isolation & LOTO Verification (PTW-006 BP)"]
    end
    subgraph "Step 3 - Domain Clearances & Parallel Gates"
        MEP["MEP Engineer<br/>Utilities Clearance (PTW-001, PTW-005, PTW-006 Site)"]
        PM["P&M Engineer<br/>Plant & Rigging Clearance (PTW-001, PTW-006 Site, PTW-009A/B Lifting)"]
        IT["IT Engineer<br/>Data/Fibre Line Protection (PTW-001)"]
        QE["Quality Engineer<br/>Quality Clearance & Megohm Test (PTW-006 BP)"]
    end
    subgraph "Step 4 - Approving Authority / Section Head"
        EH["Excavation Head<br/>PTW-001 Excavation Safety Review"]
        TI["Tower Incharge<br/>Safety Review (PTW-002–05, PTW-006 Site, PTW-008, PTW-009A/B)"]
    end
    subgraph "Step 5 - Executive Approval (Critical High-Risk Only)"
        PMgr["Project Manager<br/>Mandatory Executive Review (PTW-009B Critical Lift Plan)"]
    end
    subgraph "Step 6 - Final Endorsement"
        EM["EHS Manager<br/>Final Safety Endorsement & Sole Cancel Authority"]
        EO["EHS Officer<br/>Final Safety Endorsement & Sole Cancel Authority"]
    end
    subgraph "Administration & Enterprise Governance"
        SA["Super Admin (Enterprise Governance)<br/>Global Read Oversight, User Provisioning, Ghost Purge"]
        PA["Project Admin (Worksite Administrator)<br/>Assigned Site Personnel, Permit Visibility, Geofencing"]
    end

    BIC -->|PTW-007 Drilling and Blasting - Statutory PESO Declaration| SiteEng
    SS -->|PTW-001 to 05 and PTW-008 General Work| SiteEng
    LS -->|PTW-009A Routine & PTW-009B Critical Lift Plan| SiteEng
    EL -->|PTW-006 Batching Plant Flow| PMAck
    PMAck -->|Step 2 Ack plus Statutory Decl| QE
    QE -->|Step 3 Quality Clearance| EM
    QE -->|Step 3 Quality Clearance| EO
    EL -->|PTW-006 Site Flow| SiteEng
    SiteEng -->|PTW-006 Site Flow| MEP
    SiteEng -->|PTW-006 Site Flow| PM
    SiteEng -->|PTW-001 Excavation| MEP
    SiteEng -->|PTW-001 Excavation| PM
    SiteEng -->|PTW-001 Excavation| IT
    SiteEng -->|PTW-005 Shaft Work| MEP
    SiteEng -->|PTW-002 03 04 08 Direct Spine| TI
    SiteEng -->|PTW-009A & 09B Lifting Operations| PM
    PM -->|PTW-009A & 09B Plant & Machinery Clearance| TI
    TI -->|PTW-009A Routine Lifting Direct to EHS| EM
    TI -->|PTW-009A Routine Lifting Direct to EHS| EO
    TI -->|PTW-009B Critical Lift Plan Review| PMgr
    PMgr -->|PTW-009B Critical Final Safety Endorsement| EM
    PMgr -->|PTW-009B Critical Final Safety Endorsement| EO
    SiteEng -->|PTW-007 Direct Bypass to EHS| EM
    SiteEng -->|PTW-007 Direct Bypass to EHS| EO
    MEP -->|PTW-001 Clearance| EH
    PM -->|PTW-001 Clearance| EH
    IT -->|PTW-001 Clearance| EH
    MEP -->|PTW-005 Clearance| TI
    MEP -->|PTW-006 Site Either-Or| TI
    PM -->|PTW-006 Site Either-Or| TI
    EH --> EM
    EH --> EO
    TI --> EM
    TI --> EO
```

> [!NOTE]
> **Permittee Authorization Scope**:
> 1. **PTW-007 Drilling & Blasting** can be initiated exclusively by the **Blasting / Drilling In-charge** per statutory DGMS and PESO mandates.
> 2. **PTW-009A Routine Lifting Operations** and **PTW-009B Critical Lift Plan** can be initiated exclusively by the certified **Lifting Supervisor**. Form initiation is guarded by mandatory pre-location digital signatures from the Crane Operator and Signaler/Rigger.
> 3. **PTW-006 Electrical Work** is reserved strictly for the certified **Electrician**.
> 4. **Site Supervisors** hold complete permittee authority over civil and structural permits (**PTW-001 to PTW-005, PTW-008**), but are strictly prevented from initiating specialist modules (PTW-006, PTW-007, PTW-009).
> 5. **Project Manager** holds executive domain review authority over **PTW-009B Critical Lift Plans** prior to EHS endorsement.

### 4.2 Role Permission Matrix

| Capability | Permittee (Site Supervisor) | Electrician (Specialist Permittee) | Blasting In-charge (Specialist Permittee) | Lifting Supervisor (Specialist Permittee) | Site Engineer (Technical Inspector) | MEP (Technical Approver) | P&M (Plant & Machinery Approver) | IT in charge (Technical Approver) | Quality Engineer (Technical Approver) | Excavation Head (Section Head) | Tower Incharge (Section Head) | Project Manager (Executive Approver) | EHS Head (Statutory Endorser / Issuer) | EHS supervisor (Safety Endorser) | Project Admin (Worksite Administrator) | Super Admin (Enterprise Governance) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create Permit | ✅ *(PTW-001–05, PTW-008)* | ✅ *(PTW-006)* | ✅ *(PTW-007)* | ✅ *(PTW-009A/B Unified Tile)* | — | — | — | — | — | — | — | — | — | — | — | — |
| Statutory Declarations | — | ✅ *(PTW-006 Step 1)* | ✅ *(PTW-007 PESO)* | ✅ *(Pre-Location Sigs & Rigging Plan)* | — | ✅ *(PTW-006 Step 2, PTW-009 Clearance)* | — | ✅ *(PTW-006 Step 3)* | — | — | — | — | — | — | — | — |
| Acknowledge & Forward | — | — | — | — | ✅ *(Cannot Cancel)* | — | ✅ *(PTW-006 BP)* | — | — | — | — | — | — | — | — | — |
| Parallel / Domain Clearance | — | — | — | — | — | ✅ | ✅ *(Plant, Rigging & Crane)* | ✅ | ✅ *(PTW-006 BP)* | — | — | — | — | — | — | — |
| Section Head Approval | — | — | — | — | — | — | — | — | — | ✅ *(PTW-006 BP)* | ✅ *(PTW-001)* | ✅ *(PTW-002–05, 06 Site, 08, 09A/B)* | — | — | — | — |
| Executive Review | — | — | — | — | — | — | — | — | — | — | — | ✅ *(PTW-009B Critical)* | — | — | — | — |
| EHS Final Endorsement | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — |
| Raise Observation | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — |
| Respond to Observation | ✅ *(PTW-001–05, PTW-008)* | ✅ *(PTW-006)* | ✅ *(PTW-007)* | ✅ *(PTW-009A/B Permittee)* | — | — | — | — | — | — | — | — | — | — | — | — |
| Request Extension | ✅ *(PTW-001–05, PTW-008)* | ✅ *(PTW-006)* | — *(Statutorily Disabled)* | ✅ *(PTW-009A/B, 20:30 Ceiling)* | — | — | — | — | — | — | — | — | — | — | — | — |
| Close & Surrender | ✅ *(PTW-001–05, PTW-008)* | ✅ *(PTW-006 De-isolation)* | ✅ *(PTW-007 Permittee)* | ✅ *(PTW-009A/B Demobilization)* | — | — | — | — | — | — | — | — | — | — | — | — |
| Cancel Permit (Stop-Work) | — | — | — | — | — *(No Authority)* | — | — | — | — | — | — | ✅ | ✅ | — | — | — |
| Download PDF | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ | — | — |
| Configure Geofence | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | — |
| View Register & Flow Scoping | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(Flow Only)* | ✅ *(All)* | ✅ *(All)* | ✅ *(All)* | ✅ *(All)* |
| View Dashboard KPIs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> [!IMPORTANT]
> **Strict Approval-Flow Permit Visibility Enforcement**:
> In compliance with strict information segregation and project governance, permits in the register, dashboards, and detail views are strictly visible **only to roles actively involved in that permit's approval and execution workflow** (`stakeholdersFor(p)`). Only System Administrators and EHS authorities retain global visibility across all project permits.

### 4.3 EHS Endorsement: First-Wins Gate

### 4.4 Multi-Role & Multi-Location In-Session Switchers (`#headerRoleSwitcher` & `#headerLocationSwitcher`)

For personnel holding multiple site qualifications (e.g. an engineer qualified as both Site Supervisor and Site Engineer, or assigned across multiple construction towers):

1. **Multi-Assignment User Schema**: In Firestore `/users/{uid}`, assignments are structured as an array:
   ```json
   {
     "uid": "USER_123",
     "name": "Rajesh Kumar",
     "email": "rajesh.k@aurogroup.com",
     "role": "site-supervisor",
     "projectId": "PRJ-PEARL",
     "assignments": [
       { "role": "site-supervisor", "projectId": "PRJ-PEARL", "towers": ["P1", "P2"] },
       { "role": "site-engineer", "projectId": "PRJ-PEARL", "towers": ["P1", "P2", "Clubhouse"] },
       { "role": "site-engineer", "projectId": "PRJ-SANSA", "towers": ["Sector 1 - Zone 1 & 2"] }
     ]
   }
   ```
2. **Header Role Switcher (`#headerRoleSwitcher`)**: When a user possesses multiple distinct roles, the header dynamically renders a context dropdown. Switching roles invokes `switchActiveRole({ targetRole })` and re-renders the dashboard and register to present only actionable tasks for the selected role without logging out.
3. **Header Location Switcher (`#headerLocationSwitcher`)**: For cross-site personnel, the header presents an active worksite selector, scoping dashboard KPIs, live permits, and register filters strictly to the selected project.

### 4.5 Enterprise User Provisioning & Atomic Dual-Deletion Lifecycle

1. **Unified User Provisioning Form**: Super Admin and Project Admin can create, edit, activate, or deactivate site personnel through a unified modal form in `index.html`, setting employee ID, contact details, assigned project(s), role(s), and authorized towers.
2. **Atomic Dual-Deletion Engine (`adminDeleteUser`)**: Eliminates orphaned Auth accounts and database ghosts. Deletion permanently removes the user from Firebase Authentication (`auth.deleteUser`) and simultaneously deletes the Firestore user document (`/users/{uid}`) in one coordinated operation.
3. **Ghost Auth Purge Tool (`adminSyncAndPurgeOrphanAuthUsers`)**: Directly accessible from the Users Directory toolbar (`#btnPurgeGhostUsers`). Scans Firebase Auth users against Firestore `/users`, detects orphaned authentication accounts that lack corresponding database records, and purges them while safeguarding Super Admin bootstrap credentials.
4. **Firestore Security Lockout**: In `firestore.rules`, client-side direct deletion is permanently barred across user collections:
   ```javascript
   match /users/{userId} {
     allow read: if isAuthenticated();
     allow write: if isSuperAdmin() || isProjectAdmin(request.resource.data.projectId);
     allow delete: if false; // Strict DPDP Act & audit retention: Direct deletion prohibited
   }
   ```
5. **Automatic Profile Recovery**: If an account already exists in Firebase Auth during provisioning, `adminAssignProjectRole` intercepts `auth/email-already-in-use`, retrieves the existing UID, updates custom claims, and recovers the Firestore profile cleanly.


The EHS final endorsement stage implements a **first-wins** pattern:

- **Either** EHS Manager **or** EHS Officer can provide the final endorsement
- Whichever approves first activates the permit
- The other role receives a courtesy notification that their approval is no longer required
- This ensures operational continuity when one EHS authority is unavailable

---

## 5. Permit Types & Master Data

### 5.1 Active Permit Types

| Code | Permit Type | Form ID | Checklist Items | Topology | Gating Criteria & Special Safety Rules |
|:---|:---|:---|:---:|:---:|:---|
| **PTW-001** | Excavation Work | `PTW-001` | 12 | 5-Stage (Parallel) | 3-discipline parallel clearance (MEP + P&M + IT); depth & slope ratio validation; mandatory excavation drawing attachment. |
| **PTW-002** | Hot Work | `PTW-002` | 20 | 4-Stage (Direct) | 1-hour continuous post-completion fire watch; qualified welder verification (ARPL/Contractor); flashback arresters; spark containment. |
| **PTW-003** | Guard Rail / Floor Protection Removal | `PTW-003` | 9 | 4-Stage (Direct) | 100% tie-off mandatory; full-body harness; watcher assigned until re-fixed; mandatory physical restoration photo gate upon surrender. |
| **PTW-004** | Confined Space Entry | `PTW-004` | 15 | 4-Stage (Direct) | 4-gas multi-detector test ($O_2, LEL, CO, H_2S$); forced air ventilation; physical inspection declaration; pre-task checklist doc upload. |
| **PTW-005** | Shaft Work | `PTW-005` | 10 | 5-Stage (Sequential) | Dedicated MEP clearance step; scaffolding green tag verification; fall arresters; physical safety declaration across 43 floor levels. |
| **PTW-006** | Electrical Work (HT / LT) | `PTW-006` | 14 | 4-Stage (BP) / 5-Stage (Site) | Initiated exclusively by Permittee Electrician; Facility scope radio toggle (Batching Plant vs Site); Project selection strictly available only for Site scope (locked with badge for Batching Plant); Batching Plant location strictly locked to Manual only; Mandatory reason for shutdown textarea; 10 apparatus multi-select options; Approximate shutdown hours ($from < to$); 3 Step 1 checkboxes (safe to work, LOTO register Sl. No & datetime, pre-work statutory declaration); Dual topology (Batching Plant vs Site); Exclusive Electrician surrender gate with mandatory photo and electrical de-isolation declaration. |
| **PTW-007** | Drilling & Blasting | `PTW-007` | 15 | 3-Stage (Direct Spine) | Exclusive Permittee: Blasting / Drilling In-charge only; Mutually exclusive operation toggle (Blasting vs Drilling); Mandatory on-form PESO statutory safety declaration; 4 mandatory post-checklist rig parameters; Site Engineer verification (cannot cancel); 18:30 IST sunset stop rule (zero extension runway for blasting); Post-blast misfire clearance; Night shift linkage strictly forbidden. |
| **PTW-008** | General Work | `PTW-008` | Dynamic (21 / 15 / 20 / 11) | 4-Stage (Direct) | Multi-tier safety checklists dynamically tailored to 14 work descriptions across 4 categories: Category A Panel Erection (21 items, Item 21 wind $\le 45\text{ km/h}$), Category B Hoisting & Rigging (15 items + wind warning banner), Category C Formwork (20 items + wind warning banner), Category D Custom (11 items + manual entry field). 4-stage direct spine (Site Sup $\to$ Site Eng $\to$ Tower Incharge $\to$ EHS). Mandatory housekeeping & area clearance surrender gate. |
| **PTW-009A** | Routine Lifting Operations | `PTW-009A` | 14 | 5-Stage (P&M Clearance Spine) | Single unified tile (`PTW-009`) in catalog; initiated exclusively by certified Lifting Supervisor; mandatory pre-location signature gate (Crane Operator & Signaler/Rigger digital signatures and DPDP consent); rigging geometry & sling tension calculation engine ($\text{Stress} = \frac{\text{TotalW} \times L}{H \times N}$ with $N=2$ safety clamping); 14 statutory checklist items; mobile crane ($\le 38\text{ km/h}$) and tower crane ($\le 45\text{ km/h}$) wind speed warnings; dedicated P&M Engineer technical clearance; exclusive Lifting Supervisor surrender gate with certified demobilization declaration. |
| **PTW-009B** | Critical Lift Plan / Non-Routine Lift | `PTW-009B` | 14 | 6-Stage (Project Manager Review) | Single unified tile (`PTW-009`, `liftplan` hidden from catalog grid); auto-promoted dynamically from routine lifting if: total load $> 5.0\text{ MT}$, tandem lift selected, calculated sling stress $> 80\%$ of sling SWL, or ANY of 14 statutory high-risk criteria = YES; 6-stage governance requiring executive review by Project Manager (Step 5) prior to EHS final endorsement; certified demobilization declaration upon surrender. |
| **PTW-010** | Night Shift Work | `PTW-010` | 13 | 8-Stage Dual-Phase Handover Protocol | Enterprise-grade governance for night operations (20:30 to 06:00 IST). Day Phase (5:00 PM – 6:30 PM): Initiated by Site Supervisor, 13 statutory checklist checks, contractor/subcontractor declaration, authorized activity dropdown, site photo deferred to handover, approved by Site Engineer & Tower Incharge. Unlocks sequential Stage 2 linked activity permit (Hot Work, Shaft, Lifting, etc.) through its daytime approval spine. Night Phase Handover (8:30 PM / 20:30 IST): Transferred to incoming Night Site Supervisor; qualification gate requires PM authorization + valid PTW training (< 365 days); 21:00 cutoff engine auto-cancels if unstaffed; mandatory dual site photo verification (workplace illumination + linked activity setup). Step 5: P&M Engineer night inspection of lighting towers and equipment. Step 6: EHS Safety verification activates both permits; rejection strictly isolates Night Supervisor without re-engaging day approvers. Strict statutory prohibitions: Confined Space (PTW-004), Drilling & Blasting (PTW-007), and Critical Lift Plans (PTW-009B / > 5 MT) strictly forbidden at night. Exclusive closure & surrender by Night Site Supervisor with de-energization declaration. |

### 5.2 Approval Chain Topology per Permit Type

Each permit work type implements a statutory governance topology specifically calibrated to its operational risks:

#### 5.2.1 PTW-001 Excavation Work (5 Stages - 3-Way Parallel Clearance Gate)
```mermaid
graph LR
    subgraph "PTW-001 Excavation - 5 Stages (Parallel Spine)"
        E1["Site Supervisor<br/>(Permittee)"] --> E2["Site Engineer<br/>(Step 2 Physical Verification)"]
        E2 --> E3["MEP, P&M, IT<br/>(Step 3 Parallel Clearance Gate)"]
        E3 --> E4["Excavation Head<br/>(Step 4 Section Head Review)"]
        E4 --> E5["EHS Safety<br/>(Step 5 Final Endorsement)"]
    end
```

#### 5.2.2 PTW-002 Hot Work (4 Stages - Direct Spine with 1-Hour Fire Watch)
```mermaid
graph LR
    subgraph "PTW-002 Hot Work - 4 Stages (Direct Spine)"
        HW1["Site Supervisor<br/>(Permittee)"] --> HW2["Site Engineer<br/>(Step 2 Combustible Clearance)"]
        HW2 --> HW3["Tower Incharge<br/>(Step 3 Section Head Review)"]
        HW3 --> HW4["EHS Safety<br/>(Step 4 Final Endorsement)"]
    end
```

#### 5.2.3 PTW-003 Guard Rail / Floor Protection Removal (4 Stages - Direct Spine with Re-Fixing Gate)
```mermaid
graph LR
    subgraph "PTW-003 Guard Rail - 4 Stages (Direct Spine)"
        GR1["Site Supervisor<br/>(Permittee)"] --> GR2["Site Engineer<br/>(Step 2 Tie-Off Verification)"]
        GR2 --> GR3["Tower Incharge<br/>(Step 3 Section Head Review)"]
        GR3 --> GR4["EHS Safety<br/>(Step 4 Final Endorsement)"]
    end
```

#### 5.2.4 PTW-004 Confined Space Entry (4 Stages - Direct Spine with Multi-Gas Testing)
```mermaid
graph LR
    subgraph "PTW-004 Confined Space - 4 Stages (Direct Spine)"
        CS1["Site Supervisor<br/>(Permittee & 4-Gas Test Log)"] --> CS2["Site Engineer<br/>(Step 2 Ventilation Check)"]
        CS2 --> CS3["Tower Incharge<br/>(Step 3 Section Head Review)"]
        CS3 --> CS4["EHS Safety<br/>(Step 4 Final Endorsement)"]
    end
```

#### 5.2.5 PTW-005 Shaft Work (5 Stages - Sequential Spine with MEP Clearance)
```mermaid
graph LR
    subgraph "PTW-005 Shaft Work - 5 Stages (Sequential Spine)"
        SW1["Site Supervisor<br/>(Permittee & Floor Dropdown)"] --> SW2["Site Engineer<br/>(Step 2 Scaffolding Check)"]
        SW2 --> SW3["MEP Engineer<br/>(Step 3 Utilities Clearance)"]
        SW3 --> SW4["Tower Incharge<br/>(Step 4 Section Head Review)"]
        SW4 --> SW5["EHS Safety<br/>(Step 5 Final Endorsement)"]
    end
```

#### 5.2.6 PTW-006 Electrical Work (HT/LT) (Dual-Topology: Batching Plant 4-Stage / Site 5-Stage)
```mermaid
graph LR
    subgraph "PTW-006 Electrical Work - Topology 1: Batching Plant Flow (4 Stages)"
        EL1["Permittee Electrician<br/>(Pre-Work Statutory Decl)"] --> EL2["P&M Engineer<br/>(Step 2 Ack & LOTO Decl)"]
        EL2 --> EL3["Quality Engineer<br/>(Step 3 Quality Clearance)"]
        EL3 --> EL4["EHS Safety<br/>(Step 4 Final Endorsement)"]
    end
```

```mermaid
graph LR
    subgraph "PTW-006 Electrical Work - Topology 2: Site Flow (5 Stages)"
        ELS1["Permittee Electrician<br/>(Pre-Work Statutory Decl)"] --> ELS2["Site Engineer<br/>(Step 2 Technical Ack)"]
        ELS2 --> ELS3["MEP or P&M Engineer<br/>(Step 3 Domain Clearance Gate)"]
        ELS3 --> ELS4["Tower Incharge<br/>(Step 4 Section Head Review)"]
        ELS4 --> ELS5["EHS Safety<br/>(Step 5 Final Endorsement)"]
    end
```

#### 5.2.7 PTW-007 Drilling & Blasting (3 Stages - Direct Statutory Spine to EHS)
```mermaid
graph LR
    subgraph "PTW-007 Drilling & Blasting - 3 Stages (Direct Statutory Spine)"
        BIA1["Blasting / Drilling In-charge<br/>(Exclusive Permittee & PESO Decl)"] --> BIA2["Site Engineer<br/>(Step 2 Technical Ack - Cannot Cancel)"]
        BIA2 --> BIA3["EHS Safety<br/>(Step 3 Final Endorsement)"]
    end
```

#### 5.2.8 PTW-008 General Work (4 Stages - Multi-Tier Dynamic Safety Spine)
```mermaid
graph LR
    subgraph "PTW-008 General Work - 4 Stages (Multi-Tier Dynamic Spine)"
        GW1["Site Supervisor<br/>(Permittee - Cat A-D Dynamic Checklist)"] --> GW2["Site Engineer<br/>(Step 2 Physical Verification)"]
        GW2 --> GW3["Tower Incharge<br/>(Step 3 Section Head Review)"]
        GW3 --> GW4["EHS Safety<br/>(Step 4 Final Endorsement)"]
    end
```

#### 5.2.9 PTW-009A Routine Lifting Operations (5 Stages - Technical P&M Clearance Spine)
```mermaid
graph LR
    subgraph "PTW-009A Routine Lifting - 5 Stages (P&M Clearance Spine)"
        LS1["Lifting Supervisor<br/>(Permittee & Pre-Location Signatures)"] --> LS2["Site Engineer<br/>(Step 2 Physical Verification)"]
        LS2 --> LS3["P&M Engineer<br/>(Step 3 Crane & Rigging Clearance)"]
        LS3 --> LS4["Tower Incharge<br/>(Step 4 Section Head Review)"]
        LS4 --> LS5["EHS Safety<br/>(Step 5 Final Endorsement)"]
    end
```

#### 5.2.10 PTW-009B Critical Lift Plan / Non-Routine Lift (6 Stages - Project Manager Executive Review Spine)
```mermaid
graph LR
    subgraph "PTW-009B Critical Lift Plan - 6 Stages (Executive Review Spine)"
        CLP1["Lifting Supervisor<br/>(Permittee - Critical Promotion)"] --> CLP2["Site Engineer<br/>(Step 2 Physical Verification)"]
        CLP2 --> CLP3["P&M Engineer<br/>(Step 3 Crane & Rigging Clearance)"]
        CLP3 --> CLP4["Tower Incharge<br/>(Step 4 Section Head Review)"]
        CLP4 --> CLP5["Project Manager<br/>(Step 5 Executive Domain Review)"]
        CLP5 --> CLP6["EHS Safety<br/>(Step 6 Final Endorsement)"]
    end
```

#### 5.2.11 PTW-010 Night Shift Work (Dual-Phase Handover Governance)

Night Shift and Holiday Work operates under an enterprise multi-phase governance protocol separated into distinct, independent operational stages:

##### 5.2.11.1 Phase 1 (Day Phase): Stage 1 Daytime Initiation & Approval Spine (5:00 PM – 6:30 PM IST)
Initiated during late afternoon by the daytime Site Supervisor, verified by the Site Engineer, and endorsed by the Tower Incharge. Plant & Machinery (P&M) receives an informational alert while formal EHS verification is held until nightfall.

```mermaid
graph LR
    subgraph "Phase 1: Stage 1 Daytime Approval Spine"
        NS1["Site Supervisor (Day)<br/>(Pre-fills PTW-010 · Photo Deferred)"] --> NS2["Site Engineer<br/>(Step 2 Technical Acknowledgment)"]
        NS2 --> NS3["Tower Incharge<br/>(Step 3 Section Head Approval)"]
        NS3 --> NS_STAT["Status: Night Shift Approved -<br/>Awaiting Linked Permit"]
    end
```

##### 5.2.11.2 Phase 1 (Day Phase): Sequential Stage 2 Linked Activity Permit Approval Spine
Unlocked strictly after Stage 1 Tower Incharge approval. The Day Supervisor initiates the specific trade permit (Hot Work, Shaft, Electrical, Routine Lifting, etc.), routing it through its full daytime engineering approval spine until both permits synchronize.

```mermaid
graph LR
    subgraph "Phase 1: Stage 2 Linked Daytime Activity Approval Spine"
        LP1["Site Supervisor (Day)<br/>(Fills Linked Activity Permit)"] --> LP2["Site Engineer<br/>(Step 2 Physical Verification)"]
        LP2 --> LP3["Discipline Clearances<br/>(MEP / P&M / Quality)"]
        LP3 --> LP4["Tower Incharge<br/>(Section Head Approval)"]
        LP4 --> LP_STAT["Both Permits Synchronized:<br/>Approved - Pending Night Handover"]
    end
```

##### 5.2.11.3 Phase 2 (Night Phase): 8:30 PM Handover Gate, P&M Inspection & EHS Final Activation
At 8:30 PM (20:30 IST), physical handover occurs on-site. The incoming Night Site Supervisor must pass the PM-Authorization and valid PTW training qualification gate before the 21:00 cutoff. P&M verifies minimum lux levels and equipment, and EHS executes final activation.

```mermaid
graph LR
    subgraph "Phase 2: Night Handover & EHS Activation Spine"
        HO1["Night Site Supervisor<br/>(Qualification Gate · Dual Photos)"] --> PM1["P&M Engineer (Step 5)<br/>(Lighting Towers & Lux Levels)"]
        PM1 --> EHS1["EHS Safety Verification (Step 6)<br/>(Dual Photos & 13 Checklist Points)"]
        EHS1 -- Approve --> ACT["Both Permits Activated<br/>(Status: Active)"]
        EHS1 -- Reject --> RET["Returned strictly to Night Supervisor<br/>(Day Approvers NOT Re-Engaged)"]
    end
```

##### 5.2.11.4 Phase 3 (Morning): Statutory Closure & Surrender (Night Site Supervisor Exclusive)
At 06:00 IST the following morning, night operations conclude. Closure and formal surrender to EHS are restricted exclusively to the Night Site Supervisor with mandatory illumination de-energization confirmation. Day supervisors are strictly blocked.

```mermaid
graph LR
    subgraph "Phase 3: Morning Closure & Demobilization"
        SUR1["Night Site Supervisor Exclusively<br/>(Day Supervisor Strictly Blocked)"] --> SUR2["Mandatory De-energization Check<br/>(Lighting towers de-energized, cables secured)"]
        SUR2 --> SUR3["GPS + Photo + DPDP Digital Signature"]
        SUR3 --> SUR_STAT["Status: Completed (Surrendered)<br/>(Official 6-Signatory Report Released)"]
    end
```

### 5.3 Statutory Safety Checklist: PTW-001 Excavation Work (12 Items)

> [!IMPORTANT]
> **Checklist Verification & Evidence Rules (Across All Permit Types)**:
> 1. **"NO" Response Rule**: For any checklist question answered **"NO"**, an explanation comment is **mandatory**; device GPS tagging and evidence photos are **NOT required** for individual checklist items.
> 2. **"N/A" Response Rule**: For any checklist question answered **"N/A"**, a comment is **NOT required**.
> 3. **Site Photo Gate**: The **Site Photo capture option** is locked and becomes activated **only after all checklist items have been completely filled in**.
> 4. **GPS Capture Point**: Geofencing device GPS coordinates are **not captured in initial steps**; GPS is captured exclusively when the **final permit form is submitted** (Step 4).

Form ID: `PTW-001` · Evaluated via `CHECKLIST_ITEMS`:

| # | Exact Statutory Inspection Item | Category | Required Response | Deviation Requirement | Construction Engineering Rationale |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | Is Risk Assessment carried out based on work methodology, and hazard and control measures briefed to workers? | Risk Governance | **YES** / NA | Comment if NO | Ensures Hazard Identification & Risk Assessment (HIRA) and toolbox safety briefing were conducted prior to breaking ground. |
| **2** | Is necessary PPE and insulated hand tools provided for workers, in case of manual excavation? | PPE & Tool Safety | **YES** / NA | Comment if NO | Mandates dielectric rubber boots, heavy-duty gloves, and insulated picks/spades to eliminate electric shock hazards from buried cables. |
| **3** | Are arrangements of barricading materials for the excavation area, fixing signages & lights, ready? | Perimeter Protection | **YES** / NA | Comment if NO | Enforces rigid Class-A physical fencing, retroreflective danger warning signboards, and solar hazard blinkers around pit perimeter. |
| **4** | Are machinery used for excavation inspected and fit for use? | Equipment Safety | **YES** / NA | Comment if NO | Verifies third-party fitness certification, hydraulic leak check, reverse horns, and rollover protective structures (ROPS) on excavators. |
| **5** | Are arrangements for safe access to the excavation area (ladder / stair tower / ramp etc.) made ready? | Ingress & Egress | **YES** / NA | Comment if NO | Mandates anchored ladders extending at least 1.0m above landing or stable ramps spaced within 7.5m lateral travel distance. |
| **6** | Are materials stacked away from the excavation pit? | Surcharge Loading | **YES** / NA | Comment if NO | Prevents trench lip surcharge collapse; spoils, rocks, and equipment must maintain a minimum 1.5m buffer from the edge. |
| **7** | Are any overhead services identified, and precautionary measures taken? | Overhead Hazards | **YES** / NA | Comment if NO | Prevents boom or mast strikes against live overhead high-tension electrical cables or overhead crane gantry lines. |
| **8** | Is a separate pedestrian pathway and vehicle movement at ramp provided? | Traffic Management | **YES** / NA | Comment if NO | Eliminates struck-by collisions on site ramps by segregating pedestrian walkways with physical barriers from dumpers/JCBs. |
| **9** | Are vehicle movements near the excavation area diverted? | Vibration & Collision | **YES** / NA | Comment if NO | Re-routes heavy haulage traffic to prevent dynamic shock vibration from destabilizing unreinforced excavation side slopes. |
| **10** | Is the excavator operator experienced and trained? | Competency | **YES** / NA | Comment if NO | Validates valid commercial heavy machinery operator's driving license, visual acuity certificate, and on-site competency assessment. |
| **11** | Are materials available for shoring to prevent side collapse / is slope maintained at site? | Slope Stability | **YES** / NA | Comment if NO | Verifies soil benching angle (e.g. 1:1.5) or presence of hydraulic shores, trench boxes, or sheet piles according to geotechnical soil class. |
| **12** | Is the excavator swing area demarcated and barricaded? | Crush Hazard | **YES** / NA | Comment if NO | Demarcates the 360° rotational blind spot counterweight radius to prevent pinned-against and pinch-point crushing injuries. |

### 5.4 Statutory Safety Checklist: PTW-002 Hot Work (20 Items)

Form ID: `PTW-002` · Evaluated via `HOTWORK_CHECKLIST_ITEMS`:

| # | Exact Statutory Inspection Item | Category | Required Response | Deviation Requirement | Fire Prevention & Workmanship Rule |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | Are the engaged workers, fully qualified and trained and aware of Risk involved (HIRA)? | Competency | **YES** / NA | Comment if NO | Validates welder trade certification, welder ID card, and hot work safety briefing. |
| **2** | Is Electrode holder insulated and in good condition? | Electrical Safety | **YES** / NA | Comment if NO | Eliminates stray arc flashes and direct electrocution from cracked or exposed copper holders. |
| **3** | Are work areas cleared of flammable / Combustible materials? | Fire Prevention | **YES** / NA | Comment if NO | Mandates clearing all combustibles within an 11-metre (35-foot) radius around the spark hot zone. |
| **4** | Are Grinder / Chiseling machines free from defects, equipped with Deadman / Push Button switch & safety guard? | Tool Guarding | **YES** / NA | Comment if NO | Enforces mandatory factory wheel guards and automatic cut-off deadman triggers to prevent runaway discs. |
| **5** | Are sufficient and suitable Fire Extinguishers Available? | Fire Response | **YES** / NA | Comment if NO | Requires dedicated, inspected ABC dry chemical powder or $CO_2$ extinguishers adjacent to work point. |
| **6** | Are abrasive wheels being with required standard and compliance? | Wheel Integrity | **YES** / NA | Comment if NO | Verifies ISI / EN 12413 certification markings, expiry dates, and absence of chipping or cracks. |
| **7** | Has fire retardant cloth / metal sheet been placed to prevent sparks from causing fire? | Spark Containment | **YES** / NA | Comment if NO | Mandates certified vermiculite/fiberglass fire blankets to catch dripping molten slag and bouncing sparks. |
| **8** | Is Machine spindle speed less than the maximum speed of the wheel / Disc? | Mechanical Limits | **YES** / NA | Comment if NO | Ensures grinder RPM does not exceed rated disc burst speed, preventing lethal disc shattering. |
| **9** | Are Flash back arresters installed at both regulator & torch end? | Oxy-Fuel Safety | **YES** / NA | Comment if NO | Dual-end sintered flame arresters prevent explosive flashback propagation into fuel gas cylinders. |
| **10** | Is abrasive wheel flange (front or back) of right size and fitting? | Mechanical Mounting | **YES** / NA | Comment if NO | Proper matching recessed flanges prevent uneven torsional stress and catastrophic wheel fracture. |
| **11** | Are Gas cylinder and fittings, free from oil, grease, leakage and legibly marked and kept on trolley? | Gas Cylinder Safety | **YES** / NA | Comment if NO | Hydrocarbons in contact with high-pressure oxygen cause spontaneous detonation; trolley ensures transit stability. |
| **12** | Is working platform made for the use of grinders, not on ladders? | Working Platform | **YES** / NA | Comment if NO | Forbids aggressive two-handed grinding operations from portable ladders due to reactive kickback torque. |
| **13** | Is Electrical Supply given through RCCB & Return provided from Job to the welding machine insulated? | Electrical Grounding | **YES** / NA | Comment if NO | 30mA residual current circuit breakers prevent electrocution; insulated return prevents stray current fire. |
| **14** | Is Fire extinguisher placed near the activities? | Immediate Readiness | **YES** / NA | Comment if NO | Secondary extinguisher stationed within arm's reach of the immediate hot work point. |
| **15** | Are both cylinders kept upright vertically on trolley? | Cylinder Storage | **YES** / NA | Comment if NO | Prevents liquid acetone withdrawal in dissolved acetylene cylinders; chain restraint prevents toppling. |
| **16** | Is required & appropriate PPE provided? | Personal Protection | **YES** / NA | Comment if NO | Leather apron, split-leather gauntlet welding gloves, auto-darkening shade-11 face shield, and spats. |
| **17** | Is welding machine / equipment tested and free from defects (cables, holder)? | Equipment Health | **YES** / NA | Comment if NO | No cable joints within 3m of electrode holder; pristine double insulation throughout cable runs. |
| **18** | Is supervisor available all time & Fire Watcher available? | Active Surveillance | **YES** / NA | Comment if NO | **1-Hour Fire Watch Rule:** Dedicated fire watcher posted during work and for 60 minutes post-shutdown. |
| **19** | Are rated lugs used for connecting welding cables? | Electrical Terminals | **YES** / NA | Comment if NO | Heavy-duty crimped cable lugs eliminate loose frayed wire heating, sparking, and terminal burnout. |
| **20** | Any other precautions? | Site Specifics | **YES** / NA | Comment if NO | Captures custom site hazards, adjacent flammable piping, or weather restrictions (e.g. rain/wind). |

#### Hot Work Description Registry (`HOTWORK_DESCRIPTIONS`)
1. `Welding`: Shielded Metal Arc Welding (SMAW), Gas Metal Arc Welding (GMAW/MIG), Gas Tungsten Arc Welding (GTAW/TIG).
2. `Gas Cutting`: Oxy-Acetylene / Oxy-LPG thermal cutting torches.
3. `Soldering`: High-temperature copper piping and electrical brazing.
4. `Abrasive wheel cutting`: High-speed cutoff saw and angle grinder steel profiling.

### 5.5 Statutory Safety Checklist: PTW-003 Guard Rail & Floor Protection Removal (9 Items)

Form ID: `PTW-003` · Evaluated via `GUARDRAIL_CHECKLIST_ITEMS`:

| # | Exact Statutory Inspection Item | Category | Required Response | Deviation Requirement | Fall Prevention & Statutory Protection Rule |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | Are workers aware of risk involved and precautions required (HIRA, SWM available)? | Risk Briefing | **YES** / NA | Comment if NO | Verifies Safe Work Method statement was briefed to crew before unbolting edge protections. |
| **2** | Are Fall protection gears in place (Lifeline, Eye / Ring bolt, Full body Harness, catch net etc)? | Fall Protection | **YES** / NA | Comment if NO | **100% Tie-Off Rule:** Twin-lanyard full body harnesses clipped to overhead certified lifelines. |
| **3** | Are Openings properly covered? (Above, Below, Workplace) | Multi-Level Safety | **YES** / NA | Comment if NO | Verifies floor cutouts on adjacent elevations are protected to prevent falling worker or tool impact. |
| **4** | Are Workers provided with required Personal Protective Equipment for the activity? | PPE | **YES** / NA | Comment if NO | Chin-strap safety helmets, anti-slip footwear, safety eyewear, and cut-resistant gloves. |
| **5** | Whether sufficient lighting available? | Illumination | **YES** / NA | Comment if NO | Minimum 150 Lux illumination at edge zone to prevent disorientation and missteps. |
| **6** | Is Access to work location clear and safe? | Housekeeping | **YES** / NA | Comment if NO | Clean, trip-free passage free of cables, debris, and reinforcing steel protrusions. |
| **7** | Are all Power Tools and Hand tools checked, hand strings provided and in good condition? | Tool Lanyard | **YES** / NA | Comment if NO | Tool tethers / wrist lanyards mandatory to prevent dropped objects falling from heights. |
| **8** | Are Barricades and caution sign provided on removal of guard rail / Shaft gate / Floor opening? | Warning Signage | **YES** / NA | Comment if NO | High-visibility warning barriers placed 2.0m back from opening with prominent danger notices. |
| **9** | Is Minimum one watcher provided in the area till guard rail / gates re-fixed? | Dedicated Watcher | **YES** / NA | Comment if NO | **Continuous Watcher Rule:** Assigned safety spotter stationed permanently until physical restoration. |

#### Guard Rail Removal Activities Registry (`GUARDRAIL_ACTIVITIES`)
1. `Removal of Perimeter Guard Rails` (Exterior slab edge protection)
2. `Removal of Floor Opening / Cutout Covers` (Plumbing & electrical service penetrations)
3. `Removal of Shaft Gates / Barriers` (Lift & MEP riser enclosures)
4. `Removal of Edge Protection / Handrails` (Ramps & parapets)
5. `Removal of Slab Penetration Covers` (Post-tensioning stressing pockets)
6. `Removal of Staircase Handrails / Guardrails` (Staircase void protection)
7. `Removal of Scaffolding Mid-rails / Toe-boards` (Scaffold access bays)
8. `Others (Specify)` (Custom temporary safety barrier removal)

### 5.6 Statutory Safety Checklist & Multi-Gas Detection Engine: PTW-004 Confined Space Entry (15 Items)

Form ID: `PTW-004` · Evaluated via `CONFINED_CHECKLIST_ITEMS`:

| # | Exact Statutory Inspection Item | Category | Required Response | Deviation Requirement | Confined Space Life-Safety Protocol |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | Are approved Method Statement and Risk Assessment available and supervisors and workers are aware of the risk involved and control measures? | Safe System of Work | **YES** / NA | Comment if NO | Approved method statement detailing isolation, purging, and rescue procedures. |
| **2** | Is area cleared of all hazards & hazardous substances and checked with multi gas detector? | Environmental Clearance | **YES** / NA | Comment if NO | Sludge removed, hazardous chemicals drained, and initial multi-gas atmospheric survey passed. |
| **3** | Are workers assessed for aptitude and fitness for the specific task? | Medical Fitness | **YES** / NA | Comment if NO | Medical screening for claustrophobia, respiratory fitness, and physical endurance. |
| **4** | Are workers equipped with required PPE as per MSDS and Risk Assessment? | PPE & RPE | **YES** / NA | Comment if NO | Impermeable chemical suits, nitrile/neoprene gloves, and certified breathing apparatus if needed. |
| **5** | Are site engineer or supervisor trained for confined space activities and rescue procedure? | Emergency Competency | **YES** / NA | Comment if NO | Certified confined space rescue training and familiarity with winch extraction operations. |
| **6** | Are access and working platforms available / provided? | Safe Access | **YES** / NA | Comment if NO | Securely lashed aluminum/fiberglass ladders or certified suspended entry cradle. |
| **7** | Is control of entry to confined space in place, and watcher provided for the entire duration of work? | Entry Attendant | **YES** / NA | Comment if NO | **Standby Attendant Rule:** Outside entry watcher logs entrant count and maintains continuous contact. |
| **8** | Is adequate communication system in place? | Communication | **YES** / NA | Comment if NO | Intrinsically safe two-way radios, horn signals, or hardwired communication lifelines. |
| **9** | Are rescue and first aid arrangements in place and adequate? | Rescue Readiness | **YES** / NA | Comment if NO | Certified tripod recovery winch, full-body retrieval harness, and oxygen resuscitator on standby. |
| **10** | Are precautions as per MSDS of hazardous substances are in place? | Toxic Chemical Defense | **YES** / NA | Comment if NO | Chemical neutralizers, eye wash stations, and barrier creams aligned with MSDS guidelines. |
| **11** | Are Sufficient task lights / 24V hand lamps provided? | Low-Voltage Lighting | **YES** / NA | Comment if NO | **Low Voltage Rule:** Strict 24V SELV or flameproof battery lights to eliminate electrocution in damp sumps. |
| **12** | Is Adequate ventilation and exhaust fans provided? | Forced Ventilation | **YES** / NA | Comment if NO | Continuous mechanical positive-pressure air blowers delivering fresh outdoor air to bottom of space. |
| **13** | Is Hot work permit followed for all hot works and control measure in place. | Concurrent PTW | **YES** / NA | Comment if NO | Cross-reference: If cutting/welding inside space, companion PTW-002 permit is mandatory. |
| **14** | Confirmed gas within limits (Combustible: %LEL, H2S: PPM, CO: PPM) and adequacy of O2 (O2: %) take from approved values. | Atmospheric Verification | **YES** / NA | Comment if NO | Mathematical validation against `CONFINED_GAS_THRESHOLDS` documented below. |
| **15** | Is Confined space checklist attached. | Document Evidence | **YES** / NA | Comment if NO | Mandatory physical pre-task safety checklist uploaded to permit record. |

#### Confined Space Entry Activities Registry (`CONFINED_ACTIVITIES`)
1. `Tank Cleaning` (Underground domestic water tanks, fire tanks)
2. `Sump Inspection / Repair` (Stormwater and raw water sumps)
3. `STP / WTP Maintenance` (Sewage Treatment Plant & Water Treatment Plant aeration chambers)
4. `Pipe / Cable Duct Entry` (Underground utility trenches and distribution galleries)
5. `Underground Drainage / Culvert Work` (Municipal storm drains and box culverts)
6. `Sump Waterproofing` (Polyurethane / crystalline waterproofing application in enclosed pits)
7. `Others` (Custom enclosed structural volume entry)

#### Confined Space Multi-Gas Detection Engine & Threshold Rules
Under OSHA 1910.146 and Indian Factory Act safety standards, atmospheric testing inside confined spaces must evaluate four hazardous gaseous constituents simultaneously before human entry is permitted. In `index.html`, the evaluation function `isGasReadingSafe(param, val)` enforces hard boundary rules:

$$\text{Gas Safety Condition} = \big(0 \le \text{LEL} < 10\%\big) \land \big(0 \le \text{H}_2\text{S} \le 5\text{ PPM}\big) \land \big(0 \le \text{CO} < 25\text{ PPM}\big) \land \big(19.5\% \le \text{O}_2 \le 21.0\%\big)$$

| Parameter | Identifier | Statutory Safe Range | Unit | Sensor Physics & Hazardous Thresholds | UI Validation Badge |
|:---|:---|:---:|:---:|:---|:---:|
| **Combustible Gas** | `combustible` | **$0 \le \text{Val} < 10.0$** | `% LEL` | Lower Explosive Limit. Values $\ge 10\%$ pose flash fire / explosion danger. Form validation blocks progression. | `LEL: < 10% LEL` |
| **Hydrogen Sulphide** | `h2s` | **$0 \le \text{Val} \le 5.0$** | `PPM` | Toxic sewer gas paralyzing olfactory nerves at $>10\text{ PPM}$. Lethal above $50\text{ PPM}$. Max permitted: $5\text{ PPM}$. | `H2S: 0–5 PPM` |
| **Carbon Monoxide** | `co` | **$0 \le \text{Val} < 25.0$** | `PPM` | Asphyxiant binding hemoglobin ($200\times$ affinity of $O_2$). OSHA TWA ceiling: $25\text{ PPM}$. Permitted: $<25\text{ PPM}$. | `CO: < 25 PPM` |
| **Oxygen Concentration** | `o2` | **$19.5 \le \text{Val} \le 21.0$** | `% vol` | Normal air is $20.9\%$. Deficient ($<19.5\%$) induces hypoxia; enriched ($>21.0\%$) drastically accelerates combustion. | `O2: 19.5–21.0%` |

### 5.7 Statutory Safety Checklist: PTW-005 Shaft Work (10 Items)

Form ID: `PTW-005` · Evaluated via `SHAFT_CHECKLIST_ITEMS`:

| # | Exact Statutory Inspection Item | Category | Required Response | Deviation Requirement | Vertical Void Safety & Mechanical Clearance Rule |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | Is Method statement and Risk Assessment available for the Task? | Procedure | **YES** / NA | Comment if NO | Engineering procedure for vertical hoisting, platform loading, and floor sealing. |
| **2** | Are workers aware of risk involved, precaution and control measures required and training given? | Training | **YES** / NA | Comment if NO | Working-at-heights certified training and drop hazard prevention orientation. |
| **3** | Is Overhead protection provided if required? | Overhead Defense | **YES** / NA | Comment if NO | Heavy-duty wooden/steel impact-absorbing canopy protecting workers from dropped objects above. |
| **4** | Are Workers provided with safety harness and all other required job specific Personal Protective equipments for the activity? | Fall Arrest | **YES** / NA | Comment if NO | Double-lanyard full body harness with energy absorber tied off to independent vertical lifeline. |
| **5** | Is access to shaft clear and safe? | Shaft Access | **YES** / NA | Comment if NO | Clear landing access gates; non-slip floor threshold free of oil or loose debris. |
| **6** | Is working platform provided and Scaff tag placed (planks secured, guard rails and toe boards for fall protection as per standard) / RSP Checked and fall protection in place with fall arrestor? | Platform Certification | **YES** / NA | Comment if NO | **Scaff-Tag Rule:** Valid green inspection tag affixed; heavy planks wired down with zero gaps; toe boards fitted. |
| **7** | Are Electrical tools and hand tools checked prior to use in shaft and green tag available? | Portable Appliance Testing | **YES** / NA | Comment if NO | PAT green inspection tag affixed; insulated industrial cables free of taped joints. |
| **8** | Are Light and ventilation as per requirement for activity ensured? | Environmental Quality | **YES** / NA | Comment if NO | High-lumen festoon shaft lighting and forced axial draft fans ensuring fresh air exchange. |
| **9** | Is Supervisor available full-time to monitor the activity? | Supervision | **YES** / NA | Comment if NO | Full-time on-deck supervisor monitoring workers and coordinating floor access gates. |
| **10** | Is Hot work permit obtained separately for all hot work? | Concurrent PTW | **YES** / NA | Comment if NO | Cross-reference: Separate PTW-002 permit required for welding or torch cutting inside vertical shaft. |

#### Shaft Floor Registry (`SHAFT_FLOORS` - 43 Distinct Elevations)
The system models tall-structure verticality through 43 discrete structural floor selections:
* **Substructure (7 Levels):** `Basement 3 (B3)`, `Basement 2 (B2)`, `Basement 1 (B1)`, `Ground Floor (GF)`, `Podium Level 1 (P1)`, `Podium Level 2 (P2)`, `Podium Level 3 (P3)`.
* **Superstructure (35 Levels):** `Floor 1` through `Floor 35`.
* **Roof Level (1 Level):** `Terrace / Roof Level`.

### 5.8 Statutory Safety Checklist & Dual Topologies: PTW-006 Electrical Work (HT / LT) (14 Items)

Under the Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations, Indian Electricity Rules, and OSHA 1910 Subpart S standards, all High Tension (HT) and Low Tension (LT) electrical activities require mandatory verification of 14 statutory precautions:

| Item | Statutory Precaution Description | Discipline / Risk Domain | Permitted Responses | Conditional Validation Rules | Statutory Engineering Rationale |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | Is the work carried out by qualified / trained electrician? | Competency & Licensing | **YES** / NA | Comment mandatory if NO | Licensed Wireman / Supervisor certificate verification before touching apparatus. |
| **2** | Has the electrical circuit / equipment been physically isolated from all power sources? | De-Energization | **YES** / NA | Comment mandatory if NO | Physical breaker racking out and isolator disconnect verified open. |
| **3** | Has Lockout / Tagout (LOTO) been applied and keys in possession of the electrician? | LOTO Enforcement | **YES** / NA | Comment mandatory if NO | LOTO padlock placed with unique key held by working electrician. |
| **4** | Has the isolated circuit been tested for zero voltage (voltage detector / multimeter)? | Zero-Energy Verification | **YES** / NA | Comment mandatory if NO | Calibrated contact/non-contact voltage testing proves zero electrical energy. |
| **5** | Has residual electrical energy been safely discharged and temporary earthing applied? | Residual Energy & Earthing | **YES** / NA | Comment mandatory if NO | Discharge capacitive charge; apply earth lead clamps before touch. |
| **6** | Are insulated tools, rubber gloves, and rubber mats of appropriate voltage class available and in use? | Dielectric Tooling | **YES** / NA | Comment mandatory if NO | IS 4770 / ASTM D120 class-rated gloves, 1000V insulated tools, IS 15652 mats. |
| **7** | Is personal protective equipment (PPE) including arc flash suit, face shield, and safety shoes in use? | Arc Flash Protection | **YES** / NA | Comment mandatory if NO | Arc-rated clothing (cal/cm² rated), dielectric boots, face shield with chin cup. |
| **8** | Are warning signs and physical barricades placed around the electrical work zone? | Perimeter Security | **YES** / NA | Comment mandatory if NO | "DANGER - MEN AT WORK" red danger tags and insulated rope barriers. |
| **9** | Is emergency rescue equipment (insulated rescue hook, first aid kit, fire extinguisher) available at site? | Emergency Preparedness | **YES** / NA | Comment mandatory if NO | Body rescue hook for electrical shock extraction, $CO_2$ electrical fire extinguisher. |
| **10** | Has adjacent live electrical equipment been shrouded, insulated, or guarded against accidental contact? | Proximity Guarding | **YES** / NA | Comment mandatory if NO | Dielectric blankets / insulating barriers prevent touch with adjacent live busbars. |
| **11** | Is proper lighting and ventilation provided in the electrical room / work area? | Ergonomic Environment | **YES** / NA | Comment mandatory if NO | Minimum 200 Lux battery work lights; ventilation for battery room acid fumes. |
| **12** | Is a competent electrical safety standby person (watcher) stationed during high-voltage work? | Safety Standby | **YES** / NA | Comment mandatory if NO | Dedicated safety watcher trained in CPR / first aid stationed outside flash boundary. |
| **13** | Has the single-line diagram (SLD) / circuit schematic been reviewed and verified for the apparatus? | Schematic Verification | **YES** / NA | Comment mandatory if NO | Approved SLD confirms backfeed paths, interlocks, and upstream feed sources. |
| **14** | Have underground or concealed electrical conduits in the work vicinity been identified and marked? | Concealed Utilities | **YES** / NA | Comment mandatory if NO | Cable tracer / scanner prevents drill penetration into embedded live conduits. |

#### PTW-006 Electrical Work Master Specifications & Dual Topologies

##### 1. Facility Scope & Location Rules
* **Facility Scope Switch:** Radio selection between **Batching Plant** and **Site**.
* **Scope-Dependent Project Selection:**
  - **Site Scope:** Project selection dropdown is active, enabled, and mandatory. Form filling requires selecting an Administrator-configured site project.
  - **Batching Plant Scope:** Concrete batching plants operate as standalone external industrial installations with dedicated facilities. Project selection is **strictly disabled / locked** with badge `Only Available for Site Scope`, and form submission does not require selecting a project. Location is strictly locked to **Manual Only**.
* **Batching Plant Mode:** Location selection is strictly locked to **Manual Only** (`getAllowedLocationModes('electrical', { facilityScope: 'batching_plant' }) === ['Manual']`). Tower and Basement/Podium modes are blocked with statutory safety warnings.
* **Site Mode:** Freely enables **Tower**, **Basement/Podium**, or **Manual** mode.

##### 2. Electrical Apparatus Options Registry (`ELECTRICAL_APPARATUS_OPTIONS` - 10 Options)
`HT Switchgear / RMU`, `Transformers (HT / LT)`, `LT Main Distribution Panels (PCC / MCC)`, `Sub-Distribution Boards (SDB / DB)`, `Cables / Busbars`, `DG Sets & Synchronizing Panels`, `Capacitor Banks / APFC`, `Motors & Motor Control Centers`, `Temporary Construction Power Distribution`, `Others`.

##### 3. Step 1 Initiation & LOTO Gating
* **Requester Role:** Restricted to **Permittee Electrician** (`roleTypeScope('electrician') === ['electrical']`).
* **Name of Person Taking Shutdown:** Pre-filled with the logged-in Permittee Electrician's name, or editable directly in Step 1. In Step 4, when the Permittee completes their DPDP identification and digital signature, the person taking shutdown is **automatically updated and synchronized** (`draft.shutdownRequester = signerName`) across the master permit record, Step 4 review, permit detail view, and final statutory PDF report.
* **Why Shutdown:** Mandatory textarea (`draft.shutdownWhy`).
* **Shutdown Window:** Approximate shutdown hours (`shutdownTimeFrom` to `shutdownTimeTo`), validated strictly with $from < to$.
* **Three Mandatory Step 1 Checkboxes:**
  1. `Electrician taken to make the apparatus safe to work` (`draft.electricalSafeToWork`).
  2. `Lockout done and key handed over to working crew and tag out placed and Sl. No maintained in register` (`draft.lotoDone`), accompanied by mandatory **Register Sl. No** (`draft.lotoRegisterNo`) and **Placed Date & Time** (`draft.lotoDateTime`).
  3. Pre-work statutory Electrician undertaking (`draft.electricalStatutoryDecl`).

##### 4. Dual Approval Workflows
* **Batching Plant Flow (4 Stages):**
  $$\text{Electrician (Init)} \xrightarrow{\text{Submit}} \text{P\&M Eng (Ack + Statutory Decl)} \xrightarrow{\text{Approve}} \text{Quality Eng (Insulation \& Quality Clearance)} \xrightarrow{\text{Endorse}} \text{EHS Safety} \xrightarrow{} \text{Active}$$
* **Site Flow (5 Stages):**
  $$\text{Electrician (Init)} \xrightarrow{\text{Submit}} \text{Site Eng (Technical Ack)} \xrightarrow{\text{Ack}} \text{MEP or P\&M Eng (Domain Clearance Gate)} \xrightarrow{\text{Approve}} \text{Tower Incharge} \xrightarrow{\text{Approve}} \text{EHS Safety} \xrightarrow{} \text{Active}$$
  *(Step 3 Either/Or Rule: Approval by either MEP or P&M satisfies the domain gate and advances permit to Tower Incharge).*

##### 5. Exclusive Electrician Surrender Gate
* **Role Check:** Only `currentUser.key === 'electrician'` can close/surrender a PTW-006 permit.
* **Photo Mandatory:** Clear on-site photo evidence required before surrender.
* **Statutory De-Isolation Declaration:** Mandatory confirmation of `surrElectricalClosureChk`:
  > *"I certify that electrical work is completed, all personnel withdrawn, all tools and test equipment removed, lockout padlocks and tagout tags physically removed and Sl. No logged in register. Lockouts surrendered and key returned to supervisor, covers re-fixed, and the apparatus is declared safe for de-isolation and re-energization."*

### 5.9 Statutory Safety Checklist & Technical Specifications: PTW-007 Drilling & Blasting (15 Items)

Under the Petroleum and Explosives Safety Organization (PESO), Indian Explosives Act, and Directorate General of Mines Safety (DGMS) guidelines, all drilling and blasting operations require mandatory verification of 15 statutory precautions:

| Item | Statutory Precaution Description | Discipline / Risk Domain | Permitted Responses | Conditional Validation Rules | Statutory Engineering Rationale |
|:---:|:---|:---|:---:|:---|:---|
| **1** | Are Workers fully aware of Method Statement & Risk Assessment? | Operational Briefing | **YES** / NA | Comment mandatory if NO | Tool-box talk verification; method statement and risk assessment reviewed on site. |
| **2** | Are Electronic Items / Radios & mobile phones prohibited in the location? | Electrostatic & RF Safety | **YES** / NA | Comment mandatory if NO | Eliminates stray radiofrequency (RF) and electrostatic discharge near electric detonator lead wires. |
| **3** | Are the workers engaged fully qualified and trained and with suitable PPE? | Worker Competency | **YES** / NA | Comment mandatory if NO | Verification of DGMS/PESO certified shot firer credentials and mandatory PPE. |
| **4** | Whether the detonators are checked individually for continuity & resistance.? | Detonator Integrity | **YES** / NA | Comment mandatory if NO | Ohmmeter / blasting galvanometer circuit check prior to hole insertion. |
| **5** | Are the bore holes cleared of all the debris before explosives inserted? | Hole Preparation | **YES** / NA | Comment mandatory if NO | Compressed air hole blowout prevents explosive cartridge blockage and misfires. |
| **6** | Are alert siren available and to be blown prior to the blasting & appropriate caution signage’s placed? | Warning Systems | **YES** / NA | Comment mandatory if NO | Multi-stage warning siren protocol: 10 min, 5 min, 1 min, and all-clear blast siren. |
| **7** | Are Explosives transported in approved vehicle & detonators placed separately & kept isolated with caution signage’s? | PESO Transit Compliance | **YES** / NA | Comment mandatory if NO | Licensed PESO explosive van; detonators and high explosives strictly separated. |
| **8** | Are the environmental conditions considered? | Meteorological Safety | **YES** / NA | User reviews auto-picked weather | Auto-reads live site weather telemetry (Rain, Sunny, Wind, Thunders, Lightning); supervisor reviews and clicks YES. |
| **9** | Are wooden tamping sticks available for the stemming of holes? | Anti-Spark Stemming | **YES** / NA | Comment mandatory if NO | Spark-proof non-metallic wooden or antistatic plastic tamping rods. |
| **10** | Is licensed Blasting in charge available at site all time? | Statutory Supervision | **YES** / NA | Comment mandatory if NO | Statutory continuous physical presence of PESO-licensed Blasting In-charge. |
| **11** | Are all the Mufflers(rubber mat) placed in Good Conditions? | Flyrock Suppression | **YES** / NA | Comment mandatory if NO | Heavy rubber blast mats / wire-mesh mufflers prevent rock fragmentation ejection. |
| **12** | Any misfire detected? Are all mis-fired charges removed prior to drilling operations? | Misfire Protocol | **YES** / NA | Comment mandatory if NO | Thorough visual scan; safe water jetting or secondary charge protocols for misfires. |
| **13** | Are all the excessive cartridges removed from the work spot? | Explosives Accounting | **YES** / NA | Comment mandatory if NO | Immediate reconciliation and return of unused cartridges to licensed magazine. |
| **14** | Whether the Condition of lead / leg wires are checked. | Circuit Verification | **YES** / NA | Comment mandatory if NO | Insulation check on firing cable and detonator leg wires to prevent short circuits. |
| **15** | Any other precautions (Manual entry) | Site-Specific Controls | **YES** / NA | **Manual precautions required** | Mandatory free-text entry (`draft.dbOtherPrecautions`) detailing custom geotechnical controls. |

#### Blasting & Drilling Technical Specifications & Registries

PTW-007 implements a mutually exclusive operational switch governed by `draft.operationCategory` (`'blasting'` vs `'drilling'`).

##### 1. Blasting Technical Parameters
When `operationCategory === 'blasting'`, the system validates:
* **Planned Blast Date & Time (`dbDateTime`):** Mandatory timestamp; time must be $\le 18:30\text{ IST}$ (sunset limit).
* **Total Charge Amount (`dbChargeAmount`):** Mandatory positive numeric value ($> 0\text{ kg}$).
* **Blast Hole Diameter (`dbBlastDiameter`):** Mandatory positive numeric value ($> 0\text{ m}$).
* **Blast Hole Depth (`dbBlastDepth`):** Mandatory positive numeric value ($> 0\text{ m}$).
* **Number of Blast Holes (`dbHolesCount`):** Mandatory integer ($\ge 1$).
* **Explosive Type (`dbExplosiveType`):** Selected from master `BLASTING_EXPLOSIVE_TYPES`.
* **Mandatory Post-Checklist Rig Parameters (Blasting ONLY):**
  1. `How many rig holes had been loaded for blasting?`: Total holes loaded ($\ge 1$, stored in `draft.blastingRigHolesLoaded`).
  2. `What is the depth of the Rig Hole in feet?`: Depth of rig hole ($> 0$, stored in `draft.blastingRigHoleDepthFt` and `draft.blastingRigHoleDepthM`).
  3. `How many layers of mufflers are placed on top of rig holes?`: Protective muffler / blast mat layers ($\ge 1$, stored in `draft.blastingMufflerLayers`).
  4. `Specify Safe distance provided in between each rig holes ?`: Safe distance between rig holes (strictly numeric $> 0$, stored in `draft.blastingSafeDistance`).

##### 2. Drilling Technical Parameters
When `operationCategory === 'drilling'`, blast rig and muffler fields are suppressed, and the system validates:
* **Planned Drilling Date & Time (`dbDateTime`):** Mandatory timestamp; time must be $\le 20:30\text{ IST}$.
* **Drill Hole Diameter (`dbDrillDiameter`):** Mandatory positive numeric value ($> 0\text{ m}$).
* **Drill Hole Depth (`dbDrillDepth`):** Mandatory positive numeric value ($> 0\text{ m}$).
* **Number of Drill Holes (`dbHolesCount`):** Mandatory integer ($\ge 1$).
* **Drilling Machine Type (`dbMachineType`):** Selected from master `DRILLING_MACHINE_TYPES`.

##### 3. Master Option Registries

###### Explosive Types Registry (`BLASTING_EXPLOSIVE_TYPES` - 9 Options)
`Emulsion Explosives`, `ANFO (Ammonium Nitrate Fuel Oil)`, `Slurry / Water Gel Explosives`, `Cartridge Explosives (Slurry/Emulsion)`, `Cast Boosters`, `Electric Detonators (Instantaneous / Delay)`, `Non-Electric (Nonel) Shock Tube Detonators`, `Electronic Programmable Detonators`, `Others`.

###### Drilling Machine Types Registry (`DRILLING_MACHINE_TYPES` - 8 Options)
`Crawler Drilling Rig`, `DTH (Down-the-Hole) Rig`, `Rotary Blast Hole Drill`, `Top Hammer Drill Rig`, `Pneumatic Jackhammer & Air Compressor`, `Hydraulic Rock Drill`, `Handheld Rock Drill`, `Others`.

### 5.10 Statutory Safety Specifications & Dynamic Checklists: PTW-008 General Work

Permit-to-Work Form PTW-008 (`EHS_PTW_008`) governs all general and multi-discipline construction activities on site, including building envelope installations, mechanical shifting, hoisting equipment operations, and concrete formwork assemblies.

#### 1. Single-Choice Description of Work Hierarchy (14 Standard Options)
In Step 1 of the creation wizard, the applicant must select exactly one operational description of work from a curated 14-item single-choice dropdown categorized into 4 operational tiers:

| Tier / Category | Work Classification | Form Options (Exact Literals) | Dynamic Safety Checklist Tier |
|:---|:---|:---|:---|
| **Category A** | **Panel Erection** | 1. `Erection of Glass Panel`<br/>2. `Erection of Louvers`<br/>3. `Erection of Precast panel`<br/>4. `Erection of GRC panel` | **21 Items** (11 Common + 10 Panel-Specific)<br/>*Item 21 validates wind speed $\le 45\text{ km/h}$* |
| **Category B** | **Hoists & Rigging / Shifting** | 5. `Electric chain Hoist`<br/>6. `Winch`<br/>7. `Passenger Hoist`<br/>8. `Cradel/RSP`<br/>9. `Erection`<br/>10. `Shifting`<br/>11. `Dismantling` | **15 Items** (11 Common + 4 Hoist/Rigging)<br/>*Includes High-Contrast Wind Safety Warning Banner* |
| **Category C** | **Formwork Operations** | 12. `Formwork Erection(shuttering)`<br/>13. `Formwork Dismantling & De- shuttering` | **20 Items** (11 Common + 9 Formwork-Specific)<br/>*Includes High-Contrast Wind Safety Warning Banner* |
| **Category D** | **Custom / Other** | 14. `Other` | **11 Items** (11 Common Items Only)<br/>*Renders conditional mandatory custom text input (`draft.generalWorkOther`)* |

#### 2. Wind Safety Warning Banners ($\le 45\text{ km/h}$)
For high-elevation shifting, mechanized hoists, and external formwork (Categories B & C), strong winds present severe risks of sway, structural shear, and unguided swinging loads. Step 2 of the wizard dynamically displays a prominent amber warning banner at the top of the checklist:
> **⚠️ Wind Safety Caution**: Work shall be stopped if wind speed is more than 45KM/hr. All hoisting, cradles, and exposed formwork activities must cease immediately under high wind conditions.

#### 3. Complete Statutory Checklist Hierarchy

##### Tier 1: Common Safety Checklist (Always Present Across All General Work Permits — 11 Items)
1. Are job specific PPEs provided or as specified in Risk Assessment?
2. Are barricade and caution sign placed in work areas and watcher posted if required?
3. Are Safety nets provided to avoid falling objects while workers working at below levels.
4. Are Workers inducted & trained and competent to carry out the job?
5. Is Safe working condition / working platform available / provided?
6. Are safety measures in place to prevent falling tools / materials from height?
7. Are all tools attached with strings and in good conditions?
8. Is Supervisor / Foreman available to supervise the work.
9. Are all workers in possession of double lanyard Safety Harness while working at height?
10. Is Lifeline where required, provided as per standard?
11. Have the job-specific safety requirements been explained to all crews who will be involved in the activity?.

##### Tier 2: Dynamic Sub-Checklist A: Erection of Glass / Louvers / Precast / GRC Panels (10 Items)
12. Are all Lifting Equipment’s / Devices / Tackles used TPI certified and in good conditions?
13. Is Person operating the Crane /Hoist / Winch / Device trained and competent?
14. Is Proper communication system (two-way radio) available for Crane/Hoist / Winch operator.
15. Are all electrical tools & extension leads inspected and free from damages.
16. Are Sufficient crews available for intended job.
17. Is Permit taken for removal of edge protection, then necessary measures taken to prevent other workers entering the area?
18. Are Glass/Aluminium/precast/GRC panels inspected and free from any damage before erection?
19. Is visibility level for Erection in good condition to carry out the task?
20. Are all attachments in the panels in place and secured properly?
21. Work shall be stopped if wind speed is more than 45KM/hr.?

##### Tier 3: Dynamic Sub-Checklist B: Electric chain Hoist / Winch / Passenger Hoist / Cradel/RSP / Erection / Shifting / Dismantling (4 Items + Alert)
12. Are all Lifting equipment / Devices / Tackles used TPI certified and in good condition?
13. Are all electrical tools & extension leads inspected and free from defects?
14. Are Sufficient crews available for shifting / handling materials?
15. Are Permit Taken for removal of edge protection, then necessary measures will be taken to prevent others entering the area?
> **⚠️ Wind Safety Caution Banner**: Warning: Work shall be stopped if wind speed is more than 45KM/hr.

##### Tier 4: Dynamic Sub-Checklist C: Formwork Erection(shuttering) & Formwork Dismantling & De-shuttering (9 Items + Alert)
12. Are Formwork panel is assembled as per manufacturer instruction / approved drawing.
13. Is Lifting point / hook, free from any defects and fixed as per approved drawing by design dept..
14. Is entire formwork panel inspected and no loose materials / parts on the panel.
15. Is clear Access & Working platform available / provided?
16. Are area clean and materials stacked appropriately?
17. Are Area cordoned below to avoid unauthorize entry and caution signs placed?
18. Is Edge protection / guardrails as required provided?
19. Is Permanent slab edge protection provided / available in the floors?
20. Is approval from quality department taken for Deshuttering?
> **⚠️ Wind Safety Caution Banner**: Warning: Work shall be stopped if wind speed is more than 45KM/hr.

### 5.11 Statutory Safety Specifications, Sling Calculation Engine & Checklist: PTW-009A & PTW-009B Lifting Operations (14 Items)

Lifting operations represent one of the highest-risk critical engineering disciplines on high-rise and infrastructure construction projects. The system implements a comprehensive, dual-module statutory architecture enforcing **Form PTW-009A (Routine Lifting Operations)** and **Form PTW-009B (Critical Lift Plan / Non-Routine Lift)** through a unified initiation interface.

```mermaid
graph TD
    CAT["Catalog: PTW-009 Lifting Operations<br/>(Single Unified Card · Icon: fa-arrow-up-from-ground-water)"]
    INIT["Lifting Supervisor Initiates Form"]
    GATE{"Pre-Location Signatures Gate<br/>Crane Operator & Signaler/Rigger DPDP Sigs Captured?"}
    LOC["Location Mode Unlocked<br/>(Tower / Basement / Manual)"]
    SPECS["Enter Rigging Specs, Load Weight, Crane Capacity,<br/>Geometry (Length L & Height H), Worker Count"]
    EVAL{"Dynamic Classification Evaluator<br/>1. Weight over 5.0 MT?<br/>2. Tandem Lift = Yes?<br/>3. Sling Stress over 80 percent SWL (N=2 Clamped)?<br/>4. Any of 14 High-Risk Statutory Criteria = YES?"}
    ROUTINE["Classified as PTW-009A Routine Lifting<br/>(5-Stage Approval Spine: LS to SE to P&M to TI to EHS)"]
    CRITICAL["Auto-Promoted to PTW-009B Critical Lift Plan<br/>(6-Stage Approval Spine: LS to SE to P&M to TI to PMgr to EHS)"]

    CAT --> INIT --> GATE
    GATE -->|No| GATE_LOCK["Location Selection Strictly Locked & Disabled"]
    GATE -->|Yes| LOC --> SPECS --> EVAL
    EVAL -->|"All NO, Stress under 80 percent and Weight under 5 MT"| ROUTINE
    EVAL -->|"Any Condition Triggered"| CRITICAL
```

#### 1. Single Unified Tile Architecture in Catalog
In compliance with human-factors engineering and catalog clarity:
* Exactly **ONE card** is displayed on the permit creation catalog: **`PTW-009` Lifting Operations & Lift Plan** (`icon: fa-arrow-up-from-ground-water`).
* Form `PTW-009B` (`liftplan`) is strictly marked `hiddenFromGrid: true` to prevent catalog clutter or conflicting manual selection.
* The system begins with base form `lifting` (`PTW-009A`) and automatically evaluates inputs in real time, auto-promoting the draft to `critical` (`PTW-009B`) if statutory risk thresholds are exceeded.

#### 2. Pre-Location Signatures Gate
In Step 1 of the Creation Wizard, location selection (`Tower`, `Basement / Podium`, `Manual`) is strictly locked and disabled with an attention banner:
* **Operator Signature Requirement**: The Crane Operator must provide their full legal name, visual confirmation of crane fitness, and digital signature with DPDP Act 2023 consent via dedicated modal.
* **Signaler / Rigger Signature Requirement**: The certified Signaler / Rigger must provide their full legal name, rigging certification reference, and digital signature with DPDP consent via dedicated modal.
* **Hard Enforcement Gate**: Until **both** signatures are successfully validated and captured, the location selector buttons remain disabled, preventing incomplete permits from proceeding.

#### 3. Rigging Geometry & Sling Tension Calculation Engine
The system features an automated engineering calculation engine evaluating sling tension and safety factors:

$$\text{Tension per Sling Leg } (T) = \frac{W_{\text{total}} \times L}{H \times N} = \frac{W_{\text{total}}}{N \times \sin(\theta)}$$

$$\text{Stress Percentage} = \left( \frac{T}{\text{Sling SWL}} \right) \times 100\%$$

Where:
* $W_{\text{total}} = \text{Total Weight of Load (MT)} + \text{Weight of Rigging Hardware / Spreader Beam (MT)}$
* $L = \text{Sling Leg Length (meters)}$
* $H = \text{Vertical Height from Hook to Attachment Points (meters)}$
* $\theta = \text{Sling Angle from Horizontal} = \arcsin(H / L)$
* $N = \text{Effective Number of Load-Bearing Sling Legs}$

> [!IMPORTANT]
> **$N=2$ Safety Clamping Invariant (Statutory Rigging Rigor)**:
> In multi-leg bridle slings (3-leg or 4-leg configurations), center-of-gravity shifts and minor dimensional variances mean that statutorily only **two legs ($N=2$)** can be assumed to support the load evenly at any given moment. The system strictly clamps $N \le 2$ when calculating sling stress for non-rigid configurations. If calculated sling stress exceeds **80% of sling SWL**, the system flags an overstress warning and **automatically promotes the permit to PTW-009B Critical Lift Plan**.

#### 4. The 14 Statutory High-Risk Criteria (`LIFTING_LOAD_CHECKLIST_CRITERIA`)
If the user checks **YES** to any of the following 14 high-risk criteria during Step 1 load assessment, the permit is immediately promoted to `PTW-009B Critical Lift Plan`:

| # | Statutory High-Risk Condition | Promotion Rationale | Mandatory Engineering Control |
|:---:|:---|:---|:---|
| **1** | Weight of load $\ge 5.0\text{ MT}$ ($75\%$ or more of crane SWL at radius) | Heavy Lift threshold | Formal crane load-radius chart verification |
| **2** | Tandem lifting involving two or more cranes | Multi-crane load distribution hazard | Synchronized crane speeds & dedicated lift director |
| **3** | Lifting over operating process plant, live piping, or electrical substations | Catastrophic dropped-object consequence | Shutdown or positive impact deflection shields |
| **4** | Proximity to overhead high-voltage power lines ($< 10\text{ m}$ clearance) | Electrocution & arcing danger | Line de-energization or physical boom stops |
| **5** | Lifting personnel using crane-suspended man basket / work platform | Extreme fall & tip-over hazard | Secondary safety harness line to independent hook |
| **6** | Night-time lifting operations or restricted / adverse visibility | Reduced visual depth perception | Minimum 300 lux floodlighting & radio telemetry |
| **7** | Center of gravity (CoG) is offset, unknown, shifting, or submerged | Asymmetric sling tension & load tilt | Rigging engineer CoG calculation & trial lift |
| **8** | Blind lift where crane operator cannot see load or landing zone | Collision & crush hazard | Radio communication + relay signalers posted |
| **9** | Operation on barge, floating platform, or uncompacted / sloped soil | Crane outrigger tipping / soil shear | Hardwood bogie mats & geotech bearing capacity test |
| **10** | Precast concrete panel or heavy structural steel erection $\ge 30\text{ m}$ height | High-altitude aerodynamic load | Taglines with certified riggers & wind meters |
| **11** | Lifting load with large surface area ($> 20\text{ m}^2$) prone to wind sail | Aerodynamic slewing instability | Anemometer monitoring ($\le 38\text{ km/h}$ cutoff) |
| **12** | Complex rigging geometry with sling horizontal angle $< 45^\circ$ | Exponential sling tension amplification | Spreader beam mandatory to keep angle $\ge 60^\circ$ |
| **13** | Proximity to public roads, metro rail, or external occupied structures | Public domain dropped object hazard | Traffic police coordination & exclusion corridor |
| **14** | Heavy plant machinery, generator, transformer, or chiller positioning | Confined basement/roof installation | Floor structural slab load rating certification |

#### 5. Step 2 Statutory Safety Checklist (14 Items: `CHECKLIST_ITEMS_LIFTING`)
Form ID: `PTW-009A` / `PTW-009B` · Common Safety Points & Requirements evaluated via `CHECKLIST_ITEMS_LIFTING` phrased as actionable inspection questions:

| # | Statutory Inspection Question | Category | Required Response | Statutory Engineering Rationale |
|:---:|:---|:---|:---:|:---|
| **1** | Are outriggers fully extended on solid ground? (MC) | Ground Stability | **YES** / NO / NA | Prevents punch-through ground failure; ensures 100% outrigger extension. |
| **2** | Is the swivel hook in good condition with free rotation? | Equipment Health | **YES** / NO / NA | Prevents twist-induced sling failure and load tilting during hoisting. |
| **3** | Are heavy timber or steel plates used under outriggers on soft ground? (MC) | Ground Stability | **YES** / NO / NA | Distributes heavy point loads across adequate bearing area on uncompacted soil. |
| **4** | Is a safety latch provided on the hook and in good working condition? | Hook Safety | **YES** / NO / NA | Eliminates risk of accidental sling detachment or jump-out under dynamic loads. |
| **5** | Is the crane manufacturer manual and load chart available in the operator cabin? (TC/MC) | Documentation | **YES** / NO / NA | Ensures operator has immediate access to certified manufacturer rated capacities. |
| **6** | Are the hoist limit switch, anti-two-block, and warning bell in good working condition? | Safety Limits | **YES** / NO / NA | Prevents catastrophic contact between hook block and boom head; audible warning. |
| **7** | Are wire rope, webbing, and chain slings in good condition without cuts, kinks, or wear? | Rigging Tackle | **YES** / NO / NA | Eliminates rigging failure; verifies color-coded monthly inspection validity. |
| **8** | Is the windscreen of the crane operator cabin clean and clear? | Visual Clearance | **YES** / NO / NA | Ensures uninterrupted 360° sightlines of the load, signalman, and perimeter. |
| **9** | Has a valid Third Party Inspection (TPI / Form 10/Form 11) certificate been verified for TC/MC? | Compliance | **YES** / NO / NA | Mandatory statutory proof load testing and structural fitness under Indian Factories Act. |
| **10** | Have the crane operator and signalman been briefed thoroughly on the scope of work and safety precautions? | Workforce Briefing | **YES** / NO / NA | Pre-lift toolbox talk alignment on sling hitching, load path, and hand signals. |
| **11** | Are all safety limit switches (hoist, boom, trolley) in working condition? | Mechanical Limits | **YES** / NO / NA | Verifies physical cut-off limiters for slewing, trolleying, and luffing motions. |
| **12** | Has the crane operator's statutory heavy equipment driving license / competency card been verified? | Competency | **YES** / NO / NA | Validates statutory driver's license with heavy commercial endorsement and TPI badge. |
| **13** | Does the lifting equipment have sufficient rated SWL capacity for the planned lift radius? | Capacity Verification | **YES** / NO / NA | Verifies operating radius against manufacturer derating load chart. |
| **14** | Is the signalman / rigger provided with a dedicated two-way radio (walkie-talkie)? | Telemetry & Comms | **YES** / NO / NA | Dedicated interference-free channel assigned for blind lifts and long distances. |

> **⚠️ Statutory Wind Safety Restriction Rules**:
> * **Mobile Cranes**: Hard statutory operational cutoff at **$38\text{ km/h}$ ($10.5\text{ m/s}$)**.
> * **Tower Cranes**: Hard statutory operational cutoff at **$45\text{ km/h}$ ($12.5\text{ m/s}$)**.
> * Step 2 dynamically renders prominent warning alerts reminding supervisors to halt operations when winds exceed these thresholds.
>
> **Other Safety Precautions Textarea**:
> Step 2 provides a mandatory custom engineering precautions field (`Other Safety Precautions:`) bound directly to `draft.liftingSpecialPrecautions` for recording non-standard site hazards.

#### 5.1 Sub-Table 2: Documentation & On-Site Controls (Part A vs Part B Matrix)
Sub-Table 2 dynamically switches documentation controls based on whether the lift is classified as Routine (`PTW-009A`) or Critical (`PTW-009B`):
* **Part A (Routine Lifts — 10 Items)**:
  1. P&M Green Card Sticker
  2. Equipment & Accessories Inspection (Color coding, TPI certifications)
  3. EHS Risk Assessment & SWM
  4. Lift Plan/ Method Statement (Generic)
  5. Lift Permit
  6. HIRA verification & Briefing to workforce
  7. Auro Crane & Lifting Safety Management Standard
  8. Crane Operator
  9. Signaler / Rigger
  10. Lifting In-charge / Supervisor
* **Part B (Complex / Critical / Heavy Lifts — 13 Items)**:
  1. Complex/ Critical/ Heavy/ Lifts Design Calculations & drawings
  2. P&M Green Card Sticker
  3. Equipment & Accessories Inspection (Color coding, TPI Certifications)
  4. EHS Risk Assessment & SWM
  5. Lift Plan/ Method Statement (Specific)
  6. Lift Permit
  7. Pre-start verification & Briefing to workforce
  8. Auro Crane & Lifting Safety Management Standard
  9. Crane Operator
  10. Signaler / Rigger
  11. Lifting In-charge / Supervisor
  12. EHS Supervisor
  13. Design Representative (for first 2 lifts)
* **In-Place Interactive Checkbox Behavior**: Each document item renders with an interactive toggle badge (`[✓] YES` in green when checked, `NO` in neutral grey when unchecked), persisting state changes without triggering full form DOM rebuilds or scroll displacement.

#### 6. Statutory Extension Pipeline
* **Requestor**: Exclusively initiated by the **Lifting Supervisor** (`lift-supervisor`).
* **Approval Flow**: `Tower Incharge` (`hw-section-head`) $\to$ `EHS Safety` (`ehs-manager` / `ehs-officer`).
* **Temporal Ceiling**: Strict 20:30 IST maximum validity (`EXT_MAX_CEILING_MIN = 1230`), evaluated in 10-minute steps.

#### 7. Exclusive Closure & Demobilization Surrender Gate
Permits cannot be surrendered by general site engineers. Closure is restricted exclusively to the certified **Lifting Supervisor** upon confirming the **Mandatory Lifting Demobilization & Safety Declaration**:
1. Crane boomed down, secured in weather-vane parking configuration, outriggers retracted and locked.
2. All lifting gear, wire ropes, slings, shackles, and spreader beams inspected, de-rigged, and stored in dry tackle store.
3. Drop zone barricades, swing warning signs, and traffic diversions safely removed and area restored.
4. Zero structural damage to lifted components, rigging hardware, or adjacent permanent works.
5. Mandatory photographic evidence of de-rigged site and DPDP digital signature.

---

### 5.12 Statutory Safety Specifications, Qualification Gating & Checklist: PTW-010 Night Shift (13 Items)

> [!IMPORTANT]
> **Dual-Phase Governance & Night Work Invariants**:
> 1. **Day Phase (5:00 PM – 6:30 PM)**: Initiated by Site Supervisor (`site-supervisor`, Permittee · Day). Fills PTW-010 master data, contractor/subcontractor status, authorized activity dropdown, 13 checklist points, digital signature. Site photo upload is **statutorily deferred** to the 8:30 PM physical handover. Acknowledged by Site Engineer and approved by Tower Incharge / Section Head. Advances to `Night Shift Approved – Awaiting Linked Permit`.
> 2. **Sequential Linked Activity Permit**: Only upon Tower Incharge approval does the linked activity permit form unlock. Initiated by Site Supervisor, routes through its daytime domain approval spine. Only when both daytime approval chains complete do both permits advance to `Approved – Pending Night Handover`.
> 3. **Strict Statutory Prohibitions**:
>    - `PTW-004 Confined Space Entry`: Strictly PROHIBITED at night.
>    - `PTW-007 Drilling & Blasting`: Strictly PROHIBITED at night.
>    - `PTW-009B Critical Lift Plan`: Strictly EXCLUDED (loads > 5 MT, tandem lifts, high-risk criteria); only `PTW-009A Routine Lifting` is allowed.
> 4. **8:30 PM Handover Gate & Qualification Engine**:
>    - Transferred on-site to incoming Night Site Supervisor (`night-supervisor`).
>    - **Qualification Validation Gate**: Incoming supervisor must be PM-authorized AND possess valid PTW training completed within the last 365 days.
>    - **21:00 IST Cutoff Engine**: If no qualified night supervisor is assigned and accepted by 21:00 IST, the permit automatically aborts with terminal `Cancelled` status.
>    - **Mandatory Dual Site Photos**: Mandatory capture of both Workplace Illumination photo and Linked Permit Activity Setup photo.
> 5. **Step 5 P&M Night Shift Acknowledgment**: P&M Engineer verifies lighting towers (lux levels > 150 lux), diesel generators, cable elevation, and machinery fitness.
> 6. **Step 6 EHS Verification & Strict Rejection Isolation**: EHS Officer / Manager verifies photos and checklist points. Approval activates both permits (`Active`). Rejection routes strictly back to Night Site Supervisor (`Returned to Night Supervisor`), completely isolating day approvers.
> 7. **Exclusive Night Closure & Surrender**: Closure restricted strictly to Night Site Supervisor with mandatory De-energization and Illumination Shutdown Declaration.

#### 1. 13 Statutory Safety Checklist Items (`NIGHTSHIFT_CHECKLIST_ITEMS`)

| # | Statutory Inspection Item | Category | Verification Requirement |
|:---:|:---|:---|:---|
| 1 | Work area lighting (minimum 150 lux for general work, 300 lux for precise tasks) | Illumination | Adequate lighting tower positioning, lux levels measured across working floor and corridors. |
| 2 | Emergency lighting / backup generator available and tested | Power & DG | DG set auto-changeover tested; standby generator fueled and operational. |
| 3 | Access and egress routes clearly illuminated and free of tripping hazards | Access Safety | Walkways, stairwells, and ladders lit with temporary festoon lighting and cleared of obstructions. |
| 4 | First aid post manned / First Aider identified and available on shift | Medical Safety | Dedicated trained first-aider on-site with stocked first aid kit and ambulance tie-up. |
| 5 | Emergency vehicle / ambulance on standby with driver available on site | Emergency | Dedicated emergency vehicle present with driver on site throughout the shift. |
| 6 | Drinking water and welfare facilities accessible during night shift | Welfare | Potable drinking water dispensers, illuminated rest shelter, and clean sanitation facilities open. |
| 7 | Night shift supervisor(s) nominated, trained, and present on site | Supervision | PM-authorized night supervisor physically present on site with valid training certificate. |
| 8 | Communication system operable (walkie-talkies, mobile network tested) | Communication | Two-way UHF/VHF radio sets functional with dedicated safety channel and full battery charge. |
| 9 | High-visibility PPE (reflective jackets/vests) mandatory for all night workers | PPE Compliance | Class 3 reflective vests and retro-reflective helmet stickers verified on 100% of workforce. |
| 10 | Security guards deployed at all active entry/exit gates | Site Security | Static guards stationed at active gates; unauthorized perimeter movement restricted. |
| 11 | Power cables elevated / protected against water, vehicular movement | Electrical Safety | Cables strung on insulated stands (> 2.5m elevation) with 30mA ELCB/RCCB tripping protection. |
| 12 | Fire-fighting equipment (extinguishers, sand buckets) inspected & accessible | Fire Safety | Fire extinguishers positioned at 15m intervals with valid inspection tags and illuminated markers. |
| 13 | Worker fitness / fatigue check completed — no workers on double shift | Occupational Health | Zero double shifts; fatigue screening conducted; all workers logged and verified fit. |

#### 2. Authorized Night Shift Activity Descriptions (`NIGHT_WORK_DESCRIPTIONS`)
* Excavation Work (PTW-001) — Trenching and spoil haulage outside active structural tower footprint.
* Hot Work (PTW-002) — Rebar welding, structural tacking, and steel fabrication with dedicated fire watch.
* Guard Rail Removal (PTW-003) — Temporary edge protection removal for material intake with 100% tie-off.
* Shaft Work (PTW-005) — Lift shaft bracket installation and internal riser MEP piping with staging.
* Electrical Work (HT/LT) (PTW-006) — Substation switchgear cabling and lighting circuit maintenance.
* General Work (PTW-008) — Structural concrete pouring, screeding, and curing operations.
* Routine Lifting Operations (PTW-009A) — Precast component and rebar bundle hoisting (strictly <= 5.0 MT).

#### 3. Master Night Supervisor Registry (`NIGHT_SUPERVISORS`)
* **Venkatesh Rao** (`venkatesh_rao`): Authorized (`pmAuthorised: true`), Training valid (`trainingDays: 45 < 365`). Gating: **Eligible**.
* **Ramesh Naidu** (`ramesh_naidu`): Authorized (`pmAuthorised: true`), Training valid (`trainingDays: 120 < 365`). Gating: **Eligible**.
* **Kishore Varma** (`kishore_varma`): Not authorized (`pmAuthorised: false`). Gating: **Disqualified**.
* **Anand Kumar** (`anand_kumar`): Authorized (`pmAuthorised: true`), Training expired (`trainingDays: 410 > 365`). Gating: **Disqualified**.

---

### 5.13 Universal Initiator Architecture & Role-Based Form Activation Matrix

The system implements a **declarative, role-based form accessibility matrix** that dynamically determines permit eligibility based on the authenticated persona:

```mermaid
graph TD
    INIT{"Logged-in Persona"} -->|"Role: Electrician"| E_FLOW["Active: PTW-006 Electrical Work Only<br/>Inactive: All Other 10 Modules (PTW-001 to 05, PTW-007 to PTW-010)"]
    INIT -->|"Role: Blasting In-charge"| B_FLOW["Active: PTW-007 Drilling & Blasting Only<br/>Inactive: All Other 10 Modules (PTW-001 to 06, PTW-008 to PTW-010)"]
    INIT -->|"Role: Lifting Supervisor"| LS_FLOW["Active: PTW-009 Lifting Operations & Lift Plan<br/>Inactive: All Other Modules (PTW-001 to PTW-008, PTW-010)"]
    INIT -->|"Role: Site Supervisor"| S_FLOW["Active: PTW-001 to 05, PTW-008 (Civil, Structural and General)<br/>Inactive: PTW-006 (Electrician), PTW-007 (Blasting), PTW-009 (Lifting)"]
    INIT -->|"Role: Approver or Admin"| NON_INIT["Permit Initiation Strictly Disabled<br/>(Approver / Auditor / Admin Mode)"]
```

#### 1. Centralized Form Activation Matrix

| Initiator Role | Authorized Operational Module(s) | Locked / Disabled Module(s) | Visual State & Restriction Behavior |
|:---|:---|:---|:---|
| **Electrician** (`electrician`) | **PTW-006 Electrical Work (HT/LT)** *(Form PTW-006)* | **All other forms**:<br/>PTW-001–05, PTW-007–09B, PTW-010 | **Active:** Full color, glowing accent, live status badge (`Available to Initiate`), clickable.<br/>**Inactive:** Dimmed (48% opacity), desaturated grayscale (70%), `cursor: not-allowed`, lock badge (`Restricted to Specialist Role`). Clicking triggers informative restriction toast. |
| **Blasting In-charge** (`blasting-incharge`) | **PTW-007 Drilling & Blasting** *(Form PTW-007)* | **All other forms strictly inactive**:<br/>PTW-001–06, PTW-008–09B, PTW-010 | Strictly inactive. Desaturated, non-clickable, with lock badge. Attempting to select triggers role restriction toast. Programmatic bypass blocked by hard runtime validation gate. |
| **Lifting Supervisor** (`lift-supervisor`) | **PTW-009 Lifting Operations & Critical Lift Plan** *(Forms PTW-009A & PTW-009B)* | **All other forms strictly inactive**:<br/>PTW-001–08, PTW-010 | Full color, glowing accent for PTW-009. Evaluates load weight and rigging geometry to route to routine or critical lift plan. Pre-location signature gate enforced. |
| **Site Supervisor** (`site-supervisor`) | **PTW-001 Excavation**<br/>**PTW-002 Hot Work**<br/>**PTW-003 Guard Rail**<br/>**PTW-004 Confined Space**<br/>**PTW-005 Shaft Work**<br/>**PTW-008 General Work** | **PTW-006 Electrical Work** *(Restricted to Electrician)*<br/>**PTW-007 Drilling & Blasting** *(Restricted to Blasting In-charge)*<br/>**PTW-009A/B Lifting** *(Restricted to Lifting Supervisor)*<br/>**PTW-010 Night Shift** | Specialist cards (PTW-006 Electrical, PTW-007 Drilling/Blasting, PTW-009 Lifting) are desaturated with lock badges. Site supervisor initiation access is completely removed for specialist works. Hard gate prevents creation. |

#### 2. Work-Specific Extension Rules Across Permit Work Types
* **PTW-001 to PTW-005 & PTW-008 (Civil, Structural & General Works):**
  - Standard extension window up to 20:30 IST.
  - Sequential approval: `Site Engineer` $\to$ `Tower Incharge / Section Head` $\to$ `EHS Manager / Officer`.
* **PTW-006 Electrical Work (HT/LT):**
  - Extensions require rigorous technical evaluation of electrical shutdown impact.
  - **Batching Plant Flow:** `P&M Engineer` $\to$ `Quality Engineer` $\to$ `EHS Safety`.
  - **Site Flow:** `Site Engineer` $\to$ `Tower Incharge` $\to$ `EHS Safety`.
* **PTW-007 Drilling & Blasting:**
  - **Strict Statutory Exclusion:** Extension requests are **completely disabled** for PTW-007 Blasting (`extensionDisabled: true`).
  - **Statutory Enforcement:** If blasting cannot be completed within the scheduled window, the permit must be safely closed/surrendered, and a fresh PTW-007 permit initiated.
* **PTW-009A & PTW-009B Lifting Operations:**
  - Extension request initiated exclusively by `Lifting Supervisor`.
  - Sequential review: `Tower Incharge` $\to$ `EHS Safety`.
  - Maximum validity ceiling: 20:30 IST.

#### 3. Operational Lifecycle Scoping per Initiator
* **Independent Draft Isolation:** Drafts created by each initiator role are isolated in their respective dashboards (`mine.filter(p => p.status === 'Draft')`).
* **Correction Routing:**
  - Rejected PTW-006 permits return specifically to the `electrician`.
  - Rejected PTW-007 permits return specifically to the `blasting-incharge`.
  - Rejected PTW-009A/B permits return specifically to the `lift-supervisor`.
  - Rejected PTW-001 through PTW-005, and PTW-008 permits return specifically to the `site-supervisor`.
* **Exclusive Surrender Authority:**
  - PTW-006 surrender is strictly restricted to `electrician` with mandatory LOTO removal declaration and photo.
  - PTW-007 surrender is strictly restricted to `blasting-incharge` with mandatory post-blast clearance declaration and photo.
  - PTW-009A/B surrender is strictly restricted to `lift-supervisor` with mandatory demobilization declaration and photo.
  - PTW-001 to PTW-005, and PTW-008 surrender is gated to `site-supervisor` with site restoration and certified Housekeeping & Area Clearance declaration.

### 5.13 Enterprise Project Master Data & Worksite Registry (`PROJECTS`)

In `index.html`, enterprise project sites are registered with exact coordinates, operational perimeters, tower configurations, and administrative lock statuses:

| Project ID | Project Name | Structural Tower / Zone Configuration | Site Center GPS ($Lat, Lng$) | Radius ($r$) | Administrative Status & Governance Scoping |
|:---|:---|:---|:---:|:---:|:---|
| **`PRJ-PEARL`** | **The Pearl** | `P1`, `P2`, `P3`, `P4`, `P5`, `P6`, `P7`, `Clubhouse`, `Podium`, `NTA_PHASE-1`, `NTA_PHASE-2`, `NTA_PHASE-3` | `17.4125° N, 78.3984° E` (Hitec City, Hyderabad) | $200\text{ m}$ | **Active Production Mega-Site:** Governed by Project Admin; permits, checklists, and geofencing calibrated. |
| **`PRJ-REGENT`** | **The Regent** | `Tower 4`, `Tower 5`, `NTA`, `Stores`, `FormWork`, `Precast`, `Phase-1` | `17.4371° N, 78.3612° E` (Financial District, Hyderabad) | $200\text{ m}$ | **Active Production Mega-Site:** Governed by Project Admin; high-rise structural tower zone mapping. |
| **`PRJ-SANSA`** | **Sansa County** | `Sector 1 - Zone 1 & 2`, `Sector 1 - Zone 03`, `Sector 1 - Zone 04`, `Podium Deck` | `17.4892° N, 78.3144° E` (Miyapur, Hyderabad) | $250\text{ m}$ | **Active Production Mega-Site:** Governed by Project Admin; expansive multi-zone civil development perimeter. |

> [!NOTE]
> **Authoritative Tower Registry (`AUTHORITATIVE_PROJECT_TOWERS` & `config.projects.json`)**:
> Tower configurations are single-source-of-truth constants preventing arbitrary text entry. Personnel empanelment and permit creation are strictly validated against these authoritative project tower manifests.

### 5.14 Master Constants & Configuration Registries

* **Atmospheric & Weather Options (`WEATHER_OPTIONS`):** `Sunny`, `Partly Cloudy`, `Overcast`, `Windy`, `Light Rain`, `Hazy`.
* **Excavation Equipment Master Registry (`EQUIPMENT_OPTIONS`):** `Excavator`, `JCB`, `Hydra`, `Poclain`, `Manual Excavation`, `Crane`, `Others`.
* **Lifting Equipment Types (`LIFTING_EQUIPMENT_TYPES`):** `Tower Crane`, `Mobile / Crawler Crane`, `Hydra Crane`, `Passenger / Material Hoist`, `Gantry Crane`, `Electric Chain Hoist / Winch`, `Derrick Crane`, `Other Lifting Machinery`.
* **Lifting Gear Types (`LIFTING_GEAR_TYPES`):** `Wire Rope Slings`, `Synthetic Webbing Slings`, `Chain Slings / Bridles`, `Bow / 'D' Shackles`, `Spreader / Lifting Beam`, `Lifting Eye Bolts / Swivels`, `Chain Pulley Blocks / Lever Hoists`, `Plate Clamps / Pipe Lifters`.
* **Lifting High-Risk Promotion Criteria (`LIFTING_LOAD_CHECKLIST_CRITERIA`):** 14 statutory high-risk criteria triggering auto-promotion to Critical Lift Plan (PTW-009B).
* **Lifting Mandatory Document Attachments (`LIFTING_DOCS_ROUTINE` & `LIFTING_DOCS_CRITICAL`):** Crane TPI Certificate, Rigging Tackle TPI Certificate, Operator Competency Card, Rigging / Lift Plan drawing, Ground Stability Report.
* **Statutory Lifting Checklist Items (`CHECKLIST_ITEMS_LIFTING`):** 14 comprehensive statutory inspection points for routine and critical lift operations.
* **Basement & Podium Structural Sub-Registry (`BASEMENT_PODIUM_OPTIONS`):** `Basement 3 (B3)`, `Basement 2 (B2)`, `Basement 1 (B1)`, `Ground Floor (GF)`, `Podium Level 1 (P1)`, `Podium Level 2 (P2)`, `Podium Level 3 (P3)`.
* **Working Hours Bounds:**
  - Standard work window: `OFFICE_START_MIN = 510` ($08:30\text{ IST}$) to `OFFICE_END_MIN = 1170` ($19:30\text{ IST}$).
  - Start time latest scheduling cutoff: `START_LATEST_MIN = 1110` ($18:30\text{ IST}$).
  - Extension request operational cutoff: `EXT_REQUEST_CUTOFF_MIN = 1110` ($18:30\text{ IST}$).
  - Maximum extended validity ceiling: `EXT_MAX_CEILING_MIN = 1230` ($20:30\text{ IST}$).
  - Time increment step: `EXTENSION_STEP_MIN = 10` minutes.

### 5.15 Location Selection Mode & Safety Restriction Matrix

Restricting location options based on the permit type is an essential construction safety best practice. It prevents user error, keeps data clean for statutory audits, and ensures high-risk work is pinpointed precisely where it occurs.

In the Step 1 Creation Wizard, users select from:
`Location Selection Mode (Select either Tower or Basement/Podium or Manual)`

#### Location Mapping Matrix

| Permit Type | Tower & Floor | Basement / Podium | Manual | Default Mode |
|---|:---:|:---:|:---:|:---:|
| **Excavation Work (PTW-001)** | ❌ **Restricted** | ✅ **Enabled** | ✅ **Enabled** | **Basement / Podium** |
| **Hot Work (PTW-002)** | ✅ **Enabled** | ✅ **Enabled** | ✅ **Enabled** | **Tower** |
| **Guardrail / Edge Protection (PTW-003)** | ✅ **Enabled** | ✅ **Enabled** | ❌ **Restricted** | **Tower** |
| **Confined Space (PTW-004)** | ✅ **Enabled** | ✅ **Enabled** | ✅ **Enabled** | **Tower** |
| **Shaft Work (PTW-005)** | ✅ **Enabled** | ✅ **Enabled** | ❌ **Restricted** | **Tower** |
| **Electrical Work - Batching Plant (PTW-006)** | ❌ **Restricted** | ❌ **Restricted** | ✅ **Enabled** | **Manual** |
| **Electrical Work - Site (PTW-006)** | ✅ **Enabled** | ✅ **Enabled** | ✅ **Enabled** | **Tower** |
| **Drilling & Blasting (PTW-007)** | ❌ **Restricted** | ❌ **Restricted** | ✅ **Enabled** | **Manual** |
| **General Work (PTW-008)** | ✅ **Enabled** | ✅ **Enabled** | ✅ **Enabled** | **Tower** |
| **Lifting Operations & Lift Plan (PTW-009A/B)** | ✅ **Enabled** | ✅ **Enabled** | ✅ **Enabled** | **Tower** *(Strictly locked until pre-location signatures captured)* |
| **Night Shift Work (PTW-010)** | ✅ **Enabled** | ✅ **Enabled** | ✅ **Enabled** | **Tower** |

#### Why this mapping works (The Technical & Safety Logic)

1. **Excavation Work (PTW-001)**
   * **Restrict: Tower & Floor.** Excavation cannot occur on suspended slabs. Restricting this prevents absurd data entries (e.g., *"Excavating on Tower A, Floor 12"*).
   * **Enable: Basement / Podium & Manual.** Excavation takes place for deep foundations (basements) or outside the building footprint for utility trenches, boundary walls, and perimeter landscaping (where the **Manual** option becomes essential).

2. **Hot Work (PTW-002 - Welding, Cutting, Grinding)**
   * **Enable All.** Hot work occurs across the entire site — on elevated tower slabs (e.g., structural steel welding on Floor 15), in basement parking levels, and in temporary external fabrication yards or laydown zones (Manual).

3. **Guardrail or Floor Protection Removal (PTW-003)**
   * **Restrict: Manual.** Removing edge protection creates an immediate, fatal fall hazard. Safety managers need to know *exactly* which floor and zone has an exposed edge so they can barricade the area below or halt overlapping work. A manual text entry like *"near the edge"* is unacceptable for safety tracking.
   * **Enable: Tower & Basement.** Enforces exact structural grid and floor level selection so the hazard is tied to a specific architectural coordinate.

4. **Confined Space Entry (PTW-004)**
   * **Enable All.** Confined spaces are distributed across all site domains:
     * *Basement:* Lift pits, underground water sumps, Sewage Treatment Plant (STP) tanks.
     * *Tower:* Overhead water tanks on roofs, tight mechanical ducts.
     * *Manual:* External manholes, deep drainage inspection chambers, or temporary silos outside building footprints.

5. **Shaft Work (PTW-005)**
   * **Restrict: Manual.** Similar to edge protection, shafts (lift shafts, MEP vertical cutouts) are highly specific, high-risk structural voids. Working inside them creates extreme fall and dropped-object hazards. Manual free-text entry is too vague.
   * **Enable: Tower & Basement.** Shafts run vertically through the building, starting from the basement foundation levels and ascending through the towers.

6. **Electrical Work (PTW-006 - Batching Plant vs Site)**
   * **Batching Plant Scope:** Concrete batching plants operate as standalone external industrial installations with heavy motor control centers (MCC), aggregates bins, conveyors, and silo distribution panels located outside standard building structures. Selecting Tower or Basement/Podium is physically invalid. Location mode is strictly locked to **Manual Only** (`Manual Location Only`).
   * **Site Scope:** High-voltage (HT) and low-voltage (LT) installations, transformer yards, riser busducts, tap-off boxes, and main distribution panels span across elevated tower floors, basement sub-stations, and external yard substations. All three location modes are fully enabled.

7. **Drilling & Blasting (PTW-007)**
   * **Restrict: Tower & Basement / Podium.** Drilling and blasting operations involve energetic chemical explosives and heavy rock drilling rigs that can only occur on open ground rock formations. Structural slabs, towers, and basements cannot withstand dynamic shock waves, seismic vibrations, and rock fragmentation.
   * **Enable: Manual Only.** Pinpoints the exact open-pit blast zone, quarry face, or rock trench coordinates using explicit manual chainage and area descriptors (`locManual` and `locManualArea`). Tower and Basement/Podium mode radio buttons are strictly locked with descriptive statutory safety tooltips.

8. **General Work (PTW-008)**
   * **Enable All.** General works span panel erection on elevated tower slabs (Category A), material hoisting and equipment rigging across open yards and towers (Category B), heavy formwork in basements and substructures (Category C), and miscellaneous fabrication in exterior laydown areas (Category D). All three structural location modes are fully supported with Tower as the default mode.

9. **Night Shift Work (PTW-010)**
   * **Enable All.** Night operations may occur across towers (slab finishing, MEP installation), basements (substation cabling, pump room commissioning), or exterior laydown areas (trench work, steel yard fabrication). All three structural location modes are enabled, defaulting to Tower. Physical handover at 8:30 PM verifies exact location coordinates with GPS geofencing.

---

## 6. Core Workflow: Permit Lifecycle State Machine

The system enforces a **mathematically strict Finite State Machine (FSM)**. Every state transition requires specific role authorizations, validation checks, and immutable timestamped audit logging.

### 6.1 Complete State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft : Wizard Form Fill (Supervisor / Electrician / Blasting In-charge)
    Draft --> PendingSE : submitPermit() (PTW-001–05, PTW-006 Site, PTW-007, PTW-008)
    Draft --> PendingPMAck : submitPermit() (PTW-006 Batching Plant)
    
    %% Batching Plant Flow (PTW-006 BP)
    PendingPMAck --> PendingQE : PM Acknowledges + Statutory Decl
    PendingPMAck --> ReturnedForCorrection : PM Rejects
    PendingQE --> PendingEHS : Quality Engineer Clears (Megohm Test)
    PendingQE --> ReturnedForCorrection : QE Rejects

    %% Site Engineer Stage
    PendingSE --> ReturnedForCorrection : SE Rejects + Comment
    PendingSE --> PendingParallel : SE Acknowledges (PTW-001 Excavation)
    PendingSE --> PendingMEP : SE Acknowledges (PTW-005 Shaft Work)
    PendingSE --> PendingMEP_PM : SE Acknowledges (PTW-006 Site Flow)
    PendingSE --> PendingEHS : SE Acknowledges (PTW-007 Direct Bypass to EHS)
    PendingSE --> PendingSH : SE Acknowledges (PTW-002, PTW-003, PTW-004, PTW-008)

    %% Parallel Gate (PTW-001)
    PendingParallel --> PendingSH : All 3 Approved (MEP + P&M + IT)
    PendingParallel --> ReturnedForCorrection : Any Parallel Rejects (Unchanged sections retained)

    %% Dedicated MEP Gate (PTW-005)
    PendingMEP --> PendingSH : MEP Clears
    PendingMEP --> ReturnedForCorrection : MEP Rejects

    %% Either/Or Domain Gate (PTW-006 Site Flow)
    PendingMEP_PM --> PendingSH : MEP or PM Approves (Either/Or Gate)
    PendingMEP_PM --> ReturnedForCorrection : Domain Approver Rejects

    %% Section Head Stage
    PendingSH --> PendingEHS : Section Head Approves (Excavation Head / Tower Incharge)
    PendingSH --> ReturnedForCorrection : Section Head Rejects
    PendingSH --> Cancelled : Section Head Cancels (Terminal + PDF)

    %% EHS Stage (First-Wins Gate: EHS Manager or Officer)
    PendingEHS --> Active : EHS Endorses (Manager OR Officer)
    PendingEHS --> ReturnedForCorrection : EHS Rejects
    PendingEHS --> Cancelled : EHS Cancels (Terminal + PDF)

    %% Correction Loop
    ReturnedForCorrection --> PendingSEReAck : Permittee Resubmits (Locked fields protected)
    PendingSEReAck --> PendingSH : SE Re-Acknowledges (Fast-tracks to original rejector)
    PendingSEReAck --> PendingEHS : SE Re-Acknowledges (Fast-tracks to EHS if EHS rejected)

    %% Active State & Post-Activation Workflows
    Active --> ObservationOpen : EHS Raises Observation (Stop-work / Deviation)
    Active --> Expired : Auto-Expiry (ValidTill exceeded)
    Active --> Closed : Surrender (Mandatory discipline declaration + photo + GPS)
```

### 6.2 Master Operational State Dictionary (All 27 Active States)

The table below enumerates all states implemented across the core permit lifecycle and sub-workflows in `index.html`:

| State Name | Scope / Module | Authorized Roles | Invalidation / Reversal Impact | Description |
|:---|:---|:---|:---|:---|
| `Draft` | Wizard Form | Permittee (Supervisor, Electrician, Blasting In-charge) | Form can be edited or deleted | Initial in-memory draft before formal submission |
| `Pending Site Engineer Acknowledgment` | Initial Spine | Site Engineer | Rejection returns to Draft with reason | On-site physical conditions verification stage (no closure option) |
| `Pending P&M Acknowledgment` | PTW-006 Batching Plant | P&M Engineer | Rejection returns to Electrician | Plant machinery isolation & LOTO placement verification |
| `Pending Quality Engineer Approval` | PTW-006 Batching Plant | Quality Engineer | Rejection returns to Electrician | Insulation resistance testing & electrical clearance certification |
| `Pending Parallel Approval` | PTW-001 Excavation | MEP, P&M, IT Engineers | Rejection returns form; unchanged approvals persist | 3-way concurrent gate; all 3 disciplines must clear |
| `Pending MEP Clearance` | PTW-005 Shaft Work | MEP Engineer | Rejection returns to Supervisor | Single domain clearance for duct risers & piping |
| `Pending MEP or P&M Approval` | PTW-006 Site Flow | MEP or P&M Engineer | Rejection returns to Electrician | Either/or domain clearance gate for civil site electrical work |
| `Pending Section Head` | Approving Authority | Excavation Head (PTW-001) / Tower Incharge (PTW-002–05, PTW-006 Site, PTW-008) | Can Approve, Reject, or Cancel | Holistic site safety & contractor coordination review |
| `Pending EHS Approval` | Final Endorsement | EHS Manager, EHS Officer | First-wins gate; whichever acts first locks the other | Statutory safety verification of photos, gas logs & checklists |
| `Active` | Operational Site | All Stakeholders | Normal work underway; validity countdown active | Work authorized; permits can be extended, closed, or observed |
| `Active – Observation Open` | Safety Deviation | EHS (Owner) | **Blocks Extension and Closure requests** | Work paused due to minor or major safety non-compliance |
| `Observation Pending Site Engineer Acknowledgment` | Observation Sub-flow | Site Engineer | Rejection loops back to Permittee | Permittee submitted evidence; Engineer verifying on-site |
| `Observation Pending Section Head Review` | Observation Sub-flow | Excavation Head (PTW-001) / Tower Incharge (PTW-002–05, 006, 008) | Can endorse or reject rectification | Approving authority verifies rectification efficacy |
| `Observation Pending EHS Clearance` | Observation Sub-flow | EHS Manager / Officer | Can clear (to `Active`) or cancel (to `Cancelled`) | Final safety clearance of physical rectification evidence |
| `Pending Site Engineer` | Extension Sub-flow | Site Engineer | Can approve or cancel | Extension request on-site physical validity verification |
| `Pending Section Head` | Extension Sub-flow | Excavation Head (PTW-001) / Tower Incharge (PTW-002–05, 006, 008) | Can approve or cancel | Approving authority review of extended hours request |
| `Pending EHS Approval` | Extension Sub-flow | EHS Manager / Officer | Can approve (extends `validTill`) or cancel | Final statutory extension authorization (capped at 20:30 IST) |
| `Returned for Correction` | Rejection Loop | Permittee (Supervisor / Electrician / Blasting In-charge) | Unchanged sections remain approved (Stale-Approval Rule) | Approver rejected permit; editable fields unlocked for revision |
| `Expired` | Time Enforcement | System Engine / Permittee | Requires immediate closure & surrender | Permit validity timestamp (`validTill`) exceeded |
| `Closed – Pending Surrender` | Intermediate Suspension | Permittee / System | Permit suspended awaiting formal closure signoff | Work completed on-site; awaiting digital surrender & restoration declaration |
| `Completed (Surrendered)` | Terminal Archive | Exclusive Permittee (Supervisor for PTW-001–05, 008; Electrician for PTW-006; Blasting In-charge for PTW-007; Lifting Supervisor for PTW-009A/B; Night Supervisor for PTW-010) | Permanent record; triggers Statutory PDF generation | Work complete, site surrendered, mandatory restoration declarations & photos attached |
| `Cancelled` | Emergency Stop | Any Authority / System | Permanent terminal deadlock; cannot be resubmitted | Permittee must raise brand new permit from scratch |

---

## 7. Approval Chain Architecture

The approval chain is governed by an event-driven state evaluator that dynamically inspects the permit's `approvals` object, enforces role permissions, and computes the active stage.

### 7.1 Chain Data Schema per Permit Type (`newChain`)

Directly implemented in `index.html` (`lines 5363–5378`), each permit instantiates an approval object with pending state descriptors:

```javascript
// Pending Stage Generator
const pend = () => ({ 
    status: 'pending', 
    by: null, 
    at: null, 
    gps: null, 
    comment: null, 
    sig: null 
});

// PTW-010 Night Shift Work: Dual-Phase Handover Governance
{
    kind: 'nightshift',
    sectionHead: pend(),
    nightHandover: pend(),
    pmNight: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-001 Excavation: 3-Way Parallel Gate + Sequential Spine
{
    kind: 'exc',
    mep: pend(),
    pm: pend(),
    it: pend(),
    sectionHead: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-002 Hot Work / PTW-003 Guard Rail / PTW-004 Confined Space / PTW-008 General Work
{
    kind: 'hotwork' | 'guardrail' | 'confined' | 'general',
    sectionHead: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-005 Shaft Work: Dedicated MEP Clearance + Sequential Spine
{
    kind: 'shaft',
    mep: pend(),
    sectionHead: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-006 Electrical Work (Topology 1: Batching Plant Flow)
{
    kind: 'electrical-batching',
    pm: pend(),
    qualityEngineer: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-006 Electrical Work (Topology 2: Site Flow)
{
    kind: 'electrical-site',
    mep: pend(),
    pm: pend(),
    sectionHead: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-007 Drilling & Blasting: Direct to EHS Spine (Blasting In-charge acknowledged prior to Site Engineer)
{
    kind: 'blasting',
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-009A Routine Lifting Operations: Technical P&M Clearance Spine
{
    kind: 'lifting-routine',
    pm: pend(),
    sectionHead: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}

// PTW-009B Critical Lift Plan: Executive Review Spine with Project Manager
{
    kind: 'lifting-critical',
    pm: pend(),
    sectionHead: pend(),
    projectManager: pend(),
    ehsManager: pend(),
    ehsOfficer: pend()
}
```

### 7.2 Stage Resolution Algorithm (`chainStage`)

Implemented in `index.html` (`lines 7046–7156`), `chainStage(chain)` computes the active stage via a prioritized decision tree:

```javascript
function chainStage(chain) {
    if (!chain) return 'complete';

    // Night Shift Work (PTW-010)
    if (chain.kind === 'nightshift') {
        if (chain.sectionHead && (chain.sectionHead.status === 'cancelled' || chain.sectionHead.status === 'rejected')) return 'rejected-sectionhead';
        if (chain.nightHandover && (chain.nightHandover.status === 'cancelled' || chain.nightHandover.status === 'rejected')) return 'rejected-night-handover';
        if (chain.pmNight && (chain.pmNight.status === 'cancelled' || chain.pmNight.status === 'rejected')) return 'rejected-pm-night';
        if ((chain.ehsManager && chain.ehsManager.status === 'cancelled') || (chain.ehsOfficer && chain.ehsOfficer.status === 'cancelled')) return 'cancelled-ehs';
        if ((chain.ehsManager && chain.ehsManager.status === 'rejected') || (chain.ehsOfficer && chain.ehsOfficer.status === 'rejected')) return 'rejected-ehs';
        if (!chain.sectionHead || chain.sectionHead.status !== 'approved') return 'section-head';
        if (!chain.nightHandover || chain.nightHandover.status !== 'approved') return 'night-handover';
        if (!chain.pmNight || chain.pmNight.status !== 'approved') return 'pm-night';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Lifting Operations - Routine (PTW-009A)
    if (chain.kind === 'lifting-routine') {
        if (chain.pm && (chain.pm.status === 'cancelled' || chain.pm.status === 'rejected')) return 'rejected-pm';
        if (chain.sectionHead && (chain.sectionHead.status === 'cancelled' || chain.sectionHead.status === 'rejected')) return 'rejected-sectionhead';
        if ((chain.ehsManager?.status === 'cancelled') || (chain.ehsOfficer?.status === 'cancelled')) return 'cancelled-ehs';
        if ((chain.ehsManager?.status === 'rejected') || (chain.ehsOfficer?.status === 'rejected')) return 'rejected-ehs';
        if (!chain.pm || chain.pm.status !== 'approved') return 'pm';
        if (!chain.sectionHead || chain.sectionHead.status !== 'approved') return 'section-head';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && 
            (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Lifting Operations - Critical Lift Plan (PTW-009B)
    if (chain.kind === 'lifting-critical') {
        if (chain.pm && (chain.pm.status === 'cancelled' || chain.pm.status === 'rejected')) return 'rejected-pm';
        if (chain.sectionHead && (chain.sectionHead.status === 'cancelled' || chain.sectionHead.status === 'rejected')) return 'rejected-sectionhead';
        if (chain.projectManager && (chain.projectManager.status === 'cancelled' || chain.projectManager.status === 'rejected')) return 'rejected-projectmanager';
        if ((chain.ehsManager?.status === 'cancelled') || (chain.ehsOfficer?.status === 'cancelled')) return 'cancelled-ehs';
        if ((chain.ehsManager?.status === 'rejected') || (chain.ehsOfficer?.status === 'rejected')) return 'rejected-ehs';
        if (!chain.pm || chain.pm.status !== 'approved') return 'pm';
        if (!chain.sectionHead || chain.sectionHead.status !== 'approved') return 'section-head';
        if (!chain.projectManager || chain.projectManager.status !== 'approved') return 'project-manager';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && 
            (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Drilling & Blasting (Direct Spine to EHS after Site Engineer acknowledgment)
    if (chain.kind === 'blasting') {
        if ((chain.ehsManager?.status === 'cancelled') || (chain.ehsOfficer?.status === 'cancelled')) return 'cancelled-ehs';
        if ((chain.ehsManager?.status === 'rejected') || (chain.ehsOfficer?.status === 'rejected')) return 'rejected-ehs';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && 
            (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Electrical Work - Batching Plant Flow
    if (chain.kind === 'electrical-batching') {
        if (chain.pm?.status === 'cancelled') return 'cancelled-pm';
        if (chain.pm?.status === 'rejected') return 'rejected-pm';
        if (chain.qualityEngineer?.status === 'cancelled') return 'cancelled-quality-engineer';
        if (chain.qualityEngineer?.status === 'rejected') return 'rejected-quality-engineer';
        if (chain.ehsManager?.status === 'cancelled' || chain.ehsOfficer?.status === 'cancelled') return 'cancelled-ehs';
        if (chain.ehsManager?.status === 'rejected' || chain.ehsOfficer?.status === 'rejected') return 'rejected-ehs';
        if (!chain.pm || chain.pm.status !== 'approved') return 'pm';
        if (!chain.qualityEngineer || chain.qualityEngineer.status !== 'approved') return 'quality-engineer';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && 
            (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Electrical Work - Site Flow (Either/Or Gate for MEP / P&M)
    if (chain.kind === 'electrical-site') {
        if (chain.mep?.status === 'cancelled' || chain.pm?.status === 'cancelled') return 'cancelled-mep-pm';
        if (chain.mep?.status === 'rejected' || chain.pm?.status === 'rejected') return 'rejected-mep-pm';
        if (chain.sectionHead?.status === 'cancelled') return 'cancelled-sectionhead';
        if (chain.sectionHead?.status === 'rejected') return 'rejected-sectionhead';
        if (chain.ehsManager?.status === 'cancelled' || chain.ehsOfficer?.status === 'cancelled') return 'cancelled-ehs';
        if (chain.ehsManager?.status === 'rejected' || chain.ehsOfficer?.status === 'rejected') return 'rejected-ehs';
        const step3Done = (chain.mep && chain.mep.status === 'approved') || (chain.pm && chain.pm.status === 'approved');
        if (!step3Done) return 'mep-pm';
        if (!chain.sectionHead || chain.sectionHead.status !== 'approved') return 'section-head';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && 
            (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Hot Work, Guard Rail, Confined Space, General Work
    if (chain.kind === 'guardrail' || chain.kind === 'hotwork' || chain.kind === 'confined' || chain.kind === 'general') {
        if (chain.sectionHead && ['rejected', 'cancelled'].includes(chain.sectionHead.status)) return 'rejected-sectionhead';
        if ((chain.ehsManager?.status === 'cancelled') || (chain.ehsOfficer?.status === 'cancelled')) return 'cancelled-ehs';
        if ((chain.ehsManager?.status === 'rejected') || (chain.ehsOfficer?.status === 'rejected')) return 'rejected-ehs';
        if (!chain.sectionHead || chain.sectionHead.status !== 'approved') return 'section-head';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && 
            (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Shaft Work (Requires dedicated MEP clearance before Tower Incharge)
    if (chain.kind === 'shaft') {
        if (chain.mep?.status === 'cancelled') return 'cancelled-mep';
        if (chain.mep?.status === 'rejected') return 'rejected-mep';
        if (chain.sectionHead && ['rejected', 'cancelled'].includes(chain.sectionHead.status)) return 'rejected-sectionhead';
        if ((chain.ehsManager?.status === 'cancelled') || (chain.ehsOfficer?.status === 'cancelled')) return 'cancelled-ehs';
        if ((chain.ehsManager?.status === 'rejected') || (chain.ehsOfficer?.status === 'rejected')) return 'rejected-ehs';
        if (!chain.mep || chain.mep.status !== 'approved') return 'mep';
        if (!chain.sectionHead || chain.sectionHead.status !== 'approved') return 'section-head';
        if ((!chain.ehsManager || chain.ehsManager.status !== 'approved') && 
            (!chain.ehsOfficer || chain.ehsOfficer.status !== 'approved')) return 'ehs';
        return 'complete';
    }

    // Excavation (3-Way Concurrent Parallel Gate: MEP, P&M, IT)
    if (chain.mep.status === 'rejected' || chain.pm.status === 'rejected' || chain.it.status === 'rejected') return 'rejected-parallel';
    if (chain.sectionHead.status === 'rejected' || chain.sectionHead.status === 'cancelled') return 'rejected-sectionhead';
    if (['rejected', 'cancelled'].includes(chain.ehsManager.status) || 
        ['rejected', 'cancelled'].includes(chain.ehsOfficer.status)) return 'rejected-ehs';
    if (chain.mep.status !== 'approved' || chain.pm.status !== 'approved' || chain.it.status !== 'approved') return 'parallel';
    if (chain.sectionHead.status !== 'approved') return 'section-head';
    if (chain.ehsManager.status !== 'approved' && chain.ehsOfficer.status !== 'approved') return 'ehs';
    return 'complete';
}
```

### 7.3 Role Authorization Evaluator (`roleCanActOnChain`)

Implemented in `index.html` (`lines 7157–7235`), validates whether the currently logged-in user role is strictly authorized to take action on the active stage:

```javascript
function roleCanActOnChain(chain, roleKey) {
    if (!chain) return false;
    let p = null;
    if (chain.approvals) { p = chain; chain = chain.approvals; }
    const rk = roleKey || (currentUser && currentUser.key);
    if (!rk) return false;

    const stage = chainStage(chain);

    // Lifting Operations (Routine & Critical)
    if (chain.kind === 'lifting-routine') {
        if (stage === 'pm') return rk === 'pm' && chain.pm?.status === 'pending';
        if (stage === 'section-head') return (rk === 'hw-section-head' || rk === 'section-head') && chain.sectionHead?.status === 'pending';
        if (stage === 'ehs') {
            if (rk === 'ehs-manager') return chain.ehsManager?.status === 'pending';
            if (rk === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
            return false;
        }
        return false;
    }
    if (chain.kind === 'lifting-critical') {
        if (stage === 'pm') return rk === 'pm' && chain.pm?.status === 'pending';
        if (stage === 'section-head') return (rk === 'hw-section-head' || rk === 'section-head') && chain.sectionHead?.status === 'pending';
        if (stage === 'project-manager') return rk === 'project-manager' && chain.projectManager?.status === 'pending';
        if (stage === 'ehs') {
            if (rk === 'ehs-manager') return chain.ehsManager?.status === 'pending';
            if (rk === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
            return false;
        }
        return false;
    }

    if (chain.kind === 'blasting') {
        if (stage === 'ehs') {
            if (rk === 'ehs-manager') return chain.ehsManager?.status === 'pending';
            if (rk === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
        }
        return false;
    }

    if (chain.kind === 'guardrail' || chain.kind === 'hotwork' || chain.kind === 'confined' || chain.kind === 'general') {
        if (stage === 'section-head') return (rk === 'hw-section-head' || rk === 'section-head') && chain.sectionHead?.status === 'pending';
        if (stage === 'ehs') {
            if (rk === 'ehs-manager') return chain.ehsManager?.status === 'pending';
            if (rk === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
            return false;
        }
        return false;
    }

    if (chain.kind === 'electrical-batching') {
        if (stage === 'pm') return roleKey === 'pm' && chain.pm?.status === 'pending';
        if (stage === 'quality-engineer') return roleKey === 'quality-engineer' && chain.qualityEngineer?.status === 'pending';
        if (stage === 'ehs') {
            if (roleKey === 'ehs-manager') return chain.ehsManager?.status === 'pending';
            if (roleKey === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
            return false;
        }
        return false;
    }

    if (chain.kind === 'electrical-site') {
        if (stage === 'mep-pm') return (roleKey === 'mep' || roleKey === 'pm') && (chain.mep?.status === 'pending' || chain.pm?.status === 'pending');
        if (stage === 'section-head') return (roleKey === 'hw-section-head' || roleKey === 'section-head') && chain.sectionHead?.status === 'pending';
        if (stage === 'ehs') {
            if (roleKey === 'ehs-manager') return chain.ehsManager?.status === 'pending';
            if (roleKey === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
            return false;
        }
        return false;
    }

    if (chain.kind === 'shaft') {
        if (stage === 'mep') return roleKey === 'mep' && chain.mep?.status === 'pending';
        if (stage === 'section-head') return (roleKey === 'hw-section-head' || roleKey === 'section-head') && chain.sectionHead?.status === 'pending';
        if (stage === 'ehs') {
            if (roleKey === 'ehs-manager') return chain.ehsManager?.status === 'pending';
            if (roleKey === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
            return false;
        }
        return false;
    }

    if (stage === 'parallel') {
        if (roleKey === 'mep') return chain.mep?.status === 'pending';
        if (roleKey === 'pm') return chain.pm?.status === 'pending';
        if (roleKey === 'it') return chain.it?.status === 'pending';
        return false;
    }
    if (stage === 'section-head') {
        if (chain.kind === 'exc') return roleKey === 'excavation-head' && chain.sectionHead?.status === 'pending';
        return (roleKey === 'hw-section-head' || roleKey === 'section-head') && chain.sectionHead?.status === 'pending';
    }
    if (stage === 'ehs') {
        if (roleKey === 'ehs-manager') return chain.ehsManager?.status === 'pending';
        if (roleKey === 'ehs-officer') return chain.ehsOfficer?.status === 'pending';
    }
    return false;
}
```

### 7.4 Stale Approval Retention & Fast-Track Routing Algorithm

When a permit is rejected, the system records the exact rejecting authority in `p.rejectionOrigin = { roleKey, roleLabel, by, comment }`:
1. **Field-Level Invalidation**: Only checklist items and metadata sections modified during the revision are reset.
2. **Preservation of Unaffected Clearances**: If Excavation Head rejects an Excavation permit, the parallel approvals from MEP, P&M, and IT remain marked as `approved` and are **not invalidated**.
3. **Fast-Track Routing (`actSiteEngineerAck`)**: Once the Site Supervisor corrects the form and the Site Engineer re-acknowledges on-site, the system reads `p.rejectionOrigin`:
   - If rejected by EHS $\rightarrow$ bypasses Section Head and parallel gate, returning directly to `Pending EHS Approval`.
   - If rejected by Section Head (Excavation Head / Tower Incharge) $\rightarrow$ bypasses parallel gate, returning directly to `Pending Section Head`.
   - If rejected by MEP $\rightarrow$ returns directly to `Pending Parallel Approval` with P&M and IT remaining cleared.
   - If rejected by Blasting In-charge $\rightarrow$ resubmission routes to `Pending Blasting In-charge Re-Acknowledgment`, then forward to `Pending Site Engineer Re-Acknowledgment`.

### 7.5 Core Operational Dispatch & Execution Engine

State transitions and approval evaluations are driven by a centralized suite of deterministic operational functions:

```mermaid
graph TD
    A["submitPermit(p)"] -->|PTW-001 to 05, PTW-007 Drilling, PTW-008| B["Pending Site Engineer Acknowledgment"]
    A -->|PTW-007 Blasting| BL["Pending Blasting In-charge Acknowledgment"]
    BL -->|ackBlastingIncharge| B
    A -->|PTW-006 Batching Plant| BP["Pending P&M Acknowledgment"]
    BP -->|approvePermitStage| Q["Pending Quality Engineer Approval"]
    Q -->|approvePermitStage| H["Pending EHS Approval - Manager / Officer"]
    B -->|acknowledgeSiteEngineer| C{"Permit Type Topology"}
    B -->|rejectSiteEngineer| D["Returned for Correction - Permittee Refill"]
    C -->|PTW-001 Excavation| E["Pending Parallel Approval - MEP / P&M / IT"]
    C -->|PTW-005 Shaft Work| F["Pending MEP Clearance"]
    C -->|PTW-002 03 04 08| G2["Pending Section Head - Tower Incharge"]
    C -->|PTW-006 Site Flow| M["Pending MEP or P&M Approval"]
    M -->|approvePermitStage| G2
    C -->|PTW-007 Drilling and Blasting| H
    E -->|approvePermitStage| G1["Pending Section Head - Excavation Head"]
    F -->|approvePermitStage| G2
    G1 -->|approvePermitStage| H
    G2 -->|approvePermitStage| H
    H -->|approvePermitStage First-Wins| I["activatePermit(p) to ACTIVE"]
    G1 -->|rejectPermitStage| D
    G2 -->|rejectPermitStage| D
    H -->|rejectPermitStage| D
    G1 -->|rejectPermitStage cancel| J["Cancelled - Terminal Stop Work"]
    G2 -->|rejectPermitStage cancel| J
    H -->|rejectPermitStage cancel| J
```

| Operational Function | Implementation Signature | Authoritative Role | State Transition & Business Rules |
|:---|:---|:---|:---|
| **`submitPermit`** | `submitPermit(p)` | Permittee (Supervisor / Electrician / Blasting In-charge) | Sets `submittedAt = nowTime()`, `stageEnteredAt = nowTime()`, clears escalations. PTW-007 (Drilling & Blasting) is initiated exclusively by Blasting / Drilling In-charge with on-form PESO statutory declaration and routes directly to `Pending Site Engineer Acknowledgment`. PTW-006 (Batching Plant) routes to `Pending P&M Acknowledgment`. All other permits route to `Pending Site Engineer Acknowledgment`. |
| **`acknowledgeBlastingIncharge`** | `acknowledgeBlastingIncharge(p, { gps, comment, sig, signerName, statutoryDeclaration, photo })` | Blasting / Drilling In-charge | Statutory PESO compliance acknowledgment. Validates mandatory statutory PESO declaration checkbox and mandatory on-site photo. Records in `p.signatories['blasting-incharge']` and routes forward to `Pending Site Engineer Acknowledgment`. |
| **`rejectBlastingIncharge`** | `rejectBlastingIncharge(p, { gps, comment, sig, signerName })` | Blasting / Drilling In-charge | Statutory rejection. Mutates status to `Returned for Correction`, logs return reason, and dispatches correction request notification to Permittee. |
| **`acknowledgeSiteEngineer`** | `acknowledgeSiteEngineer(p, { gps, comment, sig, signerName })` | Site Engineer | Step 2 on-site technical verification. Captures GPS (enforces site proximity), records signature and DPDP consent in `p.signatories['site-engineer']`. Routes PTW-002/03/04/08 to Tower Incharge, PTW-005 to MEP, PTW-001 to parallel gate, PTW-006 Site to MEP/P&M, and PTW-007 directly to `Pending EHS Approval`. **Site Engineer CANNOT cancel permits.** |
| **`rejectSiteEngineer`** | `rejectSiteEngineer(p, { gps, comment, sig, signerName })` | Site Engineer | Step 2 rejection. Mutates status to `Returned for Correction`, logs return reason, and dispatches correction request notification to Permittee (Site Supervisor, Electrician, or Blasting In-charge). **Cannot issue terminal cancellation.** |
| **`actOnChain`** | `actOnChain(chain, roleKey, decision, payload)` | Core Engine | Core low-level node mutator. Writes decision (`'approved'` \| `'rejected'` \| `'cancelled'`), signer, timestamp, GPS, comment, and signature into `chain[CHAIN_ROLE_FIELD[roleKey]]`. Returns `chainStage(chain)`. |
| **`approvePermitStage`** | `approvePermitStage(p, roleKey, gpsOrOpt, comment, sig, signerName)` | Assigned Reviewer | Gated by `roleCanActOnChain`. Executes `actOnChain`. If next stage is `'section-head'`, routes to Tower Incharge; if `'ehs'`, routes to EHS; if `'complete'`, triggers `activatePermit(p)`. |
| **`rejectPermitStage`** | `rejectPermitStage(p, roleKey, gpsOrOpt, comment, sig, signerName, isCancel)` | Assigned Reviewer (EHS Only for Cancel) | Evaluates `isCancel`: If `true`, mutates status to `Cancelled` (`isCancelled = true`), triggering immediate work halt and unlocking PDF report (reserved for EHS Safety Manager/Officer). If `false`, records `rejectionOrigin` and routes to `Returned for Correction`. |
| **`activatePermit`** | `activatePermit(p)` | EHS Safety | Final endorsement gate. Sets status to `Active`, sets `activatedAt = nowTime()`, resets escalation counters, and broadcasts site-wide authorization to commence high-risk operations until `validTill`. |

---

## 8. Swimlane Diagrams

Comprehensive visual swimlane and sequence specifications covering all **10 active permit types (PTW-001 through PTW-010)** and all **3 cross-cutting lifecycle engines** (Rejection & Resubmission, Safety Observation, and Extension). Each flow is rendered in dedicated vertical swimlane boxes for crystal-clear actor isolation and GitHub compatibility.

---

### 8.1 PTW-001 Excavation: End-to-End Approval & Lifecycle (3-Way Parallel Gate)
The only flow featuring a **3-way parallel gate** (MEP, P&M, IT)  On a Reject + refill, **only approvals whose fields changed are invalidated** (stale-approval rule) — approvals of unchanged sections persist. EHS clearance is satisfied by **either one** of EHS Manager or Officer.

```mermaid
sequenceDiagram
    autonumber
    box "Site Operations Swimlane"
        actor SS as "Site Supervisor (Permittee)"
        actor SE as "Site Engineer (Acknowledge)"
    end
    box "Discipline Clearances Swimlane"
        participant MEP as "MEP Engineer"
        participant PM as "P&M Engineer"
        participant IT as "IT Engineer"
    end
    box "Approving Authorities Swimlane"
        actor EH as "Excavation Head (Approving Authority)"
        actor EHS as "EHS Manager/Officer (Verification)"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: STEP 1 - Form Initiation and Checklist
    SS->>SS: Complete 4-step wizard form
    SS->>SS: Complete 12-item safety checklist (NO requires comment, Site Photo unlocked after checklist)
    SS->>SS: Capture Site Photo (activated after checklist complete)
    SS->>SS: Final review and sign, GPS captured on submission
    SS->>SYS: submitPermit(EXCAVATION)
    SYS->>SYS: Status: Pending Site Engineer Acknowledgment
    SYS->>SE: In-App Alert: Physical site review required

    Note over SS,SYS: STEP 2 - Physical Site Verification
    SE->>SE: Verify physical ground, trench depth and barricades on-site
    SE->>SYS: acknowledgeSiteEngineer()
    SYS->>SYS: Status: Pending Parallel Clearances
    SYS->>MEP: Alert: Utilities clearance required
    SYS->>PM: Alert: Machinery clearance required
    SYS->>IT: Alert: Data/Fibre lines clearance required

    Note over SS,SYS: STEP 3 - Concurrent Parallel Approval Gate
    par Concurrent Clearances (All 3 Must Approve)
        MEP->>SYS: approveParallelStage(MEP) [Utilities clear]
    and
        PM->>SYS: approveParallelStage(PM) [Equipment / Plant safe]
    and
        IT->>SYS: approveParallelStage(IT) [OFC / Data lines safe]
    end
    Note over MEP,SYS: Any Reject returns to Supervisor, unchanged sections persist
    SYS->>SYS: Status: Pending Section Head Approval (Excavation Head)
    SYS->>EH: Alert: All clearances passed, Excavation Head review required

    Note over SS,SYS: STEP 4 - Excavation Head Review
    EH->>EH: Holistic site safety review and contractor readiness
    alt Approve
        EH->>SYS: approvePermitStage()
        SYS->>SYS: Status: Pending EHS Approval
        SYS->>EHS: Alert: Final endorsement required
    else Cancel
        EH->>SYS: cancelPermit() + comment
        SYS->>SYS: Status: Cancelled (Terminal) [Generate PDF, Notify All]
    end

    Note over SS,SYS: STEP 5 - EHS Final Endorsement (Single Approver Rule)
    EHS->>EHS: Verify work-area photo and physical safety protocols
    alt Approve
        EHS->>SYS: approvePermitStage()
        SYS->>SYS: Status: Active (Work authorized to commence)
        SYS-->>SS: In-App Alert: Permit ACTIVE
        SYS-->>SE: In-App Alert: Permit ACTIVE
        SYS-->>EH: In-App Alert: Permit ACTIVE
    else Reject
        EHS->>SYS: rejectPermit() [Returns to Site Supervisor for correction]
    else Cancel
        EHS->>SYS: cancelPermit() [Stop work, PDF generated - Terminal]
    end

    Note over SS,SYS: STEP 6 - Site Closure and Surrender (Site Supervisor Exclusive)
    SYS->>SS: T-30 min auto-reminder dispatched before expiry
    SS->>SS: Complete backfill and barricade removal declarations + photo + GPS
    Note over SS,SE: Closure and surrender strictly executed by Site Supervisor (no SE closure option)
    SS->>SYS: closeAndSurrenderPermit()
    SYS->>SYS: Status: Closed [Generate Statutory PDF Archive]
```

---

### 8.2 PTW-002 Hot Work: End-to-End Approval & 1-Hour Fire Watch Rule
Features a **3-stage approval spine** (Site Engineer $\rightarrow$ Tower Incharge $\rightarrow$ EHS) and enforces the statutory **1-Hour Fire Watch** rule before permit closure.

```mermaid
sequenceDiagram
    autonumber
    box "Site Operations Swimlane"
        actor SS as "Site Supervisor (Permittee)"
        actor SE as "Site Engineer (Acknowledge)"
    end
    box "Approving Authorities Swimlane"
        actor TI as "Tower Incharge (Approving Authority)"
        actor EHS as "EHS Manager/Officer (Verification)"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: STEP 1 - Form Initiation and Photo Upload
    SS->>SS: Fill Hot Work form + spark containment plan + attach work-area photo
    SS->>SS: Checklist: Fire extinguishers, combustible clearance, flash-back arrestor
    SS->>SYS: submitPermit(HOTWORK)
    SYS->>SYS: Status: Pending Site Engineer Acknowledgment
    SYS->>SE: Alert: Hot work site acknowledgment required

    Note over SS,SYS: STEP 2 - Physical Site Verification
    SE->>SE: Verify 35-ft radius combustible clearance and water/sand buckets
    SE->>SYS: acknowledgeSiteEngineer()
    SYS->>SYS: Status: Pending Section Head Approval (Tower Incharge)
    SYS->>TI: Alert: Ready for Tower Incharge review

    Note over SS,SYS: STEP 3 - Tower Incharge Review
    alt Approve
        TI->>SYS: approvePermitStage()
        SYS->>SYS: Status: Pending EHS Approval
        SYS->>EHS: Alert: Final safety verification required
    else Cancel
        TI->>SYS: cancelPermit() + comment [Terminal, PDF generated]
    end

    Note over SS,SYS: STEP 4 - EHS Verification (Either Manager or Officer)
    EHS->>EHS: Verify fire blanket, cylinder storage, and welder PPE
    alt Approve
        EHS->>SYS: approvePermitStage()
        SYS->>SYS: Status: Active (Hot work authorized)
        SYS-->>SS: In-App Alert: Permit ACTIVE
    else Reject
        EHS->>SYS: rejectPermit() [Returns to Site Supervisor to refill and resubmit]
    else Cancel
        EHS->>SYS: cancelPermit() [Stop all work immediately, PDF generated]
    end

    Note over SS,SYS: STEP 5 - Mandatory 1-Hour Fire Watch and Closure
    Note over SS: Hot work activity completes on site; 60-minute continuous fire watch executed
    SS->>SS: Check mandatory Fire Watch declaration box (1 hr post-work watch confirmed)
    SS->>SS: Attach post-work cold-area clearance photo
    SS->>SYS: surrenderPermit()
    SYS->>SYS: Status: Closed [PDF generated with fire watch declaration]
```

---

### 8.3 PTW-003 Guard Rail & Floor Protection Removal: Re-Fixing Verification
Features a **multi-select activity dropdown** and a strict **closure barrier** requiring a mandatory photo verifying that all edge barricades, safety nets, and handrails have been fully reinstated.

```mermaid
sequenceDiagram
    autonumber
    box "Site Operations Swimlane"
        actor SS as "Site Supervisor (Permittee)"
        actor SE as "Site Engineer (Acknowledge)"
    end
    box "Approving Authorities Swimlane"
        actor TI as "Tower Incharge (Approving Authority)"
        actor EHS as "EHS Manager/Officer (Verification)"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: STEP 1 - Form Initiation and Multi-Select Activity
    SS->>SS: Select multi-activity: Material Hoisting, Concrete Pour, Facade Install
    SS->>SS: Attach initial edge/floor perimeter photo + safety harness checklist
    SS->>SYS: submitPermit(GUARDRAIL)
    SYS->>SYS: Status: Pending Site Engineer Acknowledgment
    SYS->>SE: Alert: Guard rail removal site acknowledgment required

    Note over SS,SYS: STEP 2 - Physical Site Verification
    SE->>SE: Verify 100 percent tie-off lifeline setup and perimeter signage on-site
    SE->>SYS: acknowledgeSiteEngineer()
    SYS->>SYS: Status: Pending Section Head Approval (Tower Incharge)
    SYS->>TI: Alert: Tower Incharge approval required

    Note over SS,SYS: STEP 3 - Tower Incharge Review
    alt Approve
        TI->>SYS: approvePermitStage()
        SYS->>SYS: Status: Pending EHS Approval
        SYS->>EHS: Alert: Final EHS verification required
    else Reject
        TI->>SYS: rejectPermit() [Returns to Site Supervisor]
    else Cancel
        TI->>SYS: cancelPermit() [Terminal, PDF generated]
    end

    Note over SS,SYS: STEP 4 - EHS Verification
    EHS->>EHS: Verify fall arrest system, safety nets, and warning tape
    alt Approve
        EHS->>SYS: approvePermitStage()
        SYS->>SYS: Status: Active (Removal authorized)
        SYS-->>SS: In-App Alert: Permit ACTIVE
    else Reject
        EHS->>SYS: rejectPermit() [Returns to Site Supervisor]
    else Cancel
        EHS->>SYS: cancelPermit() [Stop work, PDF generated]
    end

    Note over SS,SYS: STEP 5 - Mandatory Re-Fixing Verification and Closure
    Note over SS,SYS: Work through floor opening finishes
    SS->>SS: Guard rails, toe boards, and floor coverings re-erected
    SS->>SS: Upload mandatory declaration + photo verifying re-fixed barriers
    SS->>SYS: surrenderPermit()
    SYS->>SYS: Status: Closed [PDF generated with re-installation evidence]
```

---

### 8.4 PTW-004 Confined Space Entry: Direct Spine & Multi-Gas Atmospheric Testing
Features a **4-stage sequential spine** (Site Supervisor &rarr; Site Engineer Step 2 ground ventilation inspection &rarr; Tower Incharge section review &rarr; EHS Safety final endorsement), enforced **mandatory declaration + photo** at initiation, and strict **4-gas atmospheric testing gates** before activation and upon closure.

```mermaid
sequenceDiagram
    autonumber
    box "Entry Operations Swimlane"
        actor SS as "Site Supervisor (Entry Supervisor)"
    end
    box "Approving Authorities Swimlane"
        actor SE as "Site Engineer (Ground Verification)"
        actor TI as "Tower Incharge (Approving Authority)"
        actor EHS as "EHS Manager/Officer (Verification)"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: STEP 1 - Form Initiation, Gas Testing and Entry Declaration
    SS->>SS: Enter multi-gas detector log: O2 (19.5-23.5 percent), LEL (under 10 percent), CO (under 25ppm), H2S (under 10ppm)
    SS->>SS: Attach work-area photo + complete confined space entry checklist
    SS->>SS: Sign mandatory Entry Supervisor Safety Declaration
    SS->>SYS: submitPermit(CONFINED)
    SYS->>SYS: Status: Pending Site Engineer Acknowledgment
    SYS->>SE: Alert: Confined Space ground ventilation check required

    Note over SE,SYS: STEP 2 - Site Engineer Ground Inspection
    SE->>SE: Inspect forced mechanical ventilation, standby man presence, and rescue winch
    SE->>SYS: acknowledgeSiteEngineer()
    SYS->>SYS: Status: Pending Section Head (Tower Incharge)
    SYS->>TI: Alert: Confined Space Section Head review required

    Note over SS,SYS: STEP 2 - Tower Incharge Review
    TI->>TI: Verify forced mechanical ventilation, standby man and rescue tripod
    alt Approve
        TI->>SYS: approvePermitStage()
        SYS->>SYS: Status: Pending EHS Approval
        SYS->>EHS: Alert: Final EHS verification required
    else Reject
        TI->>SYS: rejectPermit() [Returns to Site Supervisor]
    else Cancel
        TI->>SYS: cancelPermit() [Terminal, PDF generated]
    end

    Note over SS,SYS: STEP 3 - EHS Verification
    EHS->>EHS: Review calibrated gas detector readings, SCBA and emergency harness
    alt Approve
        EHS->>SYS: approvePermitStage()
        SYS->>SYS: Status: Active (Entry authorized)
        SYS-->>SS: In-App Alert: Permit ACTIVE
    else Reject
        EHS->>SYS: rejectPermit() [Returns to Site Supervisor]
    else Cancel
        EHS->>SYS: cancelPermit() [Stop entry, PDF generated]
    end

    Note over SS,SYS: STEP 4 - Mandatory All-Clear Worker Surrender
    Note over SS,SYS: Work inside tank/manhole finishes
    SS->>SS: Confirm 100 percent headcount accounted for outside the space
    SS->>SS: Upload mandatory declaration + photo: No worker remains inside space
    SS->>SYS: surrenderPermit()
    SYS->>SYS: Status: Closed [PDF generated with full gas log and exit confirmation]
```

---

### 8.5 PTW-005 Shaft Work: Dedicated MEP Clearance & Floor Dropdown
Features a **Location dropdown with Floor selection**, **scaffold green-tag verification**, a **mandatory initial declaration + photo**, and a **dedicated single MEP Engineer clearance step** before Tower Incharge.

```mermaid
sequenceDiagram
    autonumber
    box "Site Operations Swimlane"
        actor SS as "Site Supervisor (Permittee)"
        actor SE as "Site Engineer (Acknowledge)"
    end
    box "Domain Clearance Swimlane"
        actor MEP as "MEP Engineer (Domain Clearance)"
    end
    box "Approving Authorities Swimlane"
        actor TI as "Tower Incharge (Approving Authority)"
        actor EHS as "EHS Manager/Officer (Verification)"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: STEP 1 - Form Initiation (Location + Floor Dropdown)
    SS->>SS: Select Shaft Location and specific Floor from dropdown
    SS->>SS: Verify green scaffold tag + attach mandatory declaration and photo
    SS->>SS: Complete 10-item shaft safety checklist (lifeline, toe-board, lighting)
    SS->>SYS: submitPermit(SHAFT)
    SYS->>SYS: Status: Pending Site Engineer Acknowledgment
    SYS->>SE: Alert: Shaft work site acknowledgment required

    Note over SS,SYS: STEP 2 - Site Engineer Acknowledgment
    SE->>SE: Physical site inspection of shaft opening and fall containment
    SE->>SYS: acknowledgeSiteEngineer()
    SYS->>SYS: Status: Pending MEP Clearance
    SYS->>MEP: Alert: MEP clearance required for duct/piping shaft

    Note over SS,SYS: STEP 3 - Dedicated MEP Domain Clearance
    MEP->>MEP: Inspect shaft electrical risers, plumbing pipes and ductwork safety
    alt Approve
        MEP->>SYS: approveParallelStage(MEP)
        SYS->>SYS: Status: Pending Section Head Approval (Tower Incharge)
        SYS->>TI: Alert: MEP cleared, Tower Incharge review required
    else Reject
        MEP->>SYS: rejectPermit() [Returns to Site Supervisor]
    else Cancel
        MEP->>SYS: cancelPermit() [Terminal, PDF generated]
    end

    Note over SS,SYS: STEP 4 - Tower Incharge Review
    TI->>TI: Review shaft structural stability and simultaneous work hazards
    alt Approve
        TI->>SYS: approvePermitStage()
        SYS->>SYS: Status: Pending EHS Approval
        SYS->>EHS: Alert: Final EHS endorsement required
    else Reject
        TI->>SYS: rejectPermit() [Returns to Site Supervisor]
    else Cancel
        TI->>SYS: cancelPermit() [Terminal, PDF generated]
    end

    Note over SS,SYS: STEP 5 - EHS Final Verification
    EHS->>EHS: Verify full-body harness with shock absorber and shaft net
    alt Approve
        EHS->>SYS: approvePermitStage()
        SYS->>SYS: Status: Active (Shaft work authorized)
        SYS-->>SS: In-App Alert: Permit ACTIVE
    else Reject
        EHS->>SYS: rejectPermit() [Returns to Site Supervisor]
    else Cancel
        EHS->>SYS: cancelPermit() [Stop work, PDF generated]
    end

    Note over SS,SYS: STEP 6 - Mandatory Shaft Closure and Sealing
    SS->>SS: Remove scaffold/tools, reinstall shaft cover and secure locks
    SS->>SS: Upload mandatory declaration + photo confirming shaft closed
    SS->>SYS: surrenderPermit()
    SYS->>SYS: Status: Closed [PDF generated with sealed shaft evidence]
```

---

### 8.6 PTW-006 Electrical Work (HT/LT): Dual-Topology Approval & Statutory LOTO Lifecycle

PTW-006 Electrical Work enforces an exclusive Permittee architecture for the **Authorized Electrician** (civil supervisors are restricted per `INITIATOR_PERMIT_RULES`), mandatory apparatus tagging (10 high/low voltage apparatus classes), **mandatory LOTO register serial number and placement timestamp**, and branches into **two distinct operational topologies**:
1. **Batching Plant Flow**: Dedicated plant equipment isolation verified by P&M Engineer (`Pending P&M Acknowledgment`), insulation resistance verified by Quality Engineer (`Pending Quality Engineer Approval`), and activated by EHS Safety.
2. **Site Flow**: General construction electrical work routed through Site Engineer (`Pending Site Engineer Acknowledgment`), discipline clearance by either MEP or P&M (`Pending MEP or P&M Approval`), Section Head review by Tower Incharge, and activated by EHS Safety.

```mermaid
sequenceDiagram
    autonumber
    box "Permittee Specialist Swimlane"
        actor EL as "Permittee Electrician (Exclusive Permittee)"
    end
    box "Field & Quality Verification Swimlane"
        actor SE as "Site Engineer (Site Technical Ack)"
        actor PM as "P&M Engineer (Plant & Machinery Ack)"
        actor QE as "Quality Engineer (Megohm & Quality Clearance)"
    end
    box "Approving Authorities Swimlane"
        actor MEP as "MEP / P&M Engineer (Domain Clearance)"
        actor TI as "Tower Incharge (Section Head)"
        actor EHS as "EHS Safety (Manager / Officer)"
    end
    box "Core Engine"
        participant SYS as "Core Engine"
    end

    Note over EL,SYS: PHASE 1: Form Initiation, Apparatus Tagging and LOTO Verification
    EL->>EL: Select Facility Scope: Batching Plant (Manual Locked) or Site (Flexible Mode)
    EL->>EL: Input Reason for Shutdown + Select Electrical Apparatus (Transformer/RMU/Panels)
    EL->>EL: Record Mandatory LOTO Register Sl. No. and Lock Placement Timestamp
    EL->>EL: Confirm Safe to Work Under IS 5216 and Check Pre-Work Statutory Undertaking
    EL->>SYS: submitPermit(ELECTRICAL) + Attach overview photo + GPS + DPDP Sig

    alt Topology A: Batching Plant Flow
        SYS->>SYS: Route to Status: Pending P and M Acknowledgment
        Note over PM,SYS: PHASE 2A: Plant and Machinery Statutory Acknowledgment
        PM->>SYS: acknowledgePmEngineer() with LOTO confirmation and Statutory Declaration
        SYS->>SYS: Status: Pending Quality Engineer Approval
        
        Note over QE,SYS: PHASE 3A: Quality Engineer Insulation Clearance
        QE->>SYS: approvePermitStage(QE) with Megohm Insulation Resistance Declaration
        SYS->>SYS: Status: Pending EHS Approval
        
        Note over EHS,SYS: PHASE 4A: EHS Safety Activation (First-Wins Gate)
        EHS->>SYS: approvePermitStage(EHS) [Status: Active - Electrical Work Authorized]
    else Topology B: Site Flow
        SYS->>SYS: Route to Status: Pending Site Engineer Acknowledgment
        Note over SE,SYS: PHASE 2B: Site Physical Verification
        SE->>SYS: acknowledgeSiteEngineer() with physical installation verification
        SYS->>SYS: Status: Pending MEP or P and M Approval (Either/Or Gate)
        
        Note over MEP,SYS: PHASE 3B: Dual Domain Clearance Gate
        MEP->>SYS: approvePermitStage(MEP or PM) with Domain Clearance Declaration
        SYS->>SYS: Status: Pending Section Head (Tower Incharge)
        
        Note over TI,SYS: PHASE 4B: Tower Incharge Review
        TI->>SYS: approvePermitStage(TI) [Status: Pending EHS Approval]
        
        Note over EHS,SYS: PHASE 5B: EHS Safety Activation (First-Wins Gate)
        EHS->>SYS: approvePermitStage(EHS) [Status: Active - Electrical Work Authorized]
    end

    Note over EL,EHS: POST-ACTIVATION LIFECYCLES
    opt Safety Observation Raised
        EHS->>SYS: raiseObservation() [Status: Active - Observation Open]
        SYS-->>EL: Extension and Closure BLOCKED until rectified and cleared
        EL->>SYS: respondToObservation() + rectification photo
        SE->>SYS: acknowledgeObservationEng()
        TI->>SYS: reviewObservationSectionHead()
        EHS->>SYS: resolveObservation() [Status: Active - Observation Resolved]
    end

    opt Temporal Permit Extension
        EL->>SYS: requestExtension() (Before 18:30 IST, Ceiling: 20:30 IST)
        alt Batching Plant Extension
            PM->>SYS: approveExtensionStage(PM)
            QE->>SYS: approveExtensionStage(QE)
            EHS->>SYS: approveExtensionStage(EHS)
        else Site Extension
            SE->>SYS: approveExtensionStage(SE)
            TI->>SYS: approveExtensionStage(TI)
            EHS->>SYS: approveExtensionStage(EHS)
        end
        SYS->>SYS: Status: Active (Extended)
    end

    Note over EL,SYS: TERMINAL PHASE: Completion and Statutory De-Isolation Surrender
    EL->>EL: Remove personal padlocks, remove earths, inspect panels clear
    EL->>EL: Check Mandatory Electrical De-Isolation and Restoration Declaration
    EL->>SYS: closeAndSurrenderPermit with electricalClosureConfirmed, photo, GPS and DPDP Sig
    SYS->>SYS: Status: Closed (Surrendered - De-Isolated) [Statutory Form PTW-006 PDF Unlocked]
```

---

### 8.7 PTW-007 Drilling & Blasting: End-to-End Statutory Approval Lifecycle

PTW-007 enforces a statutory safety approval pipeline with **exclusive Permittee architecture for the Blasting / Drilling In-charge** (Site Supervisor is strictly restricted per `INITIATOR_PERMIT_RULES`), **mandatory on-form PESO statutory compliance declaration**, **direct bypass to EHS Safety**, **Site Engineer non-cancellation governance**, **18:30 IST sunset hard stop rule**, and **mandatory post-blast misfire clearance**:

```mermaid
sequenceDiagram
    autonumber
    box "Specialist Permittee Swimlane"
        actor BIC as "Blasting / Drilling In-charge (Exclusive Permittee)"
    end
    box "Field Verification Swimlane"
        actor SE as "Site Engineer (Acknowledgment Only)"
    end
    box "Statutory EHS Endorsement Swimlane"
        actor EHS as "EHS Manager/Officer (Final Endorsement)"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over BIC,SYS: STEP 1 - Form Initiation (Manual Location Locked)
    BIC->>BIC: Select Manual Location Mode (Tower and Basement strictly locked with safety tooltips)
    alt Blasting Operation Selected
        BIC->>BIC: Enter Charge (kg), Diameter, Depth, Holes and Explosive Type (9 PESO Types)
        BIC->>BIC: Complete 15-item checklist (Item 8 auto-weather telemetry, Item 15 custom precautions)
        BIC->>BIC: Fill 4 Post-Checklist Rig fields (Holes loaded, Depth m, Mufflers, Safe distance)
        BIC->>BIC: Check on-form Mandatory PESO Statutory Safety Declaration Card
        BIC->>SYS: submitPermit(BLASTING) as Blasting / Drilling In-charge
        SYS->>SYS: Status: Pending Site Engineer Acknowledgment (Direct Route)
        SYS->>SE: Alert: Site Engineer technical acknowledgment required
    else Drilling Operation Selected
        BIC->>BIC: Enter Drill Machine Type, Hole Diameter, Depth and Holes Count
        BIC->>BIC: Complete 15-item checklist (rig/muffler fields suppressed)
        BIC->>SYS: submitPermit(DRILLING) as Blasting / Drilling In-charge
        SYS->>SYS: Status: Pending Site Engineer Acknowledgment
        SYS->>SE: Alert: Site Engineer technical acknowledgment required
    end

    Note over SE,SYS: STEP 2 - Site Engineer Acknowledgment
    SE->>SE: Verify physical perimeter barricades, siren positions and sentry postings
    Note over SE: Governance Rule: Site Engineer CANNOT cancel permits (Approve/Reject only)
    alt Approve & Forward
        SE->>SYS: acknowledgeSiteEngineer()
        Note over SE,SYS: Direct Bypass: Skips Parallel Gate and Section Head
        SYS->>SYS: Status: Pending EHS Approval
        SYS->>EHS: Alert: Final EHS endorsement required
    else Reject & Return
        SE->>SYS: rejectSiteEngineer() [Returns to Blasting In-charge for correction]
    end

    Note over EHS,SYS: STEP 3 - EHS Final Endorsement (First-Wins Gate)
    EHS->>EHS: Verify weather conditions, blast timing (before 18:30 IST) and PPE
    alt Endorse & Activate
        EHS->>SYS: approvePermitStage()
        SYS->>SYS: Status: Active (Drilling / Blasting authorized)
        SYS-->>BIC: In-App Alert: Permit ACTIVE
    else Reject & Return
        EHS->>SYS: rejectPermit() [Returns to Blasting In-charge for correction]
    else Cancel (Stop-Work)
        EHS->>SYS: cancelPermit() [Terminal stop-work directive, Audit PDF generated]
    end

    Note over BIC,SYS: STEP 4 - Closure and Mandatory Post-Blast Clearance
    alt Blasting Operation Surrender
        BIC->>BIC: Certified Shot Firer sweeps blast floor: zero unexploded charges or misfires
        BIC->>BIC: Check mandatory Post-Blast Clearance and Misfire Declaration checkbox
        BIC->>BIC: Attach post-blast restoration photograph
        BIC->>SYS: closeAndSurrenderPermit with blastingClearanceConfirmed
        SYS->>SYS: Status: Closed [PDF generated with Post-Blast Clearance Certification]
    else Drilling Operation Surrender
        BIC->>BIC: Remove drill rig, cap drilled holes, attach restoration photograph
        BIC->>SYS: closeAndSurrenderPermit()
        SYS->>SYS: Status: Closed [PDF generated]
    end
```

> [!NOTE]
> **Statutory Persona Isolation & DGMS Compliance**: In strict adherence to DGMS and PESO regulations, only certified **Blasting / Drilling In-charge** personnel are permitted to create PTW-007 permits. Site Supervisors are completely restricted from initiating blasting and drilling activities to prevent unauthorized or uncertified handling of explosive operations.

<a id="ptw-008-flow"></a>
<a id="88-ptw-008-general-work-end-to-end-approval--multi-tier-safety-lifecycle"></a>
### 8.8 PTW-008 General Work: End-to-End Approval & Multi-Tier Safety Lifecycle

PTW-008 General Work follows a strict 4-stage statutory governance spine: Permittee initiation by Site Supervisor, physical worksite verification by Site Engineer, Section Head review by Tower Incharge, and final statutory endorsement by EHS (first-wins gate).

```mermaid
sequenceDiagram
    autonumber
    box "Site Operations Swimlane"
        actor SS as "Site Supervisor (Permittee)"
        actor SE as "Site Engineer (Ack)"
    end
    box "Approving Authorities Swimlane"
        actor TI as "Tower Incharge (Section Head)"
        actor EHS as "EHS Safety (Mgr / Officer)"
    end
    box "Core Engine"
        participant SYS as "Core Engine"
    end

    Note over SS,SYS: PHASE 1: Form Creation and Statutory Category Checklist
    SS->>SYS: Select Work Description (1 of 14 options across Cat A, B, C, D)
    SYS->>SYS: Bind dynamic checklist (21, 15, 20, or 11 items) + wind warning (under 45 km/h)
    SS->>SYS: Complete 100 percent checklist + Attach overview photo + GPS + DPDP Sig
    SS->>SYS: submitPermit() [Status: Pending Site Engineer Acknowledgment]

    Note over SE,SYS: PHASE 2: On-Site Engineering Physical Verification
    SE->>SYS: acknowledgeSiteEngineer() with physical site verification
    SYS->>SYS: Status: Pending Section Head Approval (Tower Incharge)

    Note over TI,SYS: PHASE 3: Tower Incharge Review and Endorsement
    TI->>SYS: approvePermit() as Section Head
    SYS->>SYS: Status: Pending EHS Approval

    Note over EHS,SYS: PHASE 4: Final Safety Endorsement and Activation
    EHS->>SYS: approvePermit() as EHS Manager / Officer
    SYS->>SYS: Status: Active (Work Front Operational)

    Note over SS,EHS: POST-ACTIVATION LIFECYCLES
    opt Safety Observation Raised
        EHS->>SYS: raiseObservation() [Status: Active - Observation Open]
        SYS-->>SS: Extension and Closure BLOCKED until rectified and endorsed
        SS->>SYS: respondToObservation() + rectification photo
        SE->>SYS: acknowledgeObservationEng()
        TI->>SYS: approveObservationTI()
        EHS->>SYS: closeObservation() [Status: Active - Observation Resolved]
    end

    opt Permit Temporal Extension
        SS->>SYS: requestExtension() (Before 18:30 IST, Ceiling: 20:30 IST)
        SE->>SYS: approveExtensionStage(SE)
        TI->>SYS: approveExtensionStage(TI)
        EHS->>SYS: approveExtensionStage(EHS) [Status: Active - Extended]
    end

    Note over SS,SYS: TERMINAL PHASE: Completion, Housekeeping and Surrender Gate
    SS->>SYS: Verify area clean, loose materials cleared, tools stacked
    SS->>SYS: closeAndSurrenderPermit(generalHousekeeping: true, restorationPhoto, GPS, DPDP Sig)
    SYS->>SYS: Status: Closed (Surrendered - Work Completed) [Statutory Form PTW-008 PDF Unlocked]
```

---

<a id="ptw-009-flow"></a>
<a id="89-ptw-009a--ptw-009b-lifting-operations--critical-lift-plan-lifecycle"></a>
### 8.9 PTW-009A & PTW-009B Lifting Operations & Critical Lift Plan Lifecycle

Lifting operations implement a unified initiation architecture by the certified **Lifting Supervisor**, gated by mandatory digital signatures from the Crane Operator and Signaler/Rigger before location selection is unlocked. The system dynamically evaluates total load weight, crane load-radius charts, tandem lift flags, calculated sling stress (with $N=2$ safety clamping), and 14 statutory high-risk criteria, routing routine lifts along a 5-stage P&M clearance spine and auto-promoting critical lifts to an executive 6-stage spine requiring Project Manager clearance.

```mermaid
sequenceDiagram
    autonumber
    box "Certified Lifting Crew Swimlane"
        actor LS as "Lifting Supervisor (Permittee)"
        actor CO as "Crane Operator (Digital Sig)"
        actor CR as "Signaler / Rigger (Digital Sig)"
    end
    box "Technical Inspection Swimlane"
        actor SE as "Site Engineer (Physical Ack)"
        actor PM as "P&M Engineer (Plant & Rigging Clearance)"
    end
    box "Governance Authorities Swimlane"
        actor TI as "Tower Incharge (Section Head)"
        actor PMgr as "Project Manager (Critical Lifts Only)"
        actor EHS as "EHS Safety (Manager / Officer)"
    end
    box "Core Engine"
        participant SYS as "Core Engine"
    end

    Note over LS,SYS: PHASE 1: Pre-Location Signatures and Dynamic Classification
    LS->>SYS: Select PTW-009 Lifting Operations (Single Unified Tile)
    SYS->>SYS: Location Mode Strictly LOCKED and DISABLED
    LS->>CO: Request Crane Fitness and Competency Declaration
    CO->>SYS: Sign in Crane Operator Modal (DPDP Consent + Digital Signature)
    LS->>CR: Request Rigging Credentials Declaration
    CR->>SYS: Sign in Signaler/Rigger Modal (DPDP Consent + Digital Signature)
    SYS->>SYS: Unlock Location Mode (Tower / Basement / Manual)
    LS->>SYS: Enter Rigging Specs, Load Weight, Crane Specs, Sling Geometry (L, H)
    SYS->>SYS: Calculate Sling Tension and Stress percentage (with N=2 Safety Clamping)
    LS->>SYS: Complete 14 Statutory Checklist Items + Special Precautions
    SYS->>SYS: Evaluate Auto-Promotion (Weight greater than 5 MT, Tandem, Stress over 80 percent, or 14 Risk Criteria)
    alt Routine Lifting Operation (PTW-009A)
        LS->>SYS: submitPermit(LIFTING) [Status: Pending Site Engineer Acknowledgment]
    else Critical Lift Plan (PTW-009B)
        SYS->>SYS: Auto-promote to PTW-009B Critical Lift Plan
        LS->>SYS: submitPermit(LIFTPLAN) [Status: Pending Site Engineer Acknowledgment]
    end

    Note over SE,SYS: PHASE 2: Site Physical Verification
    SE->>SYS: acknowledgeSiteEngineer() with ground compaction and barricade check
    SYS->>SYS: Status: Pending P and M Acknowledgment

    Note over PM,SYS: PHASE 3: Plant and Machinery Technical Clearance
    PM->>SYS: approvePermitStage(PM) with Crane Fitness and TPI Tackle Clearance
    SYS->>SYS: Status: Pending Section Head Approval (Tower Incharge)

    Note over TI,SYS: PHASE 4: Tower Incharge Section Head Review
    TI->>SYS: approvePermitStage(TI) as Section Head
    alt Routine Lifting Flow (PTW-009A)
        SYS->>SYS: Status: Pending EHS Approval
    else Critical Lift Plan Flow (PTW-009B)
        SYS->>SYS: Status: Pending Project Manager Acknowledgment
        Note over PMgr,SYS: PHASE 5: Executive Domain Review (Critical Lift Only)
        PMgr->>SYS: approvePermitStage(project-manager) with Executive Clearance
        SYS->>SYS: Status: Pending EHS Approval
    end

    Note over EHS,SYS: FINAL PHASE: EHS Statutory Endorsement and Activation
    EHS->>SYS: approvePermitStage(EHS) [First-Wins Gate: Manager or Officer]
    SYS->>SYS: Status: Active (Lifting Operations Authorized)

    Note over LS,EHS: POST-ACTIVATION LIFECYCLES
    opt Safety Observation Raised
        EHS->>SYS: raiseObservation() [Status: Active - Observation Open]
        SYS-->>LS: Extension and Closure BLOCKED until rectified and cleared
        LS->>SYS: respondToObservation() + rectification photo
        SE->>SYS: acknowledgeObservationEng()
        TI->>SYS: approveObservationTI()
        EHS->>SYS: closeObservation() [Status: Active - Observation Resolved]
    end

    opt Temporal Permit Extension
        LS->>SYS: requestExtension() (Before 18:30 IST, Ceiling: 20:30 IST)
        TI->>SYS: approveExtensionStage(TI)
        EHS->>SYS: approveExtensionStage(EHS)
        SYS->>SYS: Status: Active (Extended)
    end

    Note over LS,SYS: TERMINAL PHASE: Completion and Mandatory Demobilization Gate
    LS->>LS: Crane boomed down and parked, lifting gear de-rigged, barricades cleared
    LS->>LS: Confirm Mandatory Demobilization and Safety Declaration (Form PTW-009A/B)
    LS->>SYS: closeAndSurrenderPermit with liftingDemobConfirmed, restorationPhoto, GPS and DPDP Sig
    SYS->>SYS: Status: Closed (Surrendered - Work Completed) [Statutory Form PTW-009A/B PDF Unlocked]
```

---


---

### 8.10 PTW-010 Night Shift Work: Dual-Phase Handover & 6-Signatory Governance

PTW-010 implements a specialized **Dual-Phase (Day-to-Night) Handover Architecture** with an 8:30 PM (20:30 IST) handover gate, mandatory dual site photos (Illumination + Activity Setup), 21:00 IST cutoff auto-cancel engine, P&M night inspection, and isolated EHS rejection:

```mermaid
sequenceDiagram
    autonumber
    box "Day Phase Swimlane (5:00 PM - 6:30 PM IST)"
        actor SSD as "Site Supervisor (Day Permittee)"
        actor SE as "Site Engineer (Day Verification)"
        actor TI as "Tower Incharge (Section Head)"
    end
    box "Night Handover & Verification Swimlane (8:30 PM IST)"
        actor SSN as "Night Site Supervisor (Night Permittee)"
        actor PM as "P&M Engineer (Night Inspection)"
    end
    box "Statutory Safety Swimlane"
        actor EHS as "EHS Safety (Manager / Officer)"
    end
    box "Core System Store & Engine"
        participant SYS as "System Store (PERMITS)"
    end

    Note over SSD,SYS: PHASE 1: Day Initiation and Daytime Approvals (5:00 PM - 6:30 PM)
    SSD->>SSD: Fill Form PTW-010 + Select Description + Check 13 Checklist Points
    SSD->>SYS: submitPermit(NIGHTSHIFT) [Photo deferred to 8:30 PM handover]
    SE->>SYS: acknowledgeSiteEngineer()
    TI->>SYS: approvePermitStage(TI)
    SYS->>SYS: Status: Night Shift Approved - Awaiting Linked Permit

    Note over SSD,SYS: PHASE 1 STAGE 2: Linked Daytime Activity Permit Unlocked
    SSD->>SYS: submitPermit(LINKED_ACTIVITY) [e.g. Hot Work, Electrical, Routine Lifting]
    TI->>SYS: approvePermitStage(TI) for Linked Permit
    SYS->>SYS: Both Permits advance to: Approved - Pending Night Handover

    Note over SSN,SYS: PHASE 2: 8:30 PM (20:30 IST) Night Handover Gate
    SSN->>SYS: openNightHandoverModal()
    SYS->>SYS: Validate Qualification Gate (PM Authorized + Training within 365 Days)
    SYS->>SYS: Enforce 21:00 IST Cutoff (No-show auto-cancels permits)
    SSN->>SYS: Capture Dual Photos (Workplace Illumination + Linked Activity Setup)
    SSN->>SYS: Digital Signature with DPDP Consent
    SYS->>SYS: Status: Pending P and M Night Acknowledgment

    Note over PM,SYS: STEP 5: PandM Night Shift Acknowledgment
    PM->>PM: Verify minimum lux levels (over 150 lux general, 300 lux precision)
    PM->>SYS: submitNightPmAck() (via openNightPmAckModal) with lighting & lux confirmation
    SYS->>SYS: Status: Pending EHS Approval

    Note over EHS,SYS: STEP 6: EHS Safety Verification and Strict Rejection Routing
    alt EHS Approves
        EHS->>SYS: approvePermitStage(EHS)
        SYS->>SYS: Both Night Shift and Linked Permits Activated (Status: Active)
    else EHS Rejects
        EHS->>SYS: rejectPermit()
        SYS->>SYS: Status: Returned to Night Supervisor (Day Approvers NOT re-engaged)
    end

    Note over SSN,SYS: TERMINAL PHASE: Morning Surrender (Site Supervisor Strictly Blocked)
    SSN->>SYS: openSurrenderFlow() exclusively as Night Site Supervisor
    SSN->>SYS: Confirm Mandatory Illumination De-energization Declaration
    SSN->>SYS: closeAndSurrenderPermit()
    SYS->>SYS: Status: Closed (Surrendered) [Official 6-Signatory Report Generated]
```

### 8.11 Cross-Cutting Workflow: Rejection & Resubmission (Stale-Approval Invalidation)
When an approver rejects a permit, only approvals whose fields changed are invalidated; approvals of unchanged sections persist.

```mermaid
sequenceDiagram
    autonumber
    box "Approving Authority Swimlane"
        actor Approver as "Any Rejecting Approver"
        actor PreviousApprover as "Unchanged Section Approver"
    end
    box "Site Operations Swimlane"
        actor SS as "Site Supervisor"
        actor SE as "Site Engineer"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Approver->>SYS: rejectPermit() with reason
    SYS->>SYS: Status: Returned for Correction
    SYS->>SYS: Record rejectionOrigin and lock unaffected sections
    SYS->>SS: Notification: Permit returned for correction
    Note over SS,SYS: Correction Phase
    SS->>SS: Update only rejected checklist responses / upload revised photo
    SS->>SYS: resubmitReturnedPermit()

    Note over SS,SYS: Physical Re-Acknowledgment
    SYS->>SE: Alert: Re-acknowledgment required
    SE->>SE: Verify corrections physically on-site
    SE->>SYS: acknowledgeSiteEngineer()

    Note over SYS,Approver: Fast-Track Routing and Stale-Approval Bypass
    SYS->>SYS: Evaluate modified fields vs previous approvals
    Note over PreviousApprover,SYS: Unchanged section approvals remain VALID (no re-approval required)
    SYS->>Approver: Fast-track route directly to rejecting authority
```

---

### 8.12 Cross-Cutting Workflow: Safety Observation & Stop-Work Lifecycle
EHS may intervene post-activation if an on-site deviation appears. While an observation is open, Extension and Closure are strictly blocked.

```mermaid
sequenceDiagram
    autonumber
    box "EHS Safety Authority Swimlane"
        actor EHS as "EHS Manager/Officer"
    end
    box "Site & Section Swimlane"
        actor SS as "Site Supervisor"
        actor SE as "Site Engineer"
        actor TI as "Tower Incharge"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over EHS,TI: Observation Raised by EHS
    alt Minor Deviation (Reject + Comment)
        EHS->>SYS: raiseObservation(type="deviation")
        SYS->>SYS: Status: Active (Observation Open)
        SYS-->>SS: Extension and Closure BLOCKED
        Note over SS,EHS: Remediation Phase
        SS->>SS: Rectify site condition + attach evidence photo + GPS
        SS->>SYS: respondToObservation()
        SE->>SYS: acknowledgeObservationEng()
        TI->>SYS: approveObservationTI()
        EHS->>SYS: closeObservation()
        SYS->>SYS: Status: Active (Observation Resolved)
        SYS-->>SS: Extension and Closure RESTORED
    else Critical Hazard (Cancel / Stop Work)
        EHS->>SYS: cancelPermit()
        SYS->>SYS: Status: Cancelled (Terminal)
        SYS-->>SS: All work permanently stopped [PDF generated]
    end
```

---

### 8.13 Cross-Cutting Workflow: Permit Extension Lifecycle (6:30 PM Cutoff & 8:30 PM Ceiling)
Permit extension request must be initiated before 18:30 IST. Extensions are capped at a hard validity ceiling of 20:30 IST (for standard works/drilling/lifting) and 18:30 IST (sunset hard stop for blasting).

```mermaid
sequenceDiagram
    autonumber
    box "Permittee Swimlane"
        actor SS as "Site Supervisor"
    end
    box "Review & Approval Swimlane"
        actor SE as "Site Engineer"
        actor TI as "Tower Incharge"
        actor EHS as "EHS Manager/Officer"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: Extension Request (Before 18:30 IST)
    SS->>SYS: requestExtension(duration up to 120 min)
    SYS->>SYS: Validate clock prior to 18:30 IST and validity ceiling
    SYS->>SYS: Status: Pending Site Engineer
    SYS->>SE: Alert: Extension acknowledgment required

    SE->>SYS: approveExtensionStage(SE)
    SYS->>SYS: Status: Pending Section Head
    SYS->>TI: Alert: Extension review required

    TI->>SYS: approveExtensionStage(TI)
    SYS->>SYS: Status: Pending EHS Approval
    SYS->>EHS: Alert: Extension final endorsement required

    EHS->>SYS: approveExtensionStage(EHS)
    SYS->>SYS: validTill extended [Status: Active]
    SYS-->>SS: In-App Alert: Extension APPROVED
```

---

### 8.14 Cross-Cutting Workflow: Work Completion, Housekeeping & Statutory Surrender Lifecycle (Closure Gate)

In heavy construction operations, hazardous work permits cannot simply lapse or be abandoned upon shift completion. Uncontrolled cessation introduces severe catastrophic risks: unextinguished embers in hot work zones, unbarricaded excavation trenches overnight, open floor penetrations without edge protection, unsealed confined spaces with residual gas accumulation, open hoist shafts, suspended crane loads left untethered, or uninspected blast misfires.

The system implements a **mandatory digital closure and statutory surrender gate** (`closeAndSurrenderPermit()`). Under the statutory governance model, **the Site Engineer does NOT have a closure option** — closure and statutory surrender is **strictly and exclusively reserved for the certified Permittee** (Site Supervisor for civil/structural works, Electrician for electrical works, Blasting In-charge for blasting works, and Lifting Supervisor for lifting operations). 

Executing this flow requires physical site restoration verification, discipline-specific declarations, photographic restoration evidence, on-site device GPS tagging within the geofence perimeter, DPDP consent, and the Permittee's legal digital signature. Successfully executing this flow transitions the permit immediately to the terminal `Closed` state (`Surrendered - Work Completed`) and unlocks statutory PDF generation for EHS leadership.

```mermaid
sequenceDiagram
    autonumber
    box "Certified Permittee Swimlane"
        actor SS as "Site Supervisor / Specialist Permittee (Exclusive Closure Authority)"
    end
    box "EHS Safety Swimlane"
        actor EHS as "EHS Manager / Officer"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: PHASE 1 - Physical Restoration Verification and Surrender Form
    SS->>SYS: openSurrenderFlow(permitId)
    SYS->>SYS: Pre-condition Check: Status === 'Active'
    SYS->>SYS: Pre-condition Check: currentUser is Authorized Permittee for ptype
    SYS->>SYS: Pre-condition Check: No Open Observation (status !== 'Open')
    SYS-->>SS: Render Discipline-Specific Restoration Form

    Note over SS: Mandatory Physical Declarations (Discipline-Specific):<br/>- PTW-001: Trench backfilled OR shoring safely left in place, hard barricades verified<br/>- PTW-002: 1-Hour continuous cold watch completed, gas cylinders isolated and stowed<br/>- PTW-003: Guardrails 100 percent re-fixed and bolted, zero open edge exposure<br/>- PTW-004: All entrants evacuated and accounted for, gas testing cleared, manholes bolted<br/>- PTW-005: Shaft openings sealed, green scaffold tag endorsed, hoist power locked out<br/>- PTW-006: Statutory LOTO removal and lock de-isolation certified by Electrician<br/>- PTW-007: Post-blast clearance certified, zero misfires confirmed, excess cartridges returned<br/>- PTW-008: Housekeeping and site clearance certified, loose panels and tools cleared<br/>- PTW-009A/B: Crane boomed down and parked, lifting gear de-rigged, drop zone cleared, demobilization certified by Lifting Supervisor

    Note over SS,SYS: PHASE 2 - On-Site Evidence, Geofence Tagging and Digital Signature
    SS->>SS: Inspect physical work front: housekeeping, scrap clearance, barrier integrity
    SS->>SYS: captureSurrPhoto(restorationPhoto)
    SS->>SYS: captureSurrGPS() [Enforces Device Haversine Radius]
    SS->>SYS: Enter Legal Signer Name + DPDP Consent Checkbox
    SS->>SYS: Sign on High-DPI Canvas Pad (drawDigitalSignature)
    SS->>SYS: Submit Surrender Form (closeAndSurrenderPermit)

    Note over SYS,EHS: PHASE 3 - Terminal State Mutation and Statutory PDF Release
    SYS->>SYS: Mutate Status to Closed (Surrendered)
    SYS->>SYS: Record Surrender Audit Stamp (Closed By, Timestamp IST, GPS, Signature)
    SYS->>SYS: Unlock Statutory PDF Generation with Complete Signatory Chain
    SYS->>EHS: Dispatch Notification: Permit Successfully Closed and Surrendered
```

#### Discipline-Specific Surrender & Restoration Gates

| Permit Type | Form ID | Mandatory Physical Restoration Checklist | Mandatory Evidence Gate |
|:---|:---|:---|:---|
| **PTW-001 Excavation** | `PTW-001` | 1. Trench backfilled or certified shoring securely anchored<br/>2. Class A rigid warning barricades and flashing caution beacons erected around perimeter<br/>3. Excavation machinery parked at safe distance (>2m from crest) with hydraulics locked | Mandatory on-site trench restoration photograph + device GPS coordinates |
| **PTW-002 Hot Work** | `PTW-002` | 1. Mandatory 1-hour continuous fire watch completed post-torch shutdown<br/>2. Cold area temperature check: zero smouldering slag or heated metal within 10m radius<br/>3. Gas cylinders isolated, regulators depressurized, torches detached and locked in ventilated storage | Mandatory cold-zone verification photograph + fire watch watcher endorsement |
| **PTW-003 Guard Rail** | `PTW-003` | 1. All temporary removed edge rails, floor hole covers, or toe boards 100% re-fixed and torqued<br/>2. Physical pull-test completed to verify 100 kg point load structural integrity<br/>3. No open penetration or fall hazard remaining without secondary collective protection | **Mandatory re-fixing verification photo gate** — submission blocked without photographic proof of restored barrier |
| **PTW-004 Confined Space** | `PTW-004` | 1. Entrant log reconciliation: 100% of workers confirmed exited and accounted for<br/>2. Ventilation blowers and continuous multi-gas monitors safely demobilized<br/>3. Manhole access hatch / cover replaced, bolted, and security tags affixed | Mandatory sealed manhole photo + attendant clearance sign-off |
| **PTW-005 Shaft Work** | `PTW-005` | 1. Working platform dismantled or green scaffold tag re-inspected and signed<br/>2. Shaft opening floor penetrations securely sheeted and bolted to prevent falling debris<br/>3. Materials, cables, and rigging gear completely removed from vertical void | Mandatory shaft mouth sealing photograph + MEP engineer coordination check |
| **PTW-006 Electrical Work** | `PTW-006` | 1. All personal padlocks, hasps, tags, and physical LOTO barriers removed<br/>2. Earthing switches opened, portable earth leads removed, and busbars cleared<br/>3. Enclosure covers, terminal boxes, and panel doors safely secured and bolted<br/>4. Mandatory Electrical De-Isolation & Restoration Declaration confirmed | **Mandatory Electrical De-Isolation Declaration** (`electricalClosureConfirmed: true`) + mandatory restoration photo gate |
| **PTW-007 Drilling & Blasting** | `PTW-007` | 1. Post-Blast site clearance completed: full visual sweep of blast floor conducted<br/>2. Zero misfires or unexploded charges confirmed by licensed Shot Firer<br/>3. All excessive explosive cartridges / lead wires accounted for and returned to licensed magazine<br/>4. Danger zone sentries stood down and warning sirens sounded all-clear | **Mandatory Post-Blast Clearance & Misfire Declaration** (`blastingClearanceConfirmed`) + mandatory restoration photo gate |
| **PTW-008 General Work** | `PTW-008` | 1. Working platforms, scaffolding, hoists, or formwork inspected and secured<br/>2. All tools, temporary lifting gear, and loose panels accounted for and removed<br/>3. Physical work area completely swept, scrap cleared, and waste disposed in designated bins<br/>4. Mandatory Housekeeping & Area Clearance declaration confirmed | **Mandatory Housekeeping & Area Clearance Certification** (`generalHousekeeping: true`) + mandatory restoration photo gate |
| **PTW-009A/B Lifting Ops** | `PTW-009A/B` | 1. Crane boomed down and securely parked in out-of-service position<br/>2. All lifting tackle, slings, shackles, and spreader beams de-rigged and inspected<br/>3. Drop zone barricades, warning signs, and traffic diversions removed<br/>4. Mandatory Demobilization & Safety Declaration confirmed | **Mandatory Demobilization & Safety Declaration** (`liftingDemobConfirmed: true`) + mandatory restoration photo gate |

---

### 8.15 Cross-Cutting Workflow: 4-Step Permit Creation & Initiation Wizard Flow (`WIZ_STEPS`)

All permits in the application are created using a standardized 4-step wizard interface (`WIZ_STEPS`), implementing strict sequential gating, in-line mathematical validation, interactive checklist feedback, and DPDP Act 2023 compliance.

```mermaid
sequenceDiagram
    autonumber
    box "Permittee & Site Team Swimlane"
        actor SS as "Site Supervisor (Permittee)"
        actor SE as "Site Engineer"
    end
    box "Wizard UI & Validation Swimlane"
        participant UI as "Creation Wizard UI"
        participant VAL as "Step Validator (validateWizStep)"
    end
    box "Geofencing & System Store Swimlane"
        participant GEO as "GPS & Geofence Engine"
        participant SYS as "Core System Store (PERMITS)"
    end

    Note over SS,UI: STEP 1: General Information and Engineering Setup
    SS->>UI: Select Project and Location Structure (Tower vs Basement/Podium vs Manual)
    UI->>VAL: Verify Project Configured Status
    alt Project GPS Not Configured (Uncalibrated Location)
        VAL-->>UI: Form LOCKED — Admin configuration required
        UI-->>SS: Display "Forms Locked" Alert (Creation Blocked)
    else Project GPS Active (e.g. PRJ-PEARL, PRJ-REGENT, PRJ-SANSA)
        VAL-->>UI: Project Validated
    end
    SS->>UI: Input Organization, Contractor Name, Discipline Parameters
    UI->>VAL: validateWizStep(1)
    VAL-->>UI: Enable "Next: Safety Checklist" Button

    Note over SS,UI: STEP 2: Interactive Statutory Safety Checklist and Site Photo Gate
    SS->>UI: Navigate to Step 2 (renderWizStep(2))
    UI->>UI: Dynamically render checklist items (12, 20, 9, 15, 10, 14, or dynamic items)
    loop For Every Inspection Item
        SS->>UI: Select Radio Option (YES / NO / NA)
        opt Response is "NO"
            UI-->>SS: Prompt Mandatory Explanation Comment (Photo/GPS not required)
            SS->>UI: Input Deviation Comment
        end
        opt Response is "N/A"
            UI-->>SS: Comment NOT required for N/A
        end
    end
    UI->>VAL: Check if 100 percent checklist items complete (checklistItemComplete)
    VAL-->>UI: Unlock Site Photo Option (Locked until checklist complete)
    SS->>UI: Capture Work-Area Site Photo (Mandatory gate before proceeding)
    UI->>VAL: validateWizStep(2) [all items complete + sitePhoto captured]
    VAL-->>UI: Enable "Next: Permit Validity" Button

    Note over SS,UI: STEP 3: Working Hours and Validity Bounds Engine
    SS->>UI: Navigate to Step 3 (renderWizStep(3))
    SS->>UI: Select Planned Start Time (HH:MM IST)
    UI->>VAL: Check startTime between 08:30 and 18:30 IST and startTime in future
    SS->>UI: Select Planned End Time (HH:MM IST)
    UI->>VAL: Check validTillTime after startTime and validTillTime at or before 19:30 IST
    VAL->>UI: Calculate Duration (mins) = validTillTime - startTime
    UI-->>SS: Display Duration Strip and Enable "Next: Review and Submit"

    Note over SS,UI: STEP 4: Review, DPDP Act 2023 Consent and Digital Signature
    SS->>UI: Navigate to Step 4 (renderWizStep(4))
    UI->>UI: Render full summary of inputs, coordinates, checklist and photos
    SS->>UI: Enter Signer Full Name ("R. K. Patel")
    SS->>UI: Check Statutory DPDP Act 2023 Consent Box
    SS->>UI: Draw Signature on High-DPI Canvas / Upload File
    UI->>VAL: validateWizStep(4) [signerVerified and signature.dataUrl]
    VAL-->>UI: Enable "Submit Permit for Acknowledgment" Button

    Note over SS,SYS: FINAL SUBMISSION and MANDATORY GPS CAPTURE
    SS->>UI: Click "Submit Permit"
    UI->>GEO: Prompt openGPSModal() (GPS captured ONLY on final submit)
    SS->>GEO: Capture Device GPS Location
    GEO->>GEO: haversine(deviceLat, deviceLng, siteLat, siteLng)
    alt Device Distance exceeds Allowed Project Radius
        GEO-->>UI: Out-of-Bounds Error (distance exceeds radius)
        UI-->>SS: Warning: Outside site geofence perimeter (Submission Blocked)
    else Device Distance within Allowed Project Radius
        GEO-->>UI: Geofence Verified (distance within radius)
        UI->>SYS: finalSubmitPermit(with captured GPS)
        SYS->>SYS: Assign ID (genPermitNumber) e.g. "EXC-2026-000008"
        SYS->>SYS: Initialize Approval Chain (newChain(ptype))
        SYS->>SYS: Record Signatory in p.signatories
        SYS->>SYS: Status = "Pending Site Engineer Acknowledgment"
        SYS->>SYS: Append to activityLog and Save LocalStorage
        SYS->>SE: Dispatch Real-Time Notification: "New Permit Awaiting Step 2 Acknowledgment"
        SYS-->>UI: Route to Permit Register with Success Toast
    end
```

#### Step-by-Step Validation Matrix (`validateWizStep`)

| Step | Form Step Name | Mandatory Input Fields | Boundary Conditions & Mathematical Validation | Next Button State |
|:---:|:---|:---|:---|:---|
| **1** | **General Information** | Project, Org, Contractor, Location, Discipline Parameters | 1. Project must have `configured === true`<br/>2. Contractor name mandatory if Org is Contractor/Subcontractor<br/>3. Tower mode requires Floor & Unit; Basement mode requires Level & Area; Manual mode requires Location & Area<br/>4. Excavation: numeric depth & slope, equipment array (drawing plan mandatory in Step 2)<br/>5. Hot Work: hotwork types array, welder name $\ge 2$ chars, affiliation<br/>6. Confined Space: activity, entrants $\ge 1$, declaration, gas readings<br/>7. Shaft Work: personnel $\ge 1$, scaff-tag verified, declaration<br/>8. Drilling & Blasting: Blasting requires charge $> 0$, diameter $> 0$, depth $> 0$, holes $\ge 1$, explosive type; Drilling requires machine type, diameter $> 0$, depth $> 0$, holes $\ge 1$; Location strictly locked to Manual<br/>9. Lifting Operations (PTW-009): **Pre-location digital signatures from Crane Operator and Signaler/Rigger are mandatory** before location mode can be selected; load weight, crane capacity, rigging geometry ($L, H$) evaluated with $N=2$ safety clamping<br/>*(Note: GPS is captured only at final submission; Site Photo is captured in Step 2)* | Disabled until all fields valid |
| **2** | **Safety Checklist** | All checklist items across permit form + Site Photo + Excavation Drawing (PTW-001 only) | 1. Every checklist item must satisfy `checklistItemComplete(item)`<br/>2. If answer is `NO`, comment is mandatory; photo and GPS are NOT required<br/>3. If answer is `N/A`, comment is NOT required<br/>4. **Site Photo option is locked and activated ONLY after all checklist questions are answered**<br/>5. Work-area site photo must be captured to proceed<br/>6. **PTW-001 Excavation: Excavation drawing plan is mandatory (`!!draft.drawing`)**<br/>7. PTW-007 Blasting requires 4 post-checklist rig parameters (`blastingRigHolesLoaded`, `blastingRigHoleDepthM` in meters, `blastingMufflerLayers`, `blastingSafeDistance` in meters) and Item 15 custom precautions (`dbOtherPrecautions`)<br/>8. PTW-009A/B: 14 statutory checklist items + Other Safety Precautions textarea bound to `draft.liftingSpecialPrecautions`; wind speed warning alerts ($\le 38\text{ km/h}$ mobile, $\le 45\text{ km/h}$ tower)<br/>9. Live progress bar updates $0\text{ to }100\%$ | Disabled until 100% complete, Site Photo captured, and Excavation Drawing attached (PTW-001) |
| **3** | **Permit Validity** | Planned Start Time, Planned End Time | 1. `startTime` must satisfy $08:30 \le t \le 18:30\text{ IST}$ (`START_LATEST_MIN`)<br/>2. `startTime` cannot be in the past ($t \ge \text{now()}$)<br/>3. `validTillTime` must be strictly greater than `startTime`<br/>4. `validTillTime` cannot exceed $19:30\text{ IST}$ (`OFFICE_END_MIN`), hard-capped at $18:30\text{ IST}$ for Blasting | Disabled until valid duration derived |
| **4** | **Review & Submit** | Signer Name, DPDP Consent, Canvas Signature | 1. Signer name string length $\ge 2$<br/>2. DPDP Act statutory consent checkbox checked<br/>3. Canvas signature pad has recorded strokes (`dataUrl` generated)<br/>4. **Final submission prompts GPS modal: device GPS distance $\le \text{radius}$ (`haversine`)** | Disabled until consent & signature captured |

---

### 8.16 Cross-Cutting Workflow: Administrative Site Geofencing & Worksite Radar Calibration Flow (`view-admin-config`)

The system enforces physical spatial boundaries to prevent off-site fraudulent approvals. Worksite boundaries are managed exclusively by the **Administrator** role through the interactive **Administrative Configuration & Geofence Radar View** (`view-admin-config`).

```mermaid
sequenceDiagram
    autonumber
    box "Administrator Swimlane"
        actor ADM as "System Administrator"
    end
    box "Admin UI & Radar Swimlane"
        participant UI as "Admin Config View"
        participant RAD as "HTML5 Canvas Radar (drawGeofenceRadar)"
    end
    box "System Geolocation & Registries Swimlane"
        participant GPS as "Device GPS / Geolocation API"
        participant DB as "Master Projects Registry (PROJECTS)"
        participant APP as "General System (Permit Wizard)"
    end

    ADM->>UI: Switch Role to Administrator (doLogin('admin'))
    ADM->>UI: Navigate to Admin Config View (goTo('admin-config'))
    UI->>DB: Read PROJECTS array and populate selector
    ADM->>UI: Select Project (e.g. "PRJ-SANSA - Sansa County")
    UI->>UI: Check project.configured status
    alt Project is Unconfigured (Forms Locked)
        UI-->>ADM: Display Red Status Banner: "Project GPS Not Configured (Forms Locked)"
    else Project is Configured & Active
        UI-->>ADM: Display Green Status Banner: "Project GPS Configured and Active"
    end

    Note over ADM,UI: Worksite Coordinate Tagging
    alt On-Site Hardware GPS Tagging
        ADM->>UI: Click "Go to Location and Tag (On-Site GPS)"
        UI->>GPS: navigator.geolocation.getCurrentPosition({enableHighAccuracy: true})
        GPS-->>UI: Return Lat, Lng with accuracy radius (+-4m)
        UI->>UI: Update Site Lat and Lng input fields
    else Simulated Worksite Calibration (Field Testing)
        ADM->>UI: Click "Simulate Tag (Test Worksite)"
        UI->>UI: Apply high-precision jittered site coordinates
    end

    Note over ADM,RAD: Interactive Geofence Tuning and Radar Rendering
    ADM->>UI: Adjust Radius Slider (or click Preset Pill: 50m, 100m, 150m, 200m, 500m)
    UI->>RAD: Trigger drawGeofenceRadar()
    RAD->>RAD: Clear canvas and render 4 concentric range rings (30, 60, 90, 120px)
    RAD->>RAD: Render dual-axis crosshairs aligned to center
    RAD->>RAD: Render circular geofence boundary with dashed stroke and orange fill
    RAD->>RAD: Render center worksite pin (Lat/Lng center)
    RAD->>RAD: Render simulated field personnel markers (green within / red outside)
    RAD->>RAD: Display telemetry: "Worksite Pin · Xm Geofence"

    Note over ADM,DB: Configuration Persistence and Form Unlocking
    ADM->>UI: Click "Save and Activate Geofence"
    UI->>UI: Open Confirmation Modal (openSaveGeofenceModal)
    ADM->>UI: Confirm Save
    UI->>DB: Mutate project: site.lat, site.lng, radius, configured = true
    UI->>DB: Set configuredAt = now(), configuredBy = "Project Admin (Worksite Administrator)"
    UI->>DB: saveState() to LocalStorage
    UI->>APP: Broadcast Project Configured Event
    APP->>APP: Unlock permit form creation for Site Supervisors
    UI-->>ADM: Show Green Toast: "Geofence activated. Permit forms unlocked."
```

#### Geofence Radar Mathematical & Visual Architecture

The canvas radar is drawn on `<canvas id="geofenceRadarCanvas" width="300" height="260">` using direct 2D context manipulation:

1. **Range Rings:** Concentric circles drawn at radii $r \in \{30\text{px}, 60\text{px}, 90\text{px}, 120\text{px}\}$ with stroke `rgba(255, 255, 255, 0.08)`.
2. **Crosshairs:** Bisecting horizontal and vertical center lines with stroke `rgba(255, 255, 255, 0.12)`.
3. **Dynamic Boundary Projection:** The physical radius $R_{\text{meters}}$ is mapped non-linearly to pixel radius $R_{\text{px}}$ to maintain crisp visibility across both compact ($50\text{m}$) and wide ($2000\text{m}$) perimeters:
   $$R_{\text{px}} = \text{clamp}\big(30, \, 25 + 4.4 \cdot \sqrt{R_{\text{meters}}}, \, 125\big)$$
4. **Perimeter Stroke & Fill:** Rendered with dashed line pattern `[6, 4]`, stroke color `#E8600A`, and background fill `rgba(232, 96, 10, 0.12)`.
5. **Spatial Personnel Simulation:**
   - **In-Bounds Beacon:** Plotted at $(x_c + 0.45 \cdot R_{\text{px}}, \, y_c - 0.35 \cdot R_{\text{px}})$ in emerald green (`#2E7D32`), demonstrating compliant on-site staff.
   - **Out-of-Bounds Beacon:** Plotted at $(x_c - 1.35 \cdot R_{\text{px}}, \, y_c + 0.80 \cdot R_{\text{px}})$ in ruby red (`#C62828`), demonstrating fraudulent off-site attempts that are blocked by the system.

---

### 8.17 Cross-Cutting Architecture: Application-Wide Deterministic Navigation & Consistency Engine

To ensure an enterprise-grade, deterministic user experience free of unpredictable UI jumps, scroll shaking, or orphaned modals, the application implements a dedicated **7-Layer Deterministic Navigation Architecture** across all screens, forms, dialogs, and workflows.

```mermaid
flowchart TD
    subgraph L1["Layer 1: Wizard Step Transitions"]
        W1["wizNext() / wizPrev() / goToWizStep(n)"] --> S0["window.scrollTo({ top: 0, behavior: 'instant' })"]
        S0 --> W2["Instant Top Alignment (0, 0) & Indicator Sync"]
    end

    subgraph L2["Layer 2: Interactive Gated Stepper"]
        ST1["#stepIndicator Node Click"] --> ST2{"Target Step Earlier than Current?"}
        ST2 -->|Yes: Backward Jump| ST3["Instant Access Granted without Validation"]
        ST2 -->|No: Forward Jump| ST4["Sequential Intermediate Validation Loop"]
        ST4 -->|All Intermediates Valid| ST5["Advance to Target Step"]
        ST4 -->|Any Intermediate Invalid| ST6["Block Jump, Toast & scrollToStepError()"]
    end

    subgraph L3["Layer 3: Smart Form Validation Guidance"]
        ERR["Step Validation Failure"] --> SE1["scrollToStepError(step)"]
        SE1 -->|Step 1: Master Data| SE2["Smooth Center on Invalid Field and Focus Input"]
        SE1 -->|Step 2: Checklist and Uploads| SE3["Smooth Center on Incomplete Item + pulseAttention glow / Dropzone"]
        SE1 -->|Step 3: Operating Hours| SE4["Smooth Center on Time Constraint Banner"]
        SE1 -->|Step 4: Review and Sign| SE5["Smooth Center on Signatory Name / Canvas"]
    end

    subgraph L4["Layer 4: In-Step Checklist Scroll Preservation"]
        CK["setChecklistAns() / capturePhoto / captureGPS"] --> SP1["Capture currentScroll = window.scrollY"]
        SP1 --> SP2["Mutate State & renderWizStep()"]
        SP2 --> SP3["Restore window.scrollTo({ top: currentScroll, behavior: 'instant' })"]
    end

    subgraph L5["Layer 5: Digital Signature Viewport Anchoring"]
        SIG1["continueWizToSignature() / continueModalToSignature()"] --> SIG2["Validate Signer & Consent -> Smooth Center on Signature Canvas"]
        SIG3["editWizSigner() / editModalSigner()"] --> SIG4["Reset Verified State -> Expand Inputs & Focus Signer Name"]
    end

    subgraph L6["Layer 6: Unified Modal Engine & Dismissal"]
        MOD1["openModal(id)"] --> MOD2["Reset .modal-body.scrollTop = 0 & Lock Background (body.modal-open)"]
        MOD3["closeModal(id)"] --> MOD4["Remove .show, Reset Scroll & Release Background Lock"]
        MOD5["Backdrop Click (e.target === modal) / Escape Key"] --> MOD3
    end

    subgraph L7["Layer 7: Top-Level Views & Browser History"]
        NAV["goTo(view) / viewDetail(id)"] --> NAV1["Dismiss all active modals & overlays"]
        NAV1 --> NAV2["Reset window.scrollTo({ top: 0, behavior: 'instant' })"]
        NAV2 --> NAV3["history.pushState(#view, #detail/id) & popstate Listener"]
    end
```

#### Detailed Layer Specifications

1. **Deterministic Step Transitions & Instant Top Alignment (`wizNext`, `wizPrev`)**:
   - Eliminates the browser's slow CSS smooth-scroll animation over large multi-step form heights that previously caused erratic scroll positioning.
   - Every wizard forward or backward step immediately resets the window viewport to coordinates `(0, 0)` via `window.scrollTo({ top: 0, behavior: 'instant' })`.

2. **Interactive Stepper with Sequential Forward Gating (`goToWizStep`)**:
   - The top `#stepIndicator` nodes display dynamic `.step-node.clickable` states for accessible steps.
   - Backward jumps to any earlier completed step are granted instantly without re-running draft validations.
   - Forward jumps to future steps are strictly validated in sequence (e.g. jumping from Step 1 to Step 3 validates Step 1 first; if Step 1 is invalid, it stays on Step 1, displays a warning toast, and invokes `scrollToStepError(1)`).

3. **Smart Validation Guidance with Attention Pulsing (`scrollToStepError`)**:
   - When a user clicks **Next** with missing fields, the viewport smoothly centers directly on the first offending element:
     - **Step 1**: Centers on `.form-field.invalid` or `.form-error` and focuses the relevant input.
     - **Step 2**: Centers on the first incomplete `.checklist-item` and applies the `@keyframes pulseAttention` CSS glow. If all items are answered but the work-area site photo or excavation drawing is missing, it smoothly centers on `#photoDropzone` or `#drawingDropzone`.
     - **Step 3**: Centers on `#startTimeError` or `#validTimeError`.
     - **Step 4**: Centers on `#seSignerName` or `#seSigPad-wrap`.

4. **In-Step Checklist Scroll Preservation**:
   - In Step 2, selecting answers (`YES`, `NO`, `N/A`), capturing GPS, or attaching photos triggers reactive DOM updates.
   - `setChecklistAns`, `captureChecklistPhoto`, `captureChecklistGPS`, and `captureSitePhoto` record `window.scrollY` prior to mutating state and instantly restore it post-render. The user never experiences scroll snapping or jumps to other checklist items.

5. **Signature Pad Viewport Anchoring**:
   - **Wizard Step 4**: Clicking **"Continue to Digital Signature"** validates signatory fields and smoothly centers `#seSigPad-wrap` into the viewport (`block: 'center'`). Clicking **"Change Signatory / Re-sign"** reveals the name input, smoothly centers on `#seSignerName`, and focuses the cursor.
   - **Action Modals**: In all approval, rejection, extension, and surrender modals, clicking **"Continue to Digital Signature"** smoothly centers `#modalSigBox`, while clicking **"Change Signatory / Re-sign"** reveals and focuses `#modalSignerName`.

6. **Unified Modal Lifecycle (`openModal`, `closeModal`)**:
   - 100% of modal activation calls across the platform route through `openModal(id)`.
   - Automatically resets `.modal-body.scrollTop = 0` to prevent orphaned scroll offsets when reopening modals.
   - Appends `.modal-open` (`overflow: hidden`) to `document.body` to lock background content scrolling while dialogs are active.
   - Clicking any modal backdrop (`e.target === modal`) or pressing the `Escape` key cleanly closes the topmost active modal.

7. **Top-Level Navigation & Browser History (`popstate`)**:
   - Calling `goTo(view)` or `viewDetail(id)` automatically dismisses open modal overlays, resets window scroll to `(0, 0)` instantly, and records browser history state (`pushState`).
   - Global `popstate` event listener enables native browser **Back** and **Forward** buttons to navigate seamlessly across dashboard, register, notifications, admin config, and permit detail views.

---

## 9. Escalation & Auto-Expiry Engine

In hazardous construction environments, an unacted permit in an approval queue or an unmonitored active permit represents an unacceptable operational and life-safety risk. The system incorporates an autonomous, real-time **Escalation & Auto-Expiry Engine** that operates continuously via a 5-second interval timer (`setInterval(runEscalationTick, 5000)`).

### 9.1 Escalation Architecture & Timer Pipeline

```mermaid
graph TD
    subgraph "Pending Stage Escalation Queue"
        A["Permit enters pending approval stage"] --> B["Record p.stageEnteredAt = now()"]
        B --> C{"Elapsed time at least 45s (demo) / 2h (prod)?"}
        C -->|Yes| D["Stage 1 SLA Breach<br/>Notify Tower Incharge & EHS Manager<br/>Set p.escalation.stage1 = true"]
        C -->|No| E["Continue monitoring tick loop"]
        D --> F{"Elapsed time at least 120s (demo) / 4h (prod)?"}
        F -->|Yes| G["Stage 2 SLA Breach<br/>Notify EHS Leadership (Manager & Officer)<br/>Set p.escalation.stage2 = true"]
    end

    subgraph "Active Permit Validity Timers"
        H["Permit Status: Active"] --> I{"Time remaining 30 mins or less (T-30)?"}
        I -->|Yes| J["30-Min Expiry Warning<br/>Notify Site Supervisor & Site Engineer<br/>Set p.warn30 = true"]
        J --> K{"Current time reaches or exceeds p.validTill?"}
        K -->|Yes| L{"Open Observation Exists?<br/>(p.observation.status !== 'Resolved')"}
        L -->|No| M["Status: Expired<br/>Broadcast Emergency Alert to All Stakeholders"]
        L -->|Yes| N["Status: Cancelled (isCancelled: true)<br/>EMERGENCY STOP-WORK AUTO-CANCEL<br/>Dispatch Incident Alerts"]
    end

    subgraph "Surrender Reminder Loop"
        O["Permit Status: Expired or Surrender-Pending"] --> P{"tickCount modulo 6 equals 0 (Every 30 seconds)?"}
        P -->|Yes| Q["Recurring Surrender Reminder<br/>Alert Site Supervisor to complete physical handback"]
    end
```

### 9.2 Real-Time Tick Engine Implementation (`runEscalationTick`)

Directly implemented in `index.html` (`lines 6168–6245`), the tick engine processes every permit in memory every 5000ms:

```javascript
function runEscalationTick() {
    const now = Date.now();
    let mutated = false;

    PERMITS.forEach(p => {
        // 1. Pending Approval Stage SLA Escalations
        if (p.status && p.status.includes('Pending') && p.stageEnteredAt) {
            const elapsedSeconds = (now - Date.parse(p.stageEnteredAt)) / 1000;
            if (!p.escalation) p.escalation = { stage1: false, stage2: false };

            // Stage 1 SLA Threshold: 45s (Demo) / 2 Hours (Production)
            if (elapsedSeconds >= 45 && !p.escalation.stage1) {
                p.escalation.stage1 = true;
                mutated = true;
                notify(['hw-section-head', 'ehs-manager'], 
                    `[STAGE 1 ESCALATION] Approval for ${p.id} (${p.project}) is delayed at stage: ${stageLabelFor(p)}. Immediate action required.`, 
                    'warn', p.id, 'escalation');
                logActivity(p, 'System Escalation', 'Stage 1 SLA breached (>45s in pending stage). Escalated to Tower Incharge & EHS Manager.');
            }

            // Stage 2 SLA Threshold: 120s (Demo) / 4 Hours (Production)
            if (elapsedSeconds >= 120 && !p.escalation.stage2) {
                p.escalation.stage2 = true;
                mutated = true;
                notify(['ehs-manager', 'ehs-officer'], 
                    `[STAGE 2 CRITICAL ESCALATION] Permit ${p.id} approval severely delayed at stage: ${stageLabelFor(p)}. Senior EHS intervention required.`, 
                    'error', p.id, 'escalation');
                logActivity(p, 'System Escalation', 'Stage 2 Critical SLA breached (>120s). Escalated to Senior EHS Leadership.');
            }
        }

        // 2. Active Permit Expiry & Stop-Work Automations
        if (p.status === 'Active' && p.validTill) {
            const till = Date.parse(p.validTill);
            const remainingSeconds = (till - now) / 1000;

            // T-30 Minute Close Warning
            if (remainingSeconds <= 1800 && remainingSeconds > 0 && !p.warn30) {
                p.warn30 = true;
                mutated = true;
                notify(['site-supervisor', 'site-engineer'], 
                    `[EXPIRY WARNING] Permit ${p.id} will expire in 30 minutes. Prepare work completion and site handback or request extension before 18:30 IST.`, 
                    'warn', p.id, 'warning');
                logActivity(p, 'System Timer', 'T-30 minute expiry warning triggered.');
            }

            // Natural Expiry vs Stop-Work Auto-Cancellation
            if (now >= till) {
                if (p.observation && p.observation.status !== 'Resolved') {
                    // Critical Life Safety Rule: Unresolved hazard upon expiry triggers immediate STOP-WORK AUTO-CANCEL
                    p.status = 'Cancelled';
                    p.isCancelled = true;
                    mutated = true;
                    notify('all', 
                        `[CRITICAL STOP WORK - AUTO-CANCELLED] Permit ${p.id} expired with an UNRESOLVED SAFETY OBSERVATION. Work is permanently stopped.`, 
                        'error', p.id, 'alert');
                    logActivity(p, 'Emergency Auto-Cancel', 'Permit validity expired with an open safety observation. Permit permanently cancelled.');
                } else {
                    p.status = 'Expired';
                    mutated = true;
                    notify('all', 
                        `[PERMIT EXPIRED] Permit ${p.id} has reached its validity limit (${fmtDateTime(p.validTill)}). All hot/hazardous operations must cease immediately.`, 
                        'error', p.id, 'alert');
                    logActivity(p, 'Auto-Expiry', 'Validity limit reached. Status transitioned to Expired.');
                }
            }
        }

        // 3. Recurring Surrender Reminder (Every 6th tick = 30 seconds)
        if ((p.status === 'Expired' || p.status.includes('Surrender')) && (tickCount % 6 === 0)) {
            notify(['site-supervisor', 'site-engineer'], 
                `[ACTION REQUIRED] Permit ${p.id} requires formal site closure and statutory surrender documentation.`, 
                'info', p.id, 'reminder');
        }
    });

    if (mutated) saveState();
}
```

### 9.3 Escalation Matrix & SLA Configuration

| Trigger Event | Elapsed Threshold (Demo) | Equivalent (Production) | Target Roles Dispatched | Severity | System Consequence |
|:---|:---|:---|:---|:---|:---|
| **Stage 1 SLA Delay** | $ge 45	ext{ seconds}$ | $2	ext{ hours}$ | Tower Incharge (`hw-section-head`), EHS Manager (`ehs-manager`) | `warn` (Amber) | Flags `p.escalation.stage1 = true`; logs warning in audit trail |
| **Stage 2 SLA Delay** | $ge 120	ext{ seconds}$ | $4	ext{ hours}$ | EHS Manager (`ehs-manager`), EHS Officer (`ehs-officer`) | `error` (Red) | Flags `p.escalation.stage2 = true`; alerts senior safety directors |
| **T-30 Minute Close Warning** | $le 1800	ext{ seconds}$ ($30	ext{m}$) | $30	ext{ minutes}$ | Site Supervisor (`site-supervisor`), Site Engineer (`site-engineer`) | `warn` (Amber) | Flags `p.warn30 = true`; alerts site front to begin housekeeping |
| **Natural Validity Expiry** | $	ext{Clock} ge 	ext{validTill}$ | Real-time IST | Broadcast to All Stakeholders (`'all'`) | `error` (Red) | Status transitions to `Expired`; all work must cease immediately |
| **Observation Auto-Cancel** | $	ext{Clock} ge 	ext{validTill}$ | Real-time IST | Broadcast to All Stakeholders (`'all'`) | `error` (Red) | **Emergency Stop-Work**: `status = 'Cancelled'`, `isCancelled: true` |
| **Surrender Handback Cycle** | Every $6\text{th}$ tick ($30\text{s}$) | $30\text{ minutes}$ | Site Supervisor (`site-supervisor`) | `info` (Blue) | Recurring reminder until statutory surrender is finalized by Site Supervisor |

---

## 10. Safety Observation Workflow

The **Safety Observation Engine** empowers EHS leadership to intervene directly on active permits when unsafe acts, equipment defects, atmospheric deviations, or structural hazards are detected on-site. The observation sub-flow establishes an independent **remediation state machine within the active permit**, freezing critical permit capabilities until full engineering rectification is verified.

### 10.1 Observation Sub-State Machine

```mermaid
stateDiagram-v2
    [*] --> Open : EHS raises observation via raiseObservation()
    
    note right of Open
        Active permit is locked:
        • Extension requests BLOCKED
        • Surrender & closure BLOCKED
        • Expiry timer triggers Auto-Cancel
    end note

    Open --> RectifiedAwaitingEngAck : Supervisor attaches comment + photo proof + GPS via respondToObservation()
    RectifiedAwaitingEngAck --> PendingSectionHead : Site Engineer verifies on-site via acknowledgeObservationEng()
    
    PendingSectionHead --> PendingEHS : Tower Incharge endorses via reviewObservationSectionHead()
    
    PendingEHS --> Open : EHS rejects rectification via rejectObservationEhs() (Fast-Track loop)
    PendingEHS --> Resolved : EHS conducts final sign-off via resolveObservation()
    
    Resolved --> [*] : Observation Cleared, Safety Locks Released, Status returns to Active
    
    Open --> Cancelled : Clock passes validTill before resolution (Emergency Stop-Work)
    RectifiedAwaitingEngAck --> Cancelled : Clock passes validTill before resolution
    PendingSectionHead --> Cancelled : Clock passes validTill before resolution
    PendingEHS --> Cancelled : Clock passes validTill before resolution
```

### 10.2 Comprehensive Operational Function Breakdown

The observation lifecycle is governed by 6 dedicated functions in `index.html`:

#### 1. `raiseObservation(permitId, comment, severity, gps)`
- **Authorized Roles**: Strictly `ehs-manager` and `ehs-officer`.
- **Pre-condition**: Permit must be in `Active` state.
- **State Mutation**:
  ```javascript
  p.observation = {
      id: 'OBS-' + uid(),
      raisedAt: istDateStr(),
      raisedBy: currentSignerName || 'EHS Authority',
      role: activeRole,
      severity: severity, // 'deviation' (minor) or 'stop_work' (major)
      comment: comment,
      gps: gps,
      status: 'Open',
      rejectionOrigin: null
  };
  ```
- **Safety Locking Effect**:
  - Sets permit status to `Active – Observation Open`.
  - Disables the "Request Extension" button (`if (p.observation && p.observation.status !== 'Resolved')`).
  - Disables the "Close & Surrender" button.
  - Engages the Auto-Cancel tripwire: if the permit reaches `validTill` before resolution, it will be automatically cancelled.

#### 2. `respondToObservation(permitId, comment, photo, gps)`
- **Authorized Role**: Strictly `site-supervisor` (the permittee).
- **Mandatory Inputs**: Corrective action narrative, mandatory photographic evidence of rectification, device GPS tag within geofence radius.
- **State Mutation**: `p.observation.status = 'Rectified – Awaiting Engineer Ack'`, records `p.observation.response = { comment, photo, gps, at: istDateStr() }`.
- **Notification**: Alerts `site-engineer` that on-site physical inspection is required.

#### 3. `acknowledgeObservationEng(permitId, comment, gps)`
- **Authorized Role**: Strictly `site-engineer`.
- **Operational Requirement**: Engineer physically walks to the work front to verify that the supervisor's photographic rectification reflects actual field conditions.
- **State Mutation**: `p.observation.status = 'Pending Section Head Review'`, records `p.observation.engineerAck = { by, comment, gps, at: istDateStr() }`.
- **Notification**: Routes task to Tower Incharge (`hw-section-head`).

#### 4. `reviewObservationSectionHead(permitId, comment, gps)`
- **Authorized Role**: Tower Incharge (`hw-section-head` or `section-head`).
- **Operational Requirement**: Reviews engineering feasibility and structural safety of the rectification.
- **State Mutation**: `p.observation.status = 'Pending EHS Clearance'`, records `p.observation.sectionHeadReview = { by, comment, at: istDateStr() }`.
- **Notification**: Routes task to EHS leadership (`ehs-manager`, `ehs-officer`).

#### 5. `rejectObservationEhs(permitId, comment)`
- **Authorized Role**: `ehs-manager` or `ehs-officer`.
- **Operational Condition**: EHS inspects the site and finds the rectification inadequate (e.g. guardrail re-fixed with undersized clamps or flammable debris still within 10m).
- **Fast-Track State Mutation**:
  ```javascript
  p.observation.status = 'Open';
  p.observation.rejectionOrigin = {
      roleKey: activeRole,
      roleLabel: activeRole === 'ehs-manager' ? 'EHS Manager' : 'EHS Officer',
      by: currentSignerName,
      comment: comment,
      at: istDateStr()
  };
  ```
- **Effect**: Bounces directly back to the Site Supervisor for re-rectification. When the supervisor re-responds and the Site Engineer re-acknowledges, the fast-track router skips Tower Incharge and returns directly to EHS.

#### 6. `resolveObservation(permitId, comment, sig, gps)`
- **Authorized Role**: `ehs-manager` or `ehs-officer`.
- **Operational Requirement**: Final physical safety sign-off with digital signature and GPS capture.
- **State Mutation**:
  ```javascript
  p.observation.status = 'Resolved';
  p.observation.clearedAt = istDateStr();
  p.observation.clearedBy = currentSignerName;
  p.status = 'Active'; // Restores clean Active state
  ```
- **System Consequence**: All safety locks are released; the permit can now be extended or formally closed and surrendered.

---

## 11. Extension Workflow

Construction activities frequently encounter unexpected technical delays (e.g. slow concrete slump, rock encounter during excavation, complex pipe fitting in shafts). Rather than allowing unauthorized work after hours, the system provides a **controlled, multi-stage Permit Extension Engine** subject to strict operational and temporal boundary rules.

### 11.1 Mathematical Boundary Conditions & Business Rules

The extension engine enforces four strict validation gates:

```
1. Work Started Gate:          Clock >= p.startTime
2. Single Active Queue:        !p.extension || p.extension.status !== 'pending'
3. 18:30 IST Request Cutoff:   Hours < 18  OR  (Hours === 18 AND Minutes <= 30)
4. 20:30 IST Ceiling Cap:      MaxExtension = min(120, 1230 - (CurrentHours * 60 + CurrentMinutes))
                               [where 1230 minutes = 20:30 IST] (Drilling & Standard Permits)
5. 18:30 IST Sunset Hard Stop: MaxExtension = min(120, 1110 - EndMinutes)
                               [where 1110 minutes = 18:30 IST] (Blasting Operations ONLY)
6. Safety Observation Lock:    !p.observation || p.observation.status === 'Resolved'
7. Night Shift Exclusion:      canLinkToNightShift(p) === false (PTW-007 strictly barred from Night Shift)
```

#### Mathematical Derivation of Validity Extension Cap (`extensionCapMinutes`)

Directly implemented in `index.html`:

```javascript
function extensionCapMinutes(p) {
    if (window.__TEST_MODE__ && (!p || (p.type !== 'blasting' && p.ptype !== 'blasting'))) return 180;
    const now = new Date();
    const currMinutes = now.getHours() * 60 + now.getMinutes();
    
    // PTW-007 Blasting Sunset Hard Stop Rule: Blasting operations strictly prohibited after sunset (18:30 IST)
    const isBlasting = p && (p.ptype === 'blasting' || p.type === 'blasting') && 
                       (p.operationCategory === 'blasting' || !p.operationCategory);
    
    if (isBlasting) {
        const sunsetMinutes = 18 * 60 + 30; // 18:30 IST (1110 minutes from midnight)
        let endMin = currMinutes;
        if (p.validTill) {
            const vt = new Date(p.validTill);
            if (!isNaN(vt.getTime())) endMin = Math.max(endMin, vt.getHours() * 60 + vt.getMinutes());
        }
        const remainingToSunset = sunsetMinutes - endMin;
        return Math.max(0, Math.min(120, remainingToSunset));
    }

    const hardCeilingMinutes = 20 * 60 + 30; // 20:30 IST (1230 minutes from midnight)
    const remainingToCeiling = hardCeilingMinutes - currMinutes;
    return Math.max(0, Math.min(120, remainingToCeiling));
}
```

### 11.2 3-Stage Approval Sequence

```mermaid
sequenceDiagram
    autonumber
    box "Permittee Swimlane"
        actor SS as "Site Supervisor (Permittee)"
    end
    box "Reviewers Swimlane"
        actor SE as "Site Engineer (Verification)"
        actor TI as "Tower Incharge (Review)"
        actor EHS as "EHS Manager / Officer (Endorsement)"
    end
    box "System Engine"
        participant SYS as "System Engine"
    end

    Note over SS,SYS: Extension Request Initiation
    SS->>SYS: openExtensionRequestModal()
    SYS->>SYS: Enforce: workStarted(p) === true
    SYS->>SYS: Enforce: isExtensionRequestAllowed() [Clock prior to 18:30 IST]
    SYS->>SYS: Compute: extensionCapMinutes(p) [Max Ceiling at or before 20:30 IST]
    SS->>SYS: Select Duration (30, 60, 90, 120 min) + Justification + GPS + Photo
    SS->>SYS: submitExtensionRequest()
    SYS->>SYS: Status: Pending Site Engineer
    SYS->>SE: Notification: Extension request awaiting physical check

    Note over SE,SYS: Stage 1 - Site Engineer Physical Re-Acknowledgment
    SE->>SE: Inspect work area: artificial lighting, worker fatigue, ambient safety
    SE->>SYS: approveExtensionStage(permitId, 'site-engineer')
    SYS->>SYS: Status: Pending Section Head
    SYS->>TI: Notification: Extension awaiting Tower Incharge review

    Note over TI,SYS: Stage 2 - Tower Incharge Review
    TI->>TI: Verify contractor evening deployment and coordination
    TI->>SYS: approveExtensionStage(permitId, 'hw-section-head')
    SYS->>SYS: Status: Pending EHS Approval
    SYS->>EHS: Notification: Extension awaiting final EHS sign-off

    Note over EHS,SYS: Stage 3 - Final EHS Endorsement (First-Wins Gate)
    EHS->>SYS: approveExtensionStage(permitId, 'ehs-manager')
    SYS->>SYS: Update p.validTill = oldTill + requestedMinutes
    SYS->>SYS: Set ext.status = 'approved', p.status = 'Active'
    SYS->>SYS: Broadcast: Extension Approved to All Stakeholders
```

### 11.3 Extension Rejection, Revision & Fast-Track Correction

- **Rejection Mechanism**: If Site Engineer, Tower Incharge, or EHS rejects the extension request (`rejectExtensionStage`), the permit status **immediately returns to `Active`** with its original `validTill`. Work is not abruptly stopped, but the supervisor knows work must wrap up at the original scheduled time.
- **Supervisor Revision (`openReviseExtensionModal`, `submitReviseExtensionRequest`)**: If the rejection was due to missing evening floodlight photos or excessive requested duration, the supervisor can revise the request.
- **Fast-Track Routing (`ext.isReAck`)**: When resubmitted, the system records `isReAck: true`. Once the Site Engineer re-acknowledges, the request bypasses earlier completed stages and routes directly back to the rejecting authority.

---

## 12. Notification Engine

The system features a **role-targeted, multi-cast message queue** that drives real-time collaboration across all construction stakeholders.

### 12.1 Architectural Implementation (`notify`)

Directly implemented in `index.html` (`lines 5040–5075`):

```javascript
function notify(roleTargets, message, severity = 'info', permitId = null, kind = 'general') {
    // 1. Normalize targets: accepts single string, array of strings, or 'all'
    const targets = Array.isArray(roleTargets) ? roleTargets : [roleTargets];
    
    const notif = {
        id: 'NOTIF-' + uid(),
        roles: targets,
        message: escapeHtml(message),
        severity: severity, // 'info' | 'warn' | 'error' | 'success'
        permitId: permitId,
        kind: kind,
        createdAt: istDateStr(),
        readBy: [] // Tracks role-specific read acknowledgments
    };

    // 2. FIFO Ring Buffer: Strict cap at 250 items
    NOTIFICATIONS.unshift(notif);
    if (NOTIFICATIONS.length > 250) {
        NOTIFICATIONS.pop(); // Evict oldest entry
    }

    // 3. UI Synchronization & Persistence
    refreshNotifBell();
    saveState();
}
```

### 12.2 Role Target Resolution & Alias Normalization

The notification dispatcher supports precise functional targeting and legacy alias resolution:

| Target Pattern | Resolved Roles | Operational Use Case |
|:---|:---|:---|
| `'site-supervisor'` | Site Supervisor (Permittee) | Form corrections, approval milestones, extension grants, closure & surrender (PTW-001–05, PTW-008) |
| `'electrician'` | Permittee Electrician | PTW-006 Electrical corrections, extensions, de-isolation surrender |
| `'blasting-incharge'` | Blasting / Drilling In-charge | PTW-007 corrections, drilling extensions, post-blast clearance surrender |
| `'site-engineer'` | Site Engineer | Initial acknowledgments, forwarder, Day 2 morning checks (no closure option) |
| `['mep', 'pm', 'it']` | Multi-cast Parallel Gate | Excavation parallel clearance requests |
| `'quality-engineer'` | Quality Engineer | PTW-006 Batching Plant insulation resistance clearance |
| `'excavation-head'` | **Excavation Head** | PTW-001 Excavation section head reviews, Day 2 checks |
| `'hw-section-head'` / `'section-head'` | **Tower Incharge** (Alias resolved) | Section head reviews for PTW-002–05, PTW-006 Site, PTW-008, escalations |
| `['ehs-manager', 'ehs-officer']` | EHS Leadership Team | Final safety endorsements, statutory audit reports, stop-work directives |
| `'admin'` | System Administrator | Geofence modifications, project parameter updates |
| `'all'` | Global System Broadcast | Auto-expiry alerts, emergency stop-work cancellations |

### 12.3 Storage Resilience & Quota Fallback

Mobile devices on construction sites often experience restricted LocalStorage allocations. The notification engine implements defensive storage management:
- **Default Ring Buffer**: Maximum 250 entries.
- **Quota Overflow Fallback**: If `saveState()` catches a browser `QuotaExceededError`, the engine automatically slices the notification array to the latest 120 items and re-attempts persistence without losing permit records.

### 12.4 UI Components

- **Notification Bell Badge**: Shows total unread count for the active role (capped at `99+` in CSS).
- **Slide-Out Drawer**: Chronological feed with severity color indicators (green success, amber warning, red error, blue info).
- **Deep-Link Navigation**: Every notification referencing a `permitId` includes a 1-tap "View Permit" button that instantly transitions the view to the relevant permit detail screen.
- **Mark All Read**: Role-scoped acknowledgment clearing the active user's unread counter.

---

## 13. GPS Geofencing & Proximity Verification

To eliminate fraudulent off-site approvals ("armchair approvals"), every signatory action requires cryptographic and physical verification that the approver is **within the defined spatial perimeter of the construction site**.

### 13.1 Mathematical Foundation: Haversine Great-Circle Distance

The distance $d$ between the approver's device GPS $(\phi_1, \lambda_1)$ and the project site center $(\phi_2, \lambda_2)$ is computed using the **Haversine formula on a spherical Earth model**:

$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \, \sqrt{1-a}\right)$$

$$d = R \cdot c \quad \text{where } R = 6{,}371{,}000\text{ metres (mean Earth radius)}$$

#### Code Implementation in `index.html` (`lines 5280–5295`):

```javascript
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in metres
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### 13.2 Enterprise Project Site Registry

The system includes pre-calibrated GPS coordinates, geofence radii, authoritative structural tower/zone configurations, and administrative configuration statuses for enterprise construction projects:

| Project ID | Project Name | Structural Tower / Zone Configuration | Site Center GPS ($Lat, Lng$) | Radius ($r$) | Administrative Status & Governance Scoping |
|:---|:---|:---|:---:|:---:|:---|
| **`PRJ-PEARL`** | **The Pearl** | `P1`, `P2`, `P3`, `P4`, `P5`, `P6`, `P7`, `Clubhouse`, `Podium`, `NTA_PHASE-1`, `NTA_PHASE-2`, `NTA_PHASE-3` | `17.4125° N, 78.3984° E` (Hitec City, Hyderabad) | $200\text{ m}$ | **Active Production Mega-Site:** Governed by Project Admin; permits, checklists, and geofencing calibrated. |
| **`PRJ-REGENT`** | **The Regent** | `Tower 4`, `Tower 5`, `NTA`, `Stores`, `FormWork`, `Precast`, `Phase-1` | `17.4371° N, 78.3612° E` (Financial District, Hyderabad) | $200\text{ m}$ | **Active Production Mega-Site:** Governed by Project Admin; high-rise structural tower zone mapping. |
| **`PRJ-SANSA`** | **Sansa County** | `Sector 1 - Zone 1 & 2`, `Sector 1 - Zone 03`, `Sector 1 - Zone 04`, `Podium Deck` | `17.4892° N, 78.3144° E` (Miyapur, Hyderabad) | $250\text{ m}$ | **Active Production Mega-Site:** Governed by Project Admin; expansive multi-zone civil development perimeter. |

### 13.3 Administrative Geofence Radar & Tagging Engine

The Administrator view features a high-performance **HTML5 Canvas Radar Display** (`drawGeofenceRadar()`) that visually plots:
- Concentric range rings in increments of 50m.
- The project perimeter boundary (rendered as a glowing circular stroke).
- The active approver's device GPS fix (rendered as a pulsing coordinate beacon).
- Real-time distance readout: `Distance: 42m (WITHIN GEOFENCE)` vs `Distance: 380m (OUTSIDE PERIMETER)`.
- Radius Presets: One-click selection pills for 50m, 100m, 150m, 200m, and 500m perimeters.

---

## 14. Digital Signature Engine

### 14.1 PointerEvents Canvas Architecture

Signatures are captured directly in the browser using the modern **Pointer Events API** (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`), providing unified hardware support for:
- Capacitive touchscreens (fingers on Android/iOS phones and tablets)
- Active styluses (Apple Pencil, Samsung S-Pen, Surface Pen with pressure sensitivity)
- Desktop pointer devices (mice and precision trackpads)

To prevent unwanted scrolling or page jumping during mobile signing, the canvas applies `touch-action: none`.

### 14.2 High-DPI Scaling & Stroke Interpolation

To eliminate blurriness on modern mobile Retina / OLED screens, the canvas initializes with sub-pixel resolution scaling:

```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```

Strokes are smoothed using **quadratic Bezier curve interpolation**, rendering smooth, vector-like signatures suitable for legal contracts and statutory PDF reports.

### 14.3 File Upload Alternative

For site teams equipped with scanned digital authorization stamps or corporate signature tokens, the engine provides a secure image upload alternative (`handleSigFile`):
- Client-side validation enforcing `image/png` or `image/jpeg` MIME types.
- Maximum payload limit of 2 MB.
- Automatic image aspect-ratio scaling onto the signature canvas.
- Re-encoding to standardized Base64 PNG data URLs.

### 14.4 DPDP Act 2023 Identity Binding & Consent

Under India's **Digital Personal Data Protection Act 2023**, systems must practice strict data minimization and purposeful consent. The system complies through:
1. **Dynamic Name Binding**: Approvers are never hardcoded. Functional roles (e.g. "Site Engineer") are filled by whichever individual engineer is physically on duty that day. The signer must type their legal name at the exact moment of signing.
2. **Explicit Consent Checkbox**: Every signature submission requires checking a mandatory legal declaration:
   > *"I confirm that I have physically inspected the site conditions, verified all statutory checklist items, and authorize this permit stage under ARPL Safety Governance Standards."*
3. **Immutable Timestamping**: Every signature is permanently tied to an Indian Standard Time (IST) timestamp and GPS coordinate block in the permit's `signatories` dictionary.

### 14.5 Viewport Anchoring & Signatory Re-Sign Flow

To maintain physical ergonomic alignment on hardware touchscreens, tablets, and mobile devices, the signature workflows integrate automated viewport anchoring:
- **Wizard Step 4 Anchoring (`continueWizToSignature`)**: Upon verifying the signatory's name ($\ge 2$ characters) and DPDP Act statutory consent, the window viewport smoothly centers on `#seSigPad-wrap` (`{ behavior: 'smooth', block: 'center' }`).
- **Action Modal Anchoring (`continueModalToSignature`)**: In action modals (approvals, rejections, observations, extensions, surrenders), confirming signatory details smoothly centers on `#modalSigBox`.
- **Re-Sign & Edit Signatory (`editWizSigner`, `editModalSigner`)**: Allows dynamically swapping the signatory (e.g., if another authorized colleague signs or a typo is corrected); resets signature data, expands input controls, smoothly centers the signatory name input, and automatically focuses the cursor.
- **Defensive Role Safety Fallback**: `roleInfo(key)` provides a crash-proof fallback `{ key: '', label: 'Authorized Signatory', ... }` if a null or undefined role key is encountered during modal dispatch.

### 14.6 Auto-Sign Simulation & Rapid Verification (`simulateNamedSigPad`)

To support rapid operational field testing, offline dry-runs, and headless test harness verification, every signature pad instance exposes an automated **Auto Sign** generator:
- **One-Click Generation**: Clicking the **"Auto Sign"** button calls `simulateNamedSigPad(canvasId, customName)`.
- **Procedural Calligraphic Rendering**: Synthesizes authentic, flowing cursive lettering for the designated signatory name onto the high-DPI HTML5 canvas using calibrated quadratic Bezier loops and flourishes.
- **Cryptographic PNG Encoding**: Automatically captures the canvas to a Base64 data URL, updates the status badge to `Signature captured`, binds the data to `actionModalCtx.sig` (or `draft.signature`), and enables immediate stage progression.

### 14.7 In-Place Modal DOM Mutation & Canvas Preservation

In complex multi-step modal workflows (Extension requests, Extension revisions, and Permit Surrender):
- **Isolated Target Containers**: GPS acquisition status badges and on-site camera / file attachments are housed in dedicated micro-containers (`#extGpsWrap`, `#extPhotoWrap`, `#surrGpsWrap`, `#surrPhotoWrap`).
- **Zero Canvas Teardown**: Capturing worksite coordinates or uploading photo evidence mutates only its specific target element, preserving `<canvas id="apprSigPad">` and any drawn/uploaded signature completely intact without DOM reconstruction.
- **Automatic Inking Restoration**: If a modal is reopened or redrawn, `initSigPad` detects existing signature state (`actionModalCtx.sig` or `draft.signature.dataUrl`) and immediately redraws the signature image onto the canvas context.
- **Touch-Action Containment & Immediate Dot Inking**: Canvas elements apply `touch-action: none` and `user-select: none` to prevent mobile scroll hijacking. Initial `pointerdown` / `touchstart` events draw an immediate circular point at the touch coordinates, ensuring single taps and dots are reliably captured.

### 14.8 Cross-Process Digital Signature Coverage Matrix

Digital signatures are strictly enforced and verified across all **10 operational processes**:

| Process / Workflow | Modal / View | Pad ID | Signatory Role | Statutory Retention |
|:---|:---|:---:|:---|:---|
| **1. Permit Initiation** | Wizard Step 4 | `seSigPad` | Permittee (Site Supervisor / Electrician / Blasting In-charge) | Stamped on official PDF report |
| **2. Approver Clearance** | Action Modal | `apprSigPad` | Site Engineer, MEP, P&M, Quality Engineer, Section Head, EHS | Stored in `signatories[rk]` |
| **3. Post-Correction Re-Ack** | Action Modal | `apprSigPad` | Site Engineer / P&M Engineer / Blasting In-charge | Recorded with rejection origin trace |
| **4. Drilling/Blasting Ack** | Action Modal | `apprSigPad` | Blasting In-charge (PESO declaration certified) | Linked to post-blast clearance |
| **5. Raise Safety Observation**| Observation Modal | `apprSigPad` | Safety Officer / EHS Manager / Observer | Stamped on Stop-Work notice |
| **6. Rectification Clearance** | Respond Modal | `apprSigPad` | Site Supervisor / Rectifier | Linked to photo evidence |
| **7. Extension Request** | Extension Modal | `apprSigPad` | Site Supervisor / Permittee Electrician | Subject to sunset/overtime cap |
| **8. Extension Revision** | Revise Modal | `apprSigPad` | Permittee | Re-submitted to approval chain |
| **9. Close & Surrender** | Surrender Modal | `apprSigPad` | Site Supervisor / Permittee | Backfill / De-isolation certified |
| **10. Geofence Configuration**| Admin Modal | `apprSigPad` | Project Admin (Worksite Administrator) | Authorizes worksite coordinates |

---

## 15. Statutory PDF Generation

### 15.1 Strict Role-Based Security Enforcement

Statutory safety permits are legally sensitive compliance records subject to regulatory scrutiny by government labour and factory inspectors. To prevent unauthorized extraction or tampering:

```javascript
function generatePermitPDF(p) {
    // STRICT SECURITY GATE: Enforces EHS Leadership Access Only
    if (activeRole !== 'ehs-manager' && activeRole !== 'ehs-officer') {
        showToast('Access Denied: Only EHS Manager or Officer can download statutory PDFs.', 'err');
        return;
    }
    // ... jsPDF Document Construction ...
}
```

- **Pre-Approval Masking**: During pre-approval stages (`Draft`, `Pending Parallel Approval`, `Pending Section Head`), the PDF download button is completely hidden from all users.
- **Post-Activation Unlocking**: Once a permit reaches `Active`, `Expired`, `Closed`, or `Cancelled`, the button appears, but remains strictly locked to non-EHS roles.

### 15.2 jsPDF Architecture & Multi-Page Document Layout

The PDF engine constructs an enterprise-grade statutory report rendered on standard **A4 portrait geometry (210mm × 297mm)**:

1. **Header Block**: ARPL Corporate Safety Crest, Form Reference Code (`PTW-001` through `005`), Unique Permit ID, Status Watermark (`ACTIVE`, `CLOSED`, `CANCELLED`), and Generation Timestamp (IST).
2. **Section 1: General Project Information**: Project Name, Location / Tower, Exact Work Grid, Floor Level, Contractor Name, Site Supervisor Name, Total Worker Count, and Validity Window.
3. **Section 2: Engineering Discipline Metadata**:
   - Excavation: Depth, slope ratio, soil type, machinery deployment, underground drawings confirmation.
   - Hot Work: Welder ID, welding process, 10m combustible clearance, continuous fire watch declaration.
   - Confined Space: 4-parameter gas readings ($	ext{O}_2, 	ext{LEL}, 	ext{CO}, 	ext{H}_2	ext{S}$), ventilation certification, attendant name.
   - Shaft Work: Shaft type, floor range (from-to), scaffold green tag number and validity date.
4. **Section 3: Comprehensive Safety Checklist**: Tabular matrix of all mandatory checklist items, displaying the question text, response (`YES` / `NO` / `NA`), auditor comments, and photographic evidence tags.
5. **Section 4: Full Signatory Chain & Audit Trail**: Visual matrix containing every actor's role, legal name, action decision, IST timestamp, GPS distance from site center, and high-resolution reproduction of their digital signature.
6. **Section 5: Safety Observations & Remediation Audit**: If observations were raised, records the hazard description, EHS auditor name, supervisor's rectification response, photo reference, and clearance sign-offs.
7. **Section 6: Permit Extension Authorizations**: If extended, documents the requested duration, engineering justification, and approval sequence.
8. **Section 7: Immutable Chronological Activity Log**: Complete timeline of every state transition, resubmission, rejection, and timer event recorded on the permit.

---

## 16. Role-Specific Dashboards & KPIs

To provide immediate operational focus without information overload, the system renders a customized dashboard view tailored to each of the 10 roles.

### 16.1 KPI Card Calculation Dictionary

| Role | KPI Card Label | Exact JavaScript Calculation Formula | Operational Meaning |
|:---|:---|:---|:---|
| **Site Supervisor** | **My Drafts** | `PERMITS.filter(p => p.status === 'Draft').length` | Incomplete permits being prepared (PTW-001–05, PTW-008) |
| | **In Approval Chain** | `PERMITS.filter(p => p.submittedAt && p.status.includes('Pending')).length` | Permits currently progressing through approvals |
| | **Active Permits** | `PERMITS.filter(p => p.status === 'Active').length` | Live civil, structural & general permits under supervisor's charge |
| | **Open Observations** | `PERMITS.filter(p => p.observation && p.observation.status !== 'Resolved').length` | Hazards requiring immediate site rectification |
| | **Extension Requests** | `PERMITS.filter(p => p.extension && p.extension.status === 'pending').length` | Active overtime requests under review |
| | **Closed Permits** | `PERMITS.filter(p => p.status === 'Closed').length` | Successfully surrendered and archived permits |
| **Permittee Electrician** | **My Drafts** | `PERMITS.filter(p => p.ptype === 'electrical' && p.status === 'Draft').length` | Incomplete PTW-006 electrical permits being prepared |
| | **In Approval Chain** | `PERMITS.filter(p => p.ptype === 'electrical' && p.submittedAt && p.status.includes('Pending')).length` | Electrical permits progressing through dual-topology approvals |
| | **Active Electrical Permits** | `PERMITS.filter(p => p.ptype === 'electrical' && p.status === 'Active').length` | Live HT/LT electrical works under active LOTO protocol |
| | **Open Observations** | `PERMITS.filter(p => p.ptype === 'electrical' && p.observation && p.observation.status !== 'Resolved').length` | Electrical safety deviations requiring rectification |
| | **Extension Requests** | `PERMITS.filter(p => p.ptype === 'electrical' && p.extension && p.extension.status === 'pending').length` | Electrical shutdown extension requests under review |
| | **Closed & De-isolated** | `PERMITS.filter(p => p.ptype === 'electrical' && p.status === 'Closed').length` | Safely de-isolated and surrendered electrical permits |
| **Blasting / Drilling In-charge** | **Pending My Acknowledgment** | `PERMITS.filter(p => p.ptype === 'blasting' && (p.status === 'Pending Blasting In-charge Acknowledgment' \|\| p.status === 'Pending Blasting In-charge Re-Acknowledgment')).length` | Blasting permits waiting for statutory PESO acknowledgment |
| | **Active Blasting Permits** | `PERMITS.filter(p => p.ptype === 'blasting' && p.status === 'Active').length` | Live blasting/drilling operations under licensed supervision |
| | **Acknowledged by Me** | `PERMITS.filter(p => p.ptype === 'blasting' && p.signatories?.['blasting-incharge']).length` | Historical blasting permits endorsed |
| | **Total Closed** | `PERMITS.filter(p => p.ptype === 'blasting' && p.status === 'Closed').length` | Completed blasts surrendered with post-blast clearance |
| **Site Engineer** | **Pending Acknowledgment** | `PERMITS.filter(p => p.status === 'Pending Site Engineer Acknowledgment').length` | New submissions awaiting initial on-site check (all 8 types) |
| | **Active On-Site** | `PERMITS.filter(p => p.status === 'Active').length` | Active permits operating on the project |
| | **Archived Closed** | `PERMITS.filter(p => p.status === 'Closed').length` | Completed works on site (surrendered by Permittee) |
| **MEP Engineer** | **Pending Clearance** | `PERMITS.filter(p => roleCanActOnChain(p.approvals, 'mep')).length` | Utilities clearances (PTW-001 Excavation, PTW-005 Shaft, PTW-006 Site) |
| **P&M Engineer** | **Pending Plant / LOTO Clearance** | `PERMITS.filter(p => roleCanActOnChain(p.approvals, 'pm')).length` | Machinery clearance (PTW-001, PTW-006 Site) & LOTO Ack (PTW-006 BP) |
| **IT Engineer** | **Pending IT Clearance** | `PERMITS.filter(p => roleCanActOnChain(p.approvals, 'it')).length` | Data/fibre optic route clearance (PTW-001 Excavation) |
| **Quality Engineer** | **Pending Quality Clearance** | `PERMITS.filter(p => roleCanActOnChain(p.approvals, 'quality-engineer')).length` | Insulation resistance & megohm test clearance (PTW-006 BP) |
| **Excavation Head** | **Pending My Approval** | `PERMITS.filter(p => p.ptype === 'excavation' && roleCanActOnChain(p.approvals, 'excavation-head')).length` | Excavation permits waiting for section head decision |
| | **Approved by Me** | `PERMITS.filter(p => p.approvals?.sectionHead?.status === 'approved' && p.ptype === 'excavation').length` | Historical excavation permits endorsed |
| **Tower Incharge** | **Pending My Approval** | `PERMITS.filter(p => roleCanActOnChain(p.approvals, 'hw-section-head')).length` | Permits (PTW-002–05, PTW-006 Site, PTW-008) waiting for review |
| | **Pending Extension Approval** | `PERMITS.filter(p => p.extension && p.extension.stage === 'sectionHead').length` | Overtime requests awaiting section head decision |
| | **Approved by Me** | `PERMITS.filter(p => p.approvals?.sectionHead?.status === 'approved' && p.ptype !== 'excavation').length` | Historical permits endorsed by Tower Incharge |
| **EHS Manager / Officer** | **Active Permits** | `PERMITS.filter(p => p.status === 'Active').length` | Total active hazardous works under safety audit (all 9 types) |
| | **Pending Endorsement** | `PERMITS.filter(p => roleCanActOnChain(p.approvals, activeRole)).length` | Permits awaiting final safety activation (first-wins gate) |
| | **Open Observations** | `PERMITS.filter(p => p.observation && p.observation.status !== 'Resolved').length` | Active safety non-conformances on site |
| | **Total Closed** | `PERMITS.filter(p => p.status === 'Closed').length` | Archived permits available for statutory PDF |
| **Administrator** | **Total Permits** | `PERMITS.length` | System-wide permit volume across all 9 modules (PTW-001 to PTW-009A/B) |
| | **Geofence Configured** | `PROJECTS.filter(p => p.configured).length` | Projects with tagged GPS and active geofences |
| | **Config Ratio** | `Math.round((PROJECTS.filter(p => p.configured).length / PROJECTS.length) * 100) + '%'` | Geofence governance compliance percentage |

### 16.2 Mathematical Proof of Empty-State Resilience

In high-reliability enterprise systems, dashboards must never crash when starting with an uninitialized or empty permit database (`PERMITS = []`). The system's KPI engine guarantees zero-state resilience:
- Array filtering on empty arrays returns `[]`, whose `.length` evaluates strictly to `0`.
- All arithmetic operations guard against division by zero (e.g. `PROJECTS.length ? (configured / PROJECTS.length) * 100 : 0`).
- Property accesses utilize optional chaining (`p.approvals?.sectionHead?.status`) or fallback null coalescing (`p.tower || ''`).
- Verified across 100% of automated tests.

---

## 17. Permit Register & Advanced Filtering

### 17.1 Universal Common Register Heading Across All Roles

To maintain an unfragmented enterprise audit interface, the Permit Register enforces a **single, consistent heading and subtitle across all 15 roles**:
- **Title**: `<i class="fa-solid fa-table-list"></i> Permit Register`
- **Subtitle**: `Digital safety authorization & permit-to-work tracking register`

Role-divergent headings (such as `"My Permits (Supervisor)"`, `"Site Permits"`, or `"Hot Work & Shaft Work Permit Register"`) have been replaced with this unified title. Personal role context is cleanly separated into user profile badges and sidebar navigation, while the register presents an authoritative statutory interface.

### 17.2 Statutory Requested By & Section Head Actor Alignment

Every permit record strictly reflects its designated statutory applicant and Section Head authority:

| Permit Code | Permit Type | Statutory Requested By | Role Key | Statutory Section Head | Role Key |
|:---|:---|:---|:---|:---|:---|
| **PTW-001** | Excavation Work | **Site Supervisor** | `site-supervisor` | **Excavation Head** | `excavation-head` |
| **PTW-002** | Hot Work | **Site Supervisor** | `site-supervisor` | **Tower Incharge** | `hw-section-head` |
| **PTW-003** | Guard Rail & Floor Protection | **Site Supervisor** | `site-supervisor` | **Tower Incharge** | `hw-section-head` |
| **PTW-004** | Confined Space Entry | **Site Supervisor** | `site-supervisor` | **Tower Incharge** | `hw-section-head` |
| **PTW-005** | Shaft Work | **Site Supervisor** | `site-supervisor` | **Tower Incharge** | `hw-section-head` |
| **PTW-006** | Electrical Work (Site) | **Permittee Electrician** | `electrician` | **Tower Incharge** | `hw-section-head` |
| **PTW-006** | Electrical Work (Batching Plant) | **Permittee Electrician** | `electrician` | **Quality Engineer** | `quality-engineer` |
| **PTW-007** | Drilling & Blasting | **Blasting In-charge** | `blasting-incharge` | **Tower Incharge** | `hw-section-head` |
| **PTW-008** | General Work | **Site Supervisor** | `site-supervisor` | **Tower Incharge** | `hw-section-head` |
| **PTW-009A** | Routine Lifting Operations | **Lifting Supervisor** | `lift-supervisor` | **Tower Incharge** | `hw-section-head` |
| **PTW-009B** | Critical Lift Plan | **Lifting Supervisor** | `lift-supervisor` | **Tower Incharge & Project Manager** | `hw-section-head` / `project-manager` |

#### Applicant & Section Head Helper Architecture:
- `requestedByRoleFor(p)`: Resolves the functional applicant role (`'electrician'`, `'blasting-incharge'`, `'lift-supervisor'`, or `'site-supervisor'`).
- `requestedByLabelFor(p)`: Returns the clean human-readable title (`'Electrician'`, `'Blasting In-charge'`, `'Lifting Supervisor'`, or `'Site Supervisor'`).
- `requestedByDisplayFor(p)`: Renders formatted identity (e.g., `Mohith (Site Supervisor)`, `V. Sharma (Electrician)`, `PESO Blaster Khan (Blasting In-charge)`, or `K. Reddy (Lifting Supervisor)`).
- `shRoleFor(p)`: Resolves the statutory Section Head role (`'excavation-head'`, `'quality-engineer'`, or `'hw-section-head'`).
- `shLabelFor(p)`: Returns the statutory Section Head label (`'Excavation Head'`, `'Quality Engineer'`, or `'Tower Incharge'`).

### 17.3 Approval-Flow Visibility Isolation Matrix

Permit visibility is strictly restricted to roles that actively participate in the lifecycle and approval workflow of the permit. Roles outside the approval flow cannot view the permit in the register, dashboards, or via direct URL lookup.

```javascript
function isPermitVisibleToRole(p, roleKey) {
    if (!roleKey || !p) return false;
    if (roleKey === 'admin') return true;
    const stakeholders = stakeholdersFor(p);
    return stakeholders.includes(roleKey);
}
```

#### Complete 15-Role Visibility Matrix:

| Role | Key | PTW-001 Excavation | PTW-002 Hot Work | PTW-003 Guard Rail | PTW-004 Confined | PTW-005 Shaft | PTW-006 Electrical (Site) | PTW-006 Electrical (BP) | PTW-007 Drilling & Blasting | PTW-008 General Work | PTW-009A Routine Lifting | PTW-009B Critical Lift |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Site Supervisor** | `site-supervisor` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Permittee Electrician** | `electrician` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Blasting In-charge** | `blasting-incharge` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Lifting Supervisor** | `lift-supervisor` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Site Engineer** | `site-engineer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **MEP Engineer** | `mep` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **P&M Engineer** | `pm` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **IT Engineer** | `it` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Quality Engineer** | `quality-engineer`| ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Excavation Head** | `excavation-head` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tower Incharge** | `hw-section-head`  | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Project Manager** | `project-manager`  | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **EHS Manager** | `ehs-manager`      | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EHS Officer** | `ehs-officer`      | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Administrator** | `admin`          | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

#### Enforcement Across Views:
1. **Permit Register**: `filteredPermits = PERMITS.filter(p => isPermitVisibleToRole(p, currentUser.key))` isolates table records before search and filter evaluation.
2. **Dashboard Feeds & KPI Cards**: Initiator, Site Engineer, and Domain Approver dashboards filter all aggregate counts and recent activity lists through `isPermitVisibleToRole(p, rk)`.
3. **Detail View Gate (`viewDetail(id)`)**: If a user attempts to access a permit outside their approval flow, access is denied immediately with a warning toast (`Access Denied: This permit is outside your role's approval workflow`), redirecting the user back to the register.

### 17.4 Multi-Field Tokenized Search

The Permit Register implements an instant, real-time search engine that parses search queries across multiple object fields simultaneously:

```javascript
function permitMatchesScope(p, q, statusFilter, projectFilter, typeFilter) {
    if (statusFilter && p.status !== statusFilter) return false;
    if (projectFilter && p.project !== projectFilter) return false;
    if (typeFilter && p.ptype !== typeFilter) return false;

    if (q) {
        const query = q.toLowerCase().trim();
        const matchesId = (p.id || '').toLowerCase().includes(query);
        const matchesProject = (p.project || '').toLowerCase().includes(query);
        const matchesLoc = (p.location || '').toLowerCase().includes(query);
        const matchesContractor = (p.contractor || '').toLowerCase().includes(query);
        const matchesTower = (p.tower || '').toLowerCase().includes(query);
        const matchesType = (p.ptype || '').toLowerCase().includes(query);

        if (!matchesId && !matchesProject && !matchesLoc && !matchesContractor && !matchesTower && !matchesType) {
            return false;
        }
    }
    return true;
}
```

### 17.5 Chronological Newest-First Sorting

Permits are always rendered in reverse chronological order based on creation timestamp:

```javascript
const sortedPermits = filteredPermits.slice().sort((a, b) => {
    return new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0);
});
```

This guarantees that high-priority new submissions and newly escalated permits appear at the top of every auditor's list.

---

## 18. Responsive Design Architecture

### 18.1 Multi-Tier Breakpoint System

The application layout is engineered with a **mobile-first, adaptive CSS grid and flexbox architecture** structured across 6 distinct hardware tiers:

| Viewport Tier | Width Range | Target Devices | Layout & UX Strategy |
|:---|:---|:---|:---|
| **Compact Mobile** | $le 360	ext{px}$ | Small phones (iPhone SE, Galaxy A-series) | Single-column fluid; condensed headers; compact modal padding; 14px secondary fonts |
| **Standard Mobile** | $361	ext{px} - 580	ext{px}$ | Standard smartphones (iPhone 14/15, Galaxy S23) | Full-width cards; stacked action buttons; bottom-sheet modal drawers; sticky bottom action bar |
| **Tablet Portrait** | $581	ext{px} - 768	ext{px}$ | iPad Mini, Android tablets portrait | 2-column KPI grid; collapsible slide-out drawer; horizontal scroll tables |
| **Tablet Landscape** | $769	ext{px} - 960	ext{px}$ | iPad Pro, tablets landscape, small laptops | 3-column KPI grid; split wizard view; expanded table columns |
| **Desktop / Laptop** | $961	ext{px} - 1919	ext{px}$ | Laptops, office monitors, site command screens | Persistent sidebar; multi-column approval workflows; full analytics tables |
| **Ultra-Wide / 4K** | $ge 1920	ext{px}$ | 4K command centers, dual-monitor setups | Max container width capped at `1560px` with auto margins to preserve optical ergonomics |

### 18.2 Mobile Bottom-Sheet Modals, Unified Modal Engine & Navigation Drawer

On viewports below `580px`, modals transform dynamically from centered desktop dialogs into **ergonomic bottom sheets**:
- `align-items: flex-end` anchors dialogs to the bottom edge.
- `border-radius: 16px 16px 0 0` creates a tactile mobile card aesthetic.
- Max height constrained to `92dvh` with smooth momentum scrolling (`-webkit-overflow-scrolling: touch`).
- Slide-out mobile navigation drawer activated by top-bar hamburger toggle (`toggleMobileNav()`).

#### Unified Modal Engine & Scroll Lock Lifecycle (`openModal`, `closeModal`)
- **Single Entry Point (`openModal(id)`)**: 100% of modals across the application (`actionModal`, `gpsModal`, `photoModal`) are invoked through `openModal()`.
- **Scroll Offset Reset**: Automatically executes `el.querySelector('.modal-body').scrollTop = 0` on every opening, preventing orphaned scroll offsets from previous user actions.
- **Background Scroll Lock**: Appends `body.modal-open` (`overflow: hidden`) to the document body, preventing underlying page content from scrolling or rubber-banding while a modal is displayed.
- **Global Backdrop Dismissal**: Any tap/click directly on the `.modal-overlay` outside the `.modal-box` invokes `closeModal(modal.id)`.
- **Keyboard `Escape` Handling**: A global `keydown` event listener detects the `Escape` key (key code 27) and cleanly dismisses the topmost active modal while releasing the scroll lock.

### 18.3 Touch Ergonomics & Accessibility

- **WCAG 2.1 AAA Tap Targets**: All buttons, radio pills, and checklist options enforce a minimum dimension of $44	ext{px} 	imes 44	ext{px}$ via `@media (pointer: coarse)`.
- **iOS Safari Zoom Elimination**: All form inputs, selects, and textareas enforce `font-size: 16px` minimum, preventing iOS Safari from triggering disruptive auto-zoom upon focus.
- **Safe Area Insets**: Incorporates `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to account for camera notches and home indicator bars.

---

## 19. Data Persistence & State Management

### 19.1 Global Data Schema Dictionary

The system state is maintained in 4 core global structures synchronized with browser LocalStorage:

```javascript
// 1. PERMITS Array: Primary Permit Store
PERMITS = [
    {
        id: "DB-2026-000001",
        ptype: "blasting",              // "excavation" | "hotwork" | "guardrail" | "confined" | "shaft" | "blasting"
        project: "Auro Grand Residency",
        locationMode: "manual",         // Strictly "manual" for PTW-007
        location: "Open Quarry Pit - Zone North",
        contractor: "Apex GeoBlasting Ltd",
        supervisor: "K. R. Verma",
        workerCount: 6,
        validFrom: "2026-09-09",
        validTill: "2026-09-09T18:30",
        startTime: "10:00",
        // PTW-007 Technical Parameters
        operationCategory: "blasting",  // "blasting" | "drilling"
        dbDateTime: "2026-09-09T14:30",
        dbChargeAmount: 45.5,           // Total charge (kg) > 0
        dbBlastDiameter: 0.115,         // Blast hole diameter (m) > 0
        dbBlastDepth: 6.0,              // Blast hole depth (m) > 0
        dbHolesCount: 24,               // Total holes >= 1
        dbExplosiveType: "Emulsion Explosives",
        dbMachineType: "Crawler Drilling Rig", // For drilling
        dbDrillDiameter: 0.115,         // For drilling
        dbDrillDepth: 6.0,              // For drilling
        dbOtherPrecautions: "Seismic monitors calibrated at 150m radius",
        // Blasting Post-Checklist Parameters
        blastingRigHolesLoaded: 24,
        blastingRigHoleDepthM: 6.0,      // Rig hole depth in meters
        blastingRigHoleDepthFt: 6.0,     // Backward compatibility mirror
        blastingMufflerLayers: 2,
        blastingSafeDistance: 2.5,       // Safe distance between rig holes in meters (numeric)
        blastingStatutoryDecl: true,     // Large high-contrast PESO statutory declaration card
        blastingInchargePhoto: "data:image/...", // Statutory on-site photo
        blastingClearanceConfirmed: true, // Post-Blast clearance at closure
        status: "Active",               // Operational lifecycle state
        submittedAt: "2026-09-09T08:00:00+05:30",
        activatedAt: "2026-09-09T09:30:00+05:30",
        stageEnteredAt: "2026-09-09T09:30:00+05:30",
        approvals: { kind: "blasting", ehsManager: {...}, ehsOfficer: {...} },
        signatories: { "blasting-incharge": {...}, "site-engineer": {...}, "ehs-manager": {...} },
        checklist: [ { ans: "yes", comment: "", photo: null, gps: null }, ... ],
        observation: null,
        extension: null,
        activityLog: [ { at: "...", text: "...", by: "..." }, ... ]
    }
];

// 2. NOTIFICATIONS Array: Real-Time Message Queue (Max 250 items)
NOTIFICATIONS = [
    {
        id: "NOTIF-001",
        roles: ["hw-section-head", "ehs-manager"],
        message: "[STAGE 1 ESCALATION] ...",
        severity: "warn",
        permitId: "EXC-2026-000001",
        createdAt: "2026-09-06T09:45:00+05:30",
        readBy: []
    }
];

// 3. PROJECTS Array: Geofence & Master Site Registry
PROJECTS = [
    {
        id: "PRJ-PEARL",
        name: "The Pearl",
        towers: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "Clubhouse", "Podium", "NTA_PHASE-1", "NTA_PHASE-2", "NTA_PHASE-3"],
        site: { lat: 17.4125, lng: 78.3984, address: "The Pearl, Hitec City, Hyderabad, Telangana" },
        radius: 200,
        configured: true,
        tagMethod: "GPS_FIX"
    }
];

// 4. Permit Sequence Counter
permitSeq = 1;
```

### 19.2 State Lifecycle & Persistence Engine

State synchronization follows a deterministic, unidirectional transaction loop synchronized with the single production key `const STORAGE_KEY = 'arpl_ehs_ptw_state_v16_prod'`:

```mermaid
graph TD
    A["User Action / Approval / Escalation Tick"] --> B["In-Memory State Mutation (PERMITS, NOTIFICATIONS)"]
    B --> C["Append Immutable Audit Entry to activityLog"]
    C --> D["saveState() Invocation"]
    D --> E{"LocalStorage Quota OK?"}
    E -->|Yes| F["Persist Complete State JSON to STORAGE_KEY"]
    E -->|Quota Exceeded| G["Execute Quota Fallback Algorithm"]
    G --> H["Strip Base64 Media Blobs (exceeding 200 chars) to 'demo'"]
    H --> I["Truncate Notifications to 120 items"]
    I --> J["Persist Slim State to STORAGE_KEY"]
    F --> K["Trigger View Re-render (Dashboards, Registers, Badges)"]
    J --> K
```

#### Production Quota Fallback Algorithm (`saveState`)
Mobile and enterprise browsers impose strict $5\text{MB}$ LocalStorage quotas. When multiple high-resolution photos or canvas drawing data URLs exceed this boundary:
1. `saveState()` catches the `QuotaExceededError`.
2. A deep clone `slim` is created, pruning notification queue from 250 down to 120 items.
3. Every base64 payload $>200$ characters across `sitePhoto`, `checklist[i].photo`, `drawing.dataUrl`, `extension.photo`, `closure.photo`, and `surrender.photo` is sanitized to the lightweight string `'demo'`.
4. Heavy digital signatures ($>4000$ characters) in `p.signature.dataUrl` and approval chain nodes are set to `null` while preserving verified signer identity, DPDP consent tags, timestamps, and GPS fixes.
5. The business state is safely saved without data loss or user disruption.

### 19.3 Seed Data Generation Architecture (`seedPermits`)

To enable immediate, zero-friction demonstration and automated end-to-end testing, the application incorporates a comprehensive synthetic data generator (`seedPermits()`):
* **Multi-Discipline Coverage:** Pre-populates realistic records across all 9 permit types: Excavation (`PTW-001`), Hot Work (`PTW-002`), Guard Rail Removal (`PTW-003`), Confined Space Entry (`PTW-004`), Shaft Work (`PTW-005`), Electrical Work (`PTW-006`), Drilling & Blasting (`PTW-007`), General Work (`PTW-008`), and Lifting Operations & Critical Lift Plan (`PTW-009A/B`).
* **Multi-State Representation:** Generates permits spanning active construction, pending parallel discipline gates (MEP, P&M, IT), open safety observations, returned-for-correction refilling, pending extensions, expired states, and completed surrender archives.
* **Deterministic Signatures:** Stamps cryptographic-style SVG/canvas signatures (`stampSeedSignatures()`) across role approval chains to validate UI rendering across desktop and mobile screens.
* **Demo State Reset:** Executing `resetDemoData()` cleans the `STORAGE_KEY` cache and cleanly re-seeds all 15+ baseline permits.
---

## 20. Unified Component Library

The application's visual architecture is powered by a comprehensive, design-tokenized CSS design system:

### 20.1 Design Token System (`:root`)

```css
:root {
    /* Core Brand Tokens */
    --navy: #0A1628;          /* Primary topbar & header background */
    --navy-2: #0F1E33;        /* Sidebar & elevated surface background */
    --navy-3: #16283F;        /* Secondary dark container background */
    --orange: #E8600A;        /* Primary brand accent & action button color */
    --orange-dark: #C94F06;   /* Active button state & hover accent */
    
    /* Neutral Canvas & Surface Tokens */
    --bg: #F7F8FA;            /* Main application canvas background */
    --surface: #FFFFFF;       /* Card, table & modal surface background */
    --border: #E2E5EA;        /* Standard subtle border for cards & inputs */
    --border-strong: #CBD1DA; /* High-contrast border for focused/active states */
    --text: #1B2431;          /* Primary high-contrast body text */
    --text-muted: #5B6472;    /* Secondary captions, subtitles & metadata */
    --text-faint: #889099;    /* Placeholder typography & disabled icons */
    
    /* Semantic Status Colors with Dedicated Background & Border Tiers */
    --amber: #9A6400;         /* Warning & pending approvals */
    --amber-bg: #FDF1DC;      /* Warning pill & alert banner background */
    --amber-brd: #F0D8A8;     /* Warning border token */
    --green: #1E7A3D;         /* Success, approved, active permits */
    --green-bg: #E6F5EA;      /* Success pill background */
    --green-brd: #BFE3CB;     /* Success border token */
    --blue: #1B5FAE;          /* Informational status & Site Engineer step */
    --blue-bg: #E7F1FC;       /* Informational pill background */
    --blue-brd: #BCD8F5;      /* Informational border token */
    --grey: #5B6472;          /* Neutral/draft status */
    --grey-bg: #EEF0F3;       /* Neutral pill background */
    --grey-brd: #D8DCE2;      /* Neutral border token */
    --red: #B3261E;           /* Danger, rejected, cancelled, expired */
    --red-bg: #FBEAE9;        /* Danger pill & stop-work background */
    --red-brd: #F1C4C1;       /* Danger border token */
    --purple: #6941C6;        /* Extension pipeline accent */
    --purple-bg: #F1EBFC;     /* Extension pill background */
    --purple-brd: #DCC9F5;    /* Extension border token */
    --teal: #0E7C86;          /* Safety observation & rectification accent */
    --teal-bg: #E3F6F7;       /* Observation pill background */
    --teal-brd: #BEE7EA;      /* Observation border token */
    
    /* Layout & Elevation Tokens */
    --radius: 8px;            /* Standard unified border-radius */
    --shadow-sm: 0 1px 2px rgba(10, 22, 40, .06);
    --shadow-md: 0 6px 20px rgba(10, 22, 40, .12);
    --shadow-lg: 0 20px 50px rgba(10, 22, 40, .28);
    --font-ui: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
```

### 20.2 Component Specifications

- **Action Buttons (`.btn`)**: `.btn-primary` (solid orange), `.btn-ghost` (bordered transparent), `.btn-danger` (red emergency stop), `.btn-sm` (table action pill).
- **Status Pills (`.status-pill`)**: Micro-components dynamically styled based on state (e.g. `.pill-active`, `.pill-pending`, `.pill-cancelled`, `.pill-expired`).
- **Modal Containers (`.modal`)**: Backdrop blur overlays with responsive bottom-sheet transforms on mobile devices.
- **Notification Drawers (`.notif-drawer`)**: Slide-out panels with momentum scrolling and badge synchronizers.
- **Toast Notifications (`.toast`)**: Auto-dismissing transient alerts positioned at top-right (desktop) or top-center (mobile).

---

## 21. Security & Compliance

### 21.1 Threat Modeling & Attack Surface Mitigation

| Threat Vector | Potential Vulnerability | Mitigation Implemented in `index.html` |
|:---|:---|:---|
| **Cross-Site Scripting (XSS)** | Injection via text fields (comments, contractor names, locations) | All inputs rendered to DOM pass through `escapeHtml()` encoding `&`, `<`, `>`, `"`, `'` |
| **Cross-Site Request Forgery (CSRF)** | Unauthorized approval actions via forged requests | Architecture runs client-side without session cookies; all actions require local state evaluation |
| **Privilege Escalation** | Low-privilege role attempting EHS approval or PDF generation | `roleCanActOnChain()` and `generatePermitPDF()` enforce strict role validation gates |
| **Replay & Timestamp Tampering** | Replaying expired approvals | Timestamps recorded in ISO format with explicit IST offset; state transitions checked against validTill |
| **Off-Site Fraudulent Signatures** | Signers approving from outside the construction site | Haversine GPS geofence calculator enforces maximum physical proximity radius |

### 21.2 DPDP Act 2023 Statutory Compliance Matrix

| Statutory Requirement | System Implementation | Verification Evidence |
|:---|:---|:---|
| **Purpose Limitation** | Only data strictly required for physical safety governance is captured | No financial, Aadhaar, or biometric credentials collected |
| **Notice & Explicit Consent** | Every signature screen displays mandatory statutory consent checkbox | `consent: true` flag stored with every signature record |
| **Dynamic Identity Binding** | Signer personal names are not pre-populated into functional roles | Legal names entered dynamically at the moment of signing |
| **Auditability & Traceability** | Immutable activity log tracks every action, actor, timestamp, and GPS fix | Reproducible in statutory jsPDF audit reports |
| **Data Retention & Storage** | Localized storage without third-party ad trackers or telemetry beacons | Zero external tracking scripts or CDN analytics |

---

## 22. Testing & Quality Assurance

The system is validated by an autonomous, zero-dependency Node.js test suite comprising **1,250+ automated test assertions with a 100% pass rate across 30 specialized master test suites**.

### 22.1 Test Suite Execution

```bash
# Execute master test suite (runs all 28 suites sequentially)
npm test
# OR
node tests/run_all_tests.js
```

### 22.2 Test Architecture & Coverage Breakdown

```
tests/
├── run_all_tests.js                     # Master Runner: orchestrates all 30 test suites sequentially
├── run_full_test_suite.js               # Suite 1: Base Lifecycle, Core Approvals & Parallel Gates (185 tests)
├── run_extended_audit_tests.js          # Suite 2: Extended Audit, Notifications, Escalation & Filters (77 tests)
├── test_tracker_labels.js               # Suite 3: UI & PDF Section Head Dynamic Label Resolution Tests
├── test_navigation_application_wide.js  # Suite 4: Application-Wide Deterministic Navigation & Consistency (19 tests)
├── test_responsive_viewports.js         # Suite 5: Responsive Design & Cross-Device Ergonomics (15 tests)
├── test_location_selection_mode.js      # Suite 6: Location Selection Mode & Safety Restriction Matrix (10 tests)
├── test_initiator_pages_and_form_activation.js # Suite 7: Universal Initiator Architecture & Form Activation Compliance (10 Sections)
├── test_register_actors_and_visibility.js # Suite 8: Permit Register Common Heading, Actors & Approval-Flow Visibility (7 Sections)
├── test_submission_drawing_flow.js      # Suite 9: Permit Submission Flow & Mandatory Drawing Plan Verification
├── test_pt01_excavation.js              # Suite 10: PTW-001 Excavation Work Specification & Compliance (15 Sections)
├── test_pt02_hot_work.js                # Suite 11: PTW-002 Hot Work Specification & Compliance (14 Sections)
├── test_pt03_guard_rail.js              # Suite 12: PTW-003 Guard Rail Specification & Compliance (14 Sections)
├── test_pt04_confined_space.js          # Suite 13: PTW-004 Confined Space Entry Specification & Compliance (15 Sections)
├── test_pt05_shaft_work.js              # Suite 14: PTW-005 Shaft Work Specification & Compliance (14 Sections)
├── test_pt06_electrical_work.js         # Suite 15: PTW-006 Electrical Work (HT/LT) Specification & Compliance (13 Sections)
├── test_pt07_drilling_blasting.js       # Suite 16: PTW-007 Drilling & Blasting Specification & Compliance (13 Scenario Groups)
├── test_digital_signature_pad.js        # Suite 17: Digital Signature Pad Engine & Cross-Process Compliance (6 Sections)
├── test_pt08_general_work.js            # Suite 18: PTW-008 General Work Specification & Compliance (14 Sections)
├── test_audit_remediation_security.js   # Suite 19: Forensic Audit Remediation, Security & Runtime Robustness (7 Sections)
├── test_dynamic_config_architecture.js  # Suite 20: Dynamic & Configuration-Driven Enterprise Architecture (9 Sections)
├── test_pt09_lifting_operations.js      # Suite 21: PTW-009 Lifting Operations & Critical Lift Plan (PTW-009A/B) (14 Sections)
├── test_draft_and_pt09_subtables.js     # Suite 22: Draft Resumption, Sub-Table Scroll Fix & Part A/B Checkboxes (6 Sections)
├── test_pt10_night_shift.js             # Suite 23: PTW-010 Night Shift Work & Dual-Phase Handover (12 Sections)
├── test_sunday_work_tile.js             # Suite 24: Sunday Work Tile & Weekend Governance (9 Sections)
├── test_dynamic_enterprise_features.js  # Suite 25: Dynamic Enterprise Architecture, Multi-Project & Contractor Governance (11 Sections)
├── test_ptw006_007_009_deep_verification.js # Suite 26: PTW-006, 007, 009 Deep Specification & Workflow Verification (12 Sections)
├── test_dual_deletion_and_auth_cleanup.js # Suite 27: Atomic Dual-Deletion, Ghost Purge & User Lifecycle Security (6 Sections)
├── test_role_switcher_and_project_admin.js # Suite 28: Dynamic Role/Location Switchers & Project Admin Taxonomy Standard (5 Sections)
├── test_universal_responsive_and_navigation.js # Suite 29: Universal Responsive Design, Viewport Ergonomics & Navigation Validation (7 Sections)
└── test_gps_calibration_and_projects.js # Suite 30: Worksite GPS Calibration, Authoritative Towers & Geofence Radii Audit (4 Sections)
```

#### Suite 1: Base Lifecycle & Core Engines (185 Assertions)
- **State Machine Transitions (all permit types)**: Positive approvals, negative rejections, and cancellation terminal locks.
- **3-Way Parallel Gate Evaluator**: Validates concurrent approvals across MEP, P&M, and IT; ensures no sequential deadlocks.
- **Section Head Specialization**: Proves PTW-001 Excavation requires Excavation Head (`excavation-head`), while PTW-002 through PTW-005, PTW-006 (Site), and PTW-008 require Tower Incharge (`hw-section-head`).
- **Single EHS Approver Clearance Rule**: Validates that first approval by either EHS Manager or Officer locks the stage and advances permit to Active.
- **Stale-Approval Invalidation & Fast-Track Routing**: Proves that rejection by Excavation Head preserves parallel clearances; proves re-ack routes directly back to rejector.
- **Safety Observation Lifecycle**: Proves observation blocks extension and closure; tests 4-stage rectification flow; verifies fast-track return to EHS.
- **Permit Extension Engine**: Tests 18:30 IST request cutoff gate; tests 20:30 IST hard validity ceiling; tests 3-stage extension approval pipeline.
- **Gas Reading Safety Evaluator (PTW-004)**: Tests safe and dangerous boundary conditions across $\text{O}_2, \text{LEL}, \text{CO}, \text{H}_2\text{S}$.
- **Checklist Integrity & Gating Rules**: Validates that NO requires comment without photo/GPS; N/A requires no comment; Site Photo is gated until 100% checklist completion; GPS is captured on final submission.
- **Site Supervisor Exclusive Closure**: Verifies that Site Engineer closure is rejected (`engCloseResult === false`) and only Site Supervisor can execute closure & surrender.

#### Suite 2: Extended Audit, Security & UI Math (77 Assertions)
- **Notification Engine & Role Dispatch**: Single-role, multi-role, alias resolution (`hw-section-head` <-> `section-head`), broadcast (`'all'`), and `markAllRead()`.
- **15-Role RBAC Scoping & Filtering**: Proves role scoping across all 15 project roles including Excavation Head, Tower Incharge, Quality Engineer, Lifting Supervisor, and Project Manager.
- **Escalation & Auto-Expiry**: Stage 1 SLA (45s), Stage 2 SLA (120s), T-30 minute close warning, natural expiry at `validTill`, and **emergency auto-cancel on open observation**.
- **PDF Generation & Role Security**: Proves strict denial of PDF generation to non-EHS roles; verifies clean execution for EHS Manager and Officer across all permit types.
- **KPI Dashboard Calculations**: Validates KPI card counts for Supervisor, Engineer, Excavation Head, Tower Incharge, and Administrator; **proves zero-division and undefined resilience on empty permit store (`PERMITS = []`)**.
- **Register Search & Filters**: Multi-field tokenized search across ID, Contractor, Location, Tower; validates null-safety on optional fields; verifies newest-first sorting.

#### Suite 3: Section Head Dynamic Label Resolution
- **Static Token Resolution**: Asserts that `trackerHtml`, `extTrackerHtml`, and `openApprovalGPS` resolve `"Excavation Head"` for PTW-001 and `"Tower Incharge"` for PTW-002 through PTW-005, PTW-006 (Site), and PTW-008.
- **Runtime Tracker Rendering**: Validates that permit detail approval trackers, extension trackers, and modals dynamically reflect module-specific Section Head designations.

#### Suite 4: Application-Wide Deterministic Navigation & Consistency (19 Comprehensive Tests)
- **Wizard Step Transitions & Instant Top Scroll (`wizNext`, `wizPrev`)**: Validates sequential transitions (Step 1 -> 2 -> 3 -> 4) and asserts instant `(0, 0)` scroll reset.
- **Interactive Stepper Gating (`goToWizStep`)**: Validates backward instant jump access without re-validation and verifies sequential forward validation blocking with error toasts.
- **Smart Validation Guidance (`scrollToStepError`)**: Validates auto-scrolling directly to the first invalid field (Step 1), incomplete checklist item with `pulseAttention` glow or missing upload dropzone (Step 2), timing error banner (Step 3), and signatory input / canvas (Step 4).
- **In-Step Checklist Scroll Preservation**: Asserts that selecting `YES`, `NO`, `N/A`, entering multi-gas readings, capturing GPS, or attaching photos strictly preserves `window.scrollY` across DOM updates.
- **Signature Viewport Anchoring**: Asserts that `continueWizToSignature()` and `continueModalToSignature()` smoothly center `#seSigPad-wrap` and `#modalSigBox`; asserts that `editWizSigner()` and `editModalSigner()` center and focus `#seSignerName` and `#modalSignerName`.
- **Defensive Role Safety**: Asserts that `roleInfo(undefined)` and `roleInfo(null)` safely return fallback object without throwing.
- **Unified Modal Engine**: Validates `openModal()` scroll reset (`scrollTop = 0`) and scroll lock (`body.modal-open`); validates `closeModal()` scroll reset and lock release.
- **Modal Dismissal Mechanics**: Validates backdrop click dismissal (`e.target === modal`) and global `Escape` key event handling.
- **Top-Level Navigation & Browser History**: Asserts that `goTo(view)` and `viewDetail(id)` dismiss open modals, reset scroll to `(0, 0)`, push history states, and respond cleanly to `popstate` events.

#### Suite 5: Responsive Design & Cross-Device Ergonomics (15 Tests)
- **Mobile Phones (< 580px)**: Bottom-sheet modals (`align-items: flex-end`, border-radius `18px 18px 0 0`, max-height `92dvh`), reverse-stacked footer action buttons, 1-column form/cards, isolated body scroll.
- **Ultra-Compact Phones (<= 360px)**: 24px step nodes, 4px connecting lines, compact topbar title truncation, tight card padding.
- **Phablets & Tablets (Portrait) (<= 768px)**: Inputs forced to $\ge 16\text{px}$ to eliminate iOS Safari auto-zooming, $\ge 44\text{px}$ tap targets, sticky first-column table horizontal scrolling.
- **Tablets (Landscape) & Drawers (<= 960px)**: Sidebar converts to off-canvas slide-out drawer (`left: -320px`), hamburger toggle header button, sticky table header.
- **Laptops & Small Desktops (<= 1200px)**: 2-column KPI strips and elastic detail grids (`min-width: 0`), wrapping filter bars.
- **Large & 4K Ultrawide Monitors (>= 1920px)**: Content width capped at $1560\text{px}$ with centered margins to prevent excessive stretching.
- **Mobile Landscape (Height <= 500px)**: Landscape modal compacting (`max-height: 98dvh`, reduced header/padding).
- **Touch Ergonomics (`@media (pointer: coarse)`)**: Tap targets $\ge 44\text{px}$ across all buttons, nav links, tabs, and toggles.
- **Table Containers & Sticky First Column**: Elastic horizontal scrolling containers (`.table-scroll`, `.table-responsive`, `.table-wrap`) with `overscroll-behavior-x: contain`.
- **Modal Scroll Isolation**: `overscroll-behavior: contain` on base and mobile `.modal-body` to eliminate background scroll bleed.
- **High-DPI / Retina Canvas**: `touch-action: none` and `getBoundingClientRect()` scaling for signatures and radar preview.

#### Suite 6: Location Selection Mode & Safety Restriction Matrix (test_location_selection_mode.js)
- **Exact Section Label Verification**: Verifies `Location Selection Mode (Select either Tower or Basement/Podium or Manual)` title text.
- **Three Mode Tiles**: Verifies `🏢 Tower`, `🏗️ Basement / Podium`, and `📍 Manual` tile options.
- **Safety Restriction Matrix Enforcement**: Validates `LOCATION_MODES_BY_PERMIT` table across all permit modules.
- **Excavation Suspended Slab Protection**: Proves Tower is restricted with tooltip and safety banner; asserts default is Basement/Podium; tests illegal mode switch blocking.
- **Guardrail & Shaft Void Fall Hazard Protection**: Proves Manual free-text mode is disabled/restricted with explicit safety rationales.
- **Manual Mode Field Validation & Formatting**: Tests mandatory validation of `locManual` and `locManualArea` and verified string formatting.
- **Normalization & Detail View Integrity**: Verifies schema normalization `{ mode: 'manual', manualLocation, manualArea }` and scope summary box rendering.

#### Suite 7: Universal Initiator Architecture & Form Activation Compliance (test_initiator_pages_and_form_activation.js - 10 Sections)
- **Universal Persona Layout Parity**: Asserts identical 4-box layout across all initiators.
- **Strict Role-Based Form Scoping (`INITIATOR_PERMIT_RULES`)**: Electrician is restricted exclusively to `['electrical']`; Blasting In-charge is restricted exclusively to `['blasting']`; Lifting Supervisor is restricted to `['lifting', 'liftplan']`; Site Supervisor is restricted to `['excavation', 'hotwork', 'guardrail', 'confined', 'shaft', 'general']`.
- **Catalogue Visual Differentiation**: Active cards render full color with glowing accent and "Available to Initiate" badge; inactive cards render desaturated (70% grayscale, 48% opacity) with lock badges (`Restricted to Electrician`, `Restricted to Blasting In-charge`, `Restricted to Lifting Supervisor`, `Future Module`).
- **Interactive Restriction Feedback**: Clicking an inactive card triggers an informative, non-blocking warning toast explaining the role restriction.
- **Server/Runtime Validation Shield**: Hard runtime validation blocks unauthorized form initiation attempts regardless of UI manipulation.
- **Work-Specific Extension Logic**: Enforces strictly NO extensions for Blasting operations; validates valid extension windows for Drilling and Electrical work.
- **Non-Initiator Lockdown**: Proves non-initiator personas (Engineers, Section Heads, EHS, Admin) have 100% of creation controls locked.

#### Suite 8: Permit Register Common Heading, Actors & Approval-Flow Visibility (test_register_actors_and_visibility.js - 7 Sections)
- **Unified Register Heading**: Verifies universal `<h1 id="registerTitle"><i class="fa-solid fa-table-list"></i> Permit Register</h1>` and standardized subtitle across all 15 roles.
- **Filter Coverage**: Proves `regTypeFilter` includes Electrical Work (`PTW-006`) alongside Excavation, Hot Work, Guard Rail, Confined Space, Shaft Work, and Drilling & Blasting.
- **Metadata Alignment**: Asserts `PTYPE_META.blasting` Section Head maps cleanly to Tower Incharge (`hw-section-head`).
- **Statutory Permittee Column ("Requested By")**: Dynamically renders the correct statutory role (Site Supervisor for civil/structural, Electrician for PTW-006, Blasting In-charge for PTW-007).
- **Statutory Section Head Column**: Dynamically resolves designated authority (`Excavation Head` for PTW-001, `Tower Incharge` for PTW-002–005 & PTW-007, `Quality Engineer` for PTW-006 Batching Plant).
- **Approval-Flow Visibility Matrix**: Validates the 13-role visibility matrix ensuring actors see only relevant operational queues without data pollution.

#### Suite 9: Permit Submission Flow & Mandatory Drawing Plan Verification (test_submission_drawing_flow.js)
- **Mandatory Drawing Enforcement**: Proves that the excavation drawing plan is MANDATORY for PTW-001 Excavation permits — `validateWizStep(2)` returns `false` when `draft.drawing` is null for excavation, and `true` once attached.
- **Step 2 Validation Gate**: Proves `validateWizStep(2)` requires both site photo AND excavation drawing for PTW-001; shows "Excavation drawing pending" in live requirements summary when missing.
- **UI Label Accuracy**: Drawing upload card explicitly marked with `<span class="req">*</span>` (Required) and hint text states "mandatory before submission".
- **Non-Excavation Exclusion**: Proves non-excavation permits (Electrical, Drilling & Blasting) do NOT require drawing and submit cleanly without one.
- **Step 4 Complete Review & Signature**: Proves Step 4 renders full permit review summary alongside digital signature pad and DPDP consent gates, including excavation drawing attachment row.
- **End-to-End Submission Flow**: Validates successful permit creation and submission into the active workflow for Excavation (with drawing), Electrical, and Drilling & Blasting.

#### Suite 10: PTW-001 Excavation Work Specification & Compliance (test_pt01_excavation.js - 15 Comprehensive Sections)
- **Static Metadata & Form Alignment**: Form `PTW-001`, `EXC` prefix, Section Head strictly `excavation-head` (Excavation Head).
- **Location Structure Restrictions**: Strictly restricts Excavation to `['Basement/Podium', 'Manual']` and blocks `Tower` switches with suspended slab collapse prevention.
- **Mandatory Step 1 Geotechnical Parameters**: Validates numeric `depth`, `slope`, and `equipment` array.
- **12-Item Checklist & Media Attachment Gating**: Enforces `CHECKLIST_ITEMS` (12 questions), comments for `NO` items, and mandatory worksite overview photo.
- **3-Way Parallel Domain Clearance Gate**: Concurrency gate requiring MEP, P&M, and IT clearances concurrently before Section Head review.
- **Section Head Review**: Strictly restricted to Excavation Head (`excavation-head`); Tower Incharge is blocked.
- **EHS Endorsement**: First-wins activation between EHS Manager and EHS Officer.
- **Rejection & Stale-Approval Retention**: Preserves 3-way parallel clearances when Section Head rejects; fast-tracks re-ack directly to Excavation Head.
- **3-Stage Extension Pipeline & 4-Stage Safety Observation Rectification**: Full lifecycle verification.
- **Exclusive Closure & Backfill Certification**: Restricted strictly to Site Supervisor with backfilling confirmation.
- **PDF Generation & Dynamic Tracker**: Verified jsPDF generation and tracker displaying Excavation Head.

#### Suite 11: PTW-002 Hot Work Specification & Compliance (test_pt02_hot_work.js - 14 Comprehensive Sections)
- **Static Metadata & Form Alignment**: Form `PTW-002`, `HW` prefix, Section Head strictly `hw-section-head` (Tower Incharge).
- **Location Flexibility**: Validates all 3 structures (`Tower`, `Basement/Podium`, `Manual`).
- **Step 1 Parameters**: Enforces `hotworkTypes` array, `welderName` ($\ge 2$ chars), and subcontractor affiliation gating.
- **Statutory Checklist**: Enforces `HOTWORK_CHECKLIST_ITEMS`, comments on `NO`, and mandatory site photo.
- **Sequential Direct Routing**: Direct flow from Site Engineer ack to Tower Incharge (bypassing excavation parallel gate).
- **First-Wins EHS Activation & Rejection Fast-Track**: Section Head rejection preserves workflow history; Site Eng re-ack fast-tracks to Tower Incharge.
- **3-Stage Extension & 4-Stage Safety Observation**: Verified against operational rules.
- **Exclusive Closure & 1-Hour Fire Watch Certification**: Site Supervisor exclusive; strictly requires `fireWatch: true` certification before closure.
- **PDF Generation & Dynamic Tracker**: Verified jsPDF generation and tracker displaying Tower Incharge.

#### Suite 12: PTW-003 Guard Rail Specification & Compliance (test_pt03_guard_rail.js - 14 Comprehensive Sections)
- **Static Metadata & Form Alignment**: Form `PTW-003`, `GR` prefix, Section Head `hw-section-head` (Tower Incharge).
- **Location Mode Protection**: Strictly restricts Guard Rail to `['Tower', 'Basement/Podium']` (Manual mode strictly prohibited due to floor-void fall hazards).
- **Step 1 Parameters**: Enforces `guardrailActivities` array and mandatory detail when `'Others'` is selected.
- **Statutory Checklist**: Enforces `GUARDRAIL_CHECKLIST_ITEMS`, comments on `NO`, and mandatory edge photo.
- **Sequential Direct Routing**: Site Engineer ack routes directly to Tower Incharge &rarr; EHS.
- **Rejection & Stale-Approval Pipeline**: Tower Incharge rejection and fast-track re-ack flow.
- **3-Stage Extension & 4-Stage Observation Lifecycle**: Full verification.
- **Exclusive Closure & Mandatory Guard Rail Re-Fix Certification**: Site Supervisor exclusive; strictly mandates `guardrailReFix: true` certifying all edge protections, mid-rails, and toe-boards are safely reinstalled.
- **PDF Generation & Dynamic Tracker**: Verified jsPDF generation and tracker displaying Tower Incharge.

#### Suite 13: PTW-004 Confined Space Entry Specification & Compliance (test_pt04_confined_space.js - 15 Comprehensive Sections)
- **Static Metadata & Form Alignment**: Form `PTW-004`, `CS` prefix, Section Head `hw-section-head` (Tower Incharge).
- **Multi-Gas Atmospheric Safety Logic**: Rigorously tests `CONFINED_GAS_THRESHOLDS` and `isGasReadingSafe()`:
  - Oxygen: safe strictly within $19.5\% \le \text{O}_2 \le 21.0\%$; rejects asphyxiant ($<19.5\%$) and oxygen-enriched ($>21.0\%$) hazards.
  - Combustibles: safe strictly $< 10\% \text{ LEL}$; rejects flammable/explosive mixtures ($\ge 10\%$).
  - Carbon Monoxide: safe strictly $< 25\text{ PPM}$; rejects toxic poisoning levels ($\ge 25\text{ PPM}$).
  - Hydrogen Sulphide: safe strictly $\le 5\text{ PPM}$; rejects lethal gas levels ($> 5\text{ PPM}$).
- **Step 1 Parameters**: Enforces `confinedActivity`, `numPersonnel` $\ge 1$, and mandatory `confinedDeclaration` (entrant rescue briefing).
- **Statutory Checklist**: Enforces `CONFINED_CHECKLIST_ITEMS` (15 items), comments on `NO`, and site photo.
- **Sequential Routing & First-Wins EHS**: Site Engineer &rarr; Tower Incharge &rarr; EHS activation.
- **Rejection & Fast-Track Flow**: Tower Incharge rejection and Site Eng re-acknowledgment.
- **3-Stage Extension & 4-Stage Observation Lifecycle**: Full verification.
- **Exclusive Closure & Mandatory Entrant Evacuation Declaration**: Site Supervisor exclusive; strictly mandates `confinedClosure: true` certifying all entrants are evacuated, headcount reconciled 100%, tools retrieved, and manholes bolted.
- **PDF Generation & Dynamic Tracker**: Verified jsPDF generation and tracker displaying Tower Incharge.

#### Suite 14: PTW-005 Shaft Work Specification & Compliance (test_pt05_shaft_work.js - 14 Comprehensive Sections)
- **Static Metadata & Form Alignment**: Form `PTW-005`, `SW` prefix, Section Head `hw-section-head` (Tower Incharge).
- **Location Mode Protection**: Strictly restricts Shaft Work to `['Tower', 'Basement/Podium']` (Manual mode strictly prohibited due to internal hoistway containment).
- **Step 1 Parameters**: Enforces `numPersonnel` $\ge 1$, `scaffTagVerified: true` (green scaffolding tag confirmation), and `shaftDeclaration: true` (fall protection and catch net confirmation).
- **Statutory Checklist**: Enforces `SHAFT_CHECKLIST_ITEMS` (10 items), comments on `NO`, and internal shaft photo.
- **Dedicated MEP Domain Clearance Gate**: Site Engineer ack routes specifically to `Pending MEP Clearance`; only MEP Engineer is authorized to clear this stage; Tower Incharge is strictly blocked until MEP grants clearance.
- **Section Head Approval**: MEP clearance advances status to `Pending Section Head` where Tower Incharge reviews and approves.
- **Stale-Approval Retention**: When Tower Incharge rejects, MEP clearance is preserved; Site Engineer re-ack fast-tracks directly back to Tower Incharge, bypassing MEP.
- **3-Stage Extension & 4-Stage Observation Lifecycle**: Full verification.
- **Exclusive Closure & Surrender Gate**: Restricted strictly to Site Supervisor.
- **PDF Generation & Dynamic Tracker**: Verified jsPDF generation and tracker displaying Tower Incharge.

#### Suite 15: PTW-006 Electrical Work (HT/LT) Specification & Compliance (test_pt06_electrical_work.js - 13 Comprehensive Sections)
- **Metadata & Master Registries**: Asserts `PTW-006`, `Form PTW-006`, `EW` prefix, 14 statutory checklist items, 10 electrical apparatus options, and registration of `electrician` and `quality-engineer` roles.
- **Facility Scope & Location Matrix**: Proves `getAllowedLocationModes('electrical', { facilityScope: 'batching_plant' })` returns strictly `['Manual']` and blocks Tower and Basement/Podium mode switches; proves `getAllowedLocationModes('electrical', { facilityScope: 'site' })` enables all 3 modes; proves role scoping restricts Electrician and Quality Engineer exclusively to `['electrical']`.
- **Permittee Electrician Step 1 & LOTO Gating**: Validates that Step 1 strictly enforces mandatory reason for shutdown (`shutdownWhy`), apparatus selection (`electricalApparatus`), shutdown hours ($from < to$), safe to work confirmation (`electricalSafeToWork`), LOTO register Sl. No and placement timestamp (`lotoRegisterNo`, `lotoDateTime`), and pre-work statutory undertaking (`electricalStatutoryDecl`).
- **Non-Excavation Drawing Independence**: Verifies Step 2 and Step 3 execute cleanly without requiring excavation drawing (drawing is mandatory only for PTW-001 Excavation).
- **Batching Plant Dual Approval Flow**: Proves submission routes directly to `Pending P&M Acknowledgment`; validates P&M Engineer acknowledgment with statutory declaration (`chkPmStatutoryDecl`) advancing to `Pending Quality Engineer Approval`; validates Quality Engineer review with insulation test declaration (`chkQualityStatutoryDecl`) advancing to `Pending EHS Approval`; verifies EHS endorsement activates the permit.
- **Site Dual Approval Flow & Either/Or Rule**: Proves submission routes to `Pending Site Engineer Acknowledgment`; validates Site Engineer acknowledgment routing to `Pending MEP or P&M Approval`; validates that Stage 3 either/or clearance is satisfied by either MEP or P&M with domain declaration (`chkMepPmStatutoryDecl`) and advances to `Pending Section Head` (Tower Incharge); verifies Tower Incharge approval advances to EHS and EHS activates the permit.
- **Rejection & Statutory Re-acknowledgment**: Tests rejection by P&M Engineer returning permit for correction (`returnStage === 'pm'`), resubmission routing to `Pending P&M Re-Acknowledgment`, and P&M re-acknowledgment routing forward to Quality Engineer.
- **Active Observations Lock**: Verifies that active safety observation strictly blocks closure/surrender and extension, displaying prominent warning cards; verifies resolving observation restores the Close & Surrender permit flow.
- **Exclusive Electrician Surrender & De-isolation Gate**: Asserts that non-electrician roles cannot surrender PTW-006; validates that surrender modal contains statutory `MANDATORY ELECTRICAL DE-ISOLATION & RESTORATION DECLARATION` with `surrElectricalClosureChk`; verifies closure records `electricalClosureConfirmed === true`.
- **Statutory Audit PDF Generation**: Proves jsPDF report generation executes cleanly for both Batching Plant and Site electrical permits (with certified de-isolation confirmation).
- **Detail View Rendering**: Verifies `viewDetail()` renders all PTW-006 specific fields (Facility Scope badge, Reason for Shutdown, Apparatus chips, LOTO Register & Placed Time, Pre-work Statutory Declaration, and Surrender Electrical De-Isolation confirmation).
- **Quality Engineer Dashboard Parity**: Proves Quality Engineer dashboard renders identically to approvers with 4 KPI cards (`Pending My Approval`, `Pending Extension Approval`, `Active Permits`, `Approved by Me`), dynamic scope subtitle (`Batching Plant Quality Clearance`), and real-time approval feeds (`Awaiting Your Approval` and `Recently Active on Site`).
- **Batching Plant Extension Workflow & Re-Ack Flow**: Validates the complete statutory extension sequence for Batching Plant electrical work: Step 1 Permittee Electrician request &rarr; Step 2 P&M Engineer acknowledgment (`Pending P&M Acknowledgment`) &rarr; Step 3 Quality Engineer Review & Approval as statutory Section Head (`Pending Quality Engineer Approval`) &rarr; Step 4 EHS Safety Endorsement extending validity; verifies rejection returns to Permittee Electrician for correction; proves revision routes back to P&M Engineer for Step 2 re-acknowledgment (`isReAck = true`) before returning directly forward to Quality Engineer.

#### Suite 16: PTW-007 Drilling & Blasting Specification & Compliance (test_pt07_drilling_blasting.js - 13 Scenario Groups)
- **Metadata & Constants Integrity**: Asserts `PTW-007`, `Form PTW-007`, `DB` prefix, 15-item checklist, 9 explosive types, 8 drilling machines, and `blasting-incharge` role registration.
- **Strict Manual Location Locking**: Asserts `getAllowedLocationModes('blasting')` returns strictly `['Manual']`; blocks Tower and Basement/Podium mode switches with descriptive safety tooltips.
- **Role Scope Isolation**: Proves `roleTypeScope('blasting-incharge')` is strictly restricted to `['blasting']`.
- **Operation Category Mutually Exclusive Validation**: Validates complete Blasting specifications (`dbDateTime`, `dbChargeAmount`, `dbBlastDiameter`, `dbBlastDepth`, `dbHolesCount`, `dbExplosiveType`) vs Drilling specifications (`dbDateTime`, `dbDrillDiameter`, `dbDrillDepth`, `dbHolesCount`, `dbMachineType`).
- **15-Item Checklist & Post-Checklist Rig Parameters**: Asserts Item 8 is cleanly worded without parenthetical instruction, auto-displays live site weather telemetry, and requires explicit user review and selection of `YES` (not pre-selected); asserts that Step 2 requires all 4 post-checklist rig fields (`blastingRigHolesLoaded`, `blastingRigHoleDepthM` in meters, `blastingMufflerLayers`, `blastingSafeDistance` as a positive number in meters) and Item 15 custom precautions (`dbOtherPrecautions`) for Blasting, while cleanly suppressing rig/muffler fields for Drilling.
- **Blasting In-charge Statutory Gate**: Submission routes to `Pending Blasting In-charge Acknowledgment`; proves acknowledgment requires mandatory statutory PESO compliance declaration via an enlarged, tactile high-contrast declaration card (`#chkBlastingStatutoryDecl`) and mandatory on-site photo.
- **Direct Routing to EHS**: Validates that Site Engineer acknowledgment on PTW-007 routes directly to `Pending EHS Approval` (skipping parallel gate and Section Head).
- **Drilling Submission Direct Routing**: Proves Drilling operation bypasses Blasting In-charge and routes directly to Site Engineer.
- **Sunset Hard Stop Enforcement**: Validates that `extensionCapMinutes` for Blasting is hard-capped at 18:30 IST (zero extension runway at or after 18:30), while Drilling permits extension up to 20:30 IST.
- **Rejection & Statutory Re-Acknowledgment Flow**: Tests rejection by Blasting In-charge, returns to Permittee for correction, and asserts resubmission routes to `Pending Blasting In-charge Re-Acknowledgment` then `Pending Site Engineer Re-Acknowledgment`.
- **Observation Blocking & Post-Blast Clearance**: Verifies that open observation blocks extension and surrender; validates that closing a Blasting permit requires certified Post-Blast Clearance & Misfire Declaration (`blastingClearanceConfirmed`).
- **Night Shift Linkage Exclusion & PDF Generation**: Proves `canLinkToNightShift('blasting') === false`; asserts clean execution of `generatePermitPDF()` for both Blasting and Drilling permits.
- **Blasting In-charge as Permittee Direct Flow**: Validates that Blasting / Drilling In-charge can initiate permit with on-form PESO statutory declaration routing directly to Site Engineer (bypassing duplicate In-charge review).

#### Suite 17: Digital Signature Pad Engine & Cross-Process Compliance (test_digital_signature_pad.js - 6 Comprehensive Sections)
- **Multi-Modal PointerEvents Engine**: Validates pointer down, move, and up drawing simulation across all 9 signature surfaces in the system.
- **Instant Dot Inking & Zero Latency**: Verifies immediate circular ink dot generation (`ctx.arc`) on single clicks/taps without mouse movement; touch-action isolation prevents mobile scroll hijacking.
- **Canvas Reset Integrity**: Tests `clearSigPad` canvas wiping and status resetting across creation, action, and modal workflows.
- **Procedural Auto-Sign Engine**: Verifies `simulateNamedSigPad(canvasId, name)` cursive rendering for high-speed end-to-end verification and testing.
- **Dynamic Role Resolution (`getPermitSignatory`)**: Validates signature retrieval and attribution for special roles including Excavation Head (`'excavation-head': 'sectionHead'`) and Blasting In-charge Permittee.
- **In-Place Modal DOM Mutation & Canvas Preservation**: Validates that modal content updates (live GPS coordinate fixes and photo previews inside `#extGpsWrap`, `#extPhotoWrap`, `#surrGpsWrap`, `#surrPhotoWrap`) preserve `<canvas id="apprSigPad">` without destroying canvas state.
- **DPDP Act 2023 Identity Binding & Consent**: Confirms legal name input requirement, explicit DPDP checkbox validation, and audit trail linking.

#### Suite 18: PTW-008 General Work Specification & Compliance (test_pt08_general_work.js - 14 Comprehensive Sections)
- **Static Metadata & Form Alignment**: Form `PTW-008`, `GEN` code, Section Head strictly `hw-section-head` (Tower Incharge).
- **Location Structure Flexibility**: Proves support across all 3 location structures (`Tower`, `Basement/Podium`, `Manual`).
- **14 Work Descriptions & Category Mapping**: Validates exact string literals for all 14 single-choice options across Categories A, B, C, and D.
- **Dynamic Multi-Tier Checklist Hierarchy**: Asserts 21 items for Category A (Panel Erection), 15 items for Category B (Hoists/Rigging), 20 items for Category C (Formwork), and 11 items for Category D (Custom/Other).
- **Wind Safety Caution Banner**: Enforces presence of wind warning caution banner ($> 45\text{ km/hr}$) in Step 2 for Category B and C.
- **Sequential Direct Routing**: Direct flow from Site Engineer ack to Tower Incharge (Section Head) to EHS Manager/Officer.
- **Rejection & Stale-Approval Bypass**: Verifies fast-track re-routing after return for correction without unnecessary re-approvals.
- **Temporal Extension Window**: Validates 18:30 IST request cutoff and 20:30 IST maximum extension ceiling.
- **Active Safety Observation Lock**: Proves open safety observation blocks extension and closure until 4-stage remediation is completed.
- **Exclusive Closure & Mandatory Housekeeping Certification**: Proves Site Engineer closure is rejected and validates Site Supervisor exclusive closure with `generalHousekeeping: true` certification.
- **PDF Generation & Dynamic Section Head Tracker**: Validates jsPDF generation for Form PTW-008 and dynamic approval tracker displaying Tower Incharge.

#### Suite 19: Forensic Audit Remediation, Security & Runtime Robustness (test_audit_remediation_security.js - 7 Sections)
- **Static Security & SRI Cryptographic Hashes**: Asserts presence of SHA-384 Subresource Integrity (SRI) hashes and `crossorigin="anonymous"` on Font Awesome 6.5.1 and jsPDF 2.5.1 CDN assets.
- **Parser Blocking & Accessibility**: Verifies `defer` on external script tags, accessible `<noscript>` fallback, meta description, and SVG shield favicon.
- **Dead Code Elimination**: Validates complete removal of duplicate electrical branch in `acknowledgeSiteEngineer()` and dead supervisor-blasting submission branch in `submitPermit()`.
- **Null Safety on Direct URL Routing**: Verifies `applyRoleVisibility(null)` runs without unhandled exceptions when `currentUser` is uninitialized.
- **Escalation Timer Lifecycle & Safe Tick**: Proves timer starts on `doLogin()` and stops on `doLogout()`; asserts `runEscalationTick()` gracefully handles empty or undefined permit arrays without crashing.
- **Timezone Enforcement (Asia/Kolkata)**: Verifies `fmtDate()` and `fmtTime()` force Indian Standard Time (`Asia/Kolkata`) regardless of client machine's UTC offset.
- **Statutory RBAC Invariants**: Rigorously asserts Site Supervisor is strictly barred from PTW-007 Blasting, Blasting In-charge is exclusive permittee for PTW-007, and Site Supervisor is authorized for PTW-008 General Work.

#### Suite 20: Dynamic & Configuration-Driven Enterprise Architecture (test_dynamic_config_architecture.js - 9 Sections)
- **Static Verification of Dynamic DOM Bindings**: Verifies dynamic DOM anchor points for landing page permit types bar, workflow pipeline strip, role category tabs, creation step indicators, permit selection cards, and dynamic register columns.
- **Static Verification of APP_CONFIG Schema**: Asserts registration of master configuration objects (`system`, `governanceStages`, `roleCategories`, `registerColumns`, `statuses`, `permitTypes`, `dashboards`, `workflows`, `emptyStates`, `wizardSteps`, `initiatorBanners`, `navigation`).
- **Runtime Setup & VM Sandbox Initialization**: Validates evaluation of `index.html` in an isolated Node.js VM context without errors or missing references.
- **Master APP_CONFIG Registry Validation**: Validates all 27 status definitions, 11 permit types, 7 workflow state pipelines, and 6 role categories.
- **Dynamic Status Class Resolver**: Asserts `statusClass(status)` dynamically resolves CSS styling classes directly from `APP_CONFIG.statuses`.
- **Dynamic Empty State Component**: Verifies `renderEmptyState(key)` renders centralized icons, copy, and inline styles for notifications, permits, filter misses, and audit logs.
- **Dynamic Wizard Step Indicators**: Validates dynamic derivation of `WIZ_STEPS` and step indicator generation from `APP_CONFIG.wizardSteps`.
- **Dynamic Navigation Engine**: Validates `navItemsFor(roleKey)` dynamically filtering authorized views and resolving role-scoped labels (e.g. "My Permits" vs "Permit Register") from `APP_CONFIG.navigation`.
- **Runtime Extensibility**: Proves runtime registration of custom statuses, empty states, and dynamic permit callbacks without requiring source code modifications.

#### Suite 21: PTW-009 Lifting Operations & Critical Lift Plan (PTW-009A/B) (test_pt09_lifting_operations.js - 14 Sections)
- **Static Verification of Metadata, Constants & Single Unified Tile**: Asserts PTW-009 configuration, single unified card tile (`PTW-009`), `liftplan` marked `hiddenFromGrid: true`, rigging equipment registries (`LIFTING_EQUIPMENT_TYPES`, `LIFTING_GEAR_TYPES`), and statutory declaration tokens.
- **Runtime Setup & VM Sandbox Initialization**: Validates evaluation of `index.html` within an isolated Node.js VM context without errors.
- **Catalog Verification: Single Unified Tile (PTW-009)**: Confirms catalog presents exactly one tile for lifting operations; verifies `liftplan` is strictly excluded from catalog grid.
- **Pre-Location Signatures Gate**: Rigorously verifies that location selectors (`Tower`, `Basement / Podium`, `Manual`) remain completely disabled until both Crane Operator and Signaler/Rigger complete digital signatures and DPDP consent via dedicated modals.
- **Dynamic Routing & Auto-Promotion Engine**: Proves automatic promotion from routine lifting (`lifting`) to critical lift plan (`liftplan`) whenever: load weight $> 5.0\text{ MT}$, tandem lift selected, calculated sling stress $> 80\%$ of sling SWL, or any of 14 statutory high-risk criteria answered YES.
- **Sling Stress Calculation Engine**: Validates sling tension formula, SWL percentage calculation, and safety clamping ($N=2$) for multi-leg rigging configurations.
- **Step 2 Statutory Checklist & Other Safety Precautions**: Evaluates all 14 statutory checklist items, verifies wind speed warning alerts ($\le 38\text{ km/h}$ for mobile cranes, $\le 45\text{ km/h}$ for tower cranes), and validates binding of custom precautions textarea to `draft.liftingSpecialPrecautions`.
- **Routine Lifting (PTW-009A) 5-Step Approval Spine**: Executes full sequential approval: Lifting Supervisor $\to$ Site Engineer $\to$ P&M Engineer $\to$ Tower Incharge $\to$ EHS Safety $\to$ Active.
- **Critical Lift Plan (PTW-009B) 6-Step Approval Spine**: Executes full 6-step approval flow requiring executive Project Manager clearance (Step 5) between Tower Incharge and EHS endorsement.
- **Dynamic Tracker HTML Validation**: Verifies tracker renders 5 sequential nodes for Routine Lifting and 6 nodes with Project Manager for Critical Lift Plan.
- **Extension Workflow (Tower Incharge -> EHS, 20:30 Ceiling)**: Verifies 2-stage extension approval pipeline requested by Lifting Supervisor, approved by Tower Incharge $\to$ EHS Safety, adhering to 20:30 IST maximum validity ceiling.
- **Exclusive Closure & Surrender with Demobilization Declaration**: Proves closure is strictly locked to Lifting Supervisor (`lift-supervisor`); asserts rejection if attempted by Site Engineer; enforces mandatory confirmation of `MANDATORY LIFTING DEMOBILIZATION & SAFETY DECLARATION`.
- **Official Permit Report PDF Generation**: Verifies successful generation of statutory jsPDF audit documents for both PTW-009A and PTW-009B with complete rigging calculations, technical parameters, and digital signatures.
- **Strict RBAC & Permittee Boundary Isolation**: Proves that only certified Lifting Supervisor can initiate Form PTW-009; asserts strict denial for unauthorized personas (Site Supervisor, Electrician, Blasting In-charge).

#### Suite 22: Draft Resumption, Sub-Table Scroll Fix & Part A/B Checkboxes (test_draft_and_pt09_subtables.js - 6 Sections)
- **Static Verification**: Asserts constants, titles, UI bindings, and checkbox labels for Part A (10 items) and Part B (13 items).
- **Sub-Table 2 Interactive UI Rendering**: Dynamic presentation of Part A and Part B with in-place YES/NO toggles and scrollbar styling.
- **Sub-Table 4 In-Place Dynamic Calculations**: Real-time sling stress calculation and auto-promotion to Critical Lift Plan (Part B).
- **Bi-Directional Weight Threshold Synchronization**: Dynamic synchronization of load weight thresholds ($\le 5\text{ MT}$ Part A vs $> 5\text{ MT}$ Part B).
- **Universal Draft Resumption**: Verifies draft resumption and form re-population across all specialized roles (Lifting Supervisor, Electrician).

#### Suite 23: PTW-010 Night Shift Work & Dual-Phase Handover (test_pt10_night_shift.js - 12 Sections)
- **Statutory Prohibitions & Checklist**: Enforces strict prohibition of high-risk activities (Confined Space, Blasting, Critical Lifts); validates 13 statutory night checklist items.
- **Stage 1 Daytime Approval Spine**: Site Supervisor $\to$ Site Engineer $\to$ Tower Incharge $\to$ Night Shift Approved – Awaiting Linked Permit.
- **Sequential Stage 2 Linked Activity Permitting**: Unlocks linked permit initiation, daytime clearances, and synchronized promotion to Approved – Pending Night Handover.
- **8:30 PM Handover Gate & Qualification Engine**: Enforces certified Night Site Supervisor qualification gate, 21:00 IST cutoff engine, and dual photo handover.
- **Night Activation & P&M Acknowledgment**: Lux level and machinery verification, isolated EHS rejection re-routing, and dual permit activation.
- **Morning Closure & Dynamic 6-Signatory Flow**: Exclusive closure by Night Site Supervisor with de-energization declaration and official 6-signatory PDF generation.

#### Suite 24: Sunday Work Tile & Weekend Governance (test_sunday_work_tile.js - 9 Sections)
- **IST Calendar-Driven Activation Engine**: Dynamic operational mode evaluation across weekdays, Saturday preparation, and Sunday lockout.
- **Saturday Dual-Tile Surface**: Simultaneous presentation of standard PTW and Sunday Work tiles with dedicated 9-module catalog.
- **3-Layer Night Shift Hard Exclusion**: Presentation layer, controller guard, and application wizard guard strictly blocking PTW-010 from Sunday batching.
- **Sunday Zero-Creation Lockout**: System-wide lockdown of permit creation across dashboard tiles, nav sidebar, and route guards.
- **Authorized Sunday Execution & Closure**: Full authorization of pre-authorized Sunday permit execution and statutory closure as per valid hours.
- **Register Filtering & Origin Metadata**: `sunday_work` filter, amber `SUN` badges, and official PDF audit trail tags.

#### Suite 25: Dynamic Enterprise Architecture, Multi-Project & Contractor Governance (test_dynamic_enterprise_features.js - 11 Sections)
- **Dynamic Structural Accessors**: Evaluates `getProject()`, `getProjectTowers()`, `getProjectBasements()`, `getProjectFloors()`, `getProjectZones()`, and `getProjectContractors()` across projects.
- **Approved Contractor Directory**: Validates vendor registry (`APP_CONFIG.contractorDirectory`), vendor codes, and trade specialization.
- **Runtime Project & Tower Registration**: Dynamically registers new worksite projects (`adminAddNewProject`) and appends towers (`adminPromptAddTower`).
- **Dynamic SLA Escalation Engine**: Runtime switching between Fast Demo Mode (45s / 120s) and Production Mode (2h / 4h); threshold validation.
- **Dynamic Meteorological Engine**: Real-time weather states and statutory high-wind lifting lockouts.
- **Multi-Tab Admin Center Navigation**: Dynamic tab switching across all 5 operational administration panels.
- **State Persistence & Round-Trip**: Full `localStorage` serialization and deserialization of enterprise configurations and projects.

### 22.3 Automated Test Execution Results

```
================================================================
MASTER TEST SUITE EXECUTION SUMMARY (ALL 30 SUITES)
================================================================

>>> SUITE 1: BASE LIFECYCLE & ENGINE TESTS (run_full_test_suite.js)
  Total Tests Run: 185 | Total Passed: 185 | Total Failed: 0 (100% Pass Rate)

>>> SUITE 2: EXTENDED AUDIT TESTS (run_extended_audit_tests.js)
  Total Tests Run: 77  | Total Passed: 77  | Total Failed: 0 (100% Pass Rate)

>>> SUITE 3: UI & PDF SECTION HEAD LABELS (test_tracker_labels.js)
  All static tokens, DOM trackers & PDF label resolutions passed cleanly

>>> SUITE 4: APPLICATION-WIDE NAVIGATION & CONSISTENCY (test_navigation_application_wide.js)
  All 19 navigation, stepper, scroll preservation & modal lifecycle tests passed cleanly

>>> SUITE 5: RESPONSIVE DESIGN & CROSS-DEVICE ERGONOMICS (test_responsive_viewports.js)
  All 15 viewport tiers, touch ergonomics, elastic tables & scroll isolation tests passed cleanly

>>> SUITE 6: LOCATION SELECTION MODE & SAFETY RESTRICTION MATRIX (test_location_selection_mode.js)
  All 10 static tokens, dynamic restrictions, matrix validations & UI rendering tests passed cleanly

>>> SUITE 7: UNIVERSAL INITIATOR ARCHITECTURE & FORM ACTIVATION COMPLIANCE (test_initiator_pages_and_form_activation.js)
  All 10 compliance sections, strict role form activation, initiator dashboard parity passed cleanly

>>> SUITE 8: PERMIT REGISTER COMMON HEADING, ACTORS & APPROVAL-FLOW VISIBILITY (test_register_actors_and_visibility.js)
  All 7 compliance sections, unified register heading, 15-role visibility matrix & gate enforcement passed cleanly

>>> SUITE 9: PERMIT SUBMISSION FLOW & MANDATORY DRAWING PLAN VERIFICATION (test_submission_drawing_flow.js)
  Mandatory drawing enforced for PTW-001, Step 4 signature & submit flow verified

>>> SUITE 10: PTW-001 EXCAVATION WORK (FORM PTW-001) SPECIFICATION & COMPLIANCE (test_pt01_excavation.js)
  All 15 statutory sections, 3-way parallel domain clearance & backfill surrender passed cleanly

>>> SUITE 11: PTW-002 HOT WORK (FORM PTW-002) SPECIFICATION & COMPLIANCE (test_pt02_hot_work.js)
  All 14 statutory sections, Tower Incharge SH, 3-stage extension & mandatory 1-hour fire watch passed cleanly

>>> SUITE 12: PTW-003 GUARD RAIL (FORM PTW-003) SPECIFICATION & COMPLIANCE (test_pt03_guard_rail.js)
  All 14 statutory sections, location void protection, fast-track re-ack & mandatory re-fixing passed cleanly

>>> SUITE 13: PTW-004 CONFINED SPACE ENTRY (FORM PTW-004) SPECIFICATION & COMPLIANCE (test_pt04_confined_space.js)
  All 15 statutory sections, multi-gas thresholds (O2/LEL/CO/H2S) & mandatory entrant evacuation passed cleanly

>>> SUITE 14: PTW-005 SHAFT WORK (FORM PTW-005) SPECIFICATION & COMPLIANCE (test_pt05_shaft_work.js)
  All 14 statutory sections, dedicated MEP domain gate, stale-approval retention & closure passed cleanly

>>> SUITE 15: PTW-006 ELECTRICAL WORK (FORM PTW-006) SPECIFICATION & COMPLIANCE (test_pt06_electrical_work.js)
  All 13 statutory sections, dual approval topologies (BP & Site), LOTO gating & de-isolation surrender passed cleanly

>>> SUITE 16: PTW-007 DRILLING & BLASTING (FORM PTW-007) SPECIFICATION & COMPLIANCE (test_pt07_drilling_blasting.js)
  All 13 scenario groups, statutory PESO gates, sunset hard stop (18:30) & post-blast clearance passed cleanly

>>> SUITE 17: DIGITAL SIGNATURE PAD ENGINE & CROSS-PROCESS COMPLIANCE (test_digital_signature_pad.js)
  All 6 statutory areas, pointer drawing, auto-signing, and in-place modal canvas preservation passed cleanly

>>> SUITE 18: PTW-008 GENERAL WORK (FORM PTW-008) SPECIFICATION & COMPLIANCE (test_pt08_general_work.js)
  All 14 statutory sections, multi-tier dynamic checklists (21/15/20/11 items), wind warnings & housekeeping closure passed cleanly

>>> SUITE 19: FORENSIC AUDIT REMEDIATION, SECURITY & RUNTIME ROBUSTNESS (test_audit_remediation_security.js)
  All 7 statutory sections, SRI cryptographic hashes, dead code elimination, null safety & timer lifecycles passed cleanly

>>> SUITE 20: DYNAMIC & CONFIGURATION-DRIVEN ENTERPRISE ARCHITECTURE (test_dynamic_config_architecture.js)
  All 9 sections, master APP_CONFIG schema, dynamic resolvers, empty states & runtime extensibility passed cleanly

>>> SUITE 21: PTW-009 LIFTING OPERATIONS & CRITICAL LIFT PLAN (PTW-009A/B) (test_pt09_lifting_operations.js)
  All 14 statutory sections, single unified tile, pre-location gate, N=2 clamping & PM review passed cleanly

>>> SUITE 22: DRAFT RESUMPTION, SUB-TABLE SCROLL FIX & PART A/B CHECKBOXES (test_draft_and_pt09_subtables.js)
  All 6 sections, Part A/B interactive checkboxes, in-place toggles, bi-directional auto-promotion & universal draft resumption passed cleanly

>>> SUITE 23: PTW-010 NIGHT SHIFT / HOLIDAY WORK & DUAL-PHASE HANDOVER (test_pt10_night_shift.js)
  All 12 statutory sections, dual-phase day/night handover, qualification gating, 21:00 cutoff engine, strict prohibitions, isolated EHS rejection & 6-signatory flow passed cleanly

>>> SUITE 24: SUNDAY WORK TILE & WEEKEND GOVERNANCE (test_sunday_work_tile.js)
  All 9 sections, IST calendar-driven activation, Saturday dual-tile preparation, 3-layer Night Work hard exclusion, Sunday zero-creation lockout & Sunday closure passed cleanly

>>> SUITE 25: DYNAMIC ENTERPRISE ARCHITECTURE, MULTI-PROJECT & CONTRACTOR GOVERNANCE (test_dynamic_enterprise_features.js)
  All 11 sections, dynamic project structural accessors, empaneled contractor directory, runtime project/tower registration, Demo vs. Production SLA mode switching, meteorological engine & multi-tab Admin Center passed cleanly

================================================================
GRAND TOTAL: ALL 30 MASTER TEST SUITES PASSED (100% SUCCESS RATE)
ALL 10 PERMIT WORK TYPES (PTW-001 TO PTW-010) FULLY VALIDATED
================================================================
Zero Regressions · Full Statutory Coverage · Dedicated Suite per Permit Type · 100% Deterministic · Production Ready
```

---

## 23. Glossary

| Term | Definition |
|:---|:---|
| **PTW** | **Permit-to-Work**: A formal, document-controlled safety authorization required before commencing hazardous high-risk operations. |
| **EHS** | **Environment, Health and Safety**: The corporate and operational authority governing occupational safety and statutory compliance. |
| **PESO** | **Petroleum and Explosives Safety Organization**: India's statutory nodal regulatory agency administering the Indian Explosives Act, 1884, and governing high explosives storage, transit, and shot-firing licensing. |
| **Sunset Stop Rule** | Mandatory occupational safety restriction capping energetic rock blasting operations strictly before 18:30 IST to prevent nighttime flyrock, unobserved misfires, and delayed detonations. |
| **Shot Firer** | A certified, competent person holding a statutory blaster's certificate qualified to charge, stem, prime, and initiate explosive rounds. |
| **Misfire Declaration** | Formal statutory confirmation by the Shot Firer post-detonation certifying that 100% of explosive charges have detonated cleanly with zero unexploded ordnance. |
| **Flyrock Mufflers** | Heavy-duty interlocking vulcanized rubber mats or double-layered wire mesh placed directly over blast holes to absorb kinetic fragmentation and contain flyrock. |
| **LEL** | **Lower Explosive Limit**: The minimum concentration of combustible vapor in air below which flame propagation cannot occur (safe limit: $<10%$). |
| **PPM** | **Parts Per Million**: Measurement unit for toxic atmospheric gases (Carbon Monoxide, Hydrogen Sulphide). |
| **SWL** | **Safe Working Load**: The maximum working load certified by a competent third party that lifting equipment or rigging tackle may safely support. |
| **TPI** | **Third-Party Inspection**: Mandatory statutory inspection and load test certification (Form 11) conducted by competent external certification bodies. |
| **RBAC** | **Role-Based Access Control**: Security mechanism restricting application operations to authorized functional roles. |
| **IST** | **Indian Standard Time**: Coordinated time zone ($\text{UTC}+05:30$) governing all project operations and timestamping. |
| **DPDP Act 2023** | **Digital Personal Data Protection Act, 2023 (India)**: National statutory standard governing personal data minimization and digital consent. |
| **Haversine Formula** | Mathematical formula calculating great-circle distance between two coordinate pairs on a spherical Earth model. |
| **Geofencing** | Virtual geographical perimeter enforced via device GPS to prevent fraudulent off-site approvals. |
| **First-Wins Gate** | Approval pattern where action by any one authorized peer (e.g. EHS Manager or Officer) locks the stage and advances the workflow. |
| **Stale-Approval Rule** | Governance logic ensuring that when a rejected permit is revised, only modified sections are reset while valid clearances persist. |
| **SLA** | **Service Level Agreement**: Defined operational time limits before an unacted pending approval triggers automated escalation. |

## 24. Weekend Operations Governance & Sunday Work Tile Architecture

To prevent unvetted weekend operations, mitigate uncoordinated site hazards, and maintain rigorous EHS oversight across multi-contractor mega-construction projects, ARPL enforces a strict **Weekend Operations Governance Protocol** driven by a dedicated **Sunday Work (SUN) Tile** and an automated **Zero Permit-Raising Lockout on Sunday**.

```mermaid
graph TD
    subgraph Saturday ["Saturday: Advance Preparation Window"]
        A["Dashboard: Side-by-Side Operational Tiles"] --> B["Standard PTW Tile<br/>All 10 Permits Available"]
        A --> C["Sunday Work SUN Tile<br/>PTW-001 through PTW-009 Available"]
        C -. "Hard Exclusion" .-> D["Night Shift PTW-010 Excluded"]
        C --> E["Advance Form Preparation and Statutory Approvals"]
        E --> F["Permit Tagged: sundayWork=true, originTile=SUN"]
    end

    subgraph Sunday ["Sunday: Execution and Zero-Creation Lockout"]
        G["Sunday Zero-Creation Lockout Engine"]
        G --> H["Standard PTW Tile: LOCKED"]
        G --> I["Sunday SUN Tile: CLOSED"]
        G --> J["Route Navigation Guards Block All Creation Views"]
        K["Pre-Authorized Sunday Permits Active"] --> L["Site Work Execution under Safe Window"]
        L --> M["Permit Closure and Surrender Permitted as per Valid Time"]
        M --> N["Site Restoration, Gas Check, DPDP Digital Sign"]
        N --> O["Official Permit Report PDF with Sunday Audit Trail"]
    end
```

### 24.1 Architectural Overview & Core Governance Philosophy
In standard high-risk construction environments, Sunday operations present acute EHS vulnerability: reduced supervisory presence, skeletal subcontractor staffing, and absent administrative checks often lead to informal, unvetted work.
ARPL's architecture eliminates this hazard through a **two-phase weekend control loop**:
1. **Advance Saturday Preparation**: All Sunday high-risk operations must be fully planned, risk-assessed, and vetted by all discipline heads on **Saturday**.
2. **Strict Sunday Zero-Creation Lockout**: No permits may be initiated, created, or drafted on Sunday. System-wide guards lock permit creation across all tiles and navigation paths.
3. **Authorized Sunday Execution & Closure**: Pre-authorized permits run within their certified time windows and **can be closed and surrendered on Sunday** once work is complete, certifying site safety and demobilization.

### 24.2 Dual-Tile Dashboard: PTW vs Sunday Work Tile
On the main dashboard, Saturday introduces a dedicated, high-visibility operational tile adjacent to the standard Permit-to-Work (PTW) tile:
- **PTW (Permit-to-Work) Tile**: The primary operational surface active Monday through Saturday, providing initiation access to all 10 permit modules (including Night Shift PTW-010).
- **SUN (Sunday Work) Tile**: A specialized advance preparation surface active **exclusively on Saturday (IST)**. It consolidates initiation access to the 9 standard daylight permit modules (PTW-001 to PTW-009) specifically destined for Sunday execution.

### 24.3 IST Calendar-Driven Activation Engine
Tile visibility, operational mode, and lockout enforcement are driven by the project's atomic clock adhering to Indian Standard Time (IST, $\text{UTC}+05:30$):
- **Monday to Friday**: Standard PTW tile is active. Sunday Work tile is dormant.
- **Saturday (Preparation Surface Active)**: Both Standard PTW and Sunday Work tiles are active side-by-side. Permittees can pre-authorize Sunday operations.
- **Sunday (Zero-Creation Lockout Active)**: All permit-raising tiles and buttons are dynamically locked with high-visibility lockout indicators. Permittees cannot raise permits. Permittees and approvers can view, audit, execute, and close pre-authorized permits.

To facilitate compliance audits, training demonstrations, and offline verification, the top navigation bar includes an **Interactive Day Simulator** allowing instant switching between Live IST, Saturday (Preparation Mode), Sunday (Lockout Mode), and Monday (Standard Operations).

### 24.4 Hard Exclusion of Night Shift Work (PTW-010)
Under ARPL corporate safety policy §3 and requirements NW-01, NW-02, NW-03, **Night Shift Work (PTW-010) is strictly barred from the Sunday Work tile**. Night Shift possesses an independent, specialized dual-phase daytime approval and 8:30 PM handover protocol requiring linked daytime permits, and must not be initiated through advance Sunday batching.

The exclusion is enforced through **3 independent architectural layers**:
1. **Catalog Filter (Presentation Layer)**: PTW-010 is excluded from the Sunday Work catalog modal. The UI displays an explicit statutory reminder: *"Night Shift Work (PTW-010) is excluded from this tile and must be initiated through the standard PTW flow."*
2. **Selection Guard (Controller Layer)**: Invoking `selectPermitType('nightshift')` while in Sunday Work context immediately intercepts execution, shows a warning toast, and blocks initiation.
3. **Wizard Engine Guard (Application Layer)**: `startNewPermit('nightshift')` validates `sundayWorkContext` against `APP_CONFIG.sundayWork.blockedPermitTypes`. Any attempt to force initiation fails deterministically.

### 24.5 Sunday Zero-Creation Lockout Engine (System-Wide)
On Sunday, zero permit creation is enforced without exception across the entire application surface:
- **Dashboard Tiles**: Hero creation tiles render with locked styling (lock icons, reduced opacity, and amber lockout badges). Clicking triggers the **Sunday Zero-Creation Lockout Modal**.
- **Navigation Sidebar**: The "Create Permit" navigation item dynamically switches to "Create (Locked)" with a lock icon.
- **Route Navigation Guards (`goTo(view)`)**: Direct URL hash navigation or programmatic calls to `goTo('ptype')` or `goTo('create')` are intercepted by the route guard, triggering a warning toast, popping the lockout modal, and safely redirecting the user back to the dashboard.
- **Wizard Initiation API (`startNewPermit(ptype)`)**: Enforces `isPermitRaisingAllowedToday()`. Returns `false` immediately if invoked on Sunday.

### 24.6 Sunday Permit Execution & Closure Governance
While permit *creation* is strictly prohibited on Sunday, **permit execution, safety surveillance, and formal permit closure are fully authorized**:
- **Execution Within Valid Time Window**: Work proceeds under the terms approved on Saturday.
- **Statutory Closure on Sunday**: Once work concludes and within the permit's scheduled valid hours, the certified Permittee (Site Supervisor, Electrician, Blasting In-charge, or Lifting Supervisor) accesses the permit and completes the single-step closure & surrender flow.
- **Mandatory Safety Confirmations**: Housekeeping, 1-hour fire watch verification (Hot Work), guardrail re-fixing (PTW-003), confined space atmospheric clearance (PTW-004), or electrical lockouts surrender (PTW-006) are validated alongside live GPS coordinates and DPDP digital signatures.
- **Sunday Closure Audit Logging**: Permit closure logs record an explicit audit tag: `[Sunday Closure Authorized as per Valid Time Window]`, setting `p.closure.closedOnSunday = true` and `p.surrender.closedOnSunday = true`.

### 24.7 Permit Data Origin Tracking, Register Filtering & SUN Badge
Every permit initiated via the Sunday Work tile is stamped with enterprise origin metadata:
- `p.sundayWork = true`
- `p.originTile = 'SUN'`

In the **Permit Register**:
- A dedicated filter option `☀️ Sunday Work Permits (Pre-authorized)` in the Type filter dropdown isolates all Sunday operations across any permit category.
- Sunday Work records display a prominent amber badge (`<span class="badge"><i class="fa-solid fa-sun"></i> SUN</span>`) next to the permit ID for instantaneous visual distinction during site safety walks.

### 24.8 Cross-Cutting Controls (RBAC, Notifications, Retention, PDF Audit)
- **Role-Based Access Control (RBAC)**: Initiator role boundaries (e.g. Electricians restricted to PTW-006, Lifting Supervisors to PTW-009A/B) apply uniformly within the Sunday Work tile.
- **Stakeholder Notifications**: Closing a Sunday permit fires real-time notifications to all domain stakeholders noting that Sunday closure was authorized as per valid time.
- **Official PDF Report Audit Trail**: Official jsPDF permit reports include a dedicated *"Permit Surface: Sunday Work Surface (Pre-authorized Saturday)"* entry and record the exact Sunday closure timestamp in Section 1 (Permit Master Data).

### 24.9 Smooth Scrolling & Navigation Engineering
To ensure optimal fluid navigation across large landing pages, long statutory checklists, and multi-tier approval logs:
- CSS rules enforce native `scroll-behavior: smooth` on `html` and root containers.
- Sub-table containers, modal dialogs, and sidebar views utilize `-webkit-overflow-scrolling: touch` with clean customized scrollbar aesthetics.
- An intelligent smooth-scroll link handler intercepts all internal hash anchors (`a[href^="#"]`), providing hardware-accelerated animated scrolling with offset compensation.

---

## 25. GitHub Pages Deployment

The ARPL EHS Permit-to-Work system is engineered with a **zero-build, client-side architecture** that runs natively on **GitHub Pages** without requiring any build pipelines or servers.

### One-Click GitHub Pages Setup:
1. In your GitHub repository, open **Settings** > **Pages**.
2. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` (or default branch) and folder `/(root)`.
   - Click **Save**.
3. Your application is live at:
   `https://<your-username>.github.io/<your-repository>/`

### Built-in GitHub Pages Optimizations:
* **`.nojekyll` Marker**: Included at the repository root to bypass Jekyll static-site generation and serve raw web assets directly.
* **`404.html` SPA Handler**: Provided to catch direct route reloads and redirect safely back to `./index.html`.
* **Zero Mixed Content**: All external libraries (Font Awesome, jsPDF, Leaflet/OSM) use secure `https://cdnjs.cloudflare.com` CDNs.
* **Relative Path Resolution**: All asset paths and view navigation links use `./` relative references, ensuring smooth operation under sub-directory URLs (such as `https://user.github.io/repo-name/`).
* **Instant First-Visit Initialization**: Seeds demonstration scenarios into memory automatically if `localStorage` is empty.

---

## 26. Authors & Engineering Team

Developed and engineered by:
* **Mohith**
* **Prasanna**
* **Abigna**

---

<div align="center">

**ARPL EHS Permit-to-Work Management System** · Enterprise Build · September 2026

PTW-001 Excavation · PTW-002 Hot Work · PTW-003 Guard Rail · PTW-004 Confined Space · PTW-005 Shaft Work · PTW-006 Electrical Work · PTW-007 Drilling & Blasting · PTW-008 General Work · PTW-009A/B Lifting Operations & Critical Lift Plan

*Built for safety. Engineered for accountability.*

</div>
