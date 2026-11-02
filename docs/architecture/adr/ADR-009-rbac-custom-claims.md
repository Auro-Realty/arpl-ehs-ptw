# ADR-009: Role-Based Access Control via Firebase Custom Claims

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Security Architect  
> **Technical Scope**: Authentication Tokens, RBAC Enforcement, Tenant Scoping  

---

## 1. Context and Problem Statement

The system enforces 16 distinct operational roles across 6 construction projects. We must prevent privilege escalation (e.g., a Site Supervisor attempting to approve an excavation permit or access unauthorized sites) without incurring massive database read overhead.

---

## 2. Decision

We enforce RBAC and project scoping via **Firebase Authentication Custom Claims** embedded directly into the user's JWT ID token:
```json
{
  "role": "site-engineer",
  "projectIds": ["PRJ-AGR"],
  "isGlobalAuditor": false
}
```

---

## 3. Technical Rationale & Benefits

1. **Cryptographic Tamper-Proofing**: Claims are cryptographically signed by Google's private keys. Client-side tampering immediately invalidates the token.
2. **Zero-Cost Database Rules**: Firestore Security Rules evaluate permissions instantaneously via `request.auth.token.role` and `request.auth.token.projectIds` without performing a `get()` lookup on a user profile. This saves over **1,200,000 document reads/month**, cutting Firestore database operational costs in half.
3. **Offline Role Retention**: The JWT and its custom claims are securely cached locally on the device by the Firebase SDK, allowing role-gated offline inspections in subterranean basements with zero network latency.

---

## 4. Consequences & Governance

- **Token Refresh**: Custom claim mutations (e.g., role promotions or site re-assignments) require issuing a token refresh via the client SDK (`user.getIdToken(true)`).
- **Size Limitation**: Claims payload is strictly maintained below 500 bytes (Google's limit is 1,000 bytes) by using compact project IDs (`PRJ-AGR`, `*`).
