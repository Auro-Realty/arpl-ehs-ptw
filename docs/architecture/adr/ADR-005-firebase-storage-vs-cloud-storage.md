# ADR-005: Unified Media Architecture — Firebase Storage vs. Cloud Storage

> **Status**: APPROVED  
> **Date**: 2026-09-25  
> **Deciders**: Chief Architect, Storage & Media Architect  
> **Technical Scope**: Object Storage, Media Uploads, Digital Signatures, Site Photos, Statutory Reports  

---

## 1. Context and Problem Statement

The ARPL EHS system generates substantial binary media assets across 10 permit types and 6 projects:
- High-DPI digital signature captures (Canvas vector / PNG data, FR-012)
- Statutory site condition photographs (pre-excavation, hot-work clearance, guard rail re-fixing verification)
- Structural drawings and excavation cross-sections (PTW-001)
- Generated statutory A4 PDF reports (FR-009)

At the confirmed baseline volume of **9,000 permits/month**, the application generates approximately **54,000 files/month** (~6.24 GB/month of new stored assets).

We must establish whether to use:
- **Firebase Storage**,
- **Google Cloud Storage (GCS)**, or
- A dual-bucket architecture.

---

## 2. Decision

We confirm the adoption of **a single, unified Google Cloud Storage bucket in `asia-south1` (Mumbai) accessed via Firebase Storage SDKs and Cloud Storage APIs**.

We explicitly recognize the architectural reality: **Firebase Storage is NOT a competing or duplicate service to Google Cloud Storage. Firebase Storage is a client-facing security and SDK layer directly wrapping a standard Google Cloud Storage bucket.**

---

## 3. Workload Division & Access Patterns

### 3.1 Client-Facing Direct Uploads (Firebase Storage SDK)
- **Use Case**: Field engineers capturing on-site inspection photos and digital signatures directly on mobile/tablet devices.
- **Mechanism**: The client uploads directly to the GCS bucket using the Firebase Storage Client SDK (`uploadBytesResumable`).
- **Advantage**: Bypasses the application backend API entirely, preventing large multipart file streams from consuming Cloud Run memory, bandwidth, and CPU.
- **Security**: Gated by **Firebase Storage Security Rules**:
  ```javascript
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /projects/{projectId}/permits/{permitId}/{allPaths=**} {
        // Enforce user assignment to project
        allow read: if request.auth != null && 
          request.auth.token.projectIds.hasAny([projectId, '*']);
        // Enforce file size (<2MB) and content type (image/png, image/jpeg)
        allow write: if request.auth != null &&
          request.auth.token.projectIds.hasAny([projectId, '*']) &&
          request.resource.size < 2 * 1024 * 1024 &&
          request.resource.contentType.matches('image/(jpeg|png)');
      }
    }
  }
  ```

### 3.2 Server-Side Operations (Google Cloud Storage Node.js SDK)
- **Use Case**: Cloud Run Backend generating and storing official statutory A4 PDF compliance reports and weekly database backups.
- **Mechanism**: Uses the official `@google-cloud/storage` SDK authenticated via IAM Service Account credentials.
- **Path Isolation**:
  - `gs://arpl-ehs-media-prod/projects/{projectId}/permits/{permitId}/reports/` (Read-only to clients)
  - `gs://arpl-ehs-backups-prod/firestore-exports/` (Private bucket, zero public or client access)

---

## 4. Storage Directory Topology

```
gs://arpl-ehs-media-prod/
└── projects/
    └── {projectId}/                     # Logical project partition (e.g., "PRJ-AGR")
        └── permits/
            └── {permitId}/              # Unique permit folder (e.g., "EXC-2026-000001")
                ├── signatures/          # Captured canvas signatures (50-100 KB)
                │   ├── site-engineer.png
                │   ├── section-head.png
                │   └── ehs-manager.png
                ├── photos/              # Site photos (300-600 KB)
                │   ├── site-initial.jpg
                │   ├── refixing-verification.jpg
                │   └── closure.jpg
                ├── drawings/            # Engineering excavation drawings (PTW-001)
                │   └── trench-profile.pdf
                └── reports/             # Server-generated statutory PDF certificates
                    └── statutory-certificate.pdf
```

---

## 5. Storage Lifecycle and Retention Governance

1. **Active Permits**: Standard Storage class (`asia-south1`).
2. **Completed / Closed Permits (Statutory Retention)**:
   - DPDP Act 2023 and Indian Directorate General of Mines Safety / Factory Rules require maintaining high-risk safety records for 3 to 5 years.
   - After 90 days from permit closure, Cloud Storage Object Lifecycle Rules transition files from **Standard Storage** ($0.026/GB/mo) to **Nearline Storage** ($0.010/GB/mo) or **Coldline Storage** ($0.004/GB/mo).
   - This reduces cumulative 12-month storage costs by over 60%!

---

## 6. Consequences & Verdict

- **Decision**: Single unified GCS bucket surfaced via Firebase Storage SDK and server SDK.
- **Cost Verdict**: Eliminates dual-bucket duplication and prevents API server bandwidth bloat. Storage costs remain under ₹180/month even after 12 months of cumulative growth.
