# QA Acceptance Criteria

## 1. Environment Requirements
- All tests must be conducted against the `arpl-ehs-dev` Firebase project or the Local Emulator Suite.
- Devices: iPad Pro (Safari), Samsung Galaxy Tab (Chrome), iPhone 13 (Safari), Desktop (Chrome 120+).

## 2. Core Operational Criteria

### 2.1 Offline Continuity
- **Given** I am a Site Supervisor,
- **When** I disable WiFi/Cellular on my device and create a PTW-001 permit,
- **Then** the application must successfully render the "Submitted" screen without crashing,
- **And** a local queued notification is shown,
- **When** I re-enable WiFi/Cellular,
- **Then** the permit must automatically appear in the backend database within 5 seconds.

### 2.2 Digital Signatures
- **Given** I am signing a safety declaration,
- **When** I draw my signature using an Apple Pencil or finger,
- **Then** the stroke must be smooth (interpolated),
- **And** I must check the DPDP consent box to proceed,
- **And** the resulting signature must be saved as a Base64 PNG to Cloud Storage.

### 2.3 Role Isolation
- **Given** I am logged in as an Electrician (`electrician`),
- **When** I navigate to the New Permit wizard,
- **Then** I must ONLY see PTW-006 Electrical Work available to select,
- **And** all civil permits (PTW-001, etc.) must be hidden or disabled.

### 2.4 Sling Tension Calculator (PTW-009A)
- **Given** I am filling out a routine lift plan,
- **When** I enter a Total Weight of `4 MT`, a Sling Length of `10 m`, a Sling Height of `8 m`, and `2` legs,
- **Then** the calculated stress per leg must automatically calculate as `2.5 MT` (Formula: `(4 * 10) / (8 * 2)`),
- **And** if the Sling Safe Working Load (SWL) is entered as `2.5 MT` (100% stress), the system must flag a safety violation (stress > 80% requires critical lift promotion).

### 2.5 Dynamic Statutory PDF Generation
- **Given** an EHS Manager finalizes a permit,
- **When** they click "Download Statutory PDF",
- **Then** a multi-page PDF must be generated,
- **And** the PDF must contain the ARPL logo, the specific permit checklist, and a visual matrix of all digital signatures and timestamps collected during the workflow.
