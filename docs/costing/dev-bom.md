# Development Environment — Bill of Materials (DEV BOM)

> **Document ID**: ARPL-BOM-DEV-2026-09-28-R4  
> **Status**: APPROVED & AUDITED — **REGIONALLY & TRANSACTION VALIDATED**  
> **Revision**: R4 — High-Resolution 10.0 MB Media Standard Validation for Non-Prod Testing  
> **Environment**: Development / Non-Production Testing (`arpl-ehs-dev`)  
> **Target Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Pricing Verification**: 2026-09-28 | Live Spot FX: **1 USD = ₹95.90 INR**  
> **Dedicated Cloud Tenant**: `arpl-ehs-dev` (Completely isolated from Production)  

---

## 1. DEV Workload Profile & Operating Policy

The Development environment supports feature engineering, automated unit/integration testing (25 test suites), QA role persona verification, and CI/CD deployment pipelines:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEV WORKLOAD PARAMETERS                                   │
│                                                                                        │
│  • Core Engineering Team:            3 Full-time Developers                            │
│  • Simulated Role Persona Accounts:   16 Test User Accounts (1 per RBAC role)          │
│  • Total Registered Accounts:         19 User Accounts                                 │
│  • DEV Monthly Active Users (MAU):    10 MAU                                           │
│  • Daily Test Permits Created:        10 Permits / Day                                 │
│  • Monthly Test Permits Created:      250 Permits / Month                              │
│  • Media Payload Standard:            10.0 MB Average per Test Permit                  │
│  • Compute Scaling Policy:            100% Scale-to-Zero (min-instances = 0)           │
│  • Primary Development Mode:          Firebase Local Emulator Suite (Zero Cloud Cost)  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DEV Itemized Bill of Materials

> **Regional Note**: GCS storage and operations free tiers (5 GB, 5K Class A, 50K Class B) apply **ONLY to US regions** (`us-central1`, `us-east1`, `us-west1`). In `asia-south1`, all GCS usage is billable.

| BOM ID | Category | Service | Resource / Metric | Region | SKU / Meter Family | Billing Unit | Monthly Usage | Free Quota | Free Tier Scope | Billable Usage | Unit Rate (USD) | Unit Rate (INR @ ₹95.90) | Monthly Cost (INR) | Annualized Cost (INR) | Source & Confidence | Explicit Modeling Assumption |
|---|---|---|---|---|---|---|---:|---|---|---:|---:|---:|---:|---:|---|---|
| **DEV-001** | 07. Identity | Firebase Auth | Email/Password Accounts | global | `Firebase Auth Free Tier` | MAU | 10 | 50,000 | Per Project — Global | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Firebase Pricing [HIGH] | 10 active test accounts |
| **DEV-002** | 01. Firebase | Firebase Hosting | SPA Asset Storage | global | `Hosting Storage` | GB | 0.5 | 10.0 GB | Per Project — Global | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Firebase Pricing [HIGH] | Static SPA files |
| **DEV-003** | 01. Firebase | Firebase Hosting | CDN Data Transfer | global | `Hosting Transfer` | GB | 1.0 | 10.8 GB/mo | Per Project — Global CDN | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Firebase Pricing [HIGH] | Dev web testing traffic |
| **DEV-004** | 03. Database | Cloud Firestore | Document Reads | asia-south1 | `Firestore Doc Reads` | per 100K | 125,000 | 1,500,000/mo | Per Project — All Regions | 0 | $0.036 | ₹3.45 | **₹0.00** | **₹0.00** | Firestore Docs [HIGH] | ~4,166 reads/day (within 50k free) |
| **DEV-005** | 03. Database | Cloud Firestore | Document Writes | asia-south1 | `Firestore Doc Writes` | per 100K | 35,000 | 600,000/mo | Per Project — All Regions | 0 | $0.108 | ₹10.36 | **₹0.00** | **₹0.00** | Firestore Docs [HIGH] | ~1,166 writes/day (within 20k free) |
| **DEV-006** | 03. Database | Cloud Firestore | Document Deletes | asia-south1 | `Firestore Doc Deletes` | per 100K | 10,000 | 600,000/mo | Per Project — All Regions | 0 | $0.012 | ₹1.15 | **₹0.00** | **₹0.00** | Firestore Docs [HIGH] | Test cleanup executions |
| **DEV-007** | 03. Database | Cloud Firestore | Test Data Storage | asia-south1 | `Firestore Storage` | GiB | 0.2 | 1.0 GiB | Per Project — All Regions | 0 | $0.207 | ₹19.85 | **₹0.00** | **₹0.00** | Firestore Docs [HIGH] | Seed datasets & fixtures |
| **DEV-008** | 04. Storage | Cloud Storage | Test Photos & Sigs | asia-south1 | `Cloud Storage Standard` | GB | 2.44 | **0 GB (US only)** | **US Only — N/A** | 2.44 | $0.026 | ₹2.49 | **₹6.08** | **₹72.96** | GCS Pricing [HIGH] | 250 test permits × 10.0 MB / mo |
| **DEV-009** | 04. Storage | Cloud Storage | Upload Operations | asia-south1 | `Storage Class A Ops` | per 10K | 3,000 | **0 (US only)** | **US Only — N/A** | 3,000 | $0.050 | ₹4.80 | **₹1.44** | **₹17.28** | GCS Pricing [HIGH] | Test upload operations (250 × 12) |
| **DEV-010** | 04. Storage | Cloud Storage | Read Operations | asia-south1 | `Storage Class B Ops` | per 10K | 2,500 | **0 (US only)** | **US Only — N/A** | 2,500 | $0.004 | ₹0.38 | **₹0.10** | **₹1.20** | GCS Pricing [HIGH] | Test read operations |
| **DEV-011** | 02. Compute | Google Cloud Run | API Invocations | asia-south1 | `Cloud Run Requests` | per 1M | 15,000 | 2,000,000 | Per Billing Acct — All Regions | 0 | $0.400 | ₹38.36 | **₹0.00** | **₹0.00** | Cloud Run Docs [HIGH] | Automated API test suites |
| **DEV-012** | 02. Compute | Google Cloud Run | Active vCPU Runtime | asia-south1 | `Cloud Run Active CPU` | vCPU-sec | 3,000 | 180,000 | Per Billing Acct — All Regions | 0 | $0.000024 | ₹0.0023 | **₹0.00** | **₹0.00** | Cloud Run Docs [HIGH] | 15,000 calls @ 200ms |
| **DEV-013** | 02. Compute | Google Cloud Run | Active RAM Runtime | asia-south1 | `Cloud Run Active RAM` | GiB-sec | 3,000 | 360,000 | Per Billing Acct — All Regions | 0 | $0.0000025| ₹0.00024| **₹0.00** | **₹0.00** | Cloud Run Docs [HIGH] | 1 GiB RAM container |
| **DEV-014** | 06. Security | Secret Manager | Active Secret Versions| global | `SM Active Version` | version | 4 | 6 | Per Billing Acct | 0 | $0.060 | ₹5.75 | **₹0.00** | **₹0.00** | Secret Mgr [HIGH] | DEV environment keys |
| **DEV-015** | 06. Security | Secret Manager | Secret Access Ops | global | `SM Access Operation` | per 10K | 2,500 | 10,000 | Per Billing Acct | 0 | $0.030 | ₹2.88 | **₹0.00** | **₹0.00** | Secret Mgr [HIGH] | Cached in container RAM |
| **DEV-016** | 12. CI/CD | Google Cloud Build| Container Build Min | asia-south1 | `Cloud Build e2-std-2` | minutes | 150 | 2,500 | Per Billing Acct | 0 | $0.003 | ₹0.29 | **₹0.00** | **₹0.00** | Cloud Build [HIGH] | 30 test builds @ 5 min |
| **DEV-017** | 12. CI/CD | Artifact Registry| Container Image Store | asia-south1 | `Artifact Registry Store` | GB | 0.5 | **0.5 GiB (per billing acct)** | Per Billing Acct — All Regions | 0 | $0.100 | ₹9.59 | **₹0.00** | **₹0.00** | Artifact Reg [HIGH] | 2 DEV images within 0.5 GiB free |
| **DEV-018** | 10. Logging | Cloud Logging | Debug Log Ingestion | global | `Logging Ingestion` | GiB | 1.0 | 50.0 GiB | Per Billing Acct | 0 | $0.500 | ₹47.95 | **₹0.00** | **₹0.00** | Cloud Logging [HIGH] | DEV error & debug traces |
| **DEV-019** | 11. Monitoring | Cloud Monitoring| Container Health Checks| global | `Monitoring Ingestion` | metrics | Standard | Included | Included | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | Monitoring [HIGH] | Free basic uptime checks |
| **DEV-020** | 05. Networking | Cloud Run Egress | Test API Responses | asia-south1 | `Cloud Run Internet Egress` | GB | 0.05 | **0 (N. America only)** | **N. America Only — N/A** | 0.05 | $0.120 | ₹11.51 | **₹0.58** | **₹6.96** | Network Pricing [HIGH] | Minimal test API egress |
| **DEV-021** | 05. Networking | GCS Egress | Test Media Downloads | asia-south1 | `GCS Internet Egress` | GB | 5.0 | **0 (US only)** | **US Only — N/A** | 5.0 | $0.120 | ₹11.51 | **₹57.54** | **₹690.48** | Network Pricing [HIGH] | Dev QA test downloads (10 MB payload) |

---

## 3. DEV Cost Summary & Financial Recapitulation

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DEV FINANCIAL SUMMARY (INR) — R4 VALIDATED                      │
│                                                                                        │
│  • Recurring Monthly Pre-Tax Cost:              ₹65.18 INR / month                     │
│  • Applicable GST @ 18.00% (SAC 998315):        ₹11.73 INR / month                     │
│  • Total Monthly Post-Tax Payable:             ₹76.91 INR / month                      │
│                                                                                        │
│  • Annualized Pre-Tax Total (12 Months):       ₹782.16 INR / year                      │
│  • Annualized GST @ 18.00%:                    ₹140.79 INR / year                      │
│  • Annualized Post-Tax Total:                  ₹922.95 INR / year                      │
│                                                                                        │
│  • One-Time Setup / Provisioning Cost:          ₹0.00 INR (Fully Automated Scripts)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 DEV Cost Analysis
1. **Free-Tier Operation**: DEV compute scales to zero (`min-instances = 0`) when idle, consuming ₹0.00 in compute charges. Firestore operations and Auth remain 100% within free tiers.
2. **Billable Items**: GCS media storage (₹6.08/mo), GCS operations (₹1.54/mo), and QA test download egress (₹57.54/mo) are billable because GCS and egress Always Free tiers do not apply in `asia-south1`.
3. **Budget Alert Policy**: A programmatic Google Cloud Budget Alert is established at **₹500.00 / month** with automated email notifications to the Lead DevOps Engineer to detect any unintended test infinite loops.

