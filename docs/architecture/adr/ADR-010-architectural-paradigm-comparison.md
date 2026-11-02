# ADR-010: Comprehensive Architectural Paradigm Comparison — GCP-First vs. Firebase-First vs. Combined Hybrid

> **Status**: APPROVED & ADOPTED  
> **Date**: 2026-09-25  
> **Authors**: Enterprise Architecture Review Board & Principal Cloud Architects  
> **Context**: Architectural paradigm evaluation for the ARPL EHS Permit-to-Work (PTW) Platform across 6 active business construction sites in India.  

---

## 1. Context & Business Problem

The ARPL EHS Platform digitizes hazardous construction permits (Excavation, Hot Work, Confined Space, Electrical HT/LT, Critical Lifting, Drilling & Blasting, Night Shift Handover) across 6 active construction sites in India, serving 360 unique users and processing **300 permits daily (9,000 permits/month)**.

The platform must satisfy four non-negotiable enterprise constraints:
1. **Subterranean Offline Resilience**: Work takes place in basements (-1 to -4), foundation pits, and concrete shafts where cellular signals do not reach. Field personnel must create, inspect, and sign permits offline, with seamless reconciliation upon reconnection.
2. **Real-time Field Safety Gating**: Changes in safety status (e.g., gas leak alarm, immediate revocation, multi-stage approval advancement) must push to field tablets in under 1 second without manual browser refreshes.
3. **Statutory Non-Repudiation & Legal Compliance**: Strict Indian EHS regulations (DGMS, Factory Rules) and the **Digital Personal Data Protection (DPDP) Act 2023** mandate server-validated Indian Standard Time (IST) timestamps, tamper-evident audit logs, and high-DPI digital signature watermarking on statutory A4 PDF certificates.
4. **Predictable Commercial Cost & High Availability**: Zero tolerance for cold-start delays during the 06:30–09:30 AM morning permit rush, while avoiding expensive idle infrastructure overhead.

---

## 2. Evaluation of Candidate Architectural Paradigms

Three paradigms were evaluated against the technical, operational, and commercial requirements:

### Option 1: Pure Firebase-First Architecture
*Stack: Firebase Authentication + Cloud Firestore + Cloud Functions (2nd Gen) + Firebase Storage + Firebase Hosting.*

```
[Mobile/Web Clients] ──(Direct SDK)──> [Cloud Firestore + Firebase Storage]
                                              │ (Reactive Events)
                                              ▼
                                    [Cloud Functions 2nd Gen]
```

* **Strengths**:
  * Built-in client offline persistence (`IndexedDB` cache) out-of-the-box.
  * Real-time push synchronization (`onSnapshot` listeners) with sub-second propagation.
  * Generous free quotas for Auth (50k MAU), Firestore (50k reads/day), and Hosting (10 GB).
  * Fast initial frontend velocity.
* **Fatal Deficiencies for Enterprise Safety**:
  1. **Unacceptable Cold-Start Latency**: Cloud Functions suffers from **2,000 ms to 5,000 ms cold starts** during traffic spikes. At 07:00 AM, when 45 supervisors simultaneously submit permits, cold starts cause client timeouts on weak 3G/4G connections.
  2. **Severely Constrained PDF Generation**: Compiling multi-page statutory A4 PDFs with embedded high-DPI canvas signatures and Indian legal fonts requires headless Chromium/Puppeteer and custom Debian packages. Cloud Functions lacks container control, memory durability, and execution predictability for heavy PDF pipelines.
  3. **Fragmented Finite State Machine (FSM)**: Managing a 27-state machine across disparate, event-driven functions results in "distributed logic spaghetti", race conditions during concurrent approval sweeps, and difficult auditability.
  4. **No Persistent Connection Pooling**: Cloud Functions creates and destroys database connections rapidly, adding connection overhead under heavy load.

---

### Option 2: Pure GCP-First Architecture
*Stack: Google Compute Engine / Google Kubernetes Engine (GKE) or Cloud Run + Cloud SQL (PostgreSQL) + Google Cloud Storage + Cloud Load Balancing + Cloud NAT/VPC.*

```
[Mobile/Web Clients] ──(HTTPS REST)──> [Cloud Load Balancer]
                                              │
                                              ▼
                                    [Cloud Run / GKE Containers]
                                              │
                       ┌──────────────────────┴──────────────────────┐
                       ▼                                             ▼
             [Cloud SQL (PostgreSQL)]                       [Cloud Storage (GCS)]
```

* **Strengths**:
  * Centralized, authoritative backend API with strict schema enforcement.
  * Traditional relational ACID transactions.
  * Full container runtime control for PDF compilation, custom fonts, and system binaries.
  * Zero cold starts when running persistent VM or warm container pools.
* **Fatal Deficiencies for Field Construction Realities**:
  1. **Catastrophic Failure in Underground Basements**: Cloud SQL and traditional REST APIs have **zero native offline synchronization**. Building an offline-capable client from scratch requires:
     * Writing a custom IndexedDB client storage layer.
     * Building an offline mutation queue with exponential backoff and retry policies.
     * Implementing a bidirectional conflict resolution engine for concurrent edits.
     * *Estimated Effort*: 4 to 6 months of specialized engineering, introducing permanent maintenance overhead and high bug risk in safety-critical workflows.
  2. **High Complexity for Real-Time Pushes**: Relational databases do not support native client push listeners. Propagating immediate safety status changes requires deploying a dedicated WebSocket server cluster (e.g., Socket.io on GKE/VMs) or custom Pub/Sub bridges, requiring 24/7 dedicated compute.
  3. **Prohibitive Base Infrastructure Cost**:
     * Cloud SQL (HA Enterprise): Minimum ~₹6,500 – ₹10,000 / month even at zero load.
     * Cloud External Load Balancer: ~₹1,800 / month.
     * Cloud NAT & Serverless VPC Connector: ~₹3,200 / month.
     * Total base infrastructure cost exceeds **₹11,500 / month (>₹1,38,000 / year)** before handling a single permit!

---

### Option 3: Combined Hybrid Architecture (RECOMMENDED PARADIGM)
*Stack: Firebase Edge Client Data Layer + Google Cloud Run Core Backend Engine (within the SAME Google Cloud Project).*

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              COMBINED HYBRID ARCHITECTURE                              │
│                                                                                        │
│   CLIENT / EDGE DATA LAYER (Firebase)      │  CORE BACKEND & COMPUTE ENGINE (GCP)      │
│   • Firebase Authentication (RBAC Claims)   │  • Cloud Run Container API (`arpl-ehs-api`)│
│   • Cloud Firestore (IndexedDB Offline)    │  • Authoritative 27-State FSM Engine      │
│   • Direct onSnapshot Real-time Listeners  │  • Puppeteer Statutory PDF Compiler       │
│   • Direct-to-GCS Media Uploads            │  • Cloud Tasks Rate-Limited Queue         │
│   • Firebase Hosting Global Edge CDN       │  • Cloud Scheduler 5-Min SLA Sweeper      │
│   • Firebase App Check Bot/DDoS Defense    │  • Secret Manager & Cloud Logging         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Why the Combined Paradigm Delivers the "Best of Both Worlds"**:
  1. **Subterranean Field Operability Solved**: Firestore's client SDK natively handles all local `IndexedDB` persistence, background mutation queues, and automatic bidirectional synchronization upon surfacing from basements.
  2. **Sub-Second Real-Time Safety Awareness**: Firestore's `onSnapshot` listeners update active permit boards across all devices instantly without polling or WebSocket clusters.
  3. **Authoritative Enterprise State Validation**: All 27 finite state transitions, role approvals, and cryptographic signatures are validated exclusively through the Cloud Run Core API. Clients cannot write illegal states directly to the database.
  4. **Containerized Compliance PDF Generation**: Cloud Run executes a custom Debian container packaged with embedded Indian government fonts, high-DPI canvas composition libraries, and headless Chromium to compile legal A4 PDF certificates in under 2 seconds.
  5. **Guaranteed Enterprise Latency (<100ms)**: Sized with a **Warm Instance (`min-instances = 1`)** during operational shift hours (06:00 to 22:00 IST), eliminating cold starts completely during morning permit creation rushes.
  6. **Exceptional Cost Efficiency**: By leveraging Firebase's global free tiers for Auth, CDN, and basic database operations, while deploying serverless container compute with a dedicated warm instance, the total infrastructure spend is **~₹1,750 / month (~$18.25 USD/mo)** — saving over **₹1,15,000 / year** compared to a traditional Cloud SQL architecture!

---

## 3. Comprehensive Comparison Matrix

| Evaluation Criteria | Pure Firebase-First | Pure GCP-First (Cloud SQL + GKE) | Combined Hybrid Architecture (Selected) |
|---|:---:|:---:|:---:|
| **Subterranean Offline Caching** | ⭐⭐⭐⭐⭐ (Native IndexedDB) | ⭐ (Custom engine required) | ⭐⭐⭐⭐⭐ (Native IndexedDB) |
| **Real-time Push Synchronization** | ⭐⭐⭐⭐⭐ (Sub-second onSnapshot) | ⭐⭐ (Requires WebSocket cluster) | ⭐⭐⭐⭐⭐ (Sub-second onSnapshot) |
| **Authoritative State Enforcement** | ⭐⭐⭐ (Distributed Cloud Functions) | ⭐⭐⭐⭐⭐ (Centralized API) | ⭐⭐⭐⭐⭐ (Cloud Run Core Engine) |
| **Statutory PDF & Font Rendering** | ⭐⭐ (Execution & memory limits) | ⭐⭐⭐⭐⭐ (Full Docker runtime) | ⭐⭐⭐⭐⭐ (Full Docker runtime) |
| **Cold-Start Elimination** | ⭐ (2–5s cold starts common) | ⭐⭐⭐⭐⭐ (Dedicated VM/Nodes) | ⭐⭐⭐⭐⭐ (Min-Instances = 1 warm) |
| **Development Velocity** | ⭐⭐⭐⭐ (Fast MVP, slow enterprise) | ⭐⭐ (Heavy custom sync code) | ⭐⭐⭐⭐⭐ (Optimal modularity) |
| **Operational Maintenance** | ⭐⭐⭐⭐ (Fully managed serverless) | ⭐⭐ (OS patching, DB tuning) | ⭐⭐⭐⭐⭐ (Fully managed serverless) |
| **Base Idle Infrastructure Cost** | ⭐⭐⭐⭐⭐ (~₹0 / month) | ⭐ (>₹11,500 / month) | ⭐⭐⭐⭐ (~₹1,500 – ₹1,900 / month) |
| **Annual Year 1 Cost (300/day)** | ~₹18,000 / yr (poor latency) | ~₹1,60,000 / yr | **~₹21,000 / yr (enterprise SLA)** |
| **Overall Recommendation** | REJECTED (Unacceptable SLA/PDF) | REJECTED (Fails offline basement req) | **APPROVED & MANDATED ARCHITECTURE** |

---

## 4. Decision & Implementation Invariants

1. **Mandate**: The ARPL EHS Permit-to-Work Platform shall strictly be implemented using the **Combined Hybrid Architecture**:
   - **Frontend & Edge**: Firebase Authentication, Cloud Firestore (Native Mode with offline persistence enabled), Firebase Storage, Firebase Hosting CDN, Firebase App Check.
   - **Backend & Core Engine**: Google Cloud Run (`arpl-ehs-api`), Google Cloud Tasks, Google Cloud Scheduler, Google Secret Manager, Google Cloud Logging & Monitoring.
2. **Project Consolidation**: Both Firebase services and Google Cloud services shall reside within the **same Google Cloud Project** (`arpl-ehs-prod` for production, `arpl-ehs-dev` for development), sharing IAM service accounts, internal VPC networks, and unified billing.
3. **Warm-Instance SLA Invariant**: Production Cloud Run services shall maintain `min-instances = 1` during daily operational shift hours (06:00 to 22:00 IST) to guarantee sub-100ms response times and eliminate cold starts.
