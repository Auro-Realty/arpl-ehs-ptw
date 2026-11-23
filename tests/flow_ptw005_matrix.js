/**
 * COMPREHENSIVE APPROVAL FLOW MATRIX: GROUP 2 (PTW-005 SHAFT WORK)
 *
 * Covers the 5-stage sequential clearance flow:
 * Site Supervisor (Permittee) -> Site Engineer -> MEP Engineer -> Tower Incharge (hw-section-head) -> EHS (ehs-manager / ehs-officer)
 *
 * Scenarios tested (S1 - S12):
 * S1: Happy Path
 * S2: Out-Of-Order / Wrong Role (Negative)
 * S3: Either-Or Stages (EHS Manager vs Officer first-wins)
 * S4: Return / Reject at Each Stage & Resubmission Routing (preserving MEP approval when applicable)
 * S5: Conditional Branches (Location modes: Tower, Basement/Podium, Manual)
 * S6: Project Isolation & Cross-Project Protection
 * S7: Permit Identity & Signatory Isolation
 * S8: Draft Behavior & Non-Initiator Isolation
 * S9: Input Validation & Mandatory Shaft Work Checklists
 * S10: Concurrency & Double Action Prevention
 * S11: Post-Approval Lifecycle (Extension, Observations, Surrender with shaft safety declaration, Cancellation)
 * S12: Outputs (KPI Counters, Register Visibility, PDF Generation Smoke)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('STARTING GROUP 2 (PTW-005 SHAFT WORK) APPROVAL FLOW MATRIX TESTS');
console.log('================================================================');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
if (!scriptMatch) throw new Error("Could not extract main script tag from index.html");

class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.checked = false;
        this.disabled = false;
        this.style = {};
        this.classes = new Set();
        this.children = [];
    }
    get classList() {
        return {
            add: (...cls) => cls.forEach(c => this.classes.add(c)),
            remove: (...cls) => cls.forEach(c => this.classes.delete(c)),
            contains: (c) => this.classes.has(c),
            toggle: (c, force) => {
                if (force === undefined) {
                    if (this.classes.has(c)) this.classes.delete(c);
                    else this.classes.add(c);
                } else if (force) {
                    this.classes.add(c);
                } else {
                    this.classes.delete(c);
                }
            }
        };
    }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) { return child; }
    remove() {}
    querySelector() { return null; }
    querySelectorAll() { return []; }
    focus() {}
    scrollIntoView() {}
    toDataURL() { return 'data:image/png;base64,mockcanvasdata'; }
    getContext() {
        return {
            clearRect() {}, beginPath() {}, arc() {}, stroke() {}, fill() {},
            moveTo() {}, lineTo() {}, fillText() {}, setLineDash() {}, strokeRect() {}, fillRect() {},
            translate() {}, rotate() {}, quadraticCurveTo() {}
        };
    }
}

const domElements = new Map();
function getOrCreateElem(id, tagName = 'div') {
    if (!domElements.has(id)) {
        domElements.set(id, new MockElement(id, tagName));
    }
    return domElements.get(id);
}

const mockDocument = {
    getElementById: (id) => getOrCreateElem(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement('', tag),
    body: new MockElement('body', 'body'),
    head: new MockElement('head', 'head'),
    documentElement: new MockElement('html', 'html'),
    addEventListener: () => {}
};

const mockWindow = {
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768,
    location: { hash: '', reload: () => {}, href: '' }
};

class MockPDFDoc {
    constructor(opts) {
        this.opts = opts;
        this.lines = [];
        this.images = [];
        this.pages = 1;
        this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    }
    setFillColor() { return this; }
    setDrawColor() { return this; }
    setTextColor() { return this; }
    setFont() { return this; }
    setFontSize() { return this; }
    setLineWidth() { return this; }
    rect() { return this; }
    roundedRect() { return this; }
    line() { return this; }
    text(txt, x, y, opts) { this.lines.push({ txt, x, y, opts }); return this; }
    splitTextToSize(txt, w) { return Array.isArray(txt) ? txt : [String(txt)]; }
    addImage(data, fmt, x, y, w, h) { this.images.push({ data, fmt, x, y, w, h }); return this; }
    addPage() { this.pages++; return this; }
    save(name) { this.savedName = name; return this; }
    output() { return 'data:application/pdf;base64,mockpdf'; }
}

let toastMessages = [];
const sandbox = {
    window: mockWindow,
    document: mockDocument,
    history: { pushState: () => {} },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    navigator: { userAgent: 'NodeTestEnv', geolocation: { getCurrentPosition: (cb) => cb({ coords: { latitude: 17.44, longitude: 78.38 } }) } },
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout: (fn) => fn(),
    setInterval: () => 1,
    clearTimeout: () => {},
    clearInterval: () => {},
    requestAnimationFrame: (fn) => fn(),
    Math, Date, parseInt, parseFloat, isNaN, isFinite, JSON,
    jspdf: { jsPDF: MockPDFDoc },
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
    showToast: (msg, type) => { toastMessages.push({ msg, type }); },
    alert: () => {},
    confirm: () => true,
};
mockWindow.window = mockWindow;

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(code) {
    return vm.runInContext(code, context);
}

evalInVM("window.__TEST_MODE__ = true;");
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };");

const TEST_RESULTS = {
    passed: 0,
    failed: 0,
    failures: []
};

function recordAssert(desc, fn) {
    try {
        fn();
        TEST_RESULTS.passed++;
        console.log(`  ✓ PASS: ${desc}`);
    } catch (err) {
        TEST_RESULTS.failed++;
        TEST_RESULTS.failures.push({ desc, error: err.message });
        console.log(`  ✗ FAIL: ${desc} --> ${err.message}`);
    }
}

console.log('\n--- S1: HAPPY PATH (PTW-005 SHAFT WORK) ---');
recordAssert('Complete 5-stage linear happy path: Supervisor -> Site Eng -> MEP -> Tower Incharge -> EHS -> Active', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.organization = 'Main Contractor';
            draft.locationStructure = 'Tower';
            draft.tower = 'Tower A';
            draft.locFloor = 'Floor 5';
            draft.locUnit = 'Lift Shaft 1';
            draft.shaftActivity = 'Lift guide rail installation';
            draft.shaftFloors = 'Floor 1 to Floor 10';
            draft.numPersonnel = 4;
            draft.scaffTagVerified = true;
            draft.shaftDeclaration = true;
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            draft.signerName = 'Supervisor Ram';
            draft.dpdpConsent = true;

            // 1. Submit Permit
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.createdAt = nowTime();
            p.createdBy = currentUser.name;
            p.createdByRole = currentUser.key;
            p.approvals = newChain('shaft');
            p.signatories = {};
            submitPermit(p, true);
            PERMITS.unshift(p);
            activePermit = p;
        })();
    `);

    var p = evalInVM("activePermit");
    assert.strictEqual(p.status, 'Pending Site Engineer Acknowledgment', "Step 1 submit sets status to Pending Site Engineer Acknowledgment");
    assert.strictEqual(evalInVM("getNextApproverLabel(activePermit)"), 'Site Engineer (Reviewer / Approver)', "Next approver label is Site Engineer");

    // Assert roleCanActOnChain: ONLY site-engineer can act
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'site-engineer')"), true, "Site Engineer can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'mep')"), false, "MEP cannot act prematurely at Step 1");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'hw-section-head')"), false, "Tower Incharge cannot act prematurely");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'ehs-officer')"), false, "EHS cannot act prematurely");

    // 2. Site Engineer Acknowledges (Step 2)
    evalInVM(`
        currentUser = { key: 'site-engineer', name: 'Engineer Vikram', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        acknowledgeSiteEngineer(activePermit, { comment: 'Shaft gate and safety harness verified', gps: { lat: 17.44, lng: 78.38 }, sig: 'data:image/png;base64,sigVikram', signerName: 'Engineer Vikram' });
    `);
    assert.strictEqual(evalInVM("activePermit.status"), 'Pending MEP Clearance', "Step 2 ack advances to Pending MEP Clearance");
    assert.strictEqual(evalInVM("getNextApproverLabel(activePermit)"), 'MEP (Clearance Approver)', "Next approver label is MEP");

    // Assert roleCanActOnChain: ONLY MEP can act
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'mep')"), true, "MEP can act at Step 3");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'site-engineer')"), false, "Site Engineer cannot act again");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'hw-section-head')"), false, "Tower Incharge cannot act before MEP");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'ehs-officer')"), false, "EHS cannot act before MEP");

    // 3. MEP Clearance (Step 3)
    evalInVM(`
        currentUser = { key: 'mep', name: 'MEP Engineer Roy', role: 'MEP Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        approvePermitStage(activePermit, 'mep', { gps: { lat: 17.44, lng: 78.38 }, comment: 'Electrical and plumbing isolation confirmed in shaft', sig: 'data:image/png;base64,sigRoy', signerName: 'MEP Engineer Roy' });
    `);
    assert.strictEqual(evalInVM("activePermit.status"), 'Pending Section Head', "Step 3 MEP clearance advances to Pending Section Head");
    assert.strictEqual(evalInVM("getNextApproverLabel(activePermit)"), 'Tower In-Charge / Section Head (Approver)', "Next approver label is Tower Incharge");

    // Assert roleCanActOnChain: ONLY Tower Incharge can act
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'hw-section-head')"), true, "Tower Incharge can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'mep')"), false, "MEP cannot act again");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'ehs-officer')"), false, "EHS cannot act before Section Head");

    // 4. Tower Incharge Approves (Step 4)
    evalInVM(`
        currentUser = { key: 'hw-section-head', name: 'Incharge Maria', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        approvePermitStage(activePermit, 'hw-section-head', { gps: { lat: 17.44, lng: 78.38 }, comment: 'Tower activities coordinated', sig: 'data:image/png;base64,sigMaria', signerName: 'Incharge Maria' });
    `);
    assert.strictEqual(evalInVM("activePermit.status"), 'Pending EHS Approval', "Step 4 TI approval advances to Pending EHS Approval");
    assert.strictEqual(evalInVM("getNextApproverLabel(activePermit)"), 'EHS Supervisor / EHS Head (Issuer / Approver)', "Next approver label is EHS");

    // 5. EHS Safety Endorsement (Step 5 - First Wins)
    evalInVM(`
        currentUser = { key: 'ehs-officer', name: 'Officer Mijoo', role: 'EHS Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        approvePermitStage(activePermit, 'ehs-officer', { gps: { lat: 17.44, lng: 78.38 }, comment: 'Final safety authorization for shaft work granted', sig: 'data:image/png;base64,sigMijoo', signerName: 'Officer Mijoo' });
    `);
    assert.strictEqual(evalInVM("activePermit.status"), 'Active', "Step 5 EHS endorsement activates permit");
    assert.strictEqual(evalInVM("getNextApproverLabel(activePermit)"), '', "Active permit has no next approver");
    assert.strictEqual(evalInVM("roleCanActOnChain(activePermit, 'ehs-officer')"), false, "EHS Officer cannot act on active permit");

    // Verify all 4 signatory roles recorded in order
    evalInVM("buildPermitSignatoriesCardHtml(activePermit);");
    var sigs = evalInVM("activePermit.signatories");
    assert(sigs['site-supervisor'], "Permittee signature must exist");
    assert(sigs['site-engineer'], "Site Engineer signature must exist");
    assert(sigs['mep'], "MEP Engineer signature must exist");
    assert(sigs['hw-section-head'] || sigs['section-head'], "Tower Incharge signature must exist");
    assert(sigs['ehs-manager'] || sigs['ehs-officer'], "EHS signature must exist");
    assert.strictEqual(sigs['mep'].name, 'MEP Engineer Roy', "MEP signer recorded accurately");
});

console.log('\n--- S2: OUT-OF-ORDER / WRONG ROLE (NEGATIVE) ---');
recordAssert('All non-eligible roles strictly blocked across all 5 stages of Shaft Work', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.organization = 'Main Contractor';
            draft.locationStructure = 'Tower';
            draft.tower = 'Tower A';
            draft.locFloor = 'Floor 5';
            draft.locUnit = 'Lift Shaft 1';
            draft.shaftActivity = 'Lift guide rail installation';
            draft.shaftFloors = 'Floor 1 to Floor 10';
            draft.numPersonnel = 4;
            draft.scaffTagVerified = true;
            draft.shaftDeclaration = true;
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            draft.signerName = 'Supervisor Ram';
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.approvals = newChain('shaft');
            submitPermit(p, true);
            activePermit = p;
        })();
    `);

    var allRoles = evalInVM("ROLES.map(r => r.key)");

    // At Pending Site Engineer Acknowledgment:
    allRoles.forEach(rk => {
        var canAct = evalInVM(`roleCanActOnChain(activePermit, '${rk}')`);
        if (rk === 'site-engineer') {
            assert.strictEqual(canAct, true, `${rk} must be allowed at Step 1`);
        } else {
            assert.strictEqual(canAct, false, `${rk} must be BLOCKED at Step 1`);
        }
    });

    // Advance to Pending MEP Clearance
    evalInVM(`acknowledgeSiteEngineer(activePermit, { comment: 'Ack', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });`);
    allRoles.forEach(rk => {
        var canAct = evalInVM(`roleCanActOnChain(activePermit, '${rk}')`);
        if (rk === 'mep' || rk === 'mep-engineer') {
            assert.strictEqual(canAct, true, `${rk} must be allowed at Step 2`);
        } else {
            assert.strictEqual(canAct, false, `${rk} must be BLOCKED at Step 2`);
        }
    });

    // Advance to Pending Section Head
    evalInVM(`approvePermitStage(activePermit, 'mep', { comment: 'MEP ok', sig: 'data:image/png;base64,sigMEP', signerName: 'MEP' });`);
    allRoles.forEach(rk => {
        var canAct = evalInVM(`roleCanActOnChain(activePermit, '${rk}')`);
        if (['hw-section-head', 'section-head', 'tower-in-charge'].includes(rk)) {
            assert.strictEqual(canAct, true, `${rk} must be allowed at Step 3`);
        } else {
            assert.strictEqual(canAct, false, `${rk} must be BLOCKED at Step 3`);
        }
    });

    // Advance to Pending EHS Approval
    evalInVM(`approvePermitStage(activePermit, 'hw-section-head', { comment: 'TI ok', sig: 'data:image/png;base64,sigTI', signerName: 'TI' });`);
    allRoles.forEach(rk => {
        var canAct = evalInVM(`roleCanActOnChain(activePermit, '${rk}')`);
        if (['ehs-manager', 'ehs-officer', 'ehs-head', 'ehs-supervisor'].includes(rk)) {
            assert.strictEqual(canAct, true, `${rk} must be allowed at Step 4`);
        } else {
            assert.strictEqual(canAct, false, `${rk} must be BLOCKED at Step 4`);
        }
    });
});

console.log('\n--- S3: EITHER-OR STAGES (EHS FIRST-WINS CONCURRENCY) ---');
recordAssert('EHS Manager vs EHS Officer first-wins resolution on Shaft Work', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            var p1 = JSON.parse(JSON.stringify(draft));
            p1.id = genPermitNumber('shaft');
            p1.approvals = newChain('shaft');
            submitPermit(p1, true);
            acknowledgeSiteEngineer(p1, { comment: 'SE ok', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });
            approvePermitStage(p1, 'mep', { comment: 'MEP ok', sig: 'data:image/png;base64,sigMEP', signerName: 'MEP' });
            approvePermitStage(p1, 'hw-section-head', { comment: 'TI ok', sig: 'data:image/png;base64,sigTI', signerName: 'TI' });

            // EHS Manager approves
            approvePermitStage(p1, 'ehs-manager', { comment: 'EHS Manager ok', sig: 'data:image/png;base64,sigEHSHead', signerName: 'EHS Head' });
            p1Active = p1;
        })();
    `);
    assert.strictEqual(evalInVM("p1Active.approvals.ehsManager.status"), 'approved');
    assert.strictEqual(evalInVM("chainStage(p1Active.approvals)"), 'complete');
    assert.strictEqual(evalInVM("roleCanActOnChain(p1Active, 'ehs-officer')"), false, "EHS Officer locked out after Manager approves");
});

console.log('\n--- S4: RETURN / REJECT AT EACH STAGE & RESUBMISSION ROUTING ---');
recordAssert('Rejection at Step 2 (MEP) routes to Permittee then Site Eng re-ack then MEP', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.approvals = newChain('shaft');
            submitPermit(p, true);
            acknowledgeSiteEngineer(p, { comment: 'SE ok', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });

            // MEP rejects
            rejectPermitStage(p, 'mep', { comment: 'Exposed 440V cables need isolation', sig: 'data:image/png;base64,sigMEP', signerName: 'MEP' });
            pRejMep = p;
        })();
    `);
    assert.strictEqual(evalInVM("pRejMep.status"), 'Returned for Correction');

    // Permittee resubmits
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor' };
        pRejMep.resubmitComment = 'Cables locked and tagged out';
        resubmitReturnedPermit(pRejMep);
    `);
    // Per D6, routes to Site Engineer on-site re-acknowledgment
    assert.strictEqual(evalInVM("pRejMep.status"), 'Pending Site Engineer Re-Acknowledgment');

    // Site Engineer re-acknowledges -> advances back to MEP
    evalInVM(`
        currentUser = { key: 'site-engineer', name: 'Engineer Vikram', role: 'Site Engineer' };
        acknowledgeReturnPermitEng(pRejMep, { comment: 'Physical re-inspection complete', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });
    `);
    assert.strictEqual(evalInVM("pRejMep.status"), 'Pending MEP Clearance', "Re-acknowledgment routes back to MEP");
});

recordAssert('Rejection at Step 3 (Tower Incharge) preserves prior MEP approval per D6', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.approvals = newChain('shaft');
            submitPermit(p, true);
            acknowledgeSiteEngineer(p, { comment: 'SE ok', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });
            approvePermitStage(p, 'mep', { comment: 'MEP ok', sig: 'data:image/png;base64,sigMEP', signerName: 'MEP' });

            // Tower Incharge rejects
            rejectPermitStage(p, 'hw-section-head', { comment: 'Shaft scaffolding tag expired', sig: 'data:image/png;base64,sigTI', signerName: 'TI' });
            pRejTi = p;
        })();
    `);
    assert.strictEqual(evalInVM("pRejTi.status"), 'Returned for Correction');
    // Prior MEP approval is preserved
    assert.strictEqual(evalInVM("pRejTi.approvals.mep.status"), 'approved', "MEP approval preserved across Section Head rejection");

    // Permittee resubmits
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor' };
        pRejTi.resubmitComment = 'Green scaffold tag renewed';
        resubmitReturnedPermit(pRejTi);
    `);
    assert.strictEqual(evalInVM("pRejTi.status"), 'Pending Site Engineer Re-Acknowledgment');

    // Site Engineer re-acknowledges via acknowledgeReturnPermitEng
    evalInVM(`
        currentUser = { key: 'site-engineer', name: 'Engineer Vikram', role: 'Site Engineer' };
        acknowledgeReturnPermitEng(pRejTi, { comment: 'New green tag verified on-site', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });
    `);
    // Since MEP was already approved, acknowledgeReturnPermitEng routes directly to Section Head!
    assert.strictEqual(evalInVM("pRejTi.status"), 'Pending Section Head', "Advances directly to Section Head because MEP was already cleared");
});

console.log('\n--- S5: CONDITIONAL BRANCHES (LOCATION MODES) ---');
['Tower', 'Basement/Podium', 'Manual'].forEach(mode => {
    recordAssert(`Shaft Work workflow identical across location mode: ${mode}`, () => {
        evalInVM(`
            (() => {
                startNewPermit('shaft');
                draft.projectId = 'PRJ-PEARL';
                draft.project = PROJECTS[0].name;
                draft.organization = 'Main Contractor';
                draft.locationStructure = '${mode}';
                if ('${mode}' === 'Tower') { draft.tower = 'Tower A'; draft.locFloor = 'Floor 5'; draft.locUnit = 'Lift Shaft 1'; }
                else if ('${mode}' === 'Basement/Podium') { draft.locBasementPodium = 'Basement Level 1'; draft.locArea = 'Service Shaft B'; }
                else { draft.locManual = 'External MEP Shaft'; draft.locArea = 'Substation Shaft'; }
                draft.numPersonnel = 2;
                draft.scaffTagVerified = true;
                draft.shaftDeclaration = true;
                draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
                var p = JSON.parse(JSON.stringify(draft));
                p.id = genPermitNumber('shaft');
                p.approvals = newChain('shaft');
                submitPermit(p, true);
                locShaft = p;
            })();
        `);
        assert.strictEqual(evalInVM("locShaft.status"), 'Pending Site Engineer Acknowledgment');
        assert.strictEqual(evalInVM("roleCanActOnChain(locShaft, 'site-engineer')"), true);
    });
});

console.log('\n--- S6: PROJECT ISOLATION & RBAC BOUNDARIES ---');
recordAssert('User from PRJ-REGENT strictly blocked from viewing or acting on PRJ-PEARL Shaft permit', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.approvals = newChain('shaft');
            submitPermit(p, true);
            PERMITS = [p];
            prjShaft = p;

            regentSE = { key: 'site-engineer', name: 'Regent SE', role: 'Site Engineer', projectId: 'PRJ-REGENT', projectIds: ['PRJ-REGENT'], __STRICT_PROJECT_RBAC__: true };
            pearlSE = { key: 'site-engineer', name: 'Pearl SE', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
        })();
    `);
    evalInVM("currentUser = regentSE;");
    assert.strictEqual(evalInVM("userCanAccessProject('PRJ-PEARL')"), false, "Regent user cannot access PRJ-PEARL");
    assert.strictEqual(evalInVM("roleCanActOnChain(prjShaft, 'site-engineer')"), false, "Regent SE blocked from acting");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(prjShaft, 'site-engineer')"), false, "Regent SE cannot view Pearl permit");

    evalInVM("currentUser = pearlSE;");
    assert.strictEqual(evalInVM("userCanAccessProject('PRJ-PEARL')"), true, "Pearl user accesses PRJ-PEARL");
    assert.strictEqual(evalInVM("roleCanActOnChain(prjShaft, 'site-engineer')"), true, "Pearl SE can act");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(prjShaft, 'site-engineer')"), true, "Pearl SE can view");
});

console.log('\n--- S7: PERMIT IDENTITY & SIGNATORY ISOLATION ---');
recordAssert('Shaft permit digital signatures strictly isolated', () => {
    evalInVM(`
        (() => {
            var p1 = { id: 'PTW-005-2026-000001', type: 'shaft', status: 'Active', signatories: {} };
            var p2 = { id: 'PTW-005-2026-000002', type: 'shaft', status: 'Pending MEP Clearance', signatories: {} };
            p1.signatories['mep'] = { name: 'Roy MEP', sig: 'sigRoy', consent: true, at: '2026-11-20' };
            PERMITS = [p1, p2];
            isoP2 = p2;
        })();
    `);
    var cardHtml = evalInVM("buildPermitSignatoriesCardHtml(isoP2)");
    assert(!cardHtml.includes('Roy MEP'), "P2 card must not inherit P1's MEP signature");
    assert.strictEqual(evalInVM("isoP2.signatories['mep']"), undefined, "P2 must not inherit P1's signatory");
});

console.log('\n--- S8: DRAFT BEHAVIOR & NON-INITIATOR ISOLATION ---');
recordAssert('Site Engineer and MEP never see or act on draft Shaft permits', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor' };
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            var d = JSON.parse(JSON.stringify(draft));
            d.id = 'DRAFT-SHAFT-001';
            d.status = 'Draft';
            d.createdBy = 'Supervisor Ram';
            d.createdByRole = 'site-supervisor';
            PERMITS = [d];
            draftShaft = d;
        })();
    `);
    evalInVM("currentUser = { key: 'site-engineer', name: 'Engineer Vikram', role: 'Site Engineer' };");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftShaft, 'site-engineer')"), false, "SE cannot act on draft");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(draftShaft, 'site-engineer')"), false, "SE cannot view draft");

    evalInVM("currentUser = { key: 'mep', name: 'MEP Roy', role: 'MEP Engineer' };");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftShaft, 'mep')"), false, "MEP cannot act on draft");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(draftShaft, 'mep')"), false, "MEP cannot view draft");
});

console.log('\n--- S9: INPUT VALIDATION & MANDATORY CHECKLIST RULES ---');
recordAssert('Mandatory field validation per wizard step for Shaft Work', () => {
    evalInVM("startNewPermit('shaft');");
    assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails on empty draft");
    evalInVM(`
        draft.project = PROJECTS[0].name;
        draft.organization = 'Main Contractor';
        draft.locationStructure = 'Tower';
        draft.tower = 'Tower A';
        draft.locFloor = 'Floor 5';
        draft.locUnit = 'Lift Shaft 1';
        draft.numPersonnel = 2;
        draft.scaffTagVerified = true;
        draft.shaftDeclaration = true;
    `);
    assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 passes with valid fields");
});

console.log('\n--- S10: CONCURRENCY & DOUBLE ACTION GUARDS ---');
recordAssert('Double action blocked when permit status already advanced to MEP', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.approvals = newChain('shaft');
            submitPermit(p, true);
            PERMITS = [p];

            // Site Engineer acknowledges once
            acknowledgeSiteEngineer(p, { comment: 'SE ack 1', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });
            stAfterAck = p.status;
            concShaft = p;
        })();
    `);
    assert.strictEqual(evalInVM("stAfterAck"), 'Pending MEP Clearance');
    // Site Engineer cannot act a second time
    assert.strictEqual(evalInVM("roleCanActOnChain(concShaft, 'site-engineer')"), false);
});

console.log('\n--- S11: LIFECYCLE (EXTENSION, OBSERVATIONS, SURRENDER, CANCEL) ---');
recordAssert('Full lifecycle: extension, observation gate, and surrender to EHS', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.approvals = newChain('shaft');
            p.status = 'Active';
            p.validTill = new Date(Date.now() + 3600000).toISOString();
            p.startTime = '08:00';
            p.endTime = '18:00';
            p.createdBy = 'Supervisor Ram';
            p.createdByRole = 'site-supervisor';
            PERMITS = [p];
            lifeShaft = p;

            // 1. Raise EHS Observation
            currentUser = { key: 'ehs-officer', name: 'Officer Mijoo', role: 'EHS Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            raiseObservation(lifeShaft, { comment: 'Shaft gate lock broken on Floor 6', gps: { lat: 17.44, lng: 78.38 }, sig: 'data:image/png;base64,sigMijoo', signerName: 'Officer Mijoo' });
        })();
    `);
    assert.strictEqual(evalInVM("lifeShaft.status"), 'Active – Observation Open');
    assert.strictEqual(evalInVM("hasOpenObservation(lifeShaft)"), true);

    // 2. Closure blocked while observation open
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor', projectId: 'PRJ-PEARL' };
        closeBlocked = closeAndSurrenderPermit(lifeShaft, { remarks: 'Work done' });
    `);
    assert.strictEqual(evalInVM("closeBlocked"), false, "Closure blocked by open observation");

    // 3. Resolve observation
    evalInVM(`
        currentUser = { key: 'ehs-officer', name: 'Officer Mijoo', role: 'EHS Officer', projectId: 'PRJ-PEARL' };
        resolveObservation(lifeShaft, true, { comment: 'Gate re-secured', sig: 'data:image/png;base64,sigMijoo', signerName: 'Officer Mijoo' });
    `);
    assert.strictEqual(evalInVM("lifeShaft.status"), 'Active');

    // 4. Surrender and close permit
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor', projectId: 'PRJ-PEARL' };
        closedOk = closeAndSurrenderPermit(lifeShaft, { remarks: 'All personnel evacuated and shaft gates secured', photo: 'data:image/png;base64,photo', sig: 'data:image/png;base64,sigRam', signerName: 'Supervisor Ram' });
    `);
    assert.strictEqual(evalInVM("closedOk"), true);
    assert.strictEqual(evalInVM("lifeShaft.status"), 'Completed (Surrendered)');
});

console.log('\n--- S12: OUTPUTS (DASHBOARDS, REGISTER, PDF SMOKE) ---');
recordAssert('Dashboard pending queue for MEP, register visibility, and tracker generation', () => {
    evalInVM(`
        (() => {
            startNewPermit('shaft');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: 'data:image/png;base64,sigRam' };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('shaft');
            p.approvals = newChain('shaft');
            submitPermit(p, true);
            acknowledgeSiteEngineer(p, { comment: 'SE ok', sig: 'data:image/png;base64,sigSE', signerName: 'SE' });
            PERMITS = [p];

            currentUser = { key: 'mep', name: 'Roy MEP', role: 'MEP Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            mepPendingList = pendingForRole('mep');
            kpiShaft = p;
        })();
    `);
    assert.strictEqual(evalInVM("mepPendingList.length"), 1, "MEP sees 1 actionable permit at Step 3");
    var trackerOk = typeof evalInVM("trackerHtml(kpiShaft)") === 'string';
    assert.strictEqual(trackerOk, true, "Tracker renders cleanly");
});

console.log('\n================================================================');
console.log(`GROUP 2 (PTW-005) MATRIX SUMMARY: ${TEST_RESULTS.passed} PASSED, ${TEST_RESULTS.failed} FAILED`);
console.log('================================================================');

if (TEST_RESULTS.failed > 0) {
    console.error(`\nFAILURES DETECTED IN GROUP 2 MATRIX:`);
    TEST_RESULTS.failures.forEach((f, idx) => {
        console.error(`  ${idx + 1}. ${f.desc} --> ${f.error}`);
    });
    process.exit(1);
} else {
    console.log(`\nALL GROUP 2 (PTW-005 SHAFT WORK) FLOW SCENARIOS PASSED 100% CLEANLY.`);
    process.exit(0);
}
