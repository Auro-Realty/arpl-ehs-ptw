# DPDP Act 2023 Compliance Governance

## Overview
The ARPL EHS PTW System captures personally identifiable information (PII) during the digital signature process. This document outlines how the system complies with India's **Digital Personal Data Protection (DPDP) Act, 2023**.

## 1. Consent Architecture (Section 6)
The DPDP Act mandates explicit, clear, and affirmative consent before processing personal data.

**Implementation**: 
Every digital signature modal strictly features a mandatory checkbox stating:
> *"I consent to my signature, location, and timestamp being recorded for safety governance under the DPDP Act 2023."*

The signature cannot be saved to the database unless this boolean flag is `true`.

## 2. Notice Requirements (Section 5)
Data Principals must be informed of what data is collected and why.

**Implementation**: 
The UI displays an initiator banner specifically informing the user:
> *"This system records biometric signatures and GPS telemetry for statutory safety compliance."*

## 3. Data Minimization (Section 4)
Only data necessary for the specified purpose should be collected.

**Implementation**: 
- **Roles, not Names**: User accounts do not store personal names in the core database schema. Authentication relies on email and custom claim roles (e.g., "Tower Incharge"). The actual human name is typed manually *only at the moment of signing*, strictly tying the identity to a specific, auditable safety action rather than creating a sprawling employee database.
- **Location Constraints**: GPS is only polled at the exact second the signature is submitted. The app does not track user location continuously in the background.

## 4. Erasure and Retention (Section 8)
Data must be deleted when the specified purpose is no longer served.

**Implementation**:
Safety records (permits) are subject to statutory retention periods under Indian construction law (often 3-5 years). ARPL acts as the Data Fiduciary. The system's append-only design ensures immutable records for this period. A separate Cloud Function (to be scheduled annually) must be implemented by ARPL to purge permit data older than the statutory retention threshold to comply with the DPDP right to erasure.
