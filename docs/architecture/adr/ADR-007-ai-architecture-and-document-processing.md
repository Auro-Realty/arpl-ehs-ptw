# ADR-007: AI & Document Processing Architecture — Deterministic Safety Core vs. Optional GenAI Extensions

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Head of Safety & Statutory Compliance  
> **Technical Scope**: AI/ML Evaluation, Rigging & Gas Calculations, Document OCR, Future Vertex AI  

---

## 1. Context and Problem Statement

Construction safety governance involves safety observations, equipment certifications, multi-gas telemetry, rigging calculations, and statutory permit verification. 

We must critically answer:
1. Does the core ARPL EHS Permit-to-Work system require AI/GenAI (Vertex AI / Gemini) for its baseline functionality?
2. How should safety calculations (rigging sling stress, atmospheric thresholds, GPS geofencing) be executed?
3. If AI document processing or visual hazard inspection is introduced in the future, what is the architectural integration pattern and cost model?

---

## 2. Decision

1. **Deterministic Safety Core (Baseline Decision)**: The baseline ARPL EHS platform **does NOT require AI/GenAI models** for operational safety workflows. All safety calculations, gas threshold alerts, and approval routing are strictly enforced via **deterministic, audited algorithms**.
2. **Optional Future AI Extension**: If AI visual hazard inspection or equipment calibration OCR is mandated by enterprise policy, it will be orchestrated asynchronously via **Google Cloud Run calling Vertex AI (Gemini 1.5 Flash)** in `asia-south1`. Client devices will **NEVER call AI APIs directly**.

---

## 3. Analysis of Core Safety Algorithms

The source specifications (FR-011, FR-016, FR-017, FR-018) require zero machine learning:

| Feature | Requirement | Implementation Mechanism | Why AI is NOT Appropriate |
|---|---|---|---|
| **Confined Space Gas Limits (FR-016)** | Verify O2 (19.5–21%), LEL (<10%), CO (<25 PPM), H2S (<=5 PPM) | Strict Boolean comparator logic in JavaScript / TypeScript | Statutory safety limits must be 100% deterministic with zero hallucination risk. |
| **Sling Stress Engine (FR-017)** | Compute tension $T = \frac{W \times L}{H \times N}$; flag $>80\%$ SWL | Exact trigonometric/geometric formula | Pure physics formula; AI adds latency, cost, and unpredictability. |
| **GPS Geofencing (FR-011)** | Verify signee is within site radius | Haversine formula calculation against site centroid | Standard spherical trigonometry. |
| **Approval Flow Routing (FR-004)** | 27 operational state transitions across 16 roles | Finite State Machine (FSM) lookup table | FSM is formal, mathematical, and fully verifiable by unit tests (920+ assertions). |

---

## 4. Optional GenAI Extension Architecture (Phase 27 Modeling)

For enterprise roadmap planning, we architect and cost an **Optional AI Visual Hazard & Certificate OCR Module**:

### 4.1 Orchestration Architecture
```
[Client (Mobile / Tablet)]
       │
       │ (1) Direct Upload Photo / Certificate
       ▼
[Firebase Storage (GCS asia-south1)]
       │
       │ (2) Cloud Storage Trigger / Cloud Tasks
       ▼
[Cloud Run Worker (`arpl-ehs-api`)]
       │
       │ (3) IAM Authenticated API Call (gRPC/REST)
       ▼
[Vertex AI — Gemini 1.5 Flash (asia-south1)]
       │
       │ (4) Structured JSON Response (Safety Violations, Expiry Dates)
       ▼
[Cloud Firestore (`permits/{id}/observations`)]
```

### 4.2 Use Cases for Optional AI
1. **Automated Site Photo Hazard Detection**: Verifying PPE compliance (hard hats, high-vis vests, harnesses) in uploaded pre-work site photos.
2. **Statutory Equipment Calibration Certificate OCR**: Extracting expiry dates and certification serial numbers from lifting crane load charts and gas detector calibration sheets.

### 4.3 Mathematical Token & Cost Model (Gemini 1.5 Flash)
- **Model**: `gemini-1.5-flash` in `asia-south1` (Mumbai).
- **Pricing**:
  - Image Input: $0.00002 per image (equivalent to ~258 tokens).
  - Text Input: $0.075 per 1,000,000 input tokens.
  - Text Output: $0.30 per 1,000,000 output tokens.
- **Volume Modeling (Optional PROD Feature)**:
  - 9,000 permits/month × 1 photo analyzed = 9,000 images/month.
  - Input tokens: 9,000 × 500 prompt tokens = 4,500,000 tokens.
  - Output tokens: 9,000 × 200 response tokens = 1,800,000 tokens.
  - Cost Calculation:
    - Images: 9,000 × $0.00002 = $0.18.
    - Input Text: 4.5M × $0.075/M = $0.3375.
    - Output Text: 1.8M × $0.30/M = $0.54.
    - Total Monthly AI Cost: **$1.0575 USD = ~₹101.40 INR/month**!
- **Verdict on AI Cost**: Because Gemini 1.5 Flash is highly optimized, even if full visual hazard inspection is enabled across all 9,000 permits/month, the total cloud cost is under ₹105/month.

---

## 5. Consequences & Verdict

- **Decision**: The baseline application operates with 100% deterministic safety rules (AI cost = ₹0/month).
- **Future Readiness**: If visual hazard detection is activated, it is deployed via Cloud Run calling Vertex AI in `asia-south1` with an estimated operational cost of ~₹101/month.
