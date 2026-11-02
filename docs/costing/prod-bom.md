# Production Environment — Bill of Materials (PROD BOM)

> **Document ID**: ARPL-BOM-PROD-2026-09-28-R4  
> **Status**: PROCUREMENT-GRADE, AUDITED & DAILY-TRANSACTION VALIDATED  
> **Revision**: R4 — High-Resolution 10.0 MB Media Standard with Production Warm Compute SLA  
> **Environment**: Production (`arpl-ehs-prod`)  
> **Target Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Pricing Verification**: 2026-09-28 | Live FX Rate: **1 USD = ₹95.90 INR**  
> **Confirmed Workload**: 6 Business Projects · 360 Unique Users · 300 Permits/Day Total (9,000/mo, 109,500/yr)  

---

## 1. Production Operational Parameters & Daily Transaction Sizing

Every line item below is mathematically derived from the confirmed physical daily workload of **300 permits issued daily across 6 construction sites**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CONFIRMED PROD WORKLOAD PROFILE                           │
│                                                                                        │
│  • Active Business Construction Projects:     6 Construction Sites                     │
│  • Total Registered Unique Users:             360 Unique Authenticated Accounts        │
│  • Monthly Active Users (MAU):                360 MAU (100% active on sites)           │
│  • Daily Active Personnel (DAU):              ~216 Active Staff / Day (60% on shift)   │
│  • Peak Concurrent Users:                     35 to 45 Concurrent Users (06:30–09:30)  │
│  • Daily Permit Creation Volume:              300 Permits / Day Total (50/day/site)    │
│  • Monthly Permit Volume (30-day billing):    9,000 Permits / Month                    │
│  • Annual Permit Volume (365 days):           109,500 Permits / Year                   │
│  • Media Payload Standard:                    10.0 MB Average (5.5 Photos + 5 Sigs + 1 PDF)
│  • Primary Database:                          Cloud Firestore (`asia-south1`)          │
│  • Core Backend & Statutory Compute:          Google Cloud Run (`arpl-ehs-api`)        │
│  • Production Availability SLA:               Warm Instance (`min-instances = 1`)      │
│  • Network Service Tier:                      Premium Tier (Cloud Run default)          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Regional Free Tier Rules for `asia-south1` (Mumbai)
* ⚠️ **Cloud Storage**: GCP Always Free quotas (5 GB storage, 50k ops) apply **ONLY to US regions**. In `asia-south1`, all GCS storage and operations are billable from byte zero.
* ⚠️ **Cloud Run Egress**: Premium Tier internet egress free quota (1 GB) applies **ONLY to North America**. In `asia-south1`, all Cloud Run internet egress is billable at $0.12/GB.
* ✅ **Global Free Quotas (Active in Mumbai)**: Firestore (50k reads/day, 20k writes/day, 1 GiB storage, 10 GiB/mo egress), Firebase Hosting (10 GB storage, 10.8 GB/mo CDN), Firebase Auth (50k MAU), Cloud Run active compute (180k vCPU-sec, 360k GiB-sec), Artifact Registry (0.5 GiB).

---

## 2. Comprehensive Itemized Production BOM (Revision R4)

| BOM ID | Category | Service | Resource / Metric | Region | SKU / Meter Family | Billing Unit | Monthly Usage | Free Quota | Billable Qty | Unit Rate (USD) | Unit Rate (INR @ ₹95.90) | Month 1 Cost (INR) | Month 12 Cost (INR) | Source | Confidence | Primary Operational Basis |
|---|---|---|---|---|---|---|---:|---|---:|---:|---:|---:|---:|---|---|---|
| **PRD-001** | 07. Identity | Firebase Auth | Email/Password MAU | global | `Firebase Auth Free Tier` | MAU | 360 | 50,000 / mo | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Firebase Pricing | HIGH | 360 unique users across 6 sites |
| **PRD-002** | 01. Firebase | Firebase Hosting | SPA Asset Storage | global | `Hosting Storage` | GB | 0.8 | 10.0 GB | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Firebase Pricing | HIGH | Zero-build production SPA files |
| **PRD-003** | 01. Firebase | Firebase Hosting | CDN Data Transfer | global | `Hosting Transfer` | GB | 4.5 | 10.8 GB / mo | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Firebase Pricing | HIGH | PWA client bundle edge delivery |
| **PRD-004** | 03. Database | Cloud Firestore | Document Reads | asia-south1 | `Firestore Doc Reads` | per 100K | 2,292,600 | 1,500,000 / mo (50K/day) | 792,600 | $0.036 | ₹3.45 | **₹27.36** | **₹27.36** | Firestore Docs | HIGH | 76,420 reads/day (DAU + onSnapshot) |
| **PRD-005** | 03. Database | Cloud Firestore | Document Writes | asia-south1 | `Firestore Doc Writes` | per 100K | 225,000 | 600,000 / mo (20K/day) | 0 | $0.108 | ₹10.36 | **₹0.00** | **₹0.00** | Firestore Docs | HIGH | 7,500 writes/day (25 writes/permit) |
| **PRD-006** | 03. Database | Cloud Firestore | Document Deletes | asia-south1 | `Firestore Doc Deletes` | per 100K | 10,000 | 600,000 / mo (20K/day) | 0 | $0.012 | ₹1.15 | **₹0.00** | **₹0.00** | Firestore Docs | HIGH | Notification housecleaning |
| **PRD-007** | 03. Database | Cloud Firestore | Primary Data Storage | asia-south1 | `Firestore Storage` | GiB | 0.1 → 1.08 | 1.0 GiB (all regions) | 0 (M1) → 0.08 (M12) | $0.207 | ₹19.85 | **₹0.00** | **₹1.59** | Firestore Docs | HIGH | 300 permits/day × 10 KB JSON |
| **PRD-008** | 03. Database | Cloud Firestore | Point-in-Time Recovery | asia-south1 | `Firestore PITR` | GiB | 1.08 | None | 1.08 | $0.120 | ₹11.51 | **₹12.43** | **₹12.43** | Firestore Pricing | HIGH | Continuous 7-day statutory recovery |
| **PRD-009** | 04. Storage | Cloud Storage | Media Ingestion Storage | asia-south1 | `Cloud Storage Standard` | GB | 87.89 (M1) → 1,054.69 (M12) | **0 GB (US only)** | 87.89 → 1,054.69 | $0.026 | ₹2.49 | **₹219.14** | **₹2,629.76** | GCS Pricing | HIGH | 300 permits/day × 10.0 MB media |
| **PRD-010** | 04. Storage | Cloud Storage | Class A Upload Ops | asia-south1 | `Storage Class A Ops` | per 10K | 108,000 | **0 (US only)** | 108,000 | $0.050 | ₹4.80 | **₹51.79** | **₹51.79** | GCS Pricing | HIGH | 12 file uploads per permit |
| **PRD-011** | 04. Storage | Cloud Storage | Class B Read Ops | asia-south1 | `Storage Class B Ops` | per 10K | 180,000 | **0 (US only)** | 180,000 | $0.004 | ₹0.38 | **₹6.90** | **₹6.90** | GCS Pricing | HIGH | Field inspector previews |
| **PRD-012** | 02. Compute | Google Cloud Run | API Invocations | asia-south1 | `Cloud Run Requests` | per 1M | 226,800 | 2,000,000 / mo | 0 | $0.400 | ₹38.36 | **₹0.00** | **₹0.00** | Cloud Run Pricing | HIGH | 7,560 requests/day |
| **PRD-013** | 02. Compute | Google Cloud Run | Active vCPU Runtime | asia-south1 | `Cloud Run Active CPU` | vCPU-sec | 57,384 | 180,000 / mo | 0 | $0.000024 | ₹0.0023 | **₹0.00** | **₹0.00** | Cloud Run Pricing | HIGH | Includes 300 daily PDF compilations (2.5s ea) |
| **PRD-014** | 02. Compute | Google Cloud Run | Active RAM Runtime | asia-south1 | `Cloud Run Active RAM` | GiB-sec | 57,384 | 360,000 / mo | 0 | $0.0000025| ₹0.00024| **₹0.00** | **₹0.00** | Cloud Run Pricing | HIGH | 1 GiB container allocation |
| **PRD-015** | 02. Compute | Google Cloud Run | **Production Warm Instance SLA** | asia-south1 | `Cloud Run Idle CPU+RAM (Min-Inst)`| hours | 480 (16 hrs/day) | None | 480 | — | — | **₹894.86** | **₹894.86** | Cloud Run Pricing | HIGH | **min-instances=1 to eliminate cold starts** |
| **PRD-016** | 02. Compute | Cloud Functions | Reactive Event Triggers | asia-south1 | `Cloud Functions 2nd Gen`| invocations | 225,000 | Shares Cloud Run | 0 | $0.400 | ₹38.36 | **₹0.00** | **₹0.00** | CF Pricing | HIGH | Background notification fan-out |
| **PRD-017** | 08. Messaging | Google Cloud Tasks | Deferred Async Tasks | asia-south1 | `Cloud Tasks Dispatches` | per 1M | 20,000 | 1,000,000 / mo | 0 | $0.400 | ₹38.36 | **₹0.00** | **₹0.00** | Cloud Tasks Docs | HIGH | Background PDF queue & retries |
| **PRD-018** | 08. Messaging | Cloud Scheduler | Escalation SLA Sweeps | asia-south1 | `Cloud Scheduler Active` | jobs | 1 | 3 / mo | 0 | $0.100 | ₹9.59 | **₹0.00** | **₹0.00** | Scheduler Docs | HIGH | 5-min cron triggering SLA engine |
| **PRD-019** | 05. Networking | Cloud Run Egress | API JSON Responses | asia-south1 | `Cloud Run Internet Egress` | GB | 0.79 | **0 GB (N. America only)** | 0.79 | $0.120 | ₹11.51 | **₹9.09** | **₹9.09** | Network Pricing | HIGH | 226,800 calls × 3.5 KB response |
| **PRD-020** | 05. Networking | Firestore Egress | Client SDK Data Transfer | asia-south1 | `Firestore Outbound Egress` | GiB | 14.0 | 10.0 GiB / mo (global) | 4.0 | $0.120 | ₹11.51 | **₹46.03** | **₹46.03** | Firestore Pricing | HIGH | onSnapshot real-time field sync |
| **PRD-021** | 05. Networking | GCS Egress | Media Download Transfers | asia-south1 | `GCS Internet Egress` | GB | 215.33 | **0 GB (No free tier)** | 215.33 | $0.120 | ₹11.51 | **₹2,478.02** | **₹2,478.02** | Network Pricing | HIGH | 300 permits/day × 3.5 reviews × 7.0 MB |
| **PRD-022** | 06. Security | Secret Manager | Active Secret Versions| global | `SM Active Version` | version | 4 | 6 | 0 | $0.060 | ₹5.75 | **₹0.00** | **₹0.00** | Secret Mgr Docs | HIGH | Token & signing secrets |
| **PRD-023** | 06. Security | Secret Manager | Secret Access Ops | global | `SM Access Operation` | per 10K | 20,000 | 10,000 | 10,000 | $0.030 | ₹2.88 | **₹2.88** | **₹2.88** | Secret Mgr Docs | HIGH | Cached in container memory |
| **PRD-024** | 12. CI/CD | Google Cloud Build| Container Build Min | asia-south1 | `Cloud Build e2-std-2` | minutes | 100 | 2,500 | 0 | $0.003 | ₹0.29 | **₹0.00** | **₹0.00** | Cloud Build Docs | HIGH | 20 PROD deployments @ 5 min |
| **PRD-025** | 12. CI/CD | Artifact Registry| Container Image Store | asia-south1 | `Artifact Registry Store` | GB | 0.5 | 0.5 GiB (global) | 0 | $0.100 | ₹9.59 | **₹0.00** | **₹0.00** | Artifact Reg Docs| HIGH | 2 PROD images within 0.5 GiB free |
| **PRD-026** | 10. Logging | Cloud Logging | Compliance Log Ingestion| global | `Logging Ingestion` | GiB | 3.0 | 50.0 GiB | 0 | $0.500 | ₹47.95 | **₹0.00** | **₹0.00** | Cloud Logging | HIGH | Audit logs, 30-day retention |
| **PRD-027** | 11. Monitoring | Cloud Monitoring| Container Health & SLA | global | `Monitoring Ingestion` | metrics | Standard | Included | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Monitoring Docs | HIGH | Uptime & latency alerts |
| **PRD-028** | 13. Backup/DR | Cloud Storage | Weekly DB Snapshot | asia-south1 | `Cloud Storage Standard` | GB | 8.0 | **0 GB (US only)** | 8.0 | $0.026 | ₹2.49 | **₹19.95** | **₹19.95** | GCS Pricing | HIGH | 4 weekly snapshots × 2.0 GB |

---

## 3. Financial Recapitulation by Progression

| Milestone Timeline | Cumulative Stored Data | Recurring Monthly Pre-Tax Cost | GST @ 18.00% | Recurring Monthly Post-Tax Payable |
|---|---|---:|---:|---:|
| **Month 1 (Go-Live)** | 87.89 GB Media | **₹3,768.45 INR** | ₹678.32 INR | **₹4,446.77 INR** |
| **Month 3** | 263.67 GB Media | **₹4,207.03 INR** | ₹757.27 INR | **₹4,964.30 INR** |
| **Month 6** | 527.34 GB Media | **₹4,864.46 INR** | ₹875.60 INR | **₹5,740.06 INR** |
| **Month 9** | 791.02 GB Media | **₹5,521.93 INR** | ₹993.95 INR | **₹6,515.88 INR** |
| **Month 12 (Year-End)** | 1,054.69 GB Media | **₹6,180.66 INR** | ₹1,112.52 INR | **₹7,293.18 INR** |

### 3.1 Blended Annual Production Total (Year 1)
- **Blended Monthly Average (Pre-Tax)**: **~₹4,974.69 INR / month (~$51.87 USD/month)**
- **Annualized Pre-Tax Total (Year 1)**: **₹59,696.33 INR / year (~$622.49 USD/year)**
- **Annualized GST @ 18.00% (SAC 998315)**: **₹10,745.34 INR / year** (100% creditable via Input Tax Credit)
- **Annualized Post-Tax Total (Year 1)**: **₹70,441.67 INR / year (~$734.53 USD/year)**

---

## 4. First-Principles Cost Drivers Breakdown

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION COST DRIVER COMPOSITION                        │
│                                                                                        │
│  1. Network Egress (Field Reviews + API):      ₹30,397.68 INR / yr    (50.9%)          │
│     • GCS media download egress: ₹2,478.02/mo (215.33 GB/mo for field approver reviews)│
│     • Firestore real-time sync egress: ₹46.03/mo (4.0 GiB billable above 10 GiB free)  │
│     • Cloud Run API JSON egress: ₹9.09/mo (0.79 GB/mo)                                 │
│                                                                                        │
│  2. Cloud Storage Media Archive & Ops (GCS):   ₹18,038.29 INR / yr    (30.2%)          │
│     • GCS 12-month variable cumulative storage: ₹17,094.61 / year (87.89 GB/mo)        │
│     • Class A Upload Ops: ₹51.79/mo (108,000 ops) = ₹621.48 / year                     │
│     • Class B Read Ops: ₹6.90/mo (180,000 ops) = ₹82.80 / year                         │
│     • Private DR Backup Bucket: ₹19.95/mo (8.0 GB stored) = ₹239.40 / year             │
│                                                                                        │
│  3. Cloud Run Compute (Warm Instance SLA):     ₹10,738.32 INR / yr    (18.0%)          │
│     • min-instances = 1 during shift hours (06:00–22:00) eliminates all cold starts    │
│                                                                                        │
│  4. Cloud Firestore Operations & Storage:      ₹485.88 INR / yr       (0.8%)           │
│     • 2.29M reads/month (₹27.36/mo) + 7-day continuous PITR backup (₹12.43/mo)         │
│     • Cumulative Month 12 storage overage (0.08 GiB billable)                          │
│                                                                                        │
│  5. Security (Secret Manager):                 ₹34.56 INR / yr        (0.1%)           │
│     • 10,000 billable secret access operations (₹2.88/mo)                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

