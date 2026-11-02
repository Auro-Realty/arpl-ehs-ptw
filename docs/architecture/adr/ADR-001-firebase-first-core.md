# ADR-001: Firebase-First Client Data & Offline Architecture

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Lead Safety Systems Engineer, Cloud Infrastructure Lead  
> **Technical Scope**: Client Data Layer, Offline Synchronization, Real-time Gating  

---

## 1. Context and Problem Statement

The ARPL EHS Permit-to-Work (PTW) system governs high-risk statutory operations across 6 active construction projects (e.g., Auro Grand Residency, Auro Bhumi Phase 1/2, Auro Ridge Towers). Construction environments present extreme connectivity challenges:
- Deep basements (up to 4 levels below grade for parking/foundation excavation) have zero cellular or Wi-Fi coverage.
- High-rise towers under construction experience intermittent cellular signal shadowing.
- Operations (such as PTW-004 Confined Space atmospheric testing or PTW-001 Excavation pre-checks) cannot be halted simply because a field engineer loses connectivity.
- Multiple approvers across 16 roles must coordinate stage handoffs in near-real-time without manual page refreshes or polling.

Traditional monolithic REST APIs backed by relational databases require custom offline synchronization engines, complex caching layers, and manual WebSocket state synchronization, which introduce massive engineering overhead and high failure rates in field conditions.

---

## 2. Decision

We confirm the adoption of a **Firebase-First Architecture** for the client-to-data interaction layer, specifically utilizing:
1. **Cloud Firestore** in `asia-south1` (Mumbai) with client SDK `enableIndexedDbPersistence(db)` enabled on all web/PWA clients.
2. **Firestore Real-time Listeners (`onSnapshot`)** for dynamic UI updates, notification badge sync, and live approval status propagation.
3. **Firebase Authentication** for closed-registration identity management with custom claims for RBAC.
4. **Firebase Hosting** with global edge CDN for zero-build, ultra-fast static asset delivery.
5. **Firebase Storage** for direct, authenticated client-side media uploads (site photos, digital signatures).

---

## 3. Evaluated Alternatives

### Alternative 1: Traditional Containerized REST API (Cloud Run + PostgreSQL/Cloud SQL)
- *Pros*: Standard enterprise pattern, SQL relational integrity, mature tooling.
- *Cons*: Zero native offline sync; requires building an entire custom offline queue, local IndexedDB mirror, conflict reconciliation protocol, and WebSocket push service from scratch. Would add 3–4 months of engineering effort and create a continuous maintenance burden. High fixed cost for Cloud SQL instances (~₹6,500/mo minimum).

### Alternative 2: GraphQL Subscriptions with Apollo Client / AWS AppSync
- *Pros*: Flexible querying, subscription-based updates.
- *Cons*: Multi-cloud complexity; AppSync locks to AWS; self-hosted Apollo Server requires stateful WebSocket infrastructure; offline cache in Apollo is fragile under complex multi-stage mutations.

---

## 4. Technical Justification

1. **Native Offline Capability**: Firestore's SDK intercepts all database operations locally via `IndexedDB`. When a field engineer signs an excavation clearance deep in a basement, the write succeeds instantly in the UI. When the engineer reaches ground level, the SDK automatically flushes the queue to the cloud.
2. **Real-Time Safety Visibility**: High-risk permits (e.g., PTW-002 Hot Work with active Fire Watch or PTW-007 Blasting) require immediate site-wide awareness. Firestore's `onSnapshot` pushes updates to all connected role dashboards in <100ms.
3. **Flexible Document Polymorphism**: The 10 permit types have radically different schemas (e.g., Confined Space 4-gas metrics vs. Lifting 3-part rigging geometry vs. Electrical LOTO isolation tags). Firestore natively stores heterogeneous document schemas without demanding complex relational migrations.

---

## 5. Consequences & Mitigations

- **Risk**: Declarative Firestore Security Rules can become complex for multi-stage approval logic.
  - *Mitigation*: Restrict direct client writes in Firestore to user drafts and field attachments; route all authoritative multi-stage state transitions through the **Cloud Run Core Backend API** (see [ADR-002](file:///c:/Users/MohithSai.G/Downloads/ARPL-EHS-Demo/docs/architecture/adr/ADR-002-cloud-run-core-backend.md)).
- **Risk**: Offline "last-writer-wins" conflict resolution could clobber audit histories.
  - *Mitigation*: Move the activity log to an append-only subcollection (`permits/{id}/activity_log`) so concurrent offline writes generate distinct documents rather than overwriting an array.
- **Cost Impact**: High cost efficiency. The baseline of 360 unique users and 9,000 permits/month consumes ~1.4M reads/month and ~219k writes/month, falling almost entirely within Firebase free daily quotas.
