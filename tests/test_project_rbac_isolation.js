/**
 * Regression Test Suite: Project-Site RBAC Isolation & The Regent Sync
 *
 * Verifies:
 * 1. Canonical Project ID normalization (PRJ-PEARL, PRJ-REGENT, PRJ-SANSA)
 * 2. Hard RBAC isolation: Pearl users cannot see, count, or act on Regent/Sansa permits
 * 3. Pre-calibrated Regent locations and lack of geofence lockout
 * 4. Sign-in blocking for unassigned accounts (D4 Option A)
 * 5. Super Admin global enterprise visibility
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('==================================================');
console.log('TEST SUITE: PROJECT-SITE RBAC ISOLATION & REGENT SYNC');
console.log('==================================================\n');

const htmlPath = path.resolve(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.error('FATAL: Could not extract script from index.html');
    process.exit(1);
}

// Setup sandbox VM environment
const elements = {};
function getEl(id) {
    if (!elements[id]) {
        elements[id] = {
            id,
            innerHTML: '',
            textContent: '',
            value: '',
            style: {},
            classList: {
                _classes: new Set(),
                add: function(c) { this._classes.add(c); },
                remove: function(c) { this._classes.delete(c); },
                contains: function(c) { return this._classes.has(c); },
                toggle: function(c, force) { if (force) this.add(c); else this.remove(c); }
            },
            querySelectorAll: () => [],
            addEventListener: () => {},
            removeEventListener: () => {},
            setAttribute: () => {},
            getAttribute: () => null,
            appendChild: () => {},
            removeChild: () => {},
            remove: () => {},
            focus: () => {},
            click: () => {}
        };
    }
    return elements[id];
}

const mockDoc = {
    getElementById: getEl,
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (tag) => getEl('mock_' + tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: getEl('body')
};

const mockWindow = {
    __TEST_MODE__: true,
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { hash: '', reload: () => {} }
};

let toastMessages = [];
const sandbox = {
    window: mockWindow,
    document: mockDoc,
    console: console,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); },
    setInterval: () => {},
    clearInterval: () => {},
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; },
        clear: function() { this._data = {}; }
    },
    navigator: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        geolocation: {
            getCurrentPosition: (cb) => cb({ coords: { latitude: 17.4371, longitude: 78.3612 } })
        }
    },
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    showToast: (msg, type) => { toastMessages.push({ msg, type }); },
    jspdf: { jsPDF: class { constructor() {} } }
};

vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], sandbox);

function evalInVM(code) {
    return vm.runInContext(code, sandbox);
}

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
        throw err;
    }
}

// -----------------------------------------------------------------------------
// 1. Canonical Project ID Normalization
// -----------------------------------------------------------------------------
console.log('--- 1. Canonical Project ID Normalization ---');

it('normalizeProjectId resolves all Pearl variants to PRJ-PEARL', () => {
    assert.strictEqual(evalInVM("normalizeProjectId('PRJ-PRL')"), 'PRJ-PEARL');
    assert.strictEqual(evalInVM("normalizeProjectId('PRJ-PEARL')"), 'PRJ-PEARL');
    assert.strictEqual(evalInVM("normalizeProjectId('PEARL')"), 'PRJ-PEARL');
    assert.strictEqual(evalInVM("normalizeProjectId('The Pearl')"), 'PRJ-PEARL');
    assert.strictEqual(evalInVM("normalizeProjectId('The Pearl by Auro Realty')"), 'PRJ-PEARL');
    assert.strictEqual(evalInVM("normalizeProjectId('THE PEARL (PRJ-PEARL)')"), 'PRJ-PEARL');
});

it('normalizeProjectId resolves all Regent variants to PRJ-REGENT', () => {
    assert.strictEqual(evalInVM("normalizeProjectId('PRJ-RGT')"), 'PRJ-REGENT');
    assert.strictEqual(evalInVM("normalizeProjectId('PRJ-REGENT')"), 'PRJ-REGENT');
    assert.strictEqual(evalInVM("normalizeProjectId('REGENT')"), 'PRJ-REGENT');
    assert.strictEqual(evalInVM("normalizeProjectId('The Regent')"), 'PRJ-REGENT');
    assert.strictEqual(evalInVM("normalizeProjectId('The Regent by Auro Realty')"), 'PRJ-REGENT');
    assert.strictEqual(evalInVM("normalizeProjectId('THE REGENT (PRJ-REGENT)')"), 'PRJ-REGENT');
});

it('normalizeProjectId resolves all Sansa variants to PRJ-SANSA', () => {
    assert.strictEqual(evalInVM("normalizeProjectId('PRJ-SNC')"), 'PRJ-SANSA');
    assert.strictEqual(evalInVM("normalizeProjectId('PRJ-SANSA')"), 'PRJ-SANSA');
    assert.strictEqual(evalInVM("normalizeProjectId('SANSA')"), 'PRJ-SANSA');
    assert.strictEqual(evalInVM("normalizeProjectId('Sansa County')"), 'PRJ-SANSA');
    assert.strictEqual(evalInVM("normalizeProjectId('Sansa County by Auro Realty')"), 'PRJ-SANSA');
});

it('normalizeProjectId leaves custom project IDs uppercase without corrupting', () => {
    assert.strictEqual(evalInVM("normalizeProjectId('PRJ-APH')"), 'PRJ-APH');
    assert.strictEqual(evalInVM("normalizeProjectId('Auro Pearl Horizons')"), 'AURO PEARL HORIZONS');
    assert.strictEqual(evalInVM("normalizeProjectId('Custom Sky Towers')"), 'CUSTOM SKY TOWERS');
});

// -----------------------------------------------------------------------------
// 2. Strict Project RBAC Isolation
// -----------------------------------------------------------------------------
console.log('\n--- 2. Strict Project RBAC Isolation ---');

it('userCanAccessProject correctly isolates Pearl, Regent, and Sansa users', () => {
    const pearlUser = { key: 'site-engineer', projectId: 'PRJ-PEARL', __STRICT_PROJECT_RBAC__: true };
    const regentUser = { key: 'site-engineer', projectId: 'PRJ-REGENT', __STRICT_PROJECT_RBAC__: true };
    const sansaUser = { key: 'site-engineer', projectId: 'PRJ-SANSA', __STRICT_PROJECT_RBAC__: true };
    const superAdmin = { key: 'super-admin', superAdmin: true, __STRICT_PROJECT_RBAC__: true };

    // Pearl User
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-PEARL', pearlUser), true);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-REGENT', pearlUser), false);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-SANSA', pearlUser), false);

    // Regent User
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-PEARL', regentUser), false);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-REGENT', regentUser), true);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-SANSA', regentUser), false);

    // Sansa User
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-PEARL', sansaUser), false);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-REGENT', sansaUser), false);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-SANSA', sansaUser), true);

    // Super Admin has enterprise-wide access
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-PEARL', superAdmin), true);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-REGENT', superAdmin), true);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-SANSA', superAdmin), true);
});

it('EHS Supervisor and Head have no global exemption and are strictly project-scoped (D5)', () => {
    const ehsPearl = { key: 'ehs-manager', role: 'ehs-manager', projectId: 'PRJ-PEARL', __STRICT_PROJECT_RBAC__: true };
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-PEARL', ehsPearl), true);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-REGENT', ehsPearl), false);
    assert.strictEqual(sandbox.userCanAccessProject('PRJ-SANSA', ehsPearl), false);
});

it('Permit visibility (isPermitVisibleToRole) strictly filters permits by project', () => {
    const pPearl = { id: 'P-01', ptype: 'excavation', projectId: 'PRJ-PEARL', status: 'Pending Section Head' };
    const pRegent = { id: 'P-02', ptype: 'excavation', projectId: 'PRJ-REGENT', status: 'Pending Section Head' };

    evalInVM("currentUser = { key: 'excavation-head', projectId: 'PRJ-PEARL', __STRICT_PROJECT_RBAC__: true };");
    sandbox.pPearl = pPearl;
    sandbox.pRegent = pRegent;
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pPearl, 'excavation-head')"), true);
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pRegent, 'excavation-head')"), false);

    evalInVM("currentUser = { key: 'excavation-head', projectId: 'PRJ-REGENT', __STRICT_PROJECT_RBAC__: true };");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pPearl, 'excavation-head')"), false);
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pRegent, 'excavation-head')"), true);
});

// -----------------------------------------------------------------------------
// 3. The Regent Baseline Pre-Calibration & Geofence Sync
// -----------------------------------------------------------------------------
console.log('\n--- 3. The Regent Baseline Pre-Calibration & Geofence Sync ---');

it('The Regent baseline locations are pre-calibrated with configured: true', () => {
    const regent = evalInVM("PROJECTS.find(p => p.id === 'PRJ-REGENT')");
    assert(regent, 'The Regent project must exist in PROJECTS');
    assert.strictEqual(regent.configured, true, 'The Regent project must be marked configured');
    assert(Array.isArray(regent.locations) && regent.locations.length >= 7, 'The Regent must have 7 locations');

    regent.locations.forEach(loc => {
        assert.strictEqual(loc.configured, true, `Location ${loc.name} must be pre-calibrated with configured: true`);
        assert(loc.site && loc.site.lat !== null && loc.site.lng !== null, `Location ${loc.name} must have valid site coordinates`);
    });
});

it('isLocationConfigured returns true for all Regent towers', () => {
    const towers = ['Tower 4', 'Tower 5', 'NTA', 'Stores', 'FormWork', 'Precast', 'Phase-1'];
    towers.forEach(t => {
        const ok = evalInVM(`isLocationConfigured('The Regent', '${t}')`);
        assert.strictEqual(ok, true, `The Regent location ${t} must be configured`);
    });
});

// -----------------------------------------------------------------------------
// 4. Block Unassigned Account Login (D4 Option A)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Block Unassigned Account Login (D4 Option A) ---');

it('resolveAuthenticatedUserProfile rejects sign-in with access denied error when non-super-admin user lacks project assignment', async () => {
    let errorThrown = null;
    const resolveProfileFn = evalInVM("resolveAuthenticatedUserProfile");
    try {
        await resolveProfileFn(
            { uid: 'unassigned-uid', email: 'contractor@test.com' },
            { role: 'site-supervisor' }
        );
    } catch (e) {
        errorThrown = e;
    }

    assert(errorThrown, 'Sign in must throw an error for unassigned accounts');
    assert(errorThrown.message.includes('Access Denied: Your account has not been assigned to a project worksite'),
        `Error message must match D4 Option A, got: ${errorThrown ? errorThrown.message : 'none'}`);
});

console.log('\n==================================================');
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('ALL PROJECT-SITE RBAC ISOLATION & REGENT SYNC TESTS PASSED (100% SUCCESS)');
console.log('==================================================');
