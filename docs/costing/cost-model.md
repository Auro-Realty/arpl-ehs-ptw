# Mathematical Cost Model & Sensitivity Analysis — ARPL EHS Platform

> **Document ID**: ARPL-FIN-MODEL-2026-09-28-R4  
> **Status**: AUDITED, MATHEMATICALLY DERIVED & DAILY-TRANSACTION VALIDATED  
> **Revision**: R4 — High-Resolution 10.0 MB Media Standard with Production Warm Compute SLA  
> **Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Currency**: Indian Rupee (INR / ₹) converted at live rate **1 USD = ₹95.90 INR** (Checked 2026-09-28 12:33 IST)  

---

## 1. Mathematical Formulas & Meter Functions

For any scale scenario defined by:
- $S$: Number of active business construction projects
- $U$: Unique authenticated users ($60 \times S$)
- $P$: Daily permit creation volume ($P_m = P \times 30$ permits/month)
- $W$: Production compute warm instances ($W = 1$ for baseline shift hours)

$$\text{Media Ingestion (GB/mo)} = \frac{P_m \times 10.0 \text{ MB}}{1024} = \mathbf{0.0097656 \times P_m}$$

$$\text{GCS Storage Month } m = \text{Media Ingestion} \times m \times \$0.026 \times 95.90$$

$$\text{GCS Download Egress (GB/mo)} = \frac{P_m \times 3.5 \text{ reviews} \times 7.0 \text{ MB}}{1024} \times \$0.12 \times 95.90 = \mathbf{₹0.275335 \times P_m}$$

$$\text{Cloud Run Warm Compute (INR/mo)} = W \times [480\text{h} \times 3600\text{s} \times (\$0.00000450 + \$0.00000090)] \times 95.90 = \mathbf{₹894.86 \times W}$$

---

## 2. Multi-Scenario Mathematical Comparison Matrix

| Resource / Parameter | Scenario A (Baseline) | Scenario B (Growth) | Scenario C (High Scale) | Special Sensitivity |
|---|---|---|---|---|
| **Active Construction Sites ($S$)** | **6 Sites** | **12 Sites** | **30 Sites** | **6 Mega-Sites** |
| **Total Authenticated Users ($U$)**| **360 Users** | **720 Users** | **1,800 Users** | **360 Users** |
| **Daily Permit Volume ($P$)** | **300 Permits / Day** | **600 Permits / Day** | **1,500 Permits / Day** | **1,800 Permits / Day** |
| **Monthly Permit Volume ($P_m$)** | **9,000 / month** | **18,000 / month** | **45,000 / month** | **54,000 / month** |
| **Annual Permit Volume** | **109,500 / year** | **219,000 / year** | **547,500 / year** | **657,000 / year** |
| --- | --- | --- | --- | --- |
| **Monthly Firestore Reads** | 2,292,600 | 4,585,000 | 11,460,000 | 13,750,000 |
| *Billable Firestore Reads / Mo* | 792,600 | 3,085,000 | 9,960,000 | 12,250,000 |
| *Firestore Read Cost / Mo* | **₹27.36** | **₹106.51** | **₹343.86** | **₹422.63** |
| **Monthly Firestore Writes** | 225,000 | 450,000 | 1,125,000 | 1,350,000 |
| *Billable Firestore Writes / Mo* | 0 (Within Free Tier) | 0 (Within Free Tier) | 525,000 | 750,000 |
| *Firestore Write Cost / Mo* | **₹0.00** | **₹0.00** | **₹54.39** | **₹77.70** |
| **Firestore PITR (7-Day Backup)**| **₹12.43** | **₹24.86** | **₹62.15** | **₹74.58** |
| --- | --- | --- | --- | --- |
| **New Media Ingestion / Month** | 87.89 GB | 175.78 GB | 439.45 GB | 527.34 GB |
| **Cumulative Storage (Month 12)**| 1,054.69 GB (~1.05 TB) | 2,109.38 GB (~2.11 TB) | 5,273.44 GB (~5.27 TB) | 6,328.13 GB (~6.33 TB) |
| *GCS Storage Cost (M1) — NO free*| **₹219.14** | **₹438.29** | **₹1,095.73** | **₹1,314.87** |
| *GCS Storage Cost (M12) — NO free*| **₹2,629.76** | **₹5,259.53** | **₹13,148.80** | **₹15,778.56** |
| *GCS Class A Ops (Uploads)* | **₹51.79** | **₹103.57** | **₹258.93** | **₹310.72** |
| *GCS Class B Ops (Reads)* | **₹6.90** | **₹13.81** | **₹34.52** | **₹41.43** |
| --- | --- | --- | --- | --- |
| **Cloud Run API Requests / Mo** | 226,800 (Free) | 453,600 (Free) | 1,134,000 (Free) | 1,360,800 (Free) |
| **Cloud Run Warm Instance SLA** | **₹894.86** (1 inst) | **₹894.86** (1 inst) | **₹1,789.72** (2 inst) | **₹1,789.72** (2 inst) |
| *Cloud Run Active CPU Overage* | ₹0.00 | ₹0.00 | **₹82.50** | **₹165.00** |
| --- | --- | --- | --- | --- |
| **Cloud Run API Egress / Mo** | 0.79 GB (₹9.09) | 1.58 GB (₹18.18) | 3.95 GB (₹45.46) | 4.74 GB (₹54.56) |
| **GCS Media Download Egress** | 215.33 GB (₹2,478.02)| 430.66 GB (₹4,956.04)| 1,076.66 GB (₹12,390.20)| 1,292.00 GB (₹14,868.24)|
| **Firestore SDK Egress (Sync)** | 4.0 GiB (₹46.03) | 18.0 GiB (₹207.14) | 60.0 GiB (₹690.48) | 62.0 GiB (₹713.62) |
| --- | --- | --- | --- | --- |
| **Secret Manager & DR Bucket** | **₹22.83** | **₹43.90** | **₹65.00** | **₹70.00** |
| --- | --- | --- | --- | --- |
| **MONTH 1 PRE-TAX TOTAL** | **₹3,768.45** | **₹6,807.16** | **₹16,848.55** | **₹19,879.35** |
| **MONTH 12 PRE-TAX TOTAL** | **₹6,180.66** | **₹11,651.43** | **₹28,988.96** | **₹34,440.67** |
| **BLENDED MONTHLY (YEAR 1 PRE-TAX)**| **₹4,974.69** | **₹9,127.60** | **₹22,642.80** | **₹26,892.00** |
| **ANNUAL PRE-TAX TOTAL (YEAR 1)**| **₹59,696.33** | **₹109,531.20** | **₹271,713.60** | **₹322,704.00** |
| **GST @ 18.00%** | **₹10,745.34** | **₹19,715.62** | **₹48,908.45** | **₹58,086.72** |
| **ANNUAL POST-TAX TOTAL (YEAR 1)**| **₹70,441.67** | **₹129,246.82** | **₹320,622.05** | **₹380,790.72** |

---

## 3. Scenario Financial Interpretations

### 3.1 Scenario A: Confirmed Enterprise Baseline (6 Projects, 300 Permits/Day)
* **Primary Cost Composition**: Network Egress (50.9%), Cloud Storage Media Archive & Ops (30.2%), Cloud Run Warm Instance SLA (18.0%).
* **Run-Rate**: Month 1 starts at **₹3,768.45 / month (~$39.29 USD)**. Month 12 reaches **₹6,180.66 / month (~$64.45 USD)** as 1,055 GB (~1.05 TB) of high-resolution photographic evidence and statutory PDFs accumulate.
* **Annual Investment**: **₹59,696.33 INR / year (~$622.49 USD/year pre-tax)**.

### 3.2 Scenario B: Growth Scenario (12 Projects, 600 Permits/Day)
* Permit volume doubles across 12 active sites.
* Single warm instance handles traffic easily (concurrency = 80 req/instance).
* Firestore reads, GCS storage, and download egress scale linearly with permit activity.
* **Annual Investment**: **~₹109,531 INR / year (~$1,142 USD/year pre-tax)**.

### 3.3 Scenario C: High Scale Enterprise Rollout (30 Projects, 1,500 Permits/Day)
* Major pan-India construction conglomerate operations across 30 major residential, commercial, and industrial sites.
* Sized with **2 Warm Instances (`min-instances = 2`)** to guarantee sub-100ms response times across 200+ concurrent morning users.
* Active compute exceeds Always Free tier (264,000 vCPU-seconds > 180,000 free quota), incurring small overage charges (₹82.50/mo).
* **Annual Investment**: **~₹271,714 INR / year (~$2,833 USD/year pre-tax)**.

### 3.4 Special Sensitivity: Mega-Infrastructure Intensity (6 Sites @ 300 Permits/Site/Day = 1,800/Day)
* Simulates hyper-intensive operations such as metro rail tunneling or international airport construction.
* Sized with 2 Warm Instances and heavy cellular inspection download traffic.
* **Annual Investment**: **~₹322,704 INR / year (~$3,365 USD/year pre-tax)**.

