# Commercial Bill of Materials (Naked BOM) — Google Cloud Partner Submission

> **Document ID**: ARPL-RFP-BOM-2026-R4  
> **Submission Scope**: Google Cloud Premier Billing Partner Commercial Quotation & Billing Account Binding  
> **Target Cloud Entity**: Google Cloud India Private Limited (Bengaluru)  
> **Customer Organization**: Auro Realty Private Limited (ARPL)  
> **Target Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Catalog Pricing Baseline**: Live List Price | Spot FX Reference: **1 USD = ₹95.90 INR**  
> **Tax Classification**: SAC 998315 (IT Cloud Infrastructure Services) | GST Rate: **18.00%** (100% ITC Eligible)  
> **Workload Profile**: 6 Construction Projects · 360 Accounts · 300 Permits/Day (9,000/mo) · 10.0 MB Media Standard  

---

## 1. Procurement Specification & Submission Metadata

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          COMMERCIAL SUBMISSION METADATA                                │
│                                                                                        │
│  • Customer Legal Entity:         Auro Realty Private Limited                          │
│  • Platform Name:                 ARPL EHS Permit-to-Work (PTW) Platform               │
│  • Operational Footprint:         6 Active High-Rise & Infrastructure Sites            │
│  • Authenticated Personnel:       360 Unique Accounts (60 / site)                      │
│  • Daily Shift Active Users (DAU):~216 Active Personnel / Day                          │
│  • Morning Peak Concurrency:      35 to 45 Concurrent Users (06:30–09:30 AM IST)       │
│  • Daily Permit Issuance Volume:  300 Permits / Day Total (9,000 / month)              │
│  • Annual Permit Volume:          109,500 Permits / Year                               │
│  • Media Payload Standard:        10.0 MB Average per Permit Lifecycle                 │
│  • Core Compute Architecture:     Cloud Run (`arpl-ehs-api`) with Warm Instance SLA    │
│  • Database Engine:               Cloud Firestore (Native Mode, `asia-south1`)         │
│  • Target GCP Billing Account:    TO BE BOUND BY BILLING PARTNER                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Production Environment (`arpl-ehs-prod`) — Itemized Naked BOM

Every line item represents a verified Google Cloud / Firebase meter in `asia-south1` (Mumbai).  
*Note: GCS Always Free and Cloud Run Premium Egress free tiers do not apply in Mumbai; usage is billable from byte/operation zero as reflected below.*

| BOM ID | GCP / Firebase Service | Resource / Meter Description | SKU / Meter Family | Region | Unit | Monthly Consumption | Regional Free Quota | Billable Monthly Qty | Public List Rate (USD) | Public List Rate (INR @ ₹95.90) | Month 1 List Cost (INR) | Month 12 List Cost (INR) | Partner Disc % | Partner Quoted Rate (INR) | Partner Quoted Month 1 (INR) | Partner Quoted Month 12 (INR) |
|---|---|---|---|---|---|---:|---|---:|---:|---:|---:|---:|:---:|:---:|:---:|:---:|
| **PRD-001** | Firebase Auth | End-user Authentication | `Firebase Auth Free Tier` | global | MAU | 360 | 50,000 / mo | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-002** | Firebase Hosting | SPA Application Storage | `Hosting Storage` | global | GB | 0.8 | 10.0 GB | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-003** | Firebase Hosting | Global CDN Edge Transfer | `Hosting Transfer` | global | GB | 4.5 | 10.8 GB / mo | 0 | $0.00 | ₹0.00 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-004** | Cloud Firestore | Document Reads | `Firestore Doc Reads` | asia-south1 | 100K | 2,292,600 | 1,500,000 / mo | 792,600 | $0.036 | ₹3.4524 | **₹27.36** | **₹27.36** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-005** | Cloud Firestore | Document Writes | `Firestore Doc Writes` | asia-south1 | 100K | 225,000 | 600,000 / mo | 0 | $0.108 | ₹10.3572 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-006** | Cloud Firestore | Document Deletes | `Firestore Doc Deletes` | asia-south1 | 100K | 10,000 | 600,000 / mo | 0 | $0.012 | ₹1.1508 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-007** | Cloud Firestore | Database Data Storage | `Firestore Storage` | asia-south1 | GiB | 0.1 → 1.08 | 1.0 GiB | 0 → 0.08 | $0.207 | ₹19.8513 | **₹0.00** | **₹1.59** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-008** | Cloud Firestore | Point-in-Time Recovery | `Firestore PITR` | asia-south1 | GiB | 1.08 | None | 1.08 | $0.120 | ₹11.5080 | **₹12.43** | **₹12.43** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-009** | Cloud Storage | Media Ingestion Storage | `Cloud Storage Standard` | asia-south1 | GB | 87.89 → 1,054.69 | 0 GB (US only) | 87.89 → 1,054.69 | $0.026 | ₹2.4934 | **₹219.14** | **₹2,629.76** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-010** | Cloud Storage | Class A Upload Ops | `Storage Class A Ops` | asia-south1 | 10K | 108,000 | 0 (US only) | 108,000 | $0.050 | ₹4.7950 | **₹51.79** | **₹51.79** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-011** | Cloud Storage | Class B Read Ops | `Storage Class B Ops` | asia-south1 | 10K | 180,000 | 0 (US only) | 180,000 | $0.004 | ₹0.3836 | **₹6.90** | **₹6.90** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-012** | Cloud Run | API Invocations | `Cloud Run Requests` | asia-south1 | 1M | 226,800 | 2,000,000 / mo | 0 | $0.400 | ₹38.3600 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-013** | Cloud Run | Active vCPU Processing | `Cloud Run Active CPU` | asia-south1 | vCPU-s | 57,384 | 180,000 / mo | 0 | $0.0000240 | ₹0.0023016 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-014** | Cloud Run | Active Memory Runtime | `Cloud Run Active RAM` | asia-south1 | GiB-s | 57,384 | 360,000 / mo | 0 | $0.0000025 | ₹0.0002398 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-015** | Cloud Run | **Warm Instance SLA (Min=1)** | `Cloud Run Idle CPU+RAM`| asia-south1 | hrs | 480 (16h/day) | None | 480 | — | — | **₹894.86** | **₹894.86** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-016** | Cloud Functions | Reactive Event Triggers | `Cloud Functions 2nd Gen`| asia-south1 | invoc | 225,000 | Shares Run pool | 0 | $0.400 | ₹38.3600 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-017** | Cloud Tasks | Background Job Queue | `Cloud Tasks Dispatches` | asia-south1 | 1M | 20,000 | 1,000,000 / mo | 0 | $0.400 | ₹38.3600 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-018** | Cloud Scheduler | Escalation Sweeps | `Cloud Scheduler Active` | asia-south1 | jobs | 1 | 3 jobs | 0 | $0.100 | ₹9.5900 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-019** | Cloud Run Egress | API Response Egress | `Cloud Run Internet Egress`| asia-south1 | GB | 0.79 | 0 GB (NA only) | 0.79 | $0.120 | ₹11.5080 | **₹9.09** | **₹9.09** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-020** | Firestore Egress | Real-Time Sync Egress | `Firestore Outbound Egress`| asia-south1 | GiB | 14.0 | 10.0 GiB / mo | 4.0 | $0.120 | ₹11.5080 | **₹46.03** | **₹46.03** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-021** | GCS Egress | Field Media Downloads | `GCS Internet Egress` | asia-south1 | GB | 215.33 | 0 GB (No free) | 215.33 | $0.120 | ₹11.5080 | **₹2,478.02** | **₹2,478.02** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-022** | Secret Manager | Stored Secrets | `SM Active Version` | global | ver | 4 | 6 versions | 0 | $0.060 | ₹5.7540 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-023** | Secret Manager | Key Access Requests | `SM Access Operation` | global | 10K | 20,000 | 10,000 / mo | 10,000 | $0.030 | ₹2.8770 | **₹2.88** | **₹2.88** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-024** | Cloud Build | Container CI/CD Build | `Cloud Build e2-std-2` | asia-south1 | min | 100 | 2,500 min / mo | 0 | $0.003 | ₹0.2877 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-025** | Artifact Registry | Container Image Storage | `Artifact Registry Store` | asia-south1 | GB | 0.5 | 0.5 GiB / acct | 0 | $0.100 | ₹9.5900 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-026** | Cloud Logging | Compliance Log Ingestion | `Logging Ingestion` | global | GiB | 3.0 | 50.0 GiB / mo | 0 | $0.500 | ₹47.9500 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-027** | Cloud Monitoring| Health & Metrics Alerts | `Monitoring Ingestion` | global | — | Standard | Included | 0 | $0.000 | ₹0.0000 | **₹0.00** | **₹0.00** | [____%] | ₹______ | ₹______ | ₹______ |
| **PRD-028** | Cloud Storage | Private DR Backup Bucket | `Cloud Storage Standard` | asia-south1 | GB | 8.0 | 0 GB (US only) | 8.0 | $0.026 | ₹2.4934 | **₹19.95** | **₹19.95** | [____%] | ₹______ | ₹______ | ₹______ |
| **SUBTOTAL** | **PROD (`arpl-ehs-prod`)** | **Pre-Tax Monthly Run-Rate (List Baseline)** | — | — | — | — | — | — | — | — | **₹3,768.45** | **₹6,180.66** | [____%] | — | **₹______** | **₹______** |

---

## 3. Development Environment (`arpl-ehs-dev`) — Itemized Naked BOM

Non-production testing, feature engineering, and automated integration test pipelines.  
*Operating Policy: 100% scale-to-zero compute (`min-instances = 0`), 250 test permits/month, cleaned monthly.*

| BOM ID | GCP / Firebase Service | Resource / Meter Description | Region | Billing Unit | Monthly Consumption | Billable Quantity | Public List Rate (INR) | Monthly List Cost (INR) | Annual List Cost (INR) | Partner Disc % | Partner Quoted Annual (INR) |
|---|---|---|---|---|---:|---:|---:|---:|---:|:---:|:---:|
| **DEV-001** | Firebase Auth | Test Accounts (16 roles) | global | MAU | 10 | 0 | ₹0.00 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-002** | Firebase Hosting | DEV SPA Asset Storage | global | GB | 0.5 | 0 | ₹0.00 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-003** | Firebase Hosting | DEV CDN Edge Transfer | global | GB | 1.0 | 0 | ₹0.00 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-004** | Cloud Firestore | Test Document Reads | asia-south1 | 100K | 125,000 | 0 | ₹3.4524 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-005** | Cloud Firestore | Test Document Writes | asia-south1 | 100K | 35,000 | 0 | ₹10.3572 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-006** | Cloud Firestore | Test Document Deletes | asia-south1 | 100K | 10,000 | 0 | ₹1.1508 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-007** | Cloud Firestore | Test Data Seed Storage | asia-south1 | GiB | 0.2 | 0 | ₹19.8513 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-008** | Cloud Storage | Test Media Storage (250 permits) | asia-south1 | GB | 2.44 | 2.44 | ₹2.4934 | **₹6.08** | **₹72.96** | [____%] | ₹______ |
| **DEV-009** | Cloud Storage | Test Upload Operations (Class A) | asia-south1 | 10K | 3,000 | 3,000 | ₹4.7950 | **₹1.44** | **₹17.28** | [____%] | ₹______ |
| **DEV-010** | Cloud Storage | Test Read Operations (Class B) | asia-south1 | 10K | 2,500 | 2,500 | ₹0.3836 | **₹0.10** | **₹1.20** | [____%] | ₹______ |
| **DEV-011** | Cloud Run | Test API Invocations | asia-south1 | 1M | 15,000 | 0 | ₹38.3600 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-012** | Cloud Run | Test vCPU Runtime (Scale-to-0) | asia-south1 | vCPU-s | 3,000 | 0 | ₹0.0023 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-013** | Cloud Run | Test RAM Runtime (Scale-to-0) | asia-south1 | GiB-s | 3,000 | 0 | ₹0.0002 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-014** | Secret Manager | DEV Environment Keys | global | ver | 4 | 0 | ₹5.7540 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-015** | Secret Manager | Test Access Operations | global | 10K | 2,500 | 0 | ₹2.8770 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-016** | Cloud Build | Test Build Minutes | asia-south1 | min | 150 | 0 | ₹0.2877 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-017** | Artifact Registry | DEV Container Images | asia-south1 | GB | 0.5 | 0 | ₹9.5900 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-018** | Cloud Logging | Debug Log Ingestion | global | GiB | 1.0 | 0 | ₹47.9500 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-019** | Cloud Monitoring| Container Uptime Probes | global | — | Standard | 0 | ₹0.0000 | **₹0.00** | **₹0.00** | [____%] | ₹______ |
| **DEV-020** | Cloud Run Egress | Test API Response Egress | asia-south1 | GB | 0.05 | 0.05 | ₹11.5080 | **₹0.58** | **₹6.96** | [____%] | ₹______ |
| **DEV-021** | GCS Egress | QA Test Download Egress | asia-south1 | GB | 5.0 | 5.0 | ₹11.5080 | **₹57.54** | **₹690.48** | [____%] | ₹______ |
| **SUBTOTAL** | **DEV (`arpl-ehs-dev`)**| **Pre-Tax Run-Rate (List Baseline)** | — | — | — | — | — | **₹65.18** | **₹782.16** | [____%] | **₹______** |

---

## 4. Consolidated Commercial Grand Totals (Public List Price Baseline)

All figures below establish the **maximum list price ceiling** before partner commercial discounts:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CONSOLIDATED INFRASTRUCTURE TOTALS (INR)                        │
│                                                                                        │
│  PRODUCTION ENVIRONMENT (`arpl-ehs-prod`):                                             │
│  • Month 1 Initial Go-Live (Pre-Tax):         ₹3,768.45 INR / month (~$39.29 USD/mo)   │
│  • Month 12 Cumulative (Pre-Tax):             ₹6,180.66 INR / month (~$64.45 USD/mo)   │
│  • Blended Monthly Pre-Tax Average:           ~₹4,974.69 INR / month (~$51.87 USD/mo)  │
│  • Annualized Pre-Tax Total (Year 1):         ₹59,696.33 INR / year (~$622.49 USD/yr)  │
│  • Applicable GST @ 18.00% (SAC 998315):      ₹10,745.34 INR / year (100% ITC Credit)  │
│  • Annualized Post-Tax Total (Year 1):        ₹70,441.67 INR / year (~$734.53 USD/yr)  │
│                                                                                        │
│  DEVELOPMENT ENVIRONMENT (`arpl-ehs-dev`):                                             │
│  • Recurring Monthly Pre-Tax Total:           ₹65.18 INR / month                       │
│  • Annualized Pre-Tax Total (12 Months):       ₹782.16 INR / year (~$8.16 USD/yr)       │
│  • Applicable GST @ 18.00% (SAC 998315):      ₹140.79 INR / year                       │
│  • Annualized Post-Tax Total:                 ₹922.95 INR / year (~$9.62 USD/yr)       │
│                                                                                        │
│  COMBINED ENTERPRISE COMMITMENT (DEV + PROD):                                          │
│  • Combined Month 1 Pre-Tax:                  ₹3,833.63 INR / month                    │
│  • Combined Month 12 Pre-Tax:                 ₹6,245.84 INR / month                    │
│  • Total Combined Pre-Tax Infrastructure:     ₹60,478.49 INR / year (~$630.64 USD/yr)  │
│  • Total Applicable GST @ 18.00%:             ₹10,886.13 INR / year (Full ITC Credit)  │
│  • TOTAL ANNUAL CASH OUTFLOW (POST-TAX):      ₹71,364.62 INR / year (~$744.16 USD/yr)  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Google Cloud Billing Partner Commercial Binding Form

*To be completed by the authorized commercial sales lead of the Google Cloud Premier Partner:*

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BILLING PARTNER COMMERCIAL QUOTATION SLIP                       │
│                                                                                        │
│  1. Authorized Partner Name:          _______________________________________________  │
│  2. Google Cloud Partner ID:          _______________________________________________  │
│  3. Partner Corporate GSTIN:          _______________________________________________  │
│  4. Target GCP Billing Account ID:    _______________________________________________  │
│  5. Customer GSTIN (ARPL):            _______________________________________________  │
│  6. Invoicing Legal Entity:           Google Cloud India Private Limited (Bengaluru)   │
│  7. Applicable Tax Classification:    SAC 998315 (18.00% GST)                          │
│                                                                                        │
│  COMMERCIAL PRICING CONFIRMATION:                                                      │
│  • Partner Discretionary Discount:    [ ______ % ] off Google Published List Rates     │
│  • Quoted PROD Annual Pre-Tax:        ₹ ___________________________ INR / year         │
│  • Quoted DEV Annual Pre-Tax:         ₹ ___________________________ INR / year         │
│  • Quoted COMBINED Annual Pre-Tax:    ₹ ___________________________ INR / year         │
│  • Applicable GST @ 18.00%:           ₹ ___________________________ INR / year         │
│  • FINAL NET BINDING ANNUAL PAYABLE:  ₹ ___________________________ INR / year         │
│                                                                                        │
│  PAYMENT & CONTRACTUAL TERMS:                                                          │
│  • Payment Currency & Mode:           Indian Rupee (INR) via Corporate NEFT / RTGS     │
│  • Payment Credit Terms:              Net 30 Days from Date of Invoice                 │
│  • Quotation Validity:                30 Calendar Days from Issuance                   │
│                                                                                        │
│  PARTNER AUTHORIZED SIGNATURE:                                                         │
│                                                                                        │
│  Name: ____________________________   Title: ________________________________________  │
│                                                                                        │
│  Signature: _______________________   Date: _________________ Corporate Seal: ________  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
