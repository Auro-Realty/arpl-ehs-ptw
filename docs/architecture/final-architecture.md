# Final Architecture Blueprint — ARPL EHS Permit-to-Work Platform

> **Status**: APPROVED & PROCUREMENT-GRADE  
> **Architecture Model**: Hybrid Firebase-First Client Data Layer + Google Cloud Run Core API  
> **Target Region**: Primary: `asia-south1` (Mumbai, India) | Secondary DR: `asia-south2` (Delhi, India)  
> **Date**: 2026-09-25  
> **Workload Baseline**: 6 Business Projects · 360 Unique Users (60/proj) · 300 Permits/Day Total (9,000/mo, 109,500/yr)  

---

## 1. Architectural Vision & Operational Boundary

The ARPL EHS Permit-to-Work (PTW) Platform employs a **Hybrid Architecture** combining:
1. **Firebase-First Client Data Layer**: Solves field offline operability, real-time safety gating, and direct edge file uploads for mobile/tablet construction workers.
2. **Google Cloud Run Core Backend & Compute Backbone**: Provides an authoritative, containerized, high-concurrency runtime for complex 27-state FSM transitions, statutory A4 PDF rendering with embedded high-DPI signatures, and autonomous SLA escalation sweeps.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  USER ACCESS LAYER                                       │
│    Field Workers · Site Engineers · Section Heads · EHS Officers · Admins (360 Users)   │
└──────────────────────────────────────────┬───────────────────────────────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             FIREBASE EDGE / CLIENT LAYER                                 │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────────┐  │
│  │   Firebase Hosting    │   │  Firebase Authentication │   │    Firebase App Check   │  │
│  │  Global Edge CDN/SSL  │   │  Custom Claims (RBAC)    │   │  Device Integrity/DDoS  │  │
│  └───────────────────────┘   └──────────────────────────┘   └─────────────────────────┘  │
│                                           │                                              │
│                                           ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                     OFFLINE APPLICATION LAYER (Client-Side PWA)                    │  │
│  │   • Vanilla JS SPA (Zero-Build)          • Local IndexedDB Cache                   │  │
│  │   • Event-Driven State Engine            • Offline Mutation Queue & Sync           │  │
│  └──────────────────┬─────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────┼─────────────────────────────────┼──────────────────────────────────┘
                      │ (Direct Reads & Real-Time Sync) │ (Direct Media Uploads)
                      ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               GOOGLE CLOUD PLATFORM (`asia-south1`)                      │
│                                                                                          │
│  ┌────────────────────────────────┐            ┌──────────────────────────────────────┐  │
│  │   Cloud Firestore (Primary)    │            │   Cloud Storage / Firebase Storage   │  │
│  │ • 6 Logical Business Projects  │            │ • Site Photos (<2MB)                 │  │
│  │ • Append-Only Activity Logs    │            │ • High-DPI Digital Signatures        │  │
│  │ • Real-time onSnapshot Listeners│           │ • Statutory Compliance PDF Archives  │  │
│  └────────────────▲───────────────┘            └──────────────────▲───────────────────┘  │
│                   │                                               │                      │
│                   │ (Reads/Writes State)                          │ (Writes Reports)     │
│                   │                                               │                      │
│  ┌────────────────┴───────────────────────────────────────────────┴───────────────────┐  │
│  │                    CORE BACKEND API & STATUTORY COMPUTE LAYER                      │  │
│  │                          Google Cloud Run (`arpl-ehs-api`)                         │  │
│  │  • Authoritative State Machine Transitions (27 States, 16 Roles)                   │  │
│  │  • Statutory A4 PDF Generation Engine (High-DPI Signature Watermarking)             │  │
│  │  • SLA Escalation & Auto-Expiry Worker (2h/4h SLA, T-30 Warning, 21:00 Cutoff)     │  │
│  │  • Administrative User Provisioning & Project Custom Claims Dispatcher             │  │
│  └────────────────▲───────────────────────────▲───────────────────────────────────────┘  │
│                   │                           │                                          │
│                   │ (Triggers Periodic Ticks) │ (Enqueues Heavy Deferred Tasks)          │
│                   │                           │                                          │
│  ┌────────────────┴───────────────┐   ┌───────┴───────────────────────────────────────┐  │
│  │      Cloud Scheduler           │   │               Cloud Tasks                     │  │
│  │ • 5-min Cron Tick (06:00-22:00)│   │ • Rate-Limited Background Queue               │  │
│  │ • OIDC Service Account Auth    │   │ • Async PDF Rendering & Notification Fan-out  │  │
│  └────────────────────────────────┘   └───────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        SECURITY & OBSERVABILITY FOUNDATION                         │  │
│  │ • Secret Manager: Token Secrets, Service Account Keys, System Config Hashes        │  │
│  │ • Cloud Logging: Structured Audit Logs, Error Tracing, Compliance Retain (30 days)│  │
│  │ • Cloud Monitoring: Uptime Checks, Container Concurrency, SLA Latency Alerts       │  │
│  │ • Disaster Recovery: Firestore PITR (7-Day Continuous) + Weekly GCS Bucket Export  │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Responsibility Separation: Firebase vs. Google Cloud Platform

| Responsibility Domain | Assigned Technology | Primary Driver & Justification |
|---|---|---|
| **Static Delivery & CDN** | **Firebase Hosting** | Edge-cached delivery of zero-build HTML/JS/CSS, automated SSL, global presence. |
| **User Identity & Sessions** | **Firebase Authentication** | Closed registration, custom claims embedding (`role`, `projectIds[]`), secure JWT issuance. |
| **Device Integrity** | **Firebase App Check** | Protects backend APIs and Firestore from scrapers, replay attacks, and abuse. |
| **Operational Database** | **Cloud Firestore** | Native offline IndexedDB caching, live `onSnapshot` subscriptions, document polymorphism. |
| **Media & File Storage** | **Firebase Storage (GCS)** | Direct client-to-storage authenticated file uploads; offloads heavy binaries from API. |
| **Core API & State Gating** | **Google Cloud Run** | Authoritative 27-state transition referee, high concurrency (80 req/instance), connection reuse. |
| **Statutory PDF Generation** | **Google Cloud Run** | Containerized rendering with embedded fonts, high-DPI canvas composition, regulatory stamps. |
| **Periodic Escalation Engine**| **Google Cloud Scheduler** | Autonomous 5-minute cron triggering Cloud Run SLA sweeps with OIDC IAM service account. |
| **Deferred Heavy Queuing** | **Google Cloud Tasks** | Rate-limited, retriable queue for background PDF compilation and multi-role notification fan-outs. |
| **Reactive Event Triggers** | **Cloud Functions (2nd Gen)** | Lightweight Firestore triggers (`onDocumentWritten`) for notification dispatch and indexing. |
| **Secrets & Encryption Keys**| **Google Secret Manager** | Secure, versioned injection of service account credentials and signing tokens into Cloud Run. |
| **Telemetry & Auditing** | **Cloud Logging & Monitoring**| Centralized compliance logging (30-day retention), container health metrics, and alert policies. |
| **Disaster Recovery** | **Firestore PITR & GCS Export** | 7-day point-in-time recovery (1-minute RPO) + weekly full database snapshot exports to GCS. |

---

## 3. Deep Dive: Component Architectures

### 3.1 Client & Offline Application Layer
- **Zero-Build Vanilla SPA**: Loaded via Firebase Hosting. Requires no client-side compiler, ensuring fast loading on low-power site smartphones.
- **Offline Persistence**: Enabled via `enableIndexedDbPersistence(db)`.
  - When offline, Firestore SDK routes all reads to local `IndexedDB`.
  - Mutations (drafting permits, uploading checklists) are written to local queues.
  - On reconnection, the SDK automatically flushes writes in chronological order.
- **Append-Only Subcollections**: To eliminate "last-writer-wins" overwrites between concurrent offline approvers, activity logs and comments are stored in subcollections (`permits/{id}/activity_log`), ensuring zero loss of statutory audit trails.

### 3.2 Core Backend API (Google Cloud Run)
- **Container Specification**:
  - Image: Debian 12 Slim + Node.js 20 LTS + standard statutory fonts.
  - Sizing: 1 vCPU, 1 GiB RAM.
  - Concurrency: 80 concurrent requests per instance.
  - Port: 8080 (HTTPS via Google Front End).
- **Endpoint Structure**:
  - `POST /api/v1/permits/:id/transition`: Authoritative FSM transition executor. Verifies caller role from Firebase Auth JWT against `roleCanActOnChain()` matrix, validates digital signature, updates permit state, appends audit log, and enqueues background notifications via Cloud Tasks.
  - `POST /api/v1/permits/:id/generate-pdf`: Statutory PDF compilation. Assembles permit form data, checklist affirmations, multi-gas graphs, and high-DPI signature PNGs into an official A4 document, uploads to Cloud Storage, and stores the permanent URL.
  - `POST /api/v1/escalation/tick`: Autonomous SLA sweep triggered by Cloud Scheduler. Inspects active permits where `nextSlaCheck <= now()`, auto-escalates to Stage 2, issues T-30 warnings, or auto-cancels unapproved night-shift permits past 21:00 IST.
  - `POST /api/v1/admin/users/assign`: Admin API for provisioning users and setting `projectIds` custom claims.

### 3.3 Data Layer & Tenant Isolation (Cloud Firestore)
- **Database Mode**: Native Mode, Standard Edition, Location: `asia-south1` (Mumbai).
- **Multi-Tenancy Model**: Single unified Firestore database logically partitioned by `projectId`:
  - `permits/{permitId}`: Core permit document containing static metadata, current status, approval stage, and storage paths.
  - `permits/{permitId}/activity_log/{logId}`: Append-only immutable audit trail.
  - `notifications/{notifId}`: Role-targeted alert feed.
  - `projects/{projectId}`: Master construction site registry with geofence radius and tower coordinates.
  - `users/{uid}`: Profile document mirroring Firebase Auth UID.
- **Tenant Isolation**: Strictly enforced by Firestore Security Rules checking `request.auth.token.projectIds.hasAny([resource.data.projectId, '*'])`.

### 3.4 Media & Storage Pipeline
- **Bucket**: `gs://arpl-ehs-media-prod` in `asia-south1`.
- **Direct Client Upload Flow**:
  1. Client captures signature on HTML5 Canvas or takes photo via device camera.
  2. Client SDK calls `uploadBytesResumable()` directly to `projects/{projectId}/permits/{permitId}/...`.
  3. Storage Security Rules validate user project membership, file size (<2MB), and MIME type.
  4. On upload completion, the client passes the storage path to the Cloud Run transition API.
- **Storage Lifecycle Policy**:
  - Standard Storage: 0 to 90 days.
  - Nearline Storage: 91 to 365 days (reduces storage unit rate by 60%).
  - Coldline Storage: >365 days (statutory long-term compliance archive).

---

## 4. Workload Performance & Sizing Validation

| Operational Parameter | Baseline Workload Value | Cloud Run / Firestore Handling Capacity | Margin of Safety |
|---|---|---|---|
| **Daily Permit Volume** | 300 permits / day total | Firestore handles >10,000 writes/sec | >1,000× Headroom |
| **Monthly Permit Volume**| 9,000 permits / month | Handled seamlessly within standard serverless limits | High |
| **Peak Creation Rate** | 2–5 permits / minute (07:00–09:00 IST) | Cloud Run handles 80 req/sec per container | >100× Headroom |
| **Concurrent Active Users**| 25–45 peak concurrent users | Cloud Run instance concurrency = 80; scales to 10 instances | 1 instance handles entire peak |
| **Monthly Firestore Reads**| ~1,395,000 reads / month (~46,500/day) | Daily free quota is 50,000 reads/day | Operates near free tier boundary |
| **Monthly Firestore Writes**| ~219,000 writes / month (~7,300/day) | Daily free quota is 20,000 writes/day | 100% within Free Tier |
| **Monthly New Media Storage**| ~6.24 GB / month | Auto-scales to petabytes | Infinite |
| **Monthly Outbound Egress**| ~8.0 GB / month | Monthly free tier is 10 GiB worldwide | 100% within Free Tier |

---

## 5. Security, Compliance & Governance

1. **Indian DPDP Act 2023 Compliance**:
   - Digital signatures captured with explicit statutory consent checkbox, signer identity binding, IST timestamp, and GPS proximity validation.
   - Immutable audit logs stored in append-only subcollections with zero update/delete permissions.
2. **Data Residency**:
   - 100% of operational data, user profiles, audit logs, and media files reside strictly within Indian sovereign borders in Google Cloud region **`asia-south1` (Mumbai, Maharashtra)**.
3. **Disaster Recovery & Business Continuity**:
   - **RPO (Recovery Point Objective)**: 1 minute (enabled via Firestore Point-in-Time Recovery).
   - **RTO (Recovery Time Objective)**: < 15 minutes (automated bucket restoration and container re-deployment).
   - Automated weekly snapshot exports to secondary isolated storage bucket.

---

> **Architectural Sign-off**: This architecture successfully harmonizes construction site field realities (offline operation, mobile cameras, canvas signatures) with strict enterprise safety governance (authoritative state transitions, immutable statutory audit trails, DPDP compliance, and high-availability containerized execution).
