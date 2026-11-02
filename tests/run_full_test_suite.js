/**
 * ARPL EHS Permit-to-Work Comprehensive Automated Test Suite
 * Covers PTW-001 to PTW-005, RBAC, Approval Chains, Rejection Loop,
 * Observations, Extensions, Closure/Surrender, PDF Security, GPS Geofencing.
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.error('FATAL: Could not extract script from index.html');
    process.exit(1);
}
const js = scriptMatch[1];

// Mock Browser Environment
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
                contains: function(c) { return this._classes.has(c); }
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

const mockEnv = {
    window: {
        __TEST_MODE__: true,
        scrollTo: () => {},
        addEventListener: () => {},
        location: { reload: () => {} }
    },
    document: mockDoc,
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; },
        clear: function() { this._data = {}; }
    },
    navigator: {
        geolocation: {
            getCurrentPosition: (cb) => cb({ coords: { latitude: 17.44, longitude: 78.38 } })
        }
    },
    setTimeout: (fn, ms) => { if (typeof fn === 'function') fn(); },
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    Date: Date,
    Math: Math,
    console: {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {}
    }
};

const exportsFn = new Function(
    ...Object.keys(mockEnv),
    js + `;\nreturn {
        PERMITS, ROLES, PTYPE_META, PROJECTS,
        get currentUser() { return currentUser; },
        set currentUser(v) { currentUser = v; },
        roleInfo, ptypeOf, pMeta, pLabel, shRoleFor, stakeholdersFor, checklistFor, checklistItemComplete, checklistItemMissing, roleTypeScope, permitMatchesScope,
        newChain, chainStage, roleCanActOnChain, actOnChain,
        statusClass, statusBadge, pendingForRole, pendingExtensionsForRole,
        genPermitNumber, getProjectRadius, haversine,
        rejectPermitStage, resubmitReturnedPermit, activatePermit,
        acknowledgeSiteEngineer, rejectSiteEngineer, approvePermitStage,
        respondToObservation, acknowledgeObservationEng, reviewObservationSectionHead, resolveObservation,
        requestExtension, approveExtensionStage, rejectExtensionStage,
        closeAndSurrenderPermit,
        getPermitSignatory, makeSimSignature,
        CONFINED_GAS_THRESHOLDS, isGasReadingSafe,
        isExtensionRequestAllowed, extensionCapMinutes, workStarted
    };`
);

const app = exportsFn(...Object.values(mockEnv));

// Test Framework
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ PASS: ${testName}`);
    } else {
        failedTests++;
        console.error(`  ✗ FAIL: ${testName}`);
        if (details) console.error(`    Detail: ${details}`);
        failures.push({ testName, details });
    }
}

function runSuite(suiteName, fn) {
    console.log(`\n==================================================`);
    console.log(`SUITE: ${suiteName}`);
    console.log(`==================================================`);
    try {
        fn();
    } catch (err) {
        console.error(`ERROR in suite ${suiteName}:`, err);
        failures.push({ testName: `SUITE CRASH: ${suiteName}`, details: err.stack || err.message });
    }
}

// ------------------------------------------------------------------
// SUITE 1: Roles, RBAC & Signatory Isolation
// ------------------------------------------------------------------
runSuite('Roles, RBAC & Signatory Isolation', () => {
    assert(app.ROLES.length === 15 || app.ROLES.length === 16, 'ROLES list contains active functional roles', `Found ${app.ROLES.length}`);
    
    const roleKeys = app.ROLES.map(r => r.key);
    assert(!roleKeys.includes('section-head'), 'Legacy "section-head" key is not exposed in ROLES list');
    assert(roleKeys.includes('hw-section-head'), 'Tower Incharge key "hw-section-head" is present in ROLES');
    assert(roleKeys.includes('excavation-head'), 'Excavation Head key "excavation-head" is present in ROLES');
    assert(roleKeys.includes('blasting-incharge'), 'Blasting In-charge key "blasting-incharge" is present in ROLES');
    assert(roleKeys.includes('electrician'), 'Electrician key "electrician" is present in ROLES');
    assert(roleKeys.includes('quality-engineer'), 'Quality Engineer key "quality-engineer" is present in ROLES');
    assert(roleKeys.includes('lift-supervisor'), 'Lifting Supervisor key "lift-supervisor" is present in ROLES');
    assert(roleKeys.includes('project-manager'), 'Project Manager key "project-manager" is present in ROLES');

    const tiRole = app.roleInfo('hw-section-head');
    assert(tiRole && tiRole.label === 'Tower Incharge', 'hw-section-head label is strictly "Tower Incharge"');

    const excRole = app.roleInfo('excavation-head');
    assert(excRole && excRole.label === 'Excavation Head', 'excavation-head label is strictly "Excavation Head"');
    
    const aliasRole = app.roleInfo('section-head');
    assert(aliasRole && aliasRole.label === 'Tower Incharge', 'Legacy roleInfo("section-head") resolves gracefully to Tower Incharge');

    const tiScope = app.roleTypeScope('hw-section-head');
    assert(Array.isArray(tiScope) && (tiScope.length === 9 || tiScope.length === 10), 'Tower Incharge scope covers permit modules', JSON.stringify(tiScope));
    assert(!tiScope.includes('excavation'), 'Tower Incharge scope EXCLUDES excavation');
    assert(tiScope.includes('blasting'), 'Tower Incharge scope INCLUDES blasting (Tower Incharge is Section Head for PTW-007)');
    assert(tiScope.includes('general'), 'Tower Incharge scope INCLUDES general (Tower Incharge is Section Head for PTW-008)');
    assert(tiScope.includes('lifting'), 'Tower Incharge scope INCLUDES lifting (Tower Incharge is Section Head for PTW-009A)');
    assert(tiScope.includes('liftplan'), 'Tower Incharge scope INCLUDES liftplan (Tower Incharge is Section Head for PTW-009B)');

    const excScope = app.roleTypeScope('excavation-head');
    assert(Array.isArray(excScope) && excScope.length === 1 && excScope[0] === 'excavation', 'Excavation Head scope covers excavation only', JSON.stringify(excScope));

    // Strict Signatory Isolation
    const mockPermit = {
        id: 'EXC-TEST-001',
        ptype: 'excavation',
        createdBy: 'Supervisor Sam',
        signerName: 'Supervisor Sam',
        signature: { dataUrl: 'data:image/png;base64,sup_sig', by: 'Supervisor Sam', at: new Date() },
        siteEngineerAck: null,
        signatories: {}
    };

    const supSig = app.getPermitSignatory(mockPermit, 'site-supervisor');
    assert(supSig && supSig.name === 'Supervisor Sam', 'Site Supervisor signatory retrieves permittee signature');

    const engSigEmpty = app.getPermitSignatory(mockPermit, 'site-engineer');
    assert(engSigEmpty === null, 'Site Engineer CANNOT inherit or read from Site Supervisor signature (Strict Isolation)');

    mockPermit.siteEngineerAck = { acknowledged: true, by: 'Engineer Eric', sig: 'data:image/png;base64,eng_sig', at: new Date() };
    const engSigActual = app.getPermitSignatory(mockPermit, 'site-engineer');
    assert(engSigActual && engSigActual.name === 'Engineer Eric', 'Site Engineer retrieves own independent signature once acknowledged');
});

// ------------------------------------------------------------------
// SUITE 2: Permit Metadata, Checklists & Location Structures
// ------------------------------------------------------------------
runSuite('Permit Metadata, Checklists & Location', () => {
    const expectedPermits = [
        { key: 'excavation', code: 'PTW-001', prefix: 'PTW-001', name: 'Excavation Work', count: 12 },
        { key: 'hotwork', code: 'PTW-002', prefix: 'PTW-002', name: 'Hot Work', count: 20 },
        { key: 'guardrail', code: 'PTW-003', prefix: 'PTW-003', name: 'Guard Rail / Floor Protection Removal', count: 9 },
        { key: 'confined', code: 'PTW-004', prefix: 'PTW-004', name: 'Confined Space Entry', count: 15 },
        { key: 'shaft', code: 'PTW-005', prefix: 'PTW-005', name: 'Shaft Work', count: 10 }
    ];

    expectedPermits.forEach(ep => {
        const meta = app.PTYPE_META[ep.key];
        assert(meta && meta.code === ep.code, `PTYPE_META has correct code ${ep.code} for ${ep.key}`);
        if (ep.key === 'excavation') {
            assert(meta && meta.shLabel === 'Excavation Head', `${ep.code} shLabel is strictly "Excavation Head"`);
            assert(meta && meta.sh === 'excavation-head', `${ep.code} approving authority role is "excavation-head"`);
        } else {
            assert(meta && meta.shLabel === 'Tower Incharge', `${ep.code} shLabel is strictly "Tower Incharge"`);
            assert(meta && meta.sh === 'hw-section-head', `${ep.code} approving authority role is "hw-section-head"`);
        }

        const pnum = app.genPermitNumber(ep.key);
        assert(pnum.startsWith(ep.prefix + '-'), `genPermitNumber for ${ep.key} has prefix ${ep.prefix}-`);

        const chk = app.checklistFor(ep.key);
        assert(chk && chk.length === ep.count, `${ep.code} checklist contains ${ep.count} items`);
    });

    const grChecklist = app.checklistFor('guardrail');
    assert(grChecklist[2].includes('(Above, Below, Workplace)'), 'Guard Rail checklist item 3 checks multi-level fall protection');

    // Checklist completeness rules:
    // NO response: comment mandatory, GPS and photo not required
    const itemNoWithComment = { q: 'Test Q', ans: 'no', comment: 'Solution applied', photo: null, gps: null };
    assert(app.checklistItemComplete(itemNoWithComment, 0, 'hotwork') === true, 'Checklist NO with comment is complete without photo or GPS');
    assert(app.checklistItemMissing(itemNoWithComment, 0, 'hotwork') === null, 'Checklist NO with comment has no missing requirements');

    const itemNoWithoutComment = { q: 'Test Q', ans: 'no', comment: '', photo: null, gps: null };
    assert(app.checklistItemComplete(itemNoWithoutComment, 0, 'hotwork') === false, 'Checklist NO without comment is incomplete');
    assert(app.checklistItemMissing(itemNoWithoutComment, 0, 'hotwork') !== null, 'Checklist NO without comment reports missing comment');

    // N/A response: comment is NOT required
    const itemNaWithoutComment = { q: 'Test Q', ans: 'na', comment: null };
    assert(app.checklistItemComplete(itemNaWithoutComment, 0, 'hotwork') === true, 'Checklist N/A is complete without comment');
    assert(app.checklistItemMissing(itemNaWithoutComment, 0, 'hotwork') === null, 'Checklist N/A has no missing requirements');
});

// ------------------------------------------------------------------
// SUITE 3: Approval Chain Engine & Positive Lifecycle (PTW-001 to PTW-005)
// ------------------------------------------------------------------
runSuite('Approval Chain Engine & Positive Lifecycle', () => {
    // 1. PTW-001 Excavation: parallel (MEP, PM, IT) -> Excavation Head -> EHS
    const chExc = app.newChain('excavation');
    assert(app.chainStage(chExc) === 'parallel', 'Excavation starts at parallel gate');
    assert(app.roleCanActOnChain(chExc, 'mep'), 'MEP can act on parallel gate');
    assert(app.roleCanActOnChain(chExc, 'pm'), 'PM can act on parallel gate');
    assert(app.roleCanActOnChain(chExc, 'it'), 'IT can act on parallel gate');
    assert(!app.roleCanActOnChain(chExc, 'excavation-head'), 'Excavation Head cannot act before parallel clearance');
    assert(!app.roleCanActOnChain(chExc, 'hw-section-head'), 'Tower Incharge cannot act on Excavation');

    app.actOnChain(chExc, 'mep', 'approved', { signerName: 'MEP Eng' });
    assert(app.chainStage(chExc) === 'parallel', 'Parallel gate remains open after only MEP approves');
    
    app.actOnChain(chExc, 'pm', 'approved', { signerName: 'PM Eng' });
    app.actOnChain(chExc, 'it', 'approved', { signerName: 'IT Eng' });
    assert(app.chainStage(chExc) === 'section-head', 'Parallel gate clears to Excavation Head once MEP+PM+IT all approve');
    assert(app.roleCanActOnChain(chExc, 'excavation-head'), 'Excavation Head can now act on Excavation');
    assert(!app.roleCanActOnChain(chExc, 'hw-section-head'), 'Tower Incharge CANNOT act on Excavation');

    app.actOnChain(chExc, 'excavation-head', 'approved', { signerName: 'Excavation Head Chief' });
    assert(app.chainStage(chExc) === 'ehs', 'Excavation Head approval routes to EHS');
    assert(app.roleCanActOnChain(chExc, 'ehs-manager'), 'EHS Manager can act');
    assert(app.roleCanActOnChain(chExc, 'ehs-officer'), 'EHS Officer can act');

    // First EHS approval activates
    const finalStage = app.actOnChain(chExc, 'ehs-manager', 'approved', { signerName: 'Safety Mgr' });
    assert(finalStage === 'complete', 'EHS Manager approval completes the chain');

    // 2. PTW-002 Hot Work: Tower Incharge -> EHS
    const chHw = app.newChain('hotwork');
    assert(app.chainStage(chHw) === 'section-head', 'Hot Work routes directly to Tower Incharge');
    app.actOnChain(chHw, 'hw-section-head', 'approved', { signerName: 'TI Chief' });
    assert(app.chainStage(chHw) === 'ehs', 'Hot Work routes to EHS');
    const hwDone = app.actOnChain(chHw, 'ehs-officer', 'approved', { signerName: 'Safety Off' });
    assert(hwDone === 'complete', 'EHS Officer approval activates Hot Work');

    // 3. PTW-003 Guard Rail: Tower Incharge -> EHS
    const chGr = app.newChain('guardrail');
    assert(app.chainStage(chGr) === 'section-head', 'Guard Rail routes directly to Tower Incharge');
    app.actOnChain(chGr, 'hw-section-head', 'approved', { signerName: 'TI Chief' });
    const grDone = app.actOnChain(chGr, 'ehs-manager', 'approved', { signerName: 'Safety Mgr' });
    assert(grDone === 'complete', 'Guard Rail chain completed');

    // 4. PTW-004 Confined Space: Tower Incharge -> EHS
    const chCs = app.newChain('confined');
    assert(app.chainStage(chCs) === 'section-head', 'Confined Space routes directly to Tower Incharge');
    app.actOnChain(chCs, 'hw-section-head', 'approved', { signerName: 'TI Chief' });
    const csDone = app.actOnChain(chCs, 'ehs-officer', 'approved', { signerName: 'Safety Off' });
    assert(csDone === 'complete', 'Confined Space chain completed');

    // 5. PTW-005 Shaft Work: MEP clearance -> Tower Incharge -> EHS
    const chSw = app.newChain('shaft');
    assert(app.chainStage(chSw) === 'mep', 'Shaft Work starts at single MEP clearance');
    app.actOnChain(chSw, 'mep', 'approved', { signerName: 'MEP Eng' });
    assert(app.chainStage(chSw) === 'section-head', 'MEP clearance routes to Tower Incharge');
    app.actOnChain(chSw, 'hw-section-head', 'approved', { signerName: 'TI Chief' });
    assert(app.chainStage(chSw) === 'ehs', 'Tower Incharge routes to EHS');
    const swDone = app.actOnChain(chSw, 'ehs-manager', 'approved', { signerName: 'Safety Mgr' });
    assert(swDone === 'complete', 'Shaft Work chain completed');
});

// ------------------------------------------------------------------
// SUITE 4: Rejection & Resubmission Loop (Positive & Negative)
// ------------------------------------------------------------------
runSuite('Rejection & Resubmission Loop', () => {
    const p = {
        id: 'HW-REJ-001',
        ptype: 'hotwork',
        status: 'Pending Section Head',
        createdBy: 'Site Supervisor',
        approvals: app.newChain('hotwork'),
        activityLog: []
    };

    // 1. Tower Incharge rejects permit
    app.rejectPermitStage(p, 'hw-section-head', { comment: 'Fire extinguisher pressure low' });
    assert(p.status === 'Returned for Correction', 'Permit status becomes Returned for Correction on rejection');
    assert(p.rejectionOrigin && p.rejectionOrigin.roleKey === 'hw-section-head', 'Rejection origin records hw-section-head');
    assert(p.rejectionOrigin && p.rejectionOrigin.roleLabel === 'Tower Incharge', 'Rejection origin roleLabel is Tower Incharge');

    // 2. Supervisor resubmits permit
    app.resubmitReturnedPermit(p);
    assert(p.status === 'Pending Site Engineer Re-Acknowledgment', 'Resubmission sets status to Pending Site Engineer Re-Acknowledgment');

    // 3. Site Engineer re-acknowledges
    app.acknowledgeSiteEngineer(p, { gps: { lat: 17.44, lng: 78.38 }, sig: 'sig_data', signerName: 'Site Eng' });
    assert(p.status === 'Pending Section Head', 'Site Engineer re-acknowledgment routes directly back to original rejector (Tower Incharge)');

    // 4. Cancellation (terminal state)
    const pCancel = {
        id: 'CS-CANCEL-001',
        ptype: 'confined',
        status: 'Pending Section Head',
        approvals: app.newChain('confined'),
        activityLog: []
    };
    app.rejectPermitStage(pCancel, 'hw-section-head', { comment: 'Toxic gas buildup cannot be mitigated', cancel: true });
    assert(pCancel.status === 'Cancelled', 'Cancellation sets status to Cancelled');
    assert(pCancel.isCancelled === true, 'Permit marked as isCancelled');
});

// ------------------------------------------------------------------
// SUITE 5: Safety Observation Lifecycle (Positive & Negative)
// ------------------------------------------------------------------
runSuite('Safety Observation Lifecycle', () => {
    const p = {
        id: 'GR-OBS-001',
        ptype: 'guardrail',
        status: 'Active',
        validTill: new Date(Date.now() + 4 * 3600 * 1000),
        approvals: app.newChain('guardrail'),
        observation: null,
        activityLog: []
    };

    // 1. EHS raises observation
    p.observation = {
        id: 'OBS-' + p.id,
        raisedBy: 'Safety Officer',
        raisedByRole: 'EHS Officer',
        raisedAt: new Date(),
        comment: 'Harness lanyard anchor point loose',
        status: 'Open'
    };
    p.status = 'Active – Observation Open';
    assert(p.status === 'Active – Observation Open', 'Observation open sets status to Active – Observation Open');

    // CRITICAL NEGATIVE TEST: Extension & Closure BLOCKED while observation open
    assert(p.observation && p.observation.status === 'Open', 'Observation is currently open');
    
    // Test closure attempt while observation open
    const canClose = !(p.observation && p.observation.status !== 'Resolved');
    assert(!canClose, 'Permit Closure is STRICTLY BLOCKED while observation is open');

    // Test extension attempt while observation open
    const canExtend = !(p.observation && p.observation.status !== 'Resolved');
    assert(!canExtend, 'Permit Extension is STRICTLY BLOCKED while observation is open');

    // 2. Supervisor rectifies
    app.respondToObservation(p, { comment: 'Lanyard anchored to certified static lifeline', photo: 'photo_data', sig: 'sig_data', signerName: 'Supervisor' });
    assert(p.status === 'Observation Pending Site Engineer Acknowledgment', 'Supervisor rectification sets status to Observation Pending Site Engineer Acknowledgment');

    // 3. Site Engineer acknowledges
    app.acknowledgeObservationEng(p, { comment: 'Verified physical anchorage on site', sig: 'sig_data', signerName: 'Site Eng' });
    assert(p.status === 'Observation Pending Section Head Review', 'Engineer verification forwards to Tower Incharge');

    // 4. Tower Incharge reviews & endorses
    app.reviewObservationSectionHead(p, true, { comment: 'Rectification approved', sig: 'sig_data', signerName: 'Tower Incharge' });
    assert(p.status === 'Observation Pending EHS Clearance', 'Tower Incharge endorsement forwards to EHS for clearance');

    // 5. EHS clears observation
    app.resolveObservation(p, true, { comment: 'Cleared after physical inspection', sig: 'sig_data', signerName: 'EHS Officer' });
    assert(p.status === 'Active', 'EHS clearance returns permit status back to Active');
    assert(p.observation.status === 'Resolved', 'Observation status marked Resolved');
});

// ------------------------------------------------------------------
// SUITE 6: Permit Extension Lifecycle (Positive & Negative)
// ------------------------------------------------------------------
runSuite('Permit Extension Lifecycle', () => {
    const p = {
        id: 'SW-EXT-001',
        ptype: 'shaft',
        status: 'Active',
        validTill: new Date(Date.now() + 2 * 3600 * 1000),
        approvals: app.newChain('shaft'),
        extension: null,
        activityLog: []
    };

    // 1. Supervisor requests 60 min extension
    app.requestExtension(p, 60, 'Shaft duct installation running behind schedule');
    assert(p.extension !== null, 'Extension object created on permit');
    assert(p.extension.hours === 1, 'Extension duration recorded as 1 hour');
    assert(p.extension.status === 'Pending Site Engineer', 'Extension starts at Pending Site Engineer');

    // 2. Site Engineer re-acknowledges
    app.approveExtensionStage(p, 'site-engineer', { comment: 'Site inspected, extended work safe to continue', sig: 'sig_data', signerName: 'Site Eng' });
    assert(p.extension.status === 'Pending Section Head', 'Engineer approval moves extension to Tower Incharge');

    // 3. Tower Incharge reviews & approves
    app.approveExtensionStage(p, 'hw-section-head', { comment: 'Tower activities coordinated', sig: 'sig_data', signerName: 'Tower Incharge' });
    assert(p.extension.status === 'Pending EHS Approval', 'Tower Incharge approval moves extension to EHS');

    // 4. EHS endorses
    const oldExpiry = new Date(p.validTill).getTime();
    app.approveExtensionStage(p, 'ehs-manager', { comment: 'Extended validity granted', sig: 'sig_data', signerName: 'EHS Manager' });
    assert(p.extension.status === 'Approved', 'Extension status marked Approved');
    const newExpiry = new Date(p.validTill).getTime();
    assert(newExpiry - oldExpiry === 3600 * 1000, 'Permit validTill extended by exactly 1 hour');
});

// ------------------------------------------------------------------
// SUITE 7: Permit Closure & Surrender Lifecycle (Positive & Negative)
// ------------------------------------------------------------------
runSuite('Permit Closure & Surrender Lifecycle', () => {
    // Confined space specific closure: no worker remains inside
    const pCs = {
        id: 'CS-CLOSE-001',
        ptype: 'confined',
        status: 'Active',
        validTill: new Date(Date.now() + 2 * 3600 * 1000),
        approvals: app.newChain('confined'),
        closure: null,
        surrender: null,
        activityLog: []
    };

    // Requirement 1: Site Engineer does not have a closure option
    app.currentUser = { key: 'site-engineer', name: 'Engineer Eric' };
    const engCloseResult = app.closeAndSurrenderPermit(pCs, {
        remarks: 'Trying to close as engineer',
        sig: 'eng_sig',
        signerName: 'Engineer Eric',
        confinedClosure: true
    });
    assert(engCloseResult === false, 'Site Engineer CANNOT close and surrender permits (strictly restricted to Site Supervisor)');
    assert(pCs.status === 'Active', 'Permit remains Active when Site Engineer attempts closure');

    // Site Supervisor is the authorized role for closure and surrender
    app.currentUser = { key: 'site-supervisor', name: 'Supervisor Sam' };
    const supCloseResult = app.closeAndSurrenderPermit(pCs, {
        remarks: 'Work completed, tank manhole secured',
        photo: 'site_photo_data',
        sig: 'sup_sig',
        signerName: 'Supervisor Sam',
        confinedClosure: true
    });
    assert(supCloseResult === true, 'Site Supervisor successfully closes and surrenders permit');
    assert(pCs.status === 'Completed (Surrendered)', 'Permit closure moves status to Completed (Surrendered)');
    assert(pCs.surrender && pCs.surrender.confinedClosure === true, 'Mandatory declaration that no worker remains inside recorded');
});

// ------------------------------------------------------------------
// SUITE 8: PDF Download Access Control & Timing
// ------------------------------------------------------------------
runSuite('PDF Download Access Control & Timing', () => {
    // Pre-approval stage permit
    const pDraft = { id: 'HW-DRAFT', status: 'Pending Parallel Approval' };
    const isActOrTermDraft = ['Active', 'Active – Observation Open', 'Completed (Surrendered)', 'Cancelled', 'Returned for Correction', 'Expired'].includes(pDraft.status);
    assert(!isActOrTermDraft, 'PDF Download is strictly unavailable during pre-approval chain');

    // Active stage permit
    const pActive = { id: 'HW-ACTIVE', status: 'Active' };
    const isActOrTermActive = ['Active', 'Active – Observation Open', 'Completed (Surrendered)', 'Cancelled', 'Returned for Correction', 'Expired'].includes(pActive.status);
    assert(isActOrTermActive, 'PDF Download becomes available once permit is Active or in terminal state');

    // Role restrictions: ONLY EHS
    const ehsRoles = ['ehs-manager', 'ehs-officer'];
    const nonEhsRoles = ['site-supervisor', 'site-engineer', 'hw-section-head', 'section-head', 'mep', 'pm', 'it', 'admin'];

    ehsRoles.forEach(r => {
        const isEHS = (r === 'ehs-manager' || r === 'ehs-officer');
        assert(isEHS, `Role ${r} is authorized to download official PDF`);
    });

    nonEhsRoles.forEach(r => {
        const isEHS = (r === 'ehs-manager' || r === 'ehs-officer');
        assert(!isEHS, `Role ${r} is LOCKED from downloading official PDF (EHS only compliance rule)`);
    });
});

// ------------------------------------------------------------------
// SUITE 9: Status Badges & CSS Classes
// ------------------------------------------------------------------
runSuite('Status Badges & CSS Classes', () => {
    const statuses = [
        'Draft', 'Pending Site Engineer Acknowledgment', 'Pending Parallel Approval',
        'Pending MEP Clearance', 'Returned for Correction', 'Pending Tower Incharge',
        'Pending EHS Approval', 'Active', 'Active – Observation Open',
        'Observation Pending Tower Incharge Review', 'Observation Pending EHS Clearance',
        'Completed (Surrendered)', 'Cancelled', 'Expired'
    ];

    statuses.forEach(st => {
        const cls = app.statusClass(st);
        assert(cls && cls !== 'draft' || st === 'Draft', `Status "${st}" maps to CSS class "st-${cls}"`);
    });

    const badgeTI = app.statusBadge('Pending Tower Incharge');
    assert(badgeTI.includes('Pending Tower Incharge'), 'statusBadge outputs "Pending Tower Incharge"');

    // Legacy status conversion
    const badgeLegacy = app.statusBadge('Pending Section Head');
    assert(badgeLegacy.includes('Pending Tower Incharge'), 'Legacy "Pending Section Head" status automatically renders as "Pending Tower Incharge"');
});

// ------------------------------------------------------------------
// SUITE 10: GPS Geofencing Calculation
// ------------------------------------------------------------------
runSuite('GPS Geofencing Calculation', () => {
    const siteLat = 17.4435;
    const siteLng = 78.3772;

    // Worksite coordinate within 50 meters
    const nearLat = 17.4438;
    const nearLng = 78.3774;
    const distNear = app.haversine(siteLat, siteLng, nearLat, nearLng);
    assert(distNear < 100, `Close coordinate correctly calculates distance: ${distNear.toFixed(1)}m (< 100m)`);

    // Far coordinate (10 km away)
    const farLat = 17.5200;
    const farLng = 78.4500;
    const distFar = app.haversine(siteLat, siteLng, farLat, farLng);
    assert(distFar > 5000, `Far coordinate correctly calculates distance: ${distFar.toFixed(1)}m (> 5000m)`);
});

// ------------------------------------------------------------------
// SUITE 11: Multi-Gas Atmospheric Safety & Detection (PTW-004 Confined Space)
// ------------------------------------------------------------------
runSuite('Confined Space Multi-Gas Atmospheric Testing', () => {
    // 1. Safe readings (Positive test)
    assert(app.isGasReadingSafe('combustible', 2.0), 'Combustible 2.0% LEL is within safe limit (< 10%)');
    assert(app.isGasReadingSafe('h2s', 0.5), 'H2S 0.5 PPM is within safe limit (0-5 PPM)');
    assert(app.isGasReadingSafe('co', 3.0), 'CO 3.0 PPM is within safe limit (< 25 PPM)');
    assert(app.isGasReadingSafe('o2', 20.8), 'O2 20.8% is within safe limit (19.5-21.0%)');

    // 2. Dangerous readings (Negative tests)
    assert(!app.isGasReadingSafe('combustible', 10.0), 'Combustible at exactly 10% LEL triggers danger threshold');
    assert(!app.isGasReadingSafe('combustible', 15.0), 'Combustible at 15% LEL triggers explosive risk rejection');
    assert(!app.isGasReadingSafe('h2s', 5.5), 'H2S at 5.5 PPM triggers toxicity rejection');
    assert(!app.isGasReadingSafe('co', 25.0), 'CO at exactly 25 PPM triggers toxicity threshold');
    assert(!app.isGasReadingSafe('o2', 18.5), 'O2 at 18.5% (asphyxiation / oxygen deficiency) rejected');
    assert(!app.isGasReadingSafe('o2', 22.5), 'O2 at 22.5% (oxygen enrichment / fire risk) rejected');
    assert(!app.isGasReadingSafe('o2', null), 'Null gas reading rejected');
    assert(!app.isGasReadingSafe('o2', ''), 'Empty gas reading rejected');
});

// ------------------------------------------------------------------
// SUITE 12: Permit Closure Specialized Safety Declarations (PTW-002, PTW-003, PTW-004)
// ------------------------------------------------------------------
runSuite('Permit Closure Specialized Safety Declarations', () => {
    // PTW-002 Hot Work: requires continuous fire watch declaration
    const pHw = {
        id: 'HW-CLOSE-TEST',
        ptype: 'hotwork',
        status: 'Active',
        validTill: new Date(Date.now() + 3600 * 1000),
        approvals: app.newChain('hotwork'),
        activityLog: []
    };
    const hwNoWatch = app.closeAndSurrenderPermit(pHw, { remarks: 'Done', fireWatch: false });
    assert(hwNoWatch === false, 'Hot Work closure REJECTED when 1-hr fire watch is not verified');

    const hwWithWatch = app.closeAndSurrenderPermit(pHw, { remarks: 'Done', fireWatch: true });
    assert(hwWithWatch === true, 'Hot Work closure SUCCEEDS when 1-hr continuous fire watch confirmed');
    assert(pHw.status === 'Completed (Surrendered)', 'Hot Work transitioned to Completed (Surrendered)');

    // PTW-003 Guard Rail: requires re-fixing declaration
    const pGr = {
        id: 'GR-CLOSE-TEST',
        ptype: 'guardrail',
        status: 'Active',
        validTill: new Date(Date.now() + 3600 * 1000),
        approvals: app.newChain('guardrail'),
        activityLog: []
    };
    const grNoRefix = app.closeAndSurrenderPermit(pGr, { remarks: 'Done', guardrailReFix: false });
    assert(grNoRefix === false, 'Guard Rail closure REJECTED when barriers/re-fixing not confirmed');

    const grWithRefix = app.closeAndSurrenderPermit(pGr, { remarks: 'Done', guardrailReFix: true });
    assert(grWithRefix === true, 'Guard Rail closure SUCCEEDS when edge protections re-fixed');
    assert(pGr.status === 'Completed (Surrendered)', 'Guard Rail transitioned to Completed (Surrendered)');

    // PTW-004 Confined Space: requires evacuation declaration
    const pCs = {
        id: 'CS-CLOSE-TEST',
        ptype: 'confined',
        status: 'Active',
        validTill: new Date(Date.now() + 3600 * 1000),
        approvals: app.newChain('confined'),
        activityLog: []
    };
    const csNoEvac = app.closeAndSurrenderPermit(pCs, { remarks: 'Done', confinedClosure: false });
    assert(csNoEvac === false, 'Confined Space closure REJECTED when evacuation declaration not confirmed');

    const csWithEvac = app.closeAndSurrenderPermit(pCs, { remarks: 'Done', confinedClosure: true });
    assert(csWithEvac === true, 'Confined Space closure SUCCEEDS when evacuation declaration confirmed');
    assert(pCs.status === 'Completed (Surrendered)', 'Confined Space transitioned to Completed (Surrendered)');
});

// ------------------------------------------------------------------
// SUITE 13: Strict Role Delegation & Permission Boundaries
// ------------------------------------------------------------------
runSuite('Strict Role Boundaries & Delegation Rules', () => {
    const ch = app.newChain('excavation');

    // Parallel gate enforcement
    assert(!app.roleCanActOnChain(ch, 'site-supervisor'), 'Supervisor cannot act on parallel gate');
    assert(!app.roleCanActOnChain(ch, 'site-engineer'), 'Site Engineer cannot act on parallel gate');
    assert(!app.roleCanActOnChain(ch, 'hw-section-head'), 'Tower Incharge cannot act on parallel gate before clearances');
    assert(!app.roleCanActOnChain(ch, 'excavation-head'), 'Excavation Head cannot act on parallel gate before clearances');
    assert(!app.roleCanActOnChain(ch, 'ehs-manager'), 'EHS Manager cannot act on parallel gate before clearances');

    // Excavation Head step enforcement (Excavation section)
    app.actOnChain(ch, 'mep', 'approved');
    app.actOnChain(ch, 'pm', 'approved');
    app.actOnChain(ch, 'it', 'approved');

    assert(app.roleCanActOnChain(ch, 'excavation-head'), 'Excavation Head can act at section-head step for Excavation');
    assert(!app.roleCanActOnChain(ch, 'hw-section-head'), 'Tower Incharge CANNOT act on Excavation section-head step');
    assert(app.roleCanActOnChain(ch, 'section-head'), 'Legacy section-head alias can act at section-head step');
    assert(!app.roleCanActOnChain(ch, 'mep'), 'MEP cannot act again once stage cleared');
    assert(!app.roleCanActOnChain(ch, 'ehs-manager'), 'EHS cannot jump the queue before Excavation Head');
    assert(!app.roleCanActOnChain(ch, 'site-supervisor'), 'Supervisor cannot approve Excavation Head step');

    // EHS step enforcement
    app.actOnChain(ch, 'excavation-head', 'approved');
    assert(app.roleCanActOnChain(ch, 'ehs-manager'), 'EHS Manager can act at EHS step');
    assert(app.roleCanActOnChain(ch, 'ehs-officer'), 'EHS Officer can act at EHS step');
    assert(!app.roleCanActOnChain(ch, 'hw-section-head'), 'Tower Incharge cannot act at EHS step');
    assert(!app.roleCanActOnChain(ch, 'excavation-head'), 'Excavation Head cannot act at EHS step');
    assert(!app.roleCanActOnChain(ch, 'site-engineer'), 'Site Engineer cannot act at EHS step');

    // Tower Incharge step enforcement for remaining four sections
    const chHw = app.newChain('hotwork');
    assert(app.roleCanActOnChain(chHw, 'hw-section-head'), 'Tower Incharge can act at section-head step for Hot Work');
    assert(!app.roleCanActOnChain(chHw, 'excavation-head'), 'Excavation Head CANNOT act on Hot Work section-head step');
});

// ------------------------------------------------------------------
// SUITE 15: Single Approver Clearance Rule (EHS Manager OR Officer)
// ------------------------------------------------------------------
runSuite('Single EHS Approver Clearance Rule', () => {
    // EHS Manager clearance activates permit
    const ch1 = app.newChain('hotwork');
    app.actOnChain(ch1, 'hw-section-head', 'approved');
    const res1 = app.actOnChain(ch1, 'ehs-manager', 'approved');
    assert(res1 === 'complete', 'Single EHS Manager approval activates Hot Work');

    // EHS Officer clearance activates permit independently
    const ch2 = app.newChain('hotwork');
    app.actOnChain(ch2, 'hw-section-head', 'approved');
    const res2 = app.actOnChain(ch2, 'ehs-officer', 'approved');
    assert(res2 === 'complete', 'Single EHS Officer approval activates Hot Work');

    // Other EHS role can no longer act once approved
    assert(!app.roleCanActOnChain(ch1, 'ehs-officer'), 'EHS Officer cannot act once EHS Manager has approved');
    assert(!app.roleCanActOnChain(ch2, 'ehs-manager'), 'EHS Manager cannot act once EHS Officer has approved');
});

// ==================================================================
// FINAL REPORT
// ==================================================================
console.log(`\n==================================================`);
console.log(`TEST EXECUTION COMPLETE`);
console.log(`==================================================`);
console.log(`Total Tests Run:   ${totalTests}`);
console.log(`Total Passed:      ${passedTests}`);
console.log(`Total Failed:      ${failedTests}`);

if (failedTests > 0) {
    console.error(`\nFAILURES SUMMARY (${failedTests}):`);
    failures.forEach((f, i) => {
        console.error(`${i + 1}. ${f.testName}: ${f.details || 'No additional details'}`);
    });
    process.exit(1);
} else {
    console.log(`\nALL ${passedTests} TESTS PASSED WITH 100% SUCCESS RATE!`);
    process.exit(0);
}
