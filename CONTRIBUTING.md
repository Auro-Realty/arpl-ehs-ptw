# Contributing to ARPL EHS Permit-to-Work System

Thank you for your interest in contributing to the **ARPL EHS Permit-to-Work (PTW) Management System**! This repository powers digital safety governance for hazardous construction operations.

---

## 1. Core Architectural Principles

When contributing, ensure adherence to the system's foundational architectural rules:

1. **Zero-Build & Zero-Dependency Execution**:
   - The application runs directly in any modern browser without transpilation, bundlers, or compilation steps.
   - External dependencies are strictly constrained (Font Awesome for icons, jsPDF for official client-side statutory PDF generation).
2. **Single Source of Truth (`APP_CONFIG`)**:
   - Never hardcode workflows, permit types, SLA timers, roles, or project structural hierarchies in presentation components.
   - All options, schemas, and dynamic settings must be declared and configured in `APP_CONFIG` or accessor functions (`getProject*()`).
3. **Finite-State Machine (FSM) Integrity**:
   - State transitions must be strictly enforced via `chainStage()`, `roleCanActOnChain()`, and statutory gating checks.
4. **Statutory RBAC & Legal Compliance**:
   - DPDP Act 2023 compliance requires explicit consent (`consent: true`) and dynamic identity binding on all digital signatures.
   - Official Permit PDF generation is restricted **exclusively to EHS Safety Manager and Officer** roles.

---

## 2. Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher.
- A modern web browser (Chrome, Edge, Firefox, Safari).

### Launching the Application
Run the built-in HTTP server:
```bash
npm start
# OR
node server.js
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 3. Automated Test Verification

This repository enforces a **zero-regression policy**. All 25 master test suites and the extended audit suite must pass with a 100% success rate prior to committing or proposing changes.

### Running Test Suites
```bash
# Run all 25 master test suites sequentially
npm test

# Run extended audit suite (RBAC, notifications, SLA escalations, filters)
npm run test:audit

# Run full CI suite
npm run test:ci
```

---

## 4. Pull Request Guidelines

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # OR
   git checkout -b fix/your-bug-fix
   ```
2. **Follow Code Conventions**:
   - Keep formatting clean, readable, and properly indented.
   - Preserve existing function and variable naming conventions.
   - Sanitize all user inputs through `escapeHtml()` to mitigate XSS vulnerabilities.
3. **Verify Tests**:
   - Run `npm run test:ci` and ensure all tests pass.
4. **Write Meaningful Commit Messages**:
   - Use conventional commit formats: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`.
5. **Open Pull Request**:
   - Describe the changes clearly and link any related issues.
