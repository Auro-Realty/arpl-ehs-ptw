# Google Cloud Platform Bill of Materials & Service Justification

> **Document ID**: ARPL-BOM-GCP-2026-09-28-R4  
> **Status**: AUDITED, REGIONALLY VALIDATED & DAILY-TRANSACTION VERIFIED  
> **Revision**: R4 — High-Resolution 10.0 MB Media Standard Breakdown  
> **Target Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Pricing Standard**: Google Cloud India List Catalog | Live FX Rate: **1 USD = ₹95.90 INR**  
> **Target Workload**: 6 Business Projects · 360 Unique Users · 300 Permits/Day Total (9,000/mo)  

---

## 1. Google Cloud Service Portfolio Review

Every candidate Google Cloud service is independently audited to eliminate bloat, prevent architectural duplication, and mathematically justify every provisioned rupee.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              GOOGLE CLOUD SERVICES AUDIT                               │
│                                                                                        │
│  [REQUIRED]    • Cloud Run (`asia-south1`)       • Cloud Storage (Private DR Bucket)   │
│                • Cloud Scheduler                 • Cloud Tasks                         │
│                • Secret Manager                  • Artifact Registry                   │
│                • Cloud Build                     • Cloud Logging & Monitoring          │
│                • Firestore PITR Protection                                             │
│                                                                                        │
│  [FUTURE/OPT]  • Vertex AI (Gemini 1.5 Flash - Visual Hazard OCR)                      │
│                                                                                        │
│  [REJECTED]    • Cloud SQL       • BigQuery     • Pub/Sub        • Cloud Run Jobs      │
│                • Eventarc        • API Gateway  • Cloud Armor    • External Load Bal   │
│                • VPC / Cloud NAT • Cloud KMS    • Memorystore                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Itemized Service Evaluations & Compute Mechanics

### 2.1 Google Cloud Run (Fully Managed Container Compute)
- **Required**: **YES**
- **Requirement**: Containerized execution runtime for the Core Backend API (`arpl-ehs-api`), authoritative 27-state FSM validation, statutory A4 PDF compilation with high-DPI signatures, and SLA escalation batch workers.
- **Physical Daily Transactions (300 permits/day)**:
  - 1,800 state transition validations / day.
  - 300 statutory multi-page A4 PDF compilations / day.
  - 4,320 user dashboard, activity log, and notification requests / day.
  - 1,140 background and scheduler dispatches / day.
  - **Total API Requests**: 7,560 requests/day = **226,800 requests / month**.
- **Active vCPU & RAM Consumption Math**:
  - PDF Compilation (Chromium/Puppeteer): 300 PDFs/day × 2.5s = 750 vCPU-sec/day = **22,500 vCPU-sec / month**.
  - State Transitions & REST APIs: 226,800 calls @ 150 ms = **34,020 vCPU-sec / month**.
  - SLA Escalation Engine: 8,640 sweeps @ 100 ms = **864 vCPU-sec / month**.
  - **Total Active Compute**: **57,384 vCPU-seconds** and **57,384 GiB-seconds / month**.
  - *Always Free Tier Allowance*: 180,000 vCPU-sec and 360,000 GiB-sec free.
  - *Active Compute Cost*: **₹0.00 / month** (100% within free quota).
- **Production Warm Instance SLA (`min-instances = 1`)**:
  - To eliminate 2–5s cold starts for 35–45 concurrent morning users (06:30–09:30 AM), Cloud Run keeps **1 instance warm** during operational shift hours (06:00 to 22:00 IST = 480 hours/month):
  - Idle vCPU: $480 \text{ hrs} \times 3,600\text{s} \times 1 \text{ vCPU} \times \$0.00000450 \times ₹95.90 = \mathbf{₹745.72 / \text{month}}$.
  - Idle RAM: $480 \text{ hrs} \times 3,600\text{s} \times 1 \text{ GiB} \times \$0.00000090 \times ₹95.90 = \mathbf{₹149.14 / \text{month}}$.
  - **Warm Compute Subtotal**: **₹894.86 / month** (~$9.33 USD/month).
- **Cloud Run Internet Egress**:
  - 226,800 calls × 3.5 KB = 0.79 GB/month @ $0.12/GB (Premium Tier) = **₹9.09 / month**.

---

### 2.2 Google Cloud Storage (Private Disaster Recovery Bucket)
- **Required**: **YES**
- **Requirement**: Dedicated, private storage bucket (`arpl-ehs-backups-prod`) in `asia-south1` for weekly scheduled Firestore database exports and compliance audit bundles.
- **Monthly Usage**: 4 weekly snapshots × 2.0 GB = 8.0 GB stored.
- **Regional Free Tier Rule**: GCS free tier is US-only. All 8.0 GB is billable in `asia-south1`.
- **Cost (INR)**: 8.0 GB × ₹2.4934/GB = **₹19.95 / month**.

---

### 2.3 Google Cloud Tasks & Cloud Scheduler
- **Cloud Tasks**: 20,000 background task dispatches / month = **₹0.00 / month** (within 1,000,000 free tasks).
- **Cloud Scheduler**: 1 active job (8,640 sweeps/mo) = **₹0.00 / month** (within 3 free jobs).

---

### 2.4 Google Secret Manager
- **Required**: **YES**
- **Monthly Usage**: 4 active secret versions (within 6 free) + 20,000 access operations (10,000 billable @ ₹2.88/10k) = **₹2.88 / month**.

---

### 2.5 Google Cloud Build & Artifact Registry (CI/CD Pipeline)
- **Cloud Build**: 100 build minutes / month = **₹0.00 / month** (within 2,500 free min/mo).
- **Artifact Registry**: 0.5 GB stored = **₹0.00 / month** (within 0.5 GiB free tier).

---

### 2.6 Google Cloud Logging & Monitoring
- **Cloud Logging**: 3.0 GiB structured log ingestion / month = **₹0.00 / month** (within 50.0 GiB free quota).
- **Cloud Monitoring**: Standard metrics & uptime checks = **₹0.00 / month** (Included).

---

## 3. GCP Bill of Materials Summary Table (Baseline PROD)

| BOM ID | GCP Service | Resource / Meter | Monthly Usage | Free Quota | Applies to `asia-south1`? | Billable Qty | Unit Rate (INR) | Monthly INR |
|---|---|---|---|---|:---:|---|---|---:|
| **GCP-001** | Cloud Run | Requests | 226,800 req | 2,000,000 req | ✅ YES | 0 | ₹38.36 / M | **₹0.00** |
| **GCP-002** | Cloud Run | Active vCPU-sec | 57,384 sec | 180,000 sec | ✅ YES | 0 | ₹0.0023 / sec | **₹0.00** |
| **GCP-003** | Cloud Run | Active GiB-sec | 57,384 sec | 360,000 sec | ✅ YES | 0 | ₹0.0002 / sec | **₹0.00** |
| **GCP-004** | Cloud Run | **Warm Instance SLA** | 480 hours | None | — | 480 hrs | Idle rates | **₹894.86** |
| **GCP-005** | Cloud Run Egress | Internet Egress | 0.79 GB | 1 GB (N. America) | ❌ NO | 0.79 GB | ₹11.51 / GB | **₹9.09** |
| **GCP-006** | Cloud Storage | Disaster Recovery Bucket| 8.0 GB | 5 GB (US only) | ❌ NO | 8.0 GB | ₹2.49 / GB | **₹19.95** |
| **GCP-007** | Cloud Tasks | Dispatched Operations | 20,000 ops | 1,000,000 ops | ✅ YES | 0 | ₹38.36 / M | **₹0.00** |
| **GCP-008** | Cloud Scheduler | Active Job | 1 job | 3 jobs | ✅ YES | 0 | ₹9.59 / job | **₹0.00** |
| **GCP-009** | Secret Manager | Active Secret Versions | 4 versions | 6 versions | ✅ YES | 0 | ₹5.75 / ver | **₹0.00** |
| **GCP-010** | Secret Manager | Secret Access Ops | 20,000 ops | 10,000 ops | ✅ YES | 10,000 ops | ₹2.88 / 10K | **₹2.88** |
| **GCP-011** | Cloud Build | Build Minutes | 100 min | 2,500 min | ✅ YES | 0 | ₹0.29 / min | **₹0.00** |
| **GCP-012** | Artifact Registry | Container Image Storage | 0.5 GB | 0.5 GiB | ✅ YES | 0 | ₹9.59 / GB | **₹0.00** |
| **GCP-013** | Cloud Logging | Log Ingestion | 3.0 GiB | 50.0 GiB | ✅ YES | 0 | ₹47.95 / GiB | **₹0.00** |
| **GCP-014** | Cloud Monitoring | Metrics & Uptime | Standard | Included | ✅ YES | 0 | ₹0.00 | **₹0.00** |
| **TOTAL** | **GCP Services** | **Pre-Tax Subtotal** | — | — | — | — | — | **₹926.78** |

---

> **GCP BOM Sign-off**: With Cloud Run Warm Instance compute provisioned to eliminate cold starts, GCP native infrastructure delivers an enterprise-grade backend for **₹926.78 / month (~$9.66 USD/month)**.

