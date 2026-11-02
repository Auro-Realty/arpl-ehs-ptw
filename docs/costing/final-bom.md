# Final Combined Bill of Materials (BOM) — ARPL EHS Platform

> **Document ID**: ARPL-BOM-FINAL-2026-09-28-R4  
> **Status**: PROCUREMENT-GRADE, AUDITED & DAILY-TRANSACTION VALIDATED  
> **Revision**: R4 — High-Resolution 10.0 MB Media Standard with Production Warm Compute SLA  
> **Verification Date**: 2026-09-28  
> **Target Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Currency**: Indian Rupee (INR / ₹) converted at live rate **1 USD = ₹95.90 INR** (Checked 2026-09-28 12:33 IST)  
> **Target Workload**: 6 Business Projects · 360 Unique Users (60/proj) · 300 Permits/Day Total (9,000/mo, 109,500/yr)  

---

## 1. Operational Realities & Regional Free Tier Governance

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION SIZING HIGHLIGHTS                              │
│                                                                                        │
│  • Daily Permit Creation Volume:              300 Permits / Day Total (50/site/day)    │
│  • Daily Active Personnel on Shift:           ~216 Staff / Day                         │
│  • Peak Concurrent Users (06:30–09:30 AM):    35 to 45 Concurrent Users                │
│  • Media Payload Standard per Permit:         10.0 MB (5.5 Photos + 5 Sigs + 1 PDF)    │
│  • Daily Storage Ingestion:                   3,000 MB / Day (87.89 GB / Month)        │
│  • Daily Field Review Egress:                 7,350 MB / Day (215.33 GB / Month)       │
│  • Compute Mode (Production SLA):             Warm Instance (min-instances = 1)        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **Regional Free Tier Audit**:
> 1. **Cloud Storage**: Always Free storage (5 GB) and operations (50k) apply **ONLY to US regions**. In `asia-south1` (Mumbai), all GCS storage, uploads, reads, and egress are billable from byte zero.
> 2. **Network Egress**: Premium Tier internet egress (1 GB free) applies **ONLY to North America**. In `asia-south1`, Cloud Run and GCS internet egress are fully billable.
> 3. **Warm Compute**: Running `min-instances = 1` during shift hours incurs idle CPU/RAM charges (₹894.86/mo) to eliminate cold starts for critical safety operations.

---

## 2. Environment Cost Comparison & Consolidated Grand Totals

| Cost Category | DEV Environment (Monthly) | PROD Environment (Month 1) | PROD Environment (Month 12) | PROD Blended Monthly (Yr 1) | Combined Environments (Monthly M1) | Combined Environments (Annual Yr 1) |
|---|---:|---:|---:|---:|---:|---:|
| **01. Firebase (Hosting & CDN)** | ₹0.00 | ₹0.00 | ₹0.00 | ₹0.00 | **₹0.00** | **₹0.00** |
| **02. Compute (Cloud Run Warm SLA)** | ₹0.00 | ₹894.86 | ₹894.86 | ₹894.86 | **₹894.86** | **₹10,738.32** |
| **03. Database (Firestore Ops & PITR)**| ₹0.00 | ₹39.79 | ₹41.38 | ₹40.59 | **₹39.79** | **₹487.08** |
| **04. Storage (GCS — Media & Ops)** | ₹7.62 | ₹277.83 | ₹2,688.45 | ₹1,483.24 | **₹285.45** | **₹17,890.33** |
| **05. Networking (Egress — Media + API + Sync)** | ₹58.12 | ₹2,533.14 | ₹2,533.14 | ₹2,533.14 | **₹2,591.26** | **₹31,095.12** |
| **06. Security (Secret Manager)** | ₹0.00 | ₹2.88 | ₹2.88 | ₹2.88 | **₹2.88** | **₹34.56** |
| **07. Identity (Firebase Auth)** | ₹0.00 | ₹0.00 | ₹0.00 | ₹0.00 | **₹0.00** | **₹0.00** |
| **08. Messaging (Cloud Tasks & Sched)**| ₹0.00 | ₹0.00 | ₹0.00 | ₹0.00 | **₹0.00** | **₹0.00** |
| **10. Logging & Monitoring** | ₹0.00 | ₹0.00 | ₹0.00 | ₹0.00 | **₹0.00** | **₹0.00** |
| **12. CI/CD (Artifact Reg & Build)** | ₹0.00 | ₹0.00 | ₹0.00 | ₹0.00 | **₹0.00** | **₹0.00** |
| **13. Backup/DR (Private GCS Bucket)** | ₹0.00 | ₹19.95 | ₹19.95 | ₹19.95 | **₹19.95** | **₹239.40** |
| **PRE-TAX GRAND TOTAL** | **₹65.18** | **₹3,768.45** | **₹6,180.66** | **₹4,974.69** | **₹3,833.63** | **₹60,478.49** |
| **GST @ 18.00% (SAC 998315)** | ₹11.73 | ₹678.32 | ₹1,112.52 | ₹895.44 | **₹690.05** | **₹10,886.13** |
| **POST-TAX GRAND TOTAL (INR)** | **₹76.91** | **₹4,446.77** | **₹7,293.18** | **₹5,870.13** | **₹4,523.68** | **₹71,364.62** |

---

## 3. Comparison with Prior Preliminary Drafts

| Dimension | Initial Preliminary Draft | Revision R2 (Regional Free Tier Fix) | Revision R3 (1.85 MB Media Baseline) | **Revision R4 (10.0 MB Media Standard & Warm Compute)** | Engineering Justification |
|---|---:|---:|---:|---:|---|
| **Daily Permit Basis** | 30 permits/day (understated) | 300 permits/day | 300 permits/day | **300 permits/day (50/site/day)** | Physical operational baseline |
| **Media Ingestion / Mo** | 0.5 GB / month | 6.24 GB / month (1 photo) | 16.26 GB / month | **87.89 GB / month (10.0 MB standard)** | High-res hazard photos & stamped PDFs |
| **GCS Review Egress / Mo**| 0 GB (assumed free) | 4.5 GB / month | 40.0 GB / month | **215.33 GB / month (3.5 reviews × 7.0 MB)** | Real approver high-res download inspection |
| **Cloud Run Compute** | ₹0.00 (scale-to-zero) | ₹0.00 (scale-to-zero) | ₹894.86 / month (Warm min=1)| **₹894.86 / month (Warm Instance min=1)** | Eliminates 2–5s cold starts during morning rush |
| **PROD Annual Pre-Tax** | ~₹650 INR / year | ₹2,401.75 INR / year | ₹21,060.38 INR / year | **₹59,696.33 INR / year (~$622.49 USD)** | Procurement-ready production architecture |
| **Blended Monthly Pre-Tax**| ~₹54 INR / month | ~₹200 INR / month | ~₹1,755.03 INR / month | **~₹4,974.69 INR / month (~$51.87 USD)** | Outstanding value for 6 major enterprise sites |

---

## 4. Procurement Sign-Off Checklist

| Verification Item | Status |
|---|:---:|
| Sized on physical daily permit volume: 300 permits/day across 6 active sites | ✅ |
| Media sizing incorporates high-resolution hazard photos, equipment tags, signatures, and PDFs (10.0 MB/permit) | ✅ |
| Field inspector photo download egress sized for 3.5 reviews per permit (215.33 GB/month) | ✅ |
| Cloud Run compute priced with dedicated Warm Instance (`min-instances = 1`) to eliminate cold starts | ✅ |
| GCS Always Free tier correctly excluded for Mumbai (US-only restriction enforced) | ✅ |
| Cloud Run Premium Tier internet egress priced from byte zero (North America restriction enforced) | ✅ |
| Firestore real-time client sync egress priced above 10 GiB free quota | ✅ |
| All USD $\rightarrow$ INR conversions at live spot rate **₹95.90** | ✅ |
| GST treatment documented under SAC 998315 with 100% corporate ITC eligibility | ✅ |
| Zero unvalidated partner discounts or invented SKUs | ✅ |

