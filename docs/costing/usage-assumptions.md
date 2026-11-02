# Workload & Usage Assumptions — ARPL EHS Permit-to-Work Platform

> **Document ID**: ARPL-FIN-USAGE-2026-09-28-R4  
> **Status**: AUDITED, DAILY-TRANSACTION VALIDATED & REGIONALLY VERIFIED  
> **Revision**: R4 — High-Resolution 10.0 MB Media Payload Standard with Warm Compute SLA  
> **Target System**: Production & Development Environments  
> **Target Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Pricing Currency**: INR (₹) converted from USD list price at **1 USD = ₹95.90 INR** (Checked 2026-09-25 12:33 IST)  

---

## 1. Confirmed Operational Workload Baseline

The following baseline parameters represent confirmed physical realities across ARPL's 6 active construction sites:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CONFIRMED OPERATIONAL BASELINE                            │
│                                                                                        │
│  • Active Business Construction Projects:     6 Construction Sites                     │
│  • Unique Users per Construction Project:     60 Personnel / Site                      │
│  • Total Unique Authenticated Personnel:      360 Unique Authenticated Accounts        │
│  • Daily Active Users (DAU on Shift):         ~216 Active Staff / Day (60% on shift)   │
│  • Peak Concurrent Users (Morning Rush):      35 to 45 Concurrent Users (06:30–09:30)  │
│  • Daily Permit Issuance Volume:              300 Permits / Day Total (50/day/site)    │
│  • Monthly Permit Volume (30-day billing):    9,000 Permits / Month                    │
│  • Annual Permit Volume (365 days):           109,500 Permits / Year                   │
│  • Media Payload Standard:                    10.0 MB Average per Permit               │
│  • Primary Database:                          Cloud Firestore Native (`asia-south1`)   │
│  • Core Compute Runtime:                      Google Cloud Run (`arpl-ehs-api`)        │
│  • Production Availability SLA:               Warm-Instance (`min-instances = 1`)      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Daily User Activity & Concurrency Patterns

### 2.1 Daily Shift Operations
* **Shift Timing**: Primary construction operations run from **06:00 to 22:00 IST** (16 operational hours/day). Night shifts and holiday work (PTW-010) operate between 21:00 and 06:00 under pre-authorized dual-phase handovers.
* **Peak Morning Gate Rush (06:30 – 09:30 IST)**:
  * Over 70% of daily permits (210 out of 300 permits) are initiated, reviewed, and authorized during this 3-hour window.
  * **35 to 45 concurrent supervisors and engineers** actively upload high-resolution photos, enter gas readings, and affix digital signatures simultaneously.
  * **Requirement for Warm Compute**: To prevent connection timeouts on cellular networks (3G/4G) and eliminate cold-start delays (2–5 seconds), Cloud Run maintains **`min-instances = 1` warm** throughout operational shift hours.

---

## 3. High-Resolution 10.0 MB Media Standard per Permit Lifecycle

In modern civil construction, field safety inspectors and supervisors capture high-resolution uncompressed / high-quality photos using 48MP/64MP smartphone cameras to document site hazards, crane machinery, isolation lockouts, gas levels, and PPE compliance. The platform establishes an authoritative **10.0 MB average media payload per permit**:

```
[1. Initiation] ───> [2. Multi-Tier Review] ───> [3. Active Inspections] ───> [4. Closure & Surrender]
  • 2 High-Res Photos  • 4 Digital Signatures     • 1 Active Re-check Photo     • 1 Housekeeping Photo
  • 1 Signature        • 1 Statutory A4 PDF       • 0.5 Observation Photos      • 1 Surrender Signature
  (~4.0 MB)            (~2.0 MB)                  (~2.0 MB)                     (~2.0 MB)
```

### 3.1 Itemized Physical Artifacts & Operations per Permit

| Lifecycle Step | Activities & Regulatory Invariants | Media Artifacts & Sizing Composition | Firestore Reads | Firestore Writes | Storage Uploads (Class A) | Media Review Downloads |
|---|---|---|---:|---:|---:|---:|
| **1. Initiation & Drafting** | Pre-work hazard inspection photo, equipment/LOTO isolation photo, Permittee signature | 2 Photos (~3,960 KB) + 1 Signature (~40 KB) = **~4.00 MB** | 4 | 4 | 3 | 0 |
| **2. Multi-Stage Review Chain** | Site Engineer review, Section Head review, Domain Clearance (Electrical/P&M), EHS Activation | 4 Signatures (~160 KB) + 1 Statutory A4 PDF report (~600 KB) + 1 Calibration Cert Photo (~1,240 KB) = **~2.00 MB** | 6 | 12 | 6 | 3.5 (Approvers inspect high-res photos/PDF) |
| **3. Active Inspections & Gating** | Gas tests (PTW-004), hazard observations, safety checklist audits | 1 Gas Reading Photo (~1,200 KB) + 0.5 Observation Photos (~800 KB) = **~2.00 MB** | 4 | 4 | 1.5 | 1.0 (Auditors review permits) |
| **4. Closure & Surrender** | Post-work housekeeping restoration photo, surrender signature, final stamped statutory PDF | 1 Photo (~1,960 KB) + 1 Signature (~40 KB) = **~2.00 MB** | 2 | 5 | 1.5 | 1.0 (Final verification) |
| **Total per Single Permit** | **Complete Statutory Lifecycle** | **10.00 MB Total Media Payload** (5.5 Photos + 5 Sigs + 1 PDF) | **16 Reads** | **25 Writes** | **12 Uploads** | **5.5 Downloads (~7.0 MB avg payload)** |

---

## 4. First-Principles Derivation of Daily & Monthly Cloud Volumes

### 4.1 Storage & Media Ingestion (Google Cloud Storage in `asia-south1`)

> ⚠️ **Regional Free Tier Reality**: Google Cloud Storage Always Free quotas apply **ONLY to US regions**. In `asia-south1` (Mumbai), **all storage and operations are billable from byte zero**.

1. **Daily Media Ingestion**:
   - $300 \text{ permits/day} \times 10.0 \text{ MB/permit} = \mathbf{3,000 \text{ MB / day}} = \frac{3,000}{1,024} \approx \mathbf{2.9297 \text{ GB / day}}$.
2. **Monthly Media Ingestion (30 days)**:
   - $3,000 \text{ MB/day} \times 30 \text{ days} = 90,000 \text{ MB} = \frac{90,000}{1,024} \approx \mathbf{87.8906 \text{ GB / month}}$.
3. **Cumulative Storage Growth (at ₹2.4934 / GB / month — $0.026/GB @ ₹95.90)**:
   - **Month 1 (Go-Live)**: $87.8906 \text{ GB} \times ₹2.4934 = \mathbf{₹219.14 / \text{month}}$.
   - **Month 3**: $263.6719 \text{ GB} \times ₹2.4934 = \mathbf{₹657.43 / \text{month}}$.
   - **Month 6**: $527.3438 \text{ GB} \times ₹2.4934 = \mathbf{₹1,314.86 / \text{month}}$.
   - **Month 9**: $791.0156 \text{ GB} \times ₹2.4934 = \mathbf{₹1,972.33 / \text{month}}$.
   - **Month 12 (Year-End)**: $1,054.6875 \text{ GB} \times ₹2.4934 = \mathbf{₹2,629.76 / \text{month}}$ (~1.05 TB).
   - *12-Month Total Variable Storage Cost*: $87.890625 \times \frac{12 \times 13}{2} \times ₹2.4934 = 87.890625 \times 78 \times ₹2.4934 = \mathbf{₹17,094.61 / \text{year}}$ (Blended Monthly Storage: **₹1,424.55 / month**).
4. **Storage Operations**:
   - **Class A Uploads**: $300 \text{ permits/day} \times 12 \text{ uploads} = 3,600 \text{ uploads/day} \times 30 = \mathbf{108,000 \text{ ops/month}}$.
     - Billable in `asia-south1` @ $0.05/10k (₹4.795/10k): $10.8 \times ₹4.795 = \mathbf{₹51.79 / \text{month}}$.
   - **Class B Reads/Previews**: Field inspectors viewing photo thumbnails and signature vectors:
     - ~180,000 ops/month @ $0.004/10k (₹0.3836/10k): $18.0 \times ₹0.3836 = \mathbf{₹6.90 / \text{month}}$.
   - **Private Disaster Recovery Backup Bucket**:
     - 4 weekly database snapshots @ 2.0 GB = 8.0 GB stored @ ₹2.4934/GB = **₹19.95 / month**.

---

### 4.2 Network Egress Derivation (Field Approver Reviews)

Network egress represents physical outbound data transfer over the internet to field users across India:

1. **GCS Media Download Egress (Field Inspector Reviews)**:
   - When supervisors, section heads, and EHS officers review permits on tablets, they download high-resolution site photos, signatures, and PDF previews (~7.0 MB average reviewed per stage).
   - With 300 permits/day and an average of 3.5 reviews per permit:
     - Daily Egress: $300 \text{ permits/day} \times 3.5 \text{ reviews} \times 7.0 \text{ MB} = \mathbf{7,350 \text{ MB / day}} \approx \mathbf{7.1777 \text{ GB / day}}$.
     - Monthly Egress: $7.1777 \text{ GB/day} \times 30 \approx \mathbf{215.33 \text{ GB / month}}$.
     - Rate: In `asia-south1`, GCS internet egress is billable from byte zero at $0.12/GB (₹11.508/GB).
     - **Monthly Cost**: $215.33 \text{ GB} \times ₹11.508 = \mathbf{₹2,478.02 / \text{month}}$.
2. **Cloud Run API JSON Response Egress**:
   - 300 permits/day × 6 state transitions = 1,800 calls/day.
   - 216 Daily Active Users fetching permit lists, activity logs, and status updates: ~20 calls/user/day = 4,320 calls/day.
   - Scheduler ticks & background task dispatches: ~1,440 calls/day.
   - Total API Invocations: **7,560 requests/day = 226,800 requests/month**.
   - Average JSON response: ~3.5 KB.
   - Monthly Egress: $226,800 \times 3.5 \text{ KB} \approx \mathbf{0.79 \text{ GB / month}}$.
   - Rate: Cloud Run uses Premium Tier exclusively (no free tier in India).
     - **Monthly Cost**: $0.79 \text{ GB} \times ₹11.508 = \mathbf{₹9.09 / \text{month}}$.
3. **Firestore Client SDK Outbound Egress**:
   - Real-time `onSnapshot` listener updates streaming to active mobile clients = **~14.0 GiB / month**.
   - Free Quota: 10.0 GiB / month (Global Firestore free quota applies in Mumbai).
   - Billable: $14.0 - 10.0 = \mathbf{4.0 \text{ GiB / month}}$ @ $0.12/GB = **₹46.03 / month**.
4. **Firebase Hosting CDN Data Transfer**:
   - PWA client application code, stylesheets, and icons: ~4.5 GB / month.
   - Free Quota: 360 MB/day (~10.8 GB/month) global CDN transfer.
   - **Cost**: **₹0.00 / month** (100% within free quota).
5. **Total Monthly Network Egress Spend**:
   - GCS Media Downloads: ₹2,478.02
   - Cloud Run API Responses: ₹9.09
   - Firestore Client Sync: ₹46.03
   - Firebase Hosting CDN: ₹0.00
   - **Total Outbound Egress = ₹2,533.14 / month** (#2 operational driver).

---

### 4.3 Compute & API Derivation (Google Cloud Run in `asia-south1`)

> **Production Warm Instance SLA**:
> While Cloud Run provides an Always Free allowance of 180,000 vCPU-seconds for *active* execution, running high-risk construction safety systems on scale-to-zero in production causes **2–5 second cold starts** during the morning rush.
> Therefore, production includes a **Warm Instance (`min-instances = 1`)** during shift hours.

1. **Daily & Monthly API Invocations**:
   - Daily Calls: 7,560 requests / day.
   - Monthly Calls: **226,800 requests / month** (Within 2,000,000 free requests quota).
2. **Active Compute Workload**:
   - **Statutory PDF Generation**: Compiling 300 multi-page A4 PDFs/day with embedded high-resolution 10 MB image assets requires ~2.5 seconds of CPU per PDF:
     - $300 \text{ PDFs/day} \times 2.5\text{s} = 750 \text{ vCPU-seconds / day} = \mathbf{22,500 \text{ vCPU-seconds / month}}$.
   - **State Machine Transitions & REST APIs**: 226,800 calls @ 150 ms average:
     - $226,800 \times 0.15\text{s} = \mathbf{34,020 \text{ vCPU-seconds / month}}$.
   - **SLA Escalation Engine**: 8,640 sweeps/month @ 100 ms:
     - $8,640 \times 0.10\text{s} = \mathbf{864 \text{ vCPU-seconds / month}}$.
   - **Total Active Compute**: $22,500 + 34,020 + 864 = \mathbf{57,384 \text{ vCPU-seconds / month}}$ (and 57,384 GiB-seconds).
   - *Active Compute Quota Comparison*: 57,384 vs. 180,000 free vCPU-sec $\rightarrow$ Active compute is **100% covered by the Always Free Tier** (31.9% quota utilized).
3. **Production Warm Instance SLA (`min-instances = 1`)**:
   - To guarantee zero cold starts and sub-100ms response times during operational shift hours (06:00 to 22:00 IST = 16 hours/day = 480 hours/month):
   - **Idle vCPU Allocation**:
     - $480 \text{ hrs} \times 3,600\text{s} \times 1 \text{ vCPU} = 1,728,000 \text{ idle vCPU-seconds}$.
     - Cost @ $0.00000450 / sec $\times ₹95.90 = \mathbf{₹745.72 / \text{month}}$.
   - **Idle RAM Allocation**:
     - $480 \text{ hrs} \times 3,600\text{s} \times 1 \text{ GiB} = 1,728,000 \text{ idle GiB-seconds}$.
     - Cost @ $0.00000090 / sec $\times ₹95.90 = \mathbf{₹149.14 / \text{month}}$.
   - **Total Warm-Instance SLA Compute Cost**: **₹894.86 / month** (~$9.33 USD/month).

---

### 4.4 Cloud Firestore Database Operations

1. **Daily Operational Read Breakdown**:
   - 216 Daily Active Users (DAU) accessing active dashboards 4 times/shift: $216 \times 4 \times 30 \text{ permits} = 25,920 \text{ reads/day}$.
   - Real-time `onSnapshot` listener delta updates: ~30,000 reads/day.
   - Approver inspection of permit details and checklists: $300 \text{ permits} \times 4 \text{ stages} \times 15 \text{ sub-documents} = 18,000 \text{ reads/day}$.
   - SLA escalation query sweeps: ~2,500 reads/day.
   - **Total Daily Reads**: **~76,420 reads / day**.
   - **Monthly Reads**: $76,420 \times 30 = \mathbf{2,292,600 \text{ reads / month}}$.
   - *Free Quota*: 50,000 reads/day = 1,500,000 reads/month.
   - *Billable Reads*: $2,292,600 - 1,500,000 = \mathbf{792,600 \text{ billable reads/month}}$.
   - Cost @ $0.036 / 100k (₹3.4524 / 100k): $7.926 \times ₹3.4524 = \mathbf{₹27.36 / \text{month}}$.
2. **Daily Operational Write Breakdown**:
   - 300 permits/day × 25 lifecycle writes = **7,500 writes / day**.
   - Monthly Writes: $7,500 \times 30 = \mathbf{225,000 \text{ writes / month}}$.
   - *Free Quota*: 20,000 writes/day = 600,000 writes/month.
   - *Billable Writes*: **0 writes** (100% within free quota).
3. **Database Storage Accumulation**:
   - 300 permits/day × 10 KB JSON structured permit metadata = 3.0 MB/day = 90 MB/month.
   - Cumulative Month 12 data: **~1.08 GiB**.
   - *Free Quota*: 1.0 GiB free.
   - *Billable Month 12 Storage*: $1.08 - 1.0 = 0.08 \text{ GiB} @ \$0.207/\text{GiB} = \mathbf{₹1.59 / \text{month}}$.
4. **Point-in-Time Recovery (PITR)**:
   - Continuous 7-day backup: 1.08 GiB @ $0.12/GiB/mo = $\mathbf{₹12.43 / \text{month}}$.

---

## 5. Summary of 10.0 MB-Derived Production Monthly Costs

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              REVISED PRODUCTION MONTHLY RUN-RATE                       │
│                              (Based on 300 Permits/Day @ 10.0 MB Media Standard)       │
│                                                                                        │
│  MONTH 1 (Initial Go-Live):                                                            │
│  • Cloud Run (Warm Compute + API Egress):     ₹903.95 INR / month                      │
│  • Cloud Storage (Media, Ops, Egress, DR):    ₹2,775.80 INR / month                    │
│  • Cloud Firestore (Reads, PITR, Sync Egress):₹85.82 INR / month                       │
│  • Secret Manager & Security Operations:      ₹2.88 INR / month                        │
│  • Total Month 1 Pre-Tax:                     ₹3,768.45 INR / month (~$39.29 USD/mo)   │
│  • Applicable 18% GST (SAC 998315):           ₹678.32 INR / month                      │
│  • Total Month 1 Post-Tax Payable:            ₹4,446.77 INR / month                    │
│                                                                                        │
│  MONTH 12 (With 1,055 GB Cumulative Media Archive):                                    │
│  • Cloud Run (Warm Compute + API Egress):     ₹903.95 INR / month                      │
│  • Cloud Storage (1,055 GB Media+Ops+Egress): ₹5,186.42 INR / month                    │
│  • Cloud Firestore (Reads, Storage, PITR, Egr):₹87.41 INR / month                      │
│  • Secret Manager & Security Operations:      ₹2.88 INR / month                        │
│  • Total Month 12 Pre-Tax:                    ₹6,180.66 INR / month (~$64.45 USD/mo)   │
│  • Applicable 18% GST (SAC 998315):           ₹1,112.52 INR / month                    │
│  • Total Month 12 Post-Tax Payable:           ₹7,293.18 INR / month                    │
│                                                                                        │
│  ANNUAL YEAR 1 FINANCIAL TOTAL:                                                        │
│  • Blended Monthly Pre-Tax Average:           ~₹4,974.69 INR / month (~$51.87 USD/mo)  │
│  • Annualized Pre-Tax Total (Year 1):         ₹59,696.33 INR / year (~$622.49 USD/yr)  │
│  • Annualized GST @ 18.00%:                   ₹10,745.34 INR / year (100% ITC Credit)  │
│  • Annualized Post-Tax Total (Year 1):        ₹70,441.67 INR / year (~$734.53 USD/yr)  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
