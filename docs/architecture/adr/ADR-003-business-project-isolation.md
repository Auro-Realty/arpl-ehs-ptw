# ADR-003: Single GCP/Firebase Project with Logical Multi-Project Partitioning

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Enterprise Security Officer, Operations Lead  
> **Technical Scope**: Multi-Tenancy Architecture, Tenant Isolation, Cloud Project Boundary  

---

## 1. Context and Problem Statement

The confirmed business workload establishes that the ARPL EHS platform currently operates across:
- **6 active business construction projects** (e.g., Auro Grand Residency, Auro Bhumi Phase 1, Auro Bhumi Phase 2, Auro Ridge Towers, Auro Valley Commercial, Auro Heights).
- **60 unique users per business project** = **360 unique users total baseline**.
- **300 permits/day total baseline** (9,000 permits/month).

A critical architectural decision is required: **How should these 6 business projects be mapped to Google Cloud Platform and Firebase infrastructure?**

We evaluate three potential architectural options:
- **Option A**: A single production Google Cloud & Firebase project containing 6 logical business projects.
- **Option B**: 6 physically isolated Google Cloud & Firebase projects (one per business site).
- **Option C**: A hybrid model with separate cloud projects per business division or site category.

---

## 2. Decision

We decisively adopt **Option A: A Single Production Google Cloud & Firebase Project (`arpl-ehs-prod`) with Logical Multi-Project Partitioning**, complemented by a completely isolated development project (`arpl-ehs-dev`).

Physical cloud project isolation across business construction sites is **strictly rejected**.

---

## 3. Comparative Evaluation of Architectural Options

| Architectural Factor | Option A: Single Cloud Project (Logical Partitioning) | Option B: 6 Separate Cloud Projects (Physical Isolation) | Option C: Hybrid Isolation |
|---|---|---|---|
| **Identity & Authentication** | Unified Firebase Auth; single login for users across sites | Fractured auth; users at multiple sites need 6 logins or SSO federation | Complex IAM mapping across project boundaries |
| **Cross-Project Role Governance** | EHS Manager, EHS Officer, Admin view all 6 sites seamlessly | Severe fragmentation; EHS leadership cannot view a unified safety dashboard | Requires multi-project credential aggregation |
| **Infrastructure Cost** | Single aggregated quota; stays within unified free tiers | Multiplies baseline billing, Secret Manager versions, and network hops | Partial duplication of base resources |
| **CI/CD Deployment** | 1 deployment pipeline; single `git push` updates all 6 sites | 6 deployment pipelines; drift risk across sites during rollouts | 2–3 pipelines with synchronization overhead |
| **Regulatory Audit & Reporting** | Instant cross-project safety analytics, export, and compliance | Complex cross-project ETL / BigQuery pipeline required to aggregate data | Fragmented audit trails |
| **Tenant Data Isolation** | Enforced via Firestore Security Rules + Firebase Custom Claims | Enforced by physical GCP IAM boundary | Mixed isolation rules |
| **Operational Complexity** | **LOW** (Single pane of glass, unified logging) | **EXTREME** (6× operational overhead, 6 billing accounts) | **MEDIUM-HIGH** |

---

## 4. Logical Partitioning Implementation Mechanics

### 4.1 Data Modeling
Every Firestore document in the system (`permits`, `notifications`, `counters`, `audit_events`) contains a mandatory, immutable string field:
```typescript
projectId: string; // e.g., "PRJ-AGR", "PRJ-ABP", "PRJ-ART", "PRJ-AB2", "PRJ-AVC", "PRJ-AHT"
```

### 4.2 Cryptographic Role & Tenant Claims
User authorization is governed by Firebase Authentication Custom Claims set authoritatively by the Cloud Run User Provisioning API:
```json
{
  "role": "site-engineer",
  "projectIds": ["PRJ-AGR"],
  "isGlobalAuditor": false
}
```
For enterprise safety leadership (EHS Manager, EHS Officer, Administrator):
```json
{
  "role": "ehs-manager",
  "projectIds": ["*"],
  "isGlobalAuditor": true
}
```

### 4.3 Database Security Rule Enforcement
Firestore Security Rules enforce strict tenant boundaries at the database engine level, rejecting any client request that attempts to read or mutate a document outside the user's assigned projects:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAssignedProject(projectId) {
      return request.auth != null && 
        (request.auth.token.projectIds.hasAny([projectId]) || 
         request.auth.token.projectIds.hasAny(['*']));
    }

    match /permits/{permitId} {
      allow read: if isAssignedProject(resource.data.projectId);
      allow create: if isAssignedProject(request.resource.data.projectId);
      // State transitions gated by Cloud Run backend
      allow update: if false; 
      allow delete: if false;
    }
  }
}
```

### 4.4 High-Performance Indexing
Compound indexes ensure tenant isolation does not compromise query speed:
- `Collection: permits`, `Fields: projectId (ASC), status (ASC), createdAt (DESC)`
- `Collection: permits`, `Fields: projectId (ASC), ptype (ASC), validTill (ASC)`

---

## 5. Environment Separation Boundary

While business projects are partitioned logically, **Development and Production environments are physically isolated into separate Google Cloud & Firebase projects**:
- **DEV Project**: `arpl-ehs-dev` (GCP Project ID: `arpl-ehs-dev`, Firebase App ID: `1:1234567890:web:devabc123`)
  - Scaled to zero, separate test user directory, zero customer data, zero production impact.
- **PROD Project**: `arpl-ehs-prod` (GCP Project ID: `arpl-ehs-prod`, Firebase App ID: `1:0987654321:web:prodxyz789`)
  - Hardened IAM, restricted access, PITR backup enabled, production secrets, audit logging.

---

## 6. Consequences & Verdict

- **Decision**: Adopt Option A (Single Cloud Project with Logical Partitioning).
- **Justification**: Construction sites are operational units of a single legal enterprise (ARPL), not hostile third-party software tenants. Logical partitioning delivers 100% of the required data isolation while preventing millions of rupees in unnecessary architectural complexity and broken cross-site safety workflows.
