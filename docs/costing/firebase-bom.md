# Firebase Bill of Materials & Service Breakdown — ARPL EHS Platform

> **Document ID**: ARPL-BOM-FIREBASE-2026-09-28-R4  
> **Status**: AUDITED, REGIONALLY VALIDATED & DAILY-TRANSACTION VERIFIED  
> **Revision**: R4 — High-Resolution 10.0 MB Media Standard Breakdown  
> **Target Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India) | Global Edge CDN  
> **Pricing Verification**: 2026-09-28 | Live FX Rate: **1 USD = ₹95.90 INR**  
> **Billing Plan**: Firebase Blaze Plan (Pay-as-you-go)  
> **Confirmed Workload**: 6 Business Projects · 360 Unique Users · 300 Permits/Day (9,000/mo)  

---

## 1. Firebase Service Portfolio Evaluation

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FIREBASE SERVICES PORTFOLIO                               │
│                                                                                        │
│  [REQUIRED]     • Firebase Authentication    • Cloud Firestore     • Firebase Storage  │
│                 • Firebase Hosting           • Firebase App Check                      │
│                                                                                        │
│  [PARTIAL/EVENT]• Cloud Functions for Firebase (2nd Gen - Firestore Triggers Only)     │
│                                                                                        │
│  [NOT REQUIRED] • Firebase Realtime DB       • Firebase Extensions • Remote Config     │
│                 • Crashlytics                • Performance Monitor • Firebase ML       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Itemized Firebase Services Breakdown (Revision R4)

### 2.1 Firebase Authentication
- **Required**: **YES**
- **Why**: Handles secure user identity management, closed-registration authentication, password resets, and cryptographically signs JWT ID tokens containing Custom Claims (`role`, `projectIds[]`).
- **Monthly Usage**: 360 registered users, 360 Monthly Active Users (MAU).
- **Free Quota**: 50,000 MAU per month for Email/Password accounts (Per project, global quota).
- **Billable Usage**: **0 MAU**.
- **Monthly Cost (INR)**: **₹0.00**

---

### 2.2 Cloud Firestore (Native Mode, `asia-south1`)
- **Required**: **YES**
- **Why**: Primary operational database. Provides client-side offline persistence (`IndexedDB`), real-time synchronization (`onSnapshot`), document polymorphism for 10 distinct permit types, and atomic multi-document transactions.
- **Physical Daily & Monthly Derivations**:
  - Document Reads: 76,420 reads/day = **2,292,600 reads/month**.
  - Document Writes: 7,500 writes/day = **225,000 writes/month**.
  - Document Deletes: 10,000 deletes/month.
  - Data Storage: Month 1: 0.1 GiB $\rightarrow$ Month 12: **1.08 GiB**.
  - Outbound Data Transfer: **14.0 GiB / month**.
  - Point-in-Time Recovery (PITR): 1.08 GiB continuous 7-day retention.
- **Free Quotas (Global Quotas Apply in `asia-south1`)**:
  - Reads: 50,000 reads/day (1,500,000/mo).
  - Writes: 20,000 writes/day (600,000/mo).
  - Storage: 1.0 GiB stored data.
  - Outbound Data Transfer: 10.0 GiB/month free.
- **Billable Usage & Costs**:
  - Reads: 792,600 billable reads @ $0.036/100k = **₹27.36 / month**.
  - Writes: 0 writes billable (100% within free quota) = **₹0.00**.
  - Storage (Month 12): 0.08 GiB billable @ $0.207/GiB = **₹1.59 / month**.
  - Outbound Egress: 4.0 GiB billable @ $0.12/GB = **₹46.03 / month**.
  - PITR Backup: 1.08 GiB @ $0.12/GiB = **₹12.43 / month**.
- **Subtotal Firestore**:
  - Month 1: ₹27.36 (Reads) + ₹12.43 (PITR) + ₹46.03 (Egress) = **₹85.82 / month**.
  - Month 12: ₹27.36 (Reads) + ₹1.59 (Storage) + ₹12.43 (PITR) + ₹46.03 (Egress) = **₹87.41 / month**.

---

### 2.3 Firebase Storage (Cloud Storage for Firebase, `asia-south1`)
- **Required**: **YES**
- **Why**: Enables direct, authenticated client-side uploads of on-site inspection photos and high-DPI canvas digital signatures directly to Google Cloud Storage with declarative security rules.
- **Physical Daily & Monthly Derivations (300 permits/day @ 10.0 MB Standard)**:
  - Ingestion: 300 permits/day × 10.0 MB = 3,000 MB/day = **87.89 GB / month**.
  - Cumulative Stored: 87.89 GB (Month 1) $\rightarrow$ **1,054.69 GB (~1.05 TB, Month 12)**.
  - Class A Upload Ops: 3,600 uploads/day = **108,000 ops / month**.
  - Class B Read Ops: 6,000 reads/day = **180,000 ops / month**.
  - Media Download Egress: 300 × 3.5 reviews × 7.0 MB = 7,350 MB/day = **215.33 GB / month**.
- **Free Quota Regional Status**:
  - ⚠️ **CRITICAL**: The GCP Always Free Cloud Storage allowance applies **ONLY to US regions**. In `asia-south1` (Mumbai), **all Cloud Storage usage is billable from byte zero**.
- **Billable Usage & Costs**:
  - Storage Month 1: 87.89 GB @ $0.026/GB = **₹219.14 / month**.
  - Storage Month 12: 1,054.69 GB @ $0.026/GB = **₹2,629.76 / month**.
  - Class A Uploads: 108,000 ops @ $0.05/10k = **₹51.79 / month**.
  - Class B Reads: 180,000 ops @ $0.004/10k = **₹6.90 / month**.
  - Media Download Egress: 215.33 GB @ $0.12/GB = **₹2,478.02 / month**.
- **Subtotal Firebase Storage**:
  - **Month 1**: ₹219.14 (Storage) + ₹51.79 (Class A) + ₹6.90 (Class B) + ₹2,478.02 (Egress) = **₹2,755.85 / month**.
  - **Month 12**: ₹2,629.76 (Storage) + ₹51.79 (Class A) + ₹6.90 (Class B) + ₹2,478.02 (Egress) = **₹5,166.47 / month**.

---

### 2.4 Firebase Hosting & App Check
- **Firebase Hosting**: 0.8 GB storage + 4.5 GB CDN data transfer = **₹0.00 / month** (100% within 10 GB storage and 10.8 GB/mo CDN free quota).
- **Firebase App Check**: ~226,800 verifications = **₹0.00 / month** (reCAPTCHA Enterprise standard web attestation).
- **Cloud Functions for Firebase (2nd Gen Triggers)**: 225,000 reactive background invocations = **₹0.00 / month** (Shares Cloud Run free pool).

---

## 3. Firebase Bill of Materials Summary Table

| BOM ID | Firebase / Underlying GCP Service | Resource / Metric | Free Quota | Monthly Usage | Billable Qty | Unit Rate (INR) | Month 1 INR | Month 12 INR |
|---|---|---|---|---:|---:|---|---:|---:|
| **FB-001** | Firebase Authentication | Email/Password MAU | 50,000 MAU | 360 MAU | 0 MAU | ₹0.00 | **₹0.00** | **₹0.00** |
| **FB-002** | Cloud Firestore | Document Reads | 1,500,000 / mo | 2,292,600 | 792,600 | ₹3.45 / 100K | **₹27.36** | **₹27.36** |
| **FB-003** | Cloud Firestore | Document Writes | 600,000 / mo | 225,000 | 0 | ₹10.36 / 100K | **₹0.00** | **₹0.00** |
| **FB-004** | Cloud Firestore | Document Deletes | 600,000 / mo | 10,000 | 0 | ₹1.15 / 100K | **₹0.00** | **₹0.00** |
| **FB-005** | Cloud Firestore | Primary Data Storage | 1.0 GiB | 0.1 → 1.08 GiB | 0 → 0.08 GiB | ₹19.85 / GiB | **₹0.00** | **₹1.59** |
| **FB-006** | Cloud Firestore | Point-in-Time Recovery | None | 1.08 GiB | 1.08 GiB | ₹11.51 / GiB | **₹12.43** | **₹12.43** |
| **FB-007** | Cloud Firestore | Outbound Data Transfer | 10.0 GiB / mo | 14.0 GiB | 4.0 GiB | ₹11.51 / GB | **₹46.03** | **₹46.03** |
| **FB-008** | Firebase Storage | Media Ingestion Storage | **0 GB in Mumbai** | 87.89 → 1,054.69 GB| 87.89 → 1,054.69 GB| ₹2.49 / GB | **₹219.14** | **₹2,629.76** |
| **FB-009** | Firebase Storage | Class A Upload Ops | **0 in Mumbai** | 108,000 ops | 108,000 ops | ₹4.80 / 10K | **₹51.79** | **₹51.79** |
| **FB-010** | Firebase Storage | Class B Read Ops | **0 in Mumbai** | 180,000 ops | 180,000 ops | ₹0.38 / 10K | **₹6.90** | **₹6.90** |
| **FB-011** | Firebase Storage | Media Download Egress | **0 in Mumbai** | 215.33 GB | 215.33 GB | ₹11.51 / GB | **₹2,478.02** | **₹2,478.02** |
| **FB-012** | Firebase Hosting | SPA Asset Storage | 10.0 GB | 0.8 GB | 0 GB | ₹2.49 / GB | **₹0.00** | **₹0.00** |
| **FB-013** | Firebase Hosting | CDN Data Transfer | 10.8 GB / mo | 4.5 GB | 0 GB | ₹14.39 / GB | **₹0.00** | **₹0.00** |
| **FB-014** | Firebase App Check | App Attestation | Included | ~226,800 | 0 | ₹0.00 | **₹0.00** | **₹0.00** |
| **FB-015** | Cloud Functions (2nd Gen)| Reactive Triggers | Shares Cloud Run | 225,000 | 0 | Shares pool | **₹0.00** | **₹0.00** |
| **TOTAL** | **Firebase Portfolio** | **Pre-Tax Subtotal** | — | — | — | — | **₹2,841.67** | **₹5,253.88** |

