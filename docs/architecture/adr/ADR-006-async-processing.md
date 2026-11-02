# ADR-006: Asynchronous Processing Architecture — Cloud Tasks & Cloud Scheduler

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Cloud Operations Lead  
> **Technical Scope**: Asynchronous Compute, Background Queues, SLA Escalation Automation  

---

## 1. Context and Problem Statement

The Permit-to-Work system requires two distinct asynchronous capabilities:
1. **Periodic Automation (Batch Scheduling)**: The real-time Escalation and Auto-Expiry Engine (FR-007) must inspect active and pending permits across 6 sites for SLA breaches, auto-expiring unapproved night shift permits at 21:00 IST and issuing T-30 minute warnings.
2. **Deferred Task Execution (Queueing)**: Complex post-transition side effects (such as high-fidelity PDF certificate compilation, multi-recipient notification fan-outs, and immutable audit exports) must not block the interactive HTTP response on mobile devices.

We must determine the minimal, robust set of GCP async services without introducing unnecessary message brokers.

---

## 2. Decision

We mandate the selective combination of:
1. **Google Cloud Scheduler** in `asia-south1` (Mumbai) for periodic SLA escalation ticks.
2. **Google Cloud Tasks** in `asia-south1` (Mumbai) for deferred, controlled task execution (PDF rendering, bulk notifications).

We explicitly **reject Google Cloud Pub/Sub, Eventarc, and Cloud Run Jobs** for baseline production.

---

## 3. Technology Selection Matrix

| Service | Intended Architectural Use | Evaluation for ARPL EHS | Decision |
|---|---|---|---|
| **Cloud Scheduler** | Cron-based periodic invocation of HTTP endpoints | Perfect for 1-minute / 5-minute escalation sweeps calling Cloud Run `/api/v1/escalation/tick`. | **REQUIRED (PROD & DEV)** |
| **Cloud Tasks** | Controlled point-to-point task execution with rate-limiting, retries, and target endpoints | Perfect for queuing PDF generation and multi-role notification fan-outs without blocking users. | **REQUIRED (PROD)** |
| **Pub/Sub** | High-throughput, distributed event streaming with dynamic multi-subscriber fan-out | Overkill. ARPL EHS has zero streaming data and no dynamic external subscribers. Would add unnecessary message ack management. | **REJECTED** |
| **Cloud Run Jobs** | Batch container execution lasting up to 24 hours (data crunching, ETL) | Unnecessary. Escalation sweeps complete in <500ms; PDF rendering takes <2s. Neither requires a dedicated long-running batch job. | **REJECTED** |
| **Eventarc** | Routing GCP audit and cloud storage events to Cloud Run | Firestore change triggers natively handle database events via lightweight Cloud Functions without Eventarc plumbing. | **REJECTED** |

---

## 4. Implementation Details

### 4.1 Periodic Escalation Architecture (Cloud Scheduler)
- **Schedule**: `*/5 * * * *` (Every 5 minutes, 06:00–22:00 IST daily)
- **Target**: `POST https://api.arpl-ehs.internal/api/v1/escalation/tick`
- **Authentication**: OIDC token generated via IAM Service Account `ehs-escalation-sa@arpl-ehs-prod.iam.gserviceaccount.com`.
- **Query Optimization**: Queries only indexed permits where `nextSlaCheck <= now()`.

### 4.2 Deferred Processing Queue (Cloud Tasks)
- **Queue Name**: `ehs-async-tasks`
- **Rate Limit**: 10 dispatches/second (smooths traffic spikes).
- **Retry Policy**: Max 5 attempts with exponential backoff (initial delay 5s, max delay 60s).
- **Target Handler**: Cloud Run internal worker endpoints (`/api/v1/tasks/render-pdf`, `/api/v1/tasks/fanout-notifications`).

---

## 5. Cost Impact

- **Cloud Scheduler**: 3 free jobs per billing account. We use 1 job. **Cost = ₹0/month**.
- **Cloud Tasks**: 1,000,000 free operations per month. At 9,000 permits/month generating ~20,000 tasks, monthly usage is ~2% of the free quota. **Cost = ₹0/month**.

---

## 6. Consequences & Verdict

- **Decision**: Adopt Cloud Scheduler + Cloud Tasks; reject Pub/Sub, Eventarc, and Cloud Run Jobs.
- **Verdict**: Maximum operational reliability and SLA compliance at zero incremental cloud infrastructure cost.
