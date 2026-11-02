# Google Cloud Billing Partner Confirmation & Commercial RFP Schedule

> **Document ID**: ARPL-FIN-PARTNER-2026-09-25-R2  
> **Status**: READY FOR PARTNER SUBMISSION — REGIONALLY VALIDATED  
> **Revision**: R2 — Corrected Free Tier Regional Applicability for `asia-south1`  
> **Target Cloud Vendor**: Google Cloud India Private Limited  
> **Authorized Partner**: TBD BY GOOGLE CLOUD BILLING PARTNER  
> **Target Deployment Region**: Primary: `asia-south1` (Mumbai, Maharashtra, India)  
> **Workload Reference**: ARPL EHS Permit-to-Work Platform (Baseline: 6 Sites · 360 Users · 9,000 Permits/Mo)  
> **Reference Exchange Rate**: **1 USD = ₹95.90 INR** (Checked 2026-09-25 12:33 IST)  

---

## 1. Commercial Separation of Public List Price vs. Partner Contract

In accordance with enterprise procurement governance, we formally separate Google Cloud published list prices from commercial partner terms. 

Public list prices establish the maximum list price ceiling. All commercial discounts, partner rebates, committed use discounts, and local tax settlements require formal confirmation by an authorized **Google Cloud Premier Billing Partner**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              COMMERCIAL QUOTATION LAYERS                               │
│                                                                                        │
│  1. Google Published List Price:     Publicly verifiable catalog baseline              │
│  2. Partner Program Discount:        TBD BY GOOGLE CLOUD BILLING PARTNER               │
│  3. Committed Use Discount (CUD):    TBD BY GOOGLE CLOUD BILLING PARTNER               │
│  4. Partner Managed Support Markup:  TBD BY GOOGLE CLOUD BILLING PARTNER               │
│  5. Net Taxable Commercial Price:    TBD BY GOOGLE CLOUD BILLING PARTNER               │
│  6. Goods & Services Tax (GST @ 18%): Legally validated via SAC 998315 (ITC eligible)  │
│  7. Final Binding Commercial Quote:  TBD BY GOOGLE CLOUD BILLING PARTNER               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Mandatory Confirmation Schedule for Google Cloud Billing Partner

The table below lists every specific technical, SKU, pricing, regional restriction, and taxation item that the Billing Partner must review, validate, and contractually confirm:

| Item ID | Category | Resource / Service | Required Partner Confirmation | Public List Benchmark | Partner Confirmed Value |
|---|---|---|---|---|---|
| **REQ-001** | Invoicing Entity | Google Cloud Contracting Entity | Confirm invoicing entity is Google Cloud India Pvt Ltd (Bengaluru) with valid GSTIN | Google Cloud India Pvt Ltd | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-002** | Tax Treatment | HSN / SAC Code & GST Rate | Confirm SAC 998315 classification and 18.00% GST applicability with B2B ITC eligibility | SAC 998315 / 18% GST | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-003** | Regional Free Tier | Regional Quota Confirmation | Contractually confirm that Cloud Storage Always Free (5 GB, 50k ops) applies **strictly to US regions** and does NOT discount `asia-south1` | No free GCS in Mumbai | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-004** | Exact SKU | Cloud Firestore Document Reads | Confirm exact SKU ID for standard document reads in `asia-south1` (Mumbai) | `Firestore Document Reads` | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-005** | Direct INR Rate | Firestore Reads Unit Rate | Confirm binding direct INR contracted rate per 100,000 document reads | ₹3.45 per 100K reads | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-006** | Exact SKU | Cloud Firestore Document Writes | Confirm exact SKU ID for standard document writes in `asia-south1` (Mumbai) | `Firestore Document Writes` | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-007** | Direct INR Rate | Firestore Writes Unit Rate | Confirm binding direct INR contracted rate per 100,000 document writes | ₹10.36 per 100K writes | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-008** | Exact SKU | Cloud Firestore PITR Storage | Confirm SKU for Point-in-Time Recovery continuous backup in `asia-south1` | `Firestore PITR Storage` | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-009** | Direct INR Rate | Firestore PITR Unit Rate | Confirm binding direct INR rate per GiB/month for PITR storage | ₹11.51 per GiB / month | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-010** | Exact SKU | Cloud Run CPU Allocation | Confirm SKU ID for vCPU runtime in `asia-south1` (Tier 2 pricing) | `Cloud Run CPU Allocation` | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-011** | Direct INR Rate | Cloud Run vCPU-second Rate | Confirm binding direct INR rate per active vCPU-second | ₹0.0023016 / vCPU-sec | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-012** | Exact SKU | Cloud Run Memory Allocation | Confirm SKU ID for GiB-second runtime in `asia-south1` | `Cloud Run Memory Allocation`| **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-013** | Direct INR Rate | Cloud Run GiB-second Rate | Confirm binding direct INR rate per active GiB-second | ₹0.0002398 / GiB-sec | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-014** | Exact SKU | Cloud Run Internet Egress | Confirm SKU ID for Premium Tier internet egress from `asia-south1` | `Cloud Run Egress (Premium)`| **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-015** | Direct INR Rate | Cloud Run Egress Rate | Confirm binding direct INR rate per GB internet egress ($0.12/GB list) | ₹11.51 per GB | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-016** | Free Quota | Global Always Free Preservation | Contractually confirm that Cloud Run (2M req, 180k CPU-sec, 360k GiB-sec) and Artifact Registry (0.5 GiB) free allowances apply under Consolidated Billing | Active in standard billing | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-017** | Exact SKU | Cloud Storage Standard Class | Confirm SKU ID for Standard Object Storage in `asia-south1` (Mumbai) | `Cloud Storage Standard` | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-018** | Direct INR Rate | Cloud Storage Unit Rate | Confirm binding direct INR rate per GB/month for standard object storage | ₹2.49 per GB / month | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-019** | Exact SKU | Cloud Storage Operations | Confirm Class A ($0.05/10k) and Class B ($0.004/10k) operation rates in `asia-south1` | Class A & B Ops SKUs | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-020** | Exact SKU | Cloud Storage Internet Egress | Confirm SKU ID and direct INR rate for GCS download egress from `asia-south1` ($0.12/GB list) | `GCS Internet Egress` | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-021** | Exact SKU | Secret Manager Active Versions | Confirm SKU ID and billing meter for active secret versions | `Secret Manager Version` | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-022** | Commercial Terms | Partner Program Discount (%) | State discretionary partner discount percentage off Google list prices | 0.00% list | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-023** | Commercial Terms | Committed Use Discount (CUD) | Confirm minimum threshold and savings for 1-year / 3-year Resource-Based CUDs in Mumbai | 1-Yr CUD (~17-25% saving) | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-024** | Support Level | Customer Support Tier | Confirm cost and inclusions for Google Cloud Support (Basic Free vs. Enhanced / Partner Managed Support) | Basic Support ($0) | **TBD BY GOOGLE CLOUD BILLING PARTNER** |
| **REQ-025** | Invoicing Terms | Credit Period & Payment Currency | Confirm 30-day corporate credit payment terms settled strictly in Indian Rupees (INR via NEFT/RTGS) | INR Corporate Invoice | **TBD BY GOOGLE CLOUD BILLING PARTNER** |

---

## 3. Partner Sign-Off & Commercial Submission Block

To be completed by an authorized commercial representative of the Google Cloud Partner:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PARTNER PROPOSAL ACKNOWLEDGMENT                           │
│                                                                                        │
│  Partner Corporate Name:      _______________________________________________________  │
│  Partner GSTIN:               _______________________________________________________  │
│  Authorized Signatory:        _______________________________________________________  │
│  Designation:                 _______________________________________________________  │
│  Confirmed Monthly Pre-Tax:   ₹ ____________________ INR / month                       │
│  Applicable 18% GST:          ₹ ____________________ INR / month                       │
│  Total Monthly Commercial:    ₹ ____________________ INR / month                       │
│  Signature & Corporate Seal:  _______________________________________________________  │
│  Date of Quotation:           YYYY-MM-DD                                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
