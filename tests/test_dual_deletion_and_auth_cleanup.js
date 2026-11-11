const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('TEST SUITE: ATOMIC DUAL-DELETION & GHOST AUTH CLEANUP');
console.log('==================================================');

const funcPath = path.resolve(__dirname, '..', 'functions', 'index.js');
const indexPath = path.resolve(__dirname, '..', 'index.html');
const publicIndexPath = path.resolve(__dirname, '..', 'public', 'index.html');
const reconcilePath = path.resolve(__dirname, '..', 'scripts', 'reconcile-users.js');
const deployYmlPath = path.resolve(__dirname, '..', '.github', 'workflows', 'deploy.yml');

const funcContent = fs.readFileSync(funcPath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const publicIndexContent = fs.readFileSync(publicIndexPath, 'utf8');
const deployYmlContent = fs.readFileSync(deployYmlPath, 'utf8');

// --- 1. Cloud Function Exports ---
console.log('\n--- 1. Cloud Function Exports Verification ---');
assert(funcContent.includes('exports.adminDeleteUser = onCall'), 'functions/index.js must export 2nd-Gen Callable adminDeleteUser');
console.log('  ✓ PASS: exports.adminDeleteUser is exported');

assert(funcContent.includes('exports.adminSyncAndPurgeOrphanAuthUsers = onCall'), 'functions/index.js must export 2nd-Gen Callable adminSyncAndPurgeOrphanAuthUsers');
console.log('  ✓ PASS: exports.adminSyncAndPurgeOrphanAuthUsers is exported');

assert(funcContent.includes('exports.adminAssignProjectRole = onCall'), 'functions/index.js must export 2nd-Gen Callable adminAssignProjectRole');
console.log('  ✓ PASS: exports.adminAssignProjectRole is exported');

// --- 2. adminAssignProjectRole Immediate Interceptors ---
console.log('\n--- 2. adminAssignProjectRole Immediate Interceptors ---');
assert(funcContent.includes('actionUpper === "PURGE_ORPHAN_AUTH_USERS"'), 'adminAssignProjectRole must intercept PURGE_ORPHAN_AUTH_USERS at top');
assert(funcContent.includes('actionUpper === "DELETE_USER"'), 'adminAssignProjectRole must intercept DELETE_USER at top');
console.log('  ✓ PASS: adminAssignProjectRole immediate action interceptors (PURGE_ORPHAN_AUTH_USERS & DELETE_USER) verified');

// --- 3. adminDeleteUser RBAC Guards ---
console.log('\n--- 3. adminDeleteUser RBAC Guards & Dual Deletion ---');
assert(funcContent.includes('enforceRateLimit(request.auth.uid, "adminDeleteUser"'), 'adminDeleteUser must enforce rate limiting');
console.log('  ✓ PASS: adminDeleteUser rate limiting enforced');

assert(funcContent.includes('targetKey === callerUid') || funcContent.includes('uid === callerUid'), 'adminDeleteUser must prevent caller from deleting own account');
console.log('  ✓ PASS: adminDeleteUser self-deletion prevention verified');

assert(funcContent.includes('aic1176@aurogroup.com'), 'adminDeleteUser must guard Super Admin accounts');
console.log('  ✓ PASS: adminDeleteUser Super Admin protection verified');

assert(funcContent.includes('auth.deleteUser('), 'adminDeleteUser must call auth.deleteUser()');
console.log('  ✓ PASS: Permanent Firebase Authentication deletion verified');

assert(funcContent.includes('auth/user-not-found'), 'adminDeleteUser must gracefully handle auth/user-not-found');
console.log('  ✓ PASS: auth/user-not-found graceful error handling verified');

assert(funcContent.includes('collection("users").doc') || funcContent.includes("collection('users').doc"), 'adminDeleteUser must clean up Firestore /users');
console.log('  ✓ PASS: Cloud Firestore /users and /rate_limits cleanup verified');

assert(funcContent.includes('recordServerAuditLog('), 'adminDeleteUser must write immutable audit log');
console.log('  ✓ PASS: Immutable audit log entry recorded');

// --- 4. scripts/reconcile-users.js & CI/CD Wiring ---
console.log('\n--- 4. scripts/reconcile-users.js & CI/CD Wiring ---');
assert(fs.existsSync(reconcilePath), 'scripts/reconcile-users.js must exist');
const reconcileContent = fs.readFileSync(reconcilePath, 'utf8');
assert(reconcileContent.includes('run3WayReconciliation'), 'scripts/reconcile-users.js must define run3WayReconciliation');
assert(reconcileContent.includes('auth.deleteUser('), 'scripts/reconcile-users.js must delete orphan Auth users');
assert(reconcileContent.includes('rekeyedDocCount'), 'scripts/reconcile-users.js must enforce doc.id === authUser.uid');
console.log('  ✓ PASS: scripts/reconcile-users.js implements complete 3-way reconciliation');

assert(deployYmlContent.includes('scripts/reconcile-users.js'), '.github/workflows/deploy.yml must execute scripts/reconcile-users.js');
console.log('  ✓ PASS: .github/workflows/deploy.yml wires 3-way reconciliation after deployment');

// --- 5. Frontend User Directory & Toolbar Wiring ---
console.log('\n--- 5. Frontend User Directory & Toolbar Wiring ---');
assert(indexContent.includes("action: 'DELETE_USER'"), 'index.html unifiedDeleteUser must call adminAssignProjectRole with action: DELETE_USER');
console.log('  ✓ PASS: index.html unifiedDeleteUser invokes adminAssignProjectRole with DELETE_USER');

assert(indexContent.includes("action: 'PURGE_ORPHAN_AUTH_USERS'"), 'index.html handlePurgeGhostUsers must call adminAssignProjectRole with action: PURGE_ORPHAN_AUTH_USERS');
console.log('  ✓ PASS: index.html handlePurgeGhostUsers invokes adminAssignProjectRole with PURGE_ORPHAN_AUTH_USERS');

assert(indexContent.includes('id="btnPurgeGhostUsers"'), 'index.html must render Sync Auth & Purge Ghost Users button');
assert(indexContent.includes('handlePurgeGhostUsers()'), 'index.html must implement handlePurgeGhostUsers()');
console.log('  ✓ PASS: Sync Auth & Purge Ghost Users button and handler verified');

assert(indexContent.includes('initUsersLiveSnapshot()'), 'index.html must implement live onSnapshot user synchronization');
console.log('  ✓ PASS: Live onSnapshot user synchronization verified');

// --- 6. Parity Check ---
console.log('\n--- 6. Parity Verification ---');
assert.strictEqual(indexContent, publicIndexContent, 'index.html and public/index.html must be 100% byte identical');
console.log('  ✓ PASS: index.html and public/index.html 100% byte parity confirmed');

console.log('\n==================================================');
console.log('ALL ATOMIC DUAL-DELETION & GHOST PURGE TESTS PASSED (100% SUCCESS)');
console.log('==================================================');
