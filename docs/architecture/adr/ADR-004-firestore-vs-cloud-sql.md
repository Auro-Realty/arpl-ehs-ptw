# ADR-004: Primary Database Selection — Cloud Firestore vs. Cloud SQL

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Database Architect, Lead Safety Systems Engineer  
> **Technical Scope**: Primary Database Engine, Schema Evolution, Real-time Capabilities, Offline Persistence  

---

## 1. Context and Problem Statement

The Permit-to-Work system requires a robust operational database to store active permits, multi-stage approval states, statutory safety checklists, gas detector telemetry, rigging calculations, digital signatures, and audit logs across 6 construction projects.

We must critically decide whether to employ:
- **Cloud Firestore** (NoSQL document store), or
- **Cloud SQL** (Managed PostgreSQL / MySQL relational database), or
- A **Dual-Database Hybrid** (Firestore for client offline sync + Cloud SQL for core relational records).

---

## 2. Decision

We confirm the selection of **Cloud Firestore (Standard Edition, Regional `asia-south1` Mumbai)** as the **sole primary database engine**.

The introduction of **Cloud SQL is strictly rejected** as redundant, financially wasteful, and architecturally incompatible with construction-site offline requirements.

---

## 3. Comparative Technical Evaluation

| Technical Criterion | Cloud Firestore | Cloud SQL (PostgreSQL) | Why Firestore Wins for ARPL EHS |
|---|---|---|---|
| **Offline-First Synchronization** | Native via client SDK `enableIndexedDbPersistence()` | None native; requires complex custom local SQLite/IndexedDB sync protocol | **Decisive**: Ground-level workers and basement inspectors must operate completely disconnected. Building an offline sync layer for SQL is unnecessary engineering risk. |
| **Real-time Live Listeners** | Native `onSnapshot()` pushes changes to web/mobile clients in <100ms | Requires building and maintaining WebSocket gateways or Polling loops | EHS safety operations require instant visibility when a permit is revoked, escalated, or approved. |
| **Schema Polymorphism** | Native JSON document model; seamlessly accommodates 10 divergent permit schemas | Rigid relational schema; requires either complex EAV (Entity-Attribute-Value), extensive table joins, or JSONB columns | 10 permit types have unique fields (Confined Space 4-gas, Blasting charge weight, Rigging boom radius, LOTO tags). Firestore handles this natively without schema migrations. |
| **Base Fixed Cost** | **₹0/month** (scales to zero within Always Free Tier) | **~₹6,500 – ₹12,000/month** minimum fixed cost for high-availability instance | Cloud SQL requires 24/7 provisioned VM and storage even when site operations are idle at night. |
| **Operational Maintenance** | Fully serverless, zero maintenance, auto-scaling to thousands of QPS | Requires connection pooling (PgBouncer), vacuuming, replica management, OS patching | Firestore requires zero database administrator overhead. |
| **Complex Relational Joins** | No native joins; requires denormalization and document references | Full SQL JOIN capability across multiple tables | PTW workflows are document-centric (a permit is a self-contained unit of work). Query patterns are flat (filter by `projectId`, `status`, `validTill`). |
| **Audit Log Immutability** | Enforced via append-only subcollection (`activity_log`) with security rules | Enforced via SQL triggers / append-only tables | Firestore provides equal immutability with zero server maintenance. |

---

## 4. Addressing Common Arguments for Relational Databases

1. **"Does EHS reporting require SQL joins?"**
   - *Analysis*: No. EHS statutory reporting involves filtering permits by project, type, and date range to tally metrics (e.g., active permits, SLA breaches, observations raised). This is accomplished via Firestore composite indexes and client-side or Cloud Run aggregations.
   - For long-term historical analytics across years, Firestore data can be streamed to BigQuery via the official Firebase BigQuery Extension at zero base cost, without burdening the operational database.
2. **"Does Firestore guarantee ACID transactions?"**
   - *Analysis*: Yes. Firestore supports multi-document ACID transactions and batched writes. The state machine transitions (e.g., approving a stage, recording the signature, appending the audit log, and updating the counter) execute atomically.

---

## 5. Consequences & Verdict

- **Decision**: Sole primary database is Cloud Firestore (`asia-south1`).
- **Cost Verdict**: Eliminates ~₹80,000 to ~₹1,44,000/year in unnecessary Cloud SQL provisioned infrastructure.
- **Operational Verdict**: Delivers native offline persistence and real-time synchronization out of the box, directly satisfying mandatory field requirements.
