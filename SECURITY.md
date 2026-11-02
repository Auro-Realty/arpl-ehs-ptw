# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.0.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

The **ARPL EHS Permit-to-Work** system manages high-risk construction safety authorizations. We take security and data privacy vulnerabilities with utmost priority.

If you discover a security vulnerability:

1. **Do not disclose it publicly** through public GitHub issues or discussions.
2. Email full vulnerability details, reproduction steps, and potential impact to the safety engineering team.
3. You will receive an acknowledgment within 24 hours.

## Security Controls & Invariants

All pull requests and modifications must uphold the following statutory boundaries:
- **RBAC Boundaries**: Non-EHS roles must never be permitted to execute statutory PDF generation.
- **XSS Sanitization**: All user-supplied strings rendered into HTML must be escaped using `escapeHtml()`.
- **Statutory Signatures**: Signature operations must strictly require DPDP Act 2023 consent flags and capture dynamic legal names.
- **Geofencing Verification**: Off-site signatures must be logged and evaluated against the project site coordinates.
- **Finite-State Machine (FSM)**: Permitted operations must be evaluated against the strict state machine; unauthorized transitions must be deterministically rejected.
