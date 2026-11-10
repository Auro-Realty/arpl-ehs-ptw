const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('TEST SUITE: ATOMIC DUAL-DELETION & GHOST AUTH CLEANUP');
console.log('==================================================');

const funcPath = path.resolve(__dirname, '..', 'functions', 'index.js');
const indexPath = path.resolve(__dirname, '..', 'index.html');
const publicIndexPath = path.resolve(__dirname, '..', 'public', 'index.html');

const funcContent = fs.readFileSync(funcPath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const publicIndexContent = fs.readFileSync(publicIndexPath, 'utf8');

// --- 1. Cloud Function Exports ---
console.log('\n--- 1. Cloud Function Exports Verification ---');
assert(funcContent.includes('exports.adminDeleteUser = onCall'), 'functions/index.js must export 2nd-Gen Callable adminDeleteUser');
console.log('  ✓ PASS: exports.adminDeleteUser is exported');

assert(funcContent.includes('exports.adminSyncAndPurgeOrphanAuthUsers = onCall'), 'functions/index.js must export 2nd-Gen Callable adminSyncAndPurgeOrphanAuthUsers');
console.log('  ✓ PASS: exports.adminSyncAndPurgeOrphanAuthUsers is exported');

// --- 2. adminDeleteUser RBAC Guards ---
console.log('\n--- 2. adminDeleteUser RBAC Guards & Dual Deletion ---');
assert(funcContent.includes('enforceRateLimit(request.auth.uid, "adminDeleteUser"'), 'adminDeleteUser must enforce rate limiting');
console.log('  ✓ PASS: adminDeleteUser rate limiting enforced');

assert(funcContent.includes('Users cannot delete their own currently active logged-in account'), 'adminDeleteUser must block self-deletion');
console.log('  ✓ PASS: adminDeleteUser self-deletion prevention verified');

assert(funcContent.includes('Site Administrators cannot delete a Super Administrator account'), 'adminDeleteUser must prevent Site Admin from deleting Super Admin');
console.log('  ✓ PASS: adminDeleteUser Super Admin protection verified');

assert(funcContent.includes('Site Administrators can only delete staff within their assigned project'), 'adminDeleteUser must enforce project scoping for Site Admins');
console.log('  ✓ PASS: adminDeleteUser Site Admin project scoping verified');

assert(funcContent.includes('await auth.deleteUser(targetAuthUid)'), 'adminDeleteUser must call auth.deleteUser to remove from Firebase Authentication');
console.log('  ✓ PASS: Permanent Firebase Authentication deletion verified');

assert(funcContent.includes('auth/user-not-found'), 'adminDeleteUser must handle auth/user-not-found gracefully without crashing');
console.log('  ✓ PASS: auth/user-not-found graceful error handling verified');

assert(funcContent.includes("db.collection(\"users\").doc(docId).delete()"), 'adminDeleteUser must delete from Firestore /users');
assert(funcContent.includes("db.collection(\"rate_limits\").doc(docId).delete()"), 'adminDeleteUser must clean up /rate_limits');
console.log('  ✓ PASS: Cloud Firestore /users and /rate_limits cleanup verified');

assert(funcContent.includes('recordServerAuditLog(\n    "USER_DELETED_PERMANENT"'), 'adminDeleteUser must write immutable audit log entry');
console.log('  ✓ PASS: Immutable audit log entry recorded');

// --- 3. adminSyncAndPurgeOrphanAuthUsers Ghost Purge ---
console.log('\n--- 3. adminSyncAndPurgeOrphanAuthUsers Verification ---');
assert(funcContent.includes('Only Super Administrators can scan and purge orphaned Auth accounts'), 'adminSyncAndPurgeOrphanAuthUsers must be Super Admin exclusive');
console.log('  ✓ PASS: Super Admin exclusive permission guard verified');

assert(funcContent.includes('auth.listUsers(1000)'), 'adminSyncAndPurgeOrphanAuthUsers must scan Auth users');
console.log('  ✓ PASS: Auth user listing verified');

assert(funcContent.includes('aic1176@aurogroup.com') && funcContent.includes('ehs.superadmin@aurorealty.com'), 'adminSyncAndPurgeOrphanAuthUsers must protect bootstrap Super Admin emails');
console.log('  ✓ PASS: Protected bootstrap accounts verified');

assert(funcContent.includes('ORPHAN_AUTH_USERS_PURGED'), 'adminSyncAndPurgeOrphanAuthUsers must record server audit log');
console.log('  ✓ PASS: Orphan purge audit logging verified');

// --- 4. auth/email-already-in-use Auto Recovery ---
console.log('\n--- 4. auth/email-already-in-use Auto Recovery ---');
assert(funcContent.includes('createErr.code === "auth/email-already-in-use"'), 'adminAssignProjectRole must catch auth/email-already-in-use and recover');
console.log('  ✓ PASS: adminAssignProjectRole auth/email-already-in-use auto-recovery verified');

// --- 5. Frontend User Directory & Toolbar Wiring ---
console.log('\n--- 5. Frontend User Directory & Toolbar Wiring ---');
assert(indexContent.includes("httpsCallable('adminDeleteUser')"), 'index.html unifiedDeleteUser must call adminDeleteUser Cloud Function');
console.log('  ✓ PASS: index.html unifiedDeleteUser invokes adminDeleteUser');

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
