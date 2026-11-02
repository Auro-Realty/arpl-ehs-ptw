# ADR-008: HTML5 Canvas Digital Signatures & Biometric Stroke Capture

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Lead Mobile Engineer, Head of Statutory Compliance  
> **Technical Scope**: Digital Signatures, Canvas Rendering, DPDP Act 2023 Consent  

---

## 1. Context and Problem Statement

The Permit-to-Work (PTW) workflow requires legally auditable digital signatures from field personnel (Site Supervisors, Electricians, Crane Operators, Section Heads, EHS Officers) directly on mobile devices and tablets under Indian construction conditions. Standard text-based "I Agree" buttons or checkbox affirmations fail to meet Directorate General of Mines Safety and Factory Inspection statutory governance standards.

Commercial e-signature solutions (e.g., DocuSign, Adobe Sign) charge $1.50 to $4.00 per envelope. At 9,000 permits/month with an average of 4 signatures per permit (36,000 signature events/month), commercial APIs would cost over **₹30,00,000 to ₹80,00,000/year**, which is economically prohibitive.

---

## 2. Decision

We implement an in-app **HTML5 Canvas Digital Signature Engine using `PointerEvents`**:
1. **Hardware Agnostic**: Captures touch, stylus (Apple Pencil / Samsung S-Pen), and mouse inputs smoothly with Bezier stroke smoothing and High-DPI screen scaling.
2. **Direct Media Upload Pipeline**: Signatures are serialized to PNG, uploaded directly to **Firebase Storage (`asia-south1`)** via client SDK, and the resulting storage URI is bound to the permit record.
3. **Statutory Non-Repudiation Binding**: Every signature is cryptographically bound to:
   - Authenticated User UID and Role.
   - Server-enforced IST timestamp.
   - Haversine GPS proximity verification coordinates.
   - Explicit Indian DPDP Act 2023 statutory consent affirmation.

---

## 3. Cost & Operational Impact

- **Operational Cost**: **₹0.00** per signature envelope (runs entirely on native web canvas).
- **Data Sovereignty**: 100% of biometric signature stroke data remains within ARPL's private Google Cloud Storage bucket in Mumbai (`asia-south1`), with zero third-party data egress.
