# ADR-002: Cloud Run for Core Backend API & Statutory Compute

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Cloud Infrastructure Lead, Security Architect  
> **Technical Scope**: Server-Side Execution Runtime, API Layer, Statutory PDF Engine, Background Escalation  

---

## 1. Context and Problem Statement

The initial draft architecture proposed relying exclusively on **Cloud Functions for Firebase (2nd gen)** for all server-side logic, while summarily rejecting Google **Cloud Run**.

A critical evaluation of the ARPL EHS requirements reveals that Cloud Functions alone is inadequate and technically fragile for key production workloads:
1. **Statutory PDF Generation (FR-009)**: Regulatory EHS permits require official A4 PDF generation with embedded high-DPI canvas signatures (FR-012), GPS coordinate watermarks, multi-gas test graphs, and complete signatory chains. Generating 9,000 statutory PDFs/month requires predictable memory allocation, custom font rendering (e.g., Indian statutory typographic standards), and headless document libraries.
2. **Authoritative State Transitions & RBAC (FR-001, FR-003, FR-004)**: The state machine encompasses 27 operational states and 16 distinct roles with complex gating (e.g., 3-way parallel clearances for PTW-001, either/or dual-topology for PTW-006, and stale-approval invalidation). Embedding this logic inside multiple independent Cloud Functions leads to cold starts (2–5 seconds per function invocation) during peak morning permit surges (07:00–10:00 IST) and deployment drift.
3. **Continuous SLA Escalation Engine (FR-007)**: Real-time SLA monitoring (Stage 1 SLA 2h, Stage 2 SLA 4h, T-30 min warning, auto-expiry, and emergency auto-cancel on open safety observations) requires an authoritative scheduled batch worker.
4. **Concurrency and Resource Sharing**: Cloud Functions (1st gen) enforces 1 concurrent request per instance; 2nd gen can configure concurrency but still lacks unified container lifecycle hooks. Cloud Run natively handles up to 80–250 concurrent requests per instance, sharing database connection pools and secret caches.

---

## 2. Decision

We mandate the deployment of **Google Cloud Run** in `asia-south1` (Mumbai) as the **Core Backend API and Statutory Compute Engine** (`arpl-ehs-api`).

The workload division is strictly defined:
- **Cloud Run Responsibilities**:
  1. Authoritative State Machine Transitions (`POST /api/v1/permits/:id/transition`)
  2. Server-Side Statutory PDF Generation & Digital Watermarking (`POST /api/v1/permits/:id/generate-pdf`)
  3. Escalation & Auto-Expiry SLA Worker (`POST /api/v1/escalation/tick`, invoked by Cloud Scheduler)
  4. User Provisioning & Project Assignment API (`POST /api/v1/admin/users/assign`)
  5. Bulk Data Export for Regulatory Audits (`POST /api/v1/export/audit-pack`)
- **Cloud Functions Responsibilities (Retained for Event-Driven Reactive Tasks)**:
  1. Firestore change triggers (`onDocumentWritten`) for lightweight notification dispatch and activity log validation.
- **Firebase Responsibilities (Client-Facing)**:
  1. Direct client reads and offline persistence via Cloud Firestore SDK.
  2. Direct client media uploads via Firebase Storage SDK.
  3. Client authentication via Firebase Auth SDK.
  4. Global SPA delivery via Firebase Hosting.

---

## 3. Detailed Comparison: Cloud Functions vs. Cloud Run

| Architectural Dimension | Cloud Functions (2nd Gen) | Cloud Run (Selected Core API) | Winner & Architectural Impact |
|---|---|---|---|
| **Packaging & Runtime** | Ephemeral archive, Node.js managed | Custom Docker container (Debian slim + fonts + Node.js/Go) | **Cloud Run**: Full control over OS libraries, fonts for PDFs |
| **Concurrency** | Configurable, but typically low | Up to 1,000 concurrent reqs/container (configured to 80) | **Cloud Run**: 80 concurrent users share 1 container instance |
| **Cold Start Latency** | 2,500ms – 5,000ms across multiple functions | 1,200ms cold start; 15–35ms warm latency | **Cloud Run**: Shared warm instance eliminates mobile latency |
| **Execution Duration** | Up to 9 min (HTTP), 60 min (Event) | Up to 60 minutes for HTTP requests | **Cloud Run**: Resilient to large regulatory report generation |
| **Memory / CPU Flexibility**| Up to 16 GiB / 4 vCPU | Up to 32 GiB / 8 vCPU | **Cloud Run**: High-DPI canvas rendering headroom |
| **Local Development** | Firebase Emulator Suite | Docker Compose + Local container parity | **Cloud Run**: Identical environment across Dev, CI, and Prod |
| **Cost at Workload** | $0.40/M req + CPU/RAM per invocation | Same unit rates, but concurrency drastically cuts vCPU-sec | **Cloud Run**: More cost-efficient under concurrent load |
| **Connection Pooling** | Frequent pool re-creation on scale | Persistent keep-alive connections to Firestore & GCS | **Cloud Run**: Significantly reduces TLS handshake overhead |

---

## 4. Operational Sizing & Scaling Policy

- **Service Name**: `arpl-ehs-api`
- **Region**: `asia-south1` (Mumbai, India)
- **Container Sizing**: 1 vCPU, 1 GiB RAM (optimized for Node.js + PDF rendering memory)
- **Concurrency**: 80 requests per instance
- **Scaling Policy (PROD)**:
  - *Baseline Cost-Optimized Mode*: `min-instances = 0`, `max-instances = 10`. Scales to zero during off-shift hours (22:00–06:00 IST). Generates zero compute cost during idle periods, staying 100% within the monthly free tier (180,000 vCPU-sec, 360,000 GiB-sec, 2M requests).
  - *High-Availability Enterprise Mode (Optional)*: `min-instances = 1` during construction shift hours (06:00–22:00 IST) to guarantee sub-50ms response times for emergency site operations. Incremental cost is ~₹1,250/month.
- **Scaling Policy (DEV)**:
  - `min-instances = 0`, `max-instances = 2`. 100% scale-to-zero.

---

## 5. Security & Ingress Configuration

1. **Ingress Control**: Cloud Run ingress is configured to accept public traffic via HTTPS, secured by Firebase Authentication JWT verification middleware.
2. **Service-to-Service Security**: The Cloud Scheduler escalation tick endpoint (`/api/v1/escalation/tick`) is protected by Google OIDC token authentication via dedicated IAM Service Account (`ehs-scheduler-sa@arpl-ehs.iam.gserviceaccount.com`).
3. **Secret Injection**: Environment variables and database credentials are injected securely via Google Secret Manager at container runtime.

---

## 6. Consequences & Verdict

- **Decision**: **Cloud Run is genuinely required and approved as the primary compute backbone.**
- **Cost Verdict**: Far from inflating costs, Cloud Run leverages Google Cloud's generous Always Free tier (2M requests, 180k vCPU-sec, 360k GiB-sec), yielding a baseline compute cost of **₹0/month** in scale-to-zero mode, while providing an enterprise-grade containerized execution runtime.
