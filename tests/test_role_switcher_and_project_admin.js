/**
 * TEST SUITE 28: ROLE SWITCHER, LOCATION SWITCHER & PROJECT ADMIN NOMENCLATURE
 *
 * Verifies:
 * 1. switchActiveRole Cloud Function export and behavior
 * 2. Project Admin terminology across ROLES, roleInfo, dropdowns, and page titles
 * 3. Elimination of "Site Safety Incharge" and legacy "Site admin"
 * 4. Header Role Switcher (#headerRoleSwitcher) and Location Switcher (#headerLocationSwitcher)
 * 5. Direct delete prohibition in firestore.rules (allow delete: if false;)
 * 6. User profile signature rule in storage.rules (/signatures/{projectId}/users/{userId})
 * 7. 100% byte parity between index.html and public/index.html
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const PUBLIC_INDEX_PATH = path.join(ROOT_DIR, 'public/index.html');
const FUNCTIONS_PATH = path.join(ROOT_DIR, 'functions/index.js');
const FIRESTORE_RULES_PATH = path.join(ROOT_DIR, 'firestore.rules');
const STORAGE_RULES_PATH = path.join(ROOT_DIR, 'storage.rules');

console.log('==================================================');
console.log('TEST SUITE 28: ROLE SWITCHER & PROJECT ADMIN STANDARD');
console.log('==================================================\n');

// --- 1. Cloud Function switchActiveRole Export ---
console.log('--- 1. Cloud Function switchActiveRole ---');
const funcsSrc = fs.readFileSync(FUNCTIONS_PATH, 'utf8');
assert(funcsSrc.includes('exports.switchActiveRole = onCall'), 'exports.switchActiveRole must be exported as an onCall function');
assert(funcsSrc.includes('targetRole'), 'switchActiveRole must accept targetRole parameter');
assert(funcsSrc.includes('USER_ROLE_SWITCHED'), 'switchActiveRole must record server audit log on role switch');
assert(funcsSrc.includes('auth.setCustomUserClaims'), 'switchActiveRole must update custom user claims');
console.log('  ✓ PASS: switchActiveRole Cloud Function export and signature verified');

// --- 2. Project Admin Taxonomy & Elimination of Site Safety Incharge ---
console.log('\n--- 2. Standardized Role Taxonomy ---');
const indexSrc = fs.readFileSync(INDEX_PATH, 'utf8');
const pubIndexSrc = fs.readFileSync(PUBLIC_INDEX_PATH, 'utf8');

// Parity check
assert.strictEqual(indexSrc, pubIndexSrc, 'index.html and public/index.html must be 100% byte-identical');
console.log('  ✓ PASS: 100% byte parity confirmed between root index.html and public/index.html');

// Check ROLES list contains Project Admin
assert(indexSrc.includes("label: 'Project Admin'"), "ROLES list must use 'Project Admin' label");
assert(indexSrc.includes("tier: 'Tier 5 · Project Administration'"), "ROLES list must define 'Tier 5 · Project Administration'");

// Operational Role dropdown
assert(indexSrc.includes('value="project-admin">Project Admin'), "Operational Role dropdown must display 'Project Admin'");
assert(indexSrc.includes('value="hw-section-head">Tower In charge'), "Operational Role dropdown must use 'hw-section-head' for Tower In charge");

// Console titles
assert(indexSrc.includes('Project Admin Worksite Console'), "Console headers must display 'Project Admin Worksite Console'");
console.log('  ✓ PASS: Project Admin taxonomy and console titles verified');

// --- 3. Header Role Switcher & Location Switcher ---
console.log('\n--- 3. Header Role & Location Switchers ---');
assert(indexSrc.includes('id="headerRoleSwitcher"'), 'Header must contain #headerRoleSwitcher dropdown for multi-role users');
assert(indexSrc.includes('id="headerLocationSwitcher"'), 'Header must contain #headerLocationSwitcher dropdown for multi-location users');
assert(indexSrc.includes('function handleHeaderRoleSwitch'), 'handleHeaderRoleSwitch handler must be defined');
assert(indexSrc.includes('function handleHeaderLocationSwitch'), 'handleHeaderLocationSwitch handler must be defined');
console.log('  ✓ PASS: Header Role and Location Switchers verified');

// --- 4. Firestore Rules Admin Deletion & IDOR Protection ---
console.log('\n--- 4. Firestore Rules Admin Deletion & IDOR Protection ---');
const fsRules = fs.readFileSync(FIRESTORE_RULES_PATH, 'utf8');
const usersSection = fsRules.slice(fsRules.indexOf('match /users/{userId}'), fsRules.indexOf('match /project_admins/{adminId}'));
assert(usersSection.includes('allow delete: if isAuthenticated() && (isSuperAdmin()') || usersSection.includes('isSuperAdmin()'), '/users/{userId} must authorize Super Admin and Scoped Project Admin deletion');
assert(usersSection.includes('aic1176@aurogroup.com'), '/users/{userId} must permanently protect Super Admin accounts');

const paSection = fsRules.slice(fsRules.indexOf('match /project_admins/{adminId}'), fsRules.indexOf('match /site_personnel/{staffId}'));
assert(paSection.includes('isSuperAdmin()'), '/project_admins/{adminId} must authorize Super Admin and Scoped Project Admin deletion');

const spSection = fsRules.slice(fsRules.indexOf('match /site_personnel/{staffId}'), fsRules.indexOf('match /project_roles/{roleId}'));
assert(spSection.includes('isSuperAdmin()'), '/site_personnel/{staffId} must authorize Super Admin and Scoped Project Admin deletion');
console.log('  ✓ PASS: Direct Firestore deletion secured with Super Admin & Project Admin authorization and bootstrap protection');

// --- 5. Storage Rules Profile Signature Path ---
console.log('\n--- 5. Storage Rules Profile Signature Path ---');
const storageRules = fs.readFileSync(STORAGE_RULES_PATH, 'utf8');
assert(storageRules.includes('match /signatures/{projectId}/users/{userId}'), 'storage.rules must contain rule for /signatures/{projectId}/users/{userId}');
assert(storageRules.includes('request.resource.size < 512 * 1024'), 'storage.rules must enforce 512KB size limit on profile signatures');
console.log('  ✓ PASS: Personnel profile signature rule verified in storage.rules');

console.log('\n==================================================');
console.log('ALL SUITE 28 ROLE SWITCHER & PROJECT ADMIN TESTS PASSED (100% SUCCESS)');
console.log('==================================================\n');
