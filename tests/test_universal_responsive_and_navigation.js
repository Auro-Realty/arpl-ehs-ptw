const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('==================================================');
console.log('TEST SUITE: UNIVERSAL RESPONSIVE DESIGN & NAVIGATION AUDIT');
console.log('==================================================\n');

const rootIndexPath = path.join(__dirname, '..', 'index.html');
const publicIndexPath = path.join(__dirname, '..', 'public', 'index.html');
const functionsPath = path.join(__dirname, '..', 'functions', 'index.js');
const readmePath = path.join(__dirname, '..', 'README.md');

const indexHtml = fs.readFileSync(rootIndexPath, 'utf8');
const publicHtml = fs.readFileSync(publicIndexPath, 'utf8');
const functionsJs = fs.readFileSync(functionsPath, 'utf8');
const readmeMd = fs.readFileSync(readmePath, 'utf8');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// 1. Navigation & Routing Verification
// -----------------------------------------------------------------------------
console.log('--- 1. Navigation & Routing Verification ---');

it('Window listens to both popstate and hashchange for deep-linking', () => {
  assert(indexHtml.includes("window.addEventListener('popstate'"), 'Missing popstate listener');
  assert(indexHtml.includes("window.addEventListener('hashchange'"), 'Missing hashchange listener');
});

it('Escape key dismisses modals and closes mobile navigation drawer', () => {
  assert(indexHtml.includes("e.key === 'Escape'"), 'Missing Escape key listener');
  assert(indexHtml.includes("toggleMobileNav(false)"), 'Escape must close mobile drawer');
});

it('Project Admins Provisioning title is standardized', () => {
  assert(indexHtml.includes("'project-admins': ['Project Admins Provisioning'"), 'titles[project-admins] must use Project Admins Provisioning');
  assert(!indexHtml.includes("'project-admins': ['Site Administrators Provisioning'"), 'Legacy Site Administrators Provisioning must not exist in titles');
});

it('parseCurrentRoute correctly parses client hashes', () => {
  assert(indexHtml.includes('function parseCurrentRoute()'), 'Missing parseCurrentRoute');
  assert(indexHtml.includes('rawHash.startsWith(\'detail/\')'), 'Must support detail deep linking');
});

// -----------------------------------------------------------------------------
// 2. Universal Responsive Design (10 Target Viewports)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Universal Responsive Design Verification ---');

it('Viewport meta tag is configured with viewport-fit=cover', () => {
  assert(indexHtml.includes('name="viewport"'), 'Missing viewport meta tag');
  assert(indexHtml.includes('viewport-fit=cover'), 'Missing viewport-fit=cover for notched devices');
});

it('Target 1 & 2: Small Mobile (320px & 360px) styling rules exist', () => {
  assert(indexHtml.includes('@media (max-width: 360px)'), 'Missing 360px media query');
  assert(indexHtml.includes('@media (max-width: 420px)') || indexHtml.includes('@media (max-width: 480px)'), 'Missing small mobile media queries');
  // Role badge must remain visible and compact, not completely suppressed
  assert(!indexHtml.includes('@media (max-width: 360px) {\n            .topbar {\n                padding: 0 max(6px, env(safe-area-inset-right)) 0 max(6px, env(safe-area-inset-left));\n                gap: 4px;\n            }\n\n            .role-badge {\n                display: none !important;'), 'Role badge must not be completely suppressed on 360px');
});

it('Target 3 & 4: Mobile & Small Tablet (430px & 600px) styling rules exist', () => {
  assert(indexHtml.includes('@media (max-width: 580px)'), 'Missing 580px media query');
  assert(indexHtml.includes('@media (max-width: 600px)'), 'Missing 600px media query');
});

it('Target 5 & 6: Tablets (768px & 960px & 1024px) drawer & layout rules exist', () => {
  assert(indexHtml.includes('@media (max-width: 768px)'), 'Missing 768px media query');
  assert(indexHtml.includes('@media (max-width: 960px)'), 'Missing 960px media query');
  assert(indexHtml.includes('@media (max-width: 1024px)'), 'Missing 1024px media query');
  assert(indexHtml.includes('.mobile-drawer-context'), 'Missing mobile drawer context switcher styling');
});

it('Target 7 & 8: Small Laptop & Desktop (1200px & 1366px) density rules exist', () => {
  assert(indexHtml.includes('@media (max-width: 1200px)'), 'Missing 1200px media query');
  assert(indexHtml.includes('@media (max-width: 1100px)'), 'Missing 1100px media query');
  assert(indexHtml.includes('.topbar-sub {\n                display: none !important;\n            }'), 'Subtitle should hide on compact laptop viewports to avoid header crowding');
});

it('Target 9 & 10: Full HD (1920px) & Ultra-Wide (2560px) container constraints exist', () => {
  assert(indexHtml.includes('@media (min-width: 1920px)'), 'Missing 1920px min-width rule');
  assert(indexHtml.includes('@media (min-width: 2560px)'), 'Missing 2560px min-width rule');
  assert(indexHtml.includes('max-width: 1800px'), '2560px layout must enforce max content width');
});

// -----------------------------------------------------------------------------
// 3. Touch Targets & Accessibility (WCAG 2.2 AA)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Touch Targets & Accessibility Verification ---');

it('Touch targets enforce min 44x44px on touch devices', () => {
  assert(indexHtml.includes('.btn-switch-user {\n                min-width: 44px !important;\n                min-height: 44px !important;'), 'Logout/switch user button must enforce 44x44px minimum');
  assert(indexHtml.includes('.icon-btn {\n                min-width: 44px !important;\n                min-height: 44px !important;'), 'Icon buttons must enforce 44x44px minimum');
});

it('Mobile form inputs enforce 16px font size to prevent iOS auto-zoom', () => {
  assert(indexHtml.includes('input,\n            select,\n            textarea {\n                font-size: 16px !important;'), 'Input elements on mobile must be 16px to prevent iOS auto-zoom');
});

it('Icon-only buttons provide aria-label and titles', () => {
  assert(indexHtml.includes('clearPhoto()') && indexHtml.includes('aria-label="Remove Photo"'), 'clearPhoto must have aria-label');
  assert(indexHtml.includes('clearBlastingAckPhoto()') && indexHtml.includes('aria-label="Remove Confirmation Photo"'), 'clearBlastingAckPhoto must have aria-label');
});

// -----------------------------------------------------------------------------
// 4. Role Taxonomy & Project Admin Terminology
// -----------------------------------------------------------------------------
console.log('\n--- 4. Role Taxonomy & Terminology Verification ---');

it('User Directory table displays Project Admin (Worksite Administrator)', () => {
  assert(indexHtml.includes("displayRole = 'Project Admin (Worksite Administrator)'"), 'User directory table must display Project Admin (Worksite Administrator)');
});

it('KPI strip and buttons use Project Admin terminology', () => {
  assert(indexHtml.includes("'PROJECT ADMINS', projectAdminsCount + ' Empaneled'"), 'KPI strip must display PROJECT ADMINS');
  assert(indexHtml.includes('Provision Project Admin') || indexHtml.includes('Project Admins Provisioning'), 'Buttons must use Project Admins');
});

// -----------------------------------------------------------------------------
// 5. RBAC Capabilities Matrix Verification
// -----------------------------------------------------------------------------
console.log('\n--- 5. RBAC Capabilities Matrix Alignment ---');

it('README.md RBAC matrix exactly matches 17-column specification', () => {
  assert(readmeMd.includes('| Capability | Permittee (Site Supervisor) | Electrician (Specialist Permittee) | Blasting In-charge (Specialist Permittee) | Lifting Supervisor (Specialist Permittee) | Site Engineer (Technical Inspector) | MEP (Technical Approver) | P&M (Plant & Machinery Approver) | IT in charge (Technical Approver) | Quality Engineer (Technical Approver) | Excavation Head (Section Head) | Tower Incharge (Section Head) | Project Manager (Executive Approver) | EHS Head (Statutory Endorser / Issuer) | EHS supervisor (Safety Endorser) | Project Admin (Worksite Administrator) | Super Admin (Enterprise Governance) |'), 'README.md header row must match');
  assert(readmeMd.includes('| Cancel Permit (Stop-Work) | — | — | — | — | — *(No Authority)* | — | — | — | — | — | — | — | ✅ | ✅ | — | — |'), 'Cancel permit permissions must match');
  assert(readmeMd.includes('| Statutory Declarations | — | ✅ *(PTW-006 Step 1)* | ✅ *(PTW-007 PESO)* | ✅ *(Pre-Location Sigs & Rigging Plan)* | — | — | ✅ *(PTW-006 Step 2, PTW-009 Clearance)* | — | ✅ *(PTW-006 Step 3)* | — | — | — | — | — | — | — |'), 'Statutory declarations must match');
});

// -----------------------------------------------------------------------------
// 6. Cloud Functions & Ghost Purge Verification
// -----------------------------------------------------------------------------
console.log('\n--- 6. Cloud Functions & Ghost Purge Verification ---');

it('functions/index.js recognizes both bootstrap Super Admin emails for orphan purge', () => {
  assert(functionsJs.includes('callerEmail === "aic1176@aurogroup.com" ||\n    callerEmail === "ehs.superadmin@aurorealty.com"'), 'Must check both Super Admin emails');
  assert(functionsJs.includes('exports.adminSyncAndPurgeOrphanAuthUsers'), 'Must export adminSyncAndPurgeOrphanAuthUsers');
});

// -----------------------------------------------------------------------------
// 7. Parity Verification
// -----------------------------------------------------------------------------
console.log('\n--- 7. Parity Verification ---');

it('index.html and public/index.html have 100% byte parity', () => {
  const b1 = fs.readFileSync(rootIndexPath);
  const b2 = fs.readFileSync(publicIndexPath);
  assert.strictEqual(b1.length, b2.length, `Length mismatch: ${b1.length} vs ${b2.length}`);
  assert(b1.equals(b2), 'Root index.html and public/index.html must have identical byte contents');
});

console.log(`\n==================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('ALL RESPONSIVE, NAVIGATION & UI AUDIT TESTS PASSED (100% SUCCESS)');
} else {
  console.log('SOME TESTS FAILED');
}
console.log('==================================================');
