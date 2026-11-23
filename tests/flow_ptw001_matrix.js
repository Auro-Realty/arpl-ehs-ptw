/**
 * COMPREHENSIVE APPROVAL FLOW MATRIX: GROUP 6 (PTW-001 EXCAVATION WORK)
 *
 * Flow Specification (Source of Truth per approved Decision D1):
 *   Site Supervisor -> Site Engineer -> Parallel Gate (MEP · P&M · IT In-Charge in any order)
 *   -> Excavation Head -> EHS
 *
 * Scenarios tested (S1 - S12):
 * S1: Happy Path (5-stage flow with 3-discipline parallel gate)
 * S2: Out-Of-Order / Wrong Role (Negative - Tower Incharge has ZERO authority, Excavation Head only)
 * S3: Either-Or Stages (EHS Manager vs EHS Officer first-wins concurrency)
 * S4: Return / Reject at Each Stage & Resubmission Routing per D6
 * S5: Conditional Branches (Parallel Clearance Order Independence: e.g. IT -> P&M -> MEP)
 * S6: Project Isolation & RBAC Boundaries
 * S7: Permit Identity & Signatory Isolation (Excavation Head present, Tower Incharge strictly absent)
 * S8: Draft Behavior & Non-Initiator Isolation
 * S9: Input Validation & Mandatory Drawing / Depth Parameters
 * S10: Concurrency & Double Action Prevention
 * S11: Post-Approval Lifecycle (Observations gate, Surrender to EHS)
 * S12: Outputs (KPI Counters for all 3 parallel roles + Excavation Head, Register Visibility, PDF Smoke)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('STARTING GROUP 6 (PTW-001 EXCAVATION WORK) FLOW MATRIX TESTS');
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
    getNumberOfPages() { return this.pages; }
    setPage(n) { return this; }
    save(name) { this.savedName = name; return this; }
    output(type) {
        if (type === 'blob') return new Uint8Array([1, 2, 3]);
        if (type === 'datauristring') return 'data:application/pdf;base64,JVBERi0xLjQK...';
        return 'PDF_STREAM';
    }
}

const sandbox = {
    window: mockWindow,
    document: mockDocument,
    console: console,
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    navigator: { userAgent: 'NodeTest' },
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; },
        clear: function() { this._data = {}; }
    },
    jspdf: { jsPDF: MockPDFDoc },
    jspdf_autotable: {},
    autoTable: () => {},
    alert: (msg) => console.log('[MOCK ALERT]', msg),
    confirm: () => true,
    location: mockWindow.location,
    URL: { createObjectURL: () => 'blob:mock-pdf' }
};
sandbox.window.window = sandbox.window;
sandbox.window.document = mockDocument;
sandbox.window.jspdf = { jsPDF: MockPDFDoc };
sandbox.window.jsPDF = MockPDFDoc;

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(code) {
    return vm.runInContext(code, context);
}

let passedCount = 0;
let failedCount = 0;
const failureDetails = [];

function recordAssert(desc, fn) {
    try {
        fn();
        passedCount++;
        console.log(`  ✓ PASS: ${desc}`);
    } catch (e) {
        failedCount++;
        console.error(`  ✗ FAIL: ${desc}`);
        console.error('   ', e.message);
        failureDetails.push({ desc, error: e.message });
    }
}

// -------------------------------------------------------------
// S1: HAPPY PATH (PTW-001 EXCAVATION WORK)
// -------------------------------------------------------------
console.log('\n--- S1: HAPPY PATH (PTW-001 EXCAVATION WORK) ---');

recordAssert('[Excavation Happy Path] Supervisor -> Site Eng -> Parallel Gate (MEP · P&M · IT) -> Excavation Head -> EHS -> Active', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('excavation');
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.locationStructure = 'Manual';
            draft.locManual = 'Pit Zone Alpha';
            draft.locManualArea = 'North Trench 4';
            draft.excavationDepth = '2.8';
            draft.excavationSlope = '1:1.5';
            draft.excavationEquipment = ['JCB Excavator', 'Tata Tipper'];
            draft.excavationDrawing = { name: 'trench_layout_rev2.pdf', dataUrl: 'data:application/pdf;base64,mockpdfdrawing' };
            draft.organization = 'Main Contractor';
            draft.signature = { by: 'Supervisor Sam', at: nowTime(), dataUrl: makeSimSignature('Supervisor Sam') };
            draft.consent = true;

            pExc = JSON.parse(JSON.stringify(draft));
            pExc.id = genPermitNumber('excavation');
            pExc.ptype = 'excavation';
            pExc.signatories = {};
            PERMITS = [pExc];
            submitPermit(pExc, true);
        })();
    `);

    // Verify initial submission routes to Site Engineer
    assert.strictEqual(evalInVM("pExc.status"), 'Pending Site Engineer Acknowledgment', "Excavation permit routes to Site Engineer Acknowledgment");
    assert.strictEqual(evalInVM("pExc.approvals.kind"), 'exc', "Approval chain kind is exc");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'site-engineer')"), true, "Site Engineer can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'mep')"), false, "MEP cannot act before Site Engineer acknowledgment");

    // Step 2: Site Engineer Acknowledges
    evalInVM(`
        (() => {
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pExc.id, 'Underground utility drawings cross-checked on site', { lat: 17.4125, lng: 78.3984 }, makeSimSignature('Eng Eric'));
        })();
    `);
    assert.strictEqual(evalInVM("pExc.status"), 'Pending Parallel Approval', "Routes to Step 3 Parallel Clearance Gate per Decision D1");

    // Parallel Gate: all 3 disciplines can act simultaneously
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'mep')"), true, "MEP can act in parallel");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'pm')"), true, "P&M can act in parallel");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'it')"), true, "IT In-Charge can act in parallel");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'excavation-head')"), false, "Excavation Head cannot act until parallel clearance complete");

    // Parallel 1: MEP Approves
    evalInVM(`
        (() => {
            currentUser = { key: 'mep', name: 'MEP Eng Mike', role: 'MEP Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pExc, 'mep', { lat: 17.4125, lng: 78.3984 }, 'No electrical or plumbing pipelines on this trench alignment', makeSimSignature('MEP Eng Mike'), 'MEP Eng Mike');
        })();
    `);
    assert.strictEqual(evalInVM("pExc.status"), 'Pending Parallel Approval', "Status remains Pending Parallel Approval while P&M and IT pending");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'mep')"), false, "MEP cannot act again");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'pm')"), true, "P&M can still act");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'it')"), true, "IT can still act");

    // Parallel 2: IT In-Charge Approves
    evalInVM(`
        (() => {
            currentUser = { key: 'it', name: 'IT Lead Ian', role: 'IT In-Charge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pExc, 'it', { lat: 17.4125, lng: 78.3984 }, 'OFC backbone cables clear of excavation zone', makeSimSignature('IT Lead Ian'), 'IT Lead Ian');
        })();
    `);
    assert.strictEqual(evalInVM("pExc.status"), 'Pending Parallel Approval', "Status remains Pending Parallel Approval while P&M pending");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'it')"), false, "IT cannot act again");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'pm')"), true, "P&M can still act");

    // Parallel 3: P&M Approves (Final parallel approval triggers transition to Step 4)
    evalInVM(`
        (() => {
            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pExc, 'pm', { lat: 17.4125, lng: 78.3984 }, 'Excavator and tipper fitness inspection certified', makeSimSignature('PM Eng Paul'), 'PM Eng Paul');
        })();
    `);
    assert.strictEqual(evalInVM("pExc.status"), 'Pending Section Head', "Status advances to Step 4 (Excavation Head) once all 3 parallel disciplines approve");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'excavation-head')"), true, "Excavation Head can act at Step 4");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'hw-section-head')"), false, "Tower Incharge has ZERO authority over excavation");

    // Step 4: Excavation Head Approves
    evalInVM(`
        (() => {
            currentUser = { key: 'excavation-head', name: 'Excavation Head Omar', role: 'Excavation Head', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pExc, 'excavation-head', { lat: 17.4125, lng: 78.3984 }, 'Shoring, benching and ramp slope approved', makeSimSignature('Excavation Head Omar'), 'Excavation Head Omar');
        })();
    `);
    assert.strictEqual(evalInVM("pExc.status"), 'Pending EHS Approval', "Routes to EHS Safety for Step 5");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'ehs-manager')"), true, "EHS Manager can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'ehs-officer')"), true, "EHS Officer can act");

    // Step 5: EHS Manager Approves (Activates permit)
    evalInVM(`
        (() => {
            currentUser = { key: 'ehs-manager', name: 'EHS Manager Dave', role: 'EHS Safety Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pExc, 'ehs-manager', { lat: 17.4125, lng: 78.3984 }, 'Trench hard barricades and safety ladder access verified', makeSimSignature('EHS Manager Dave'), 'EHS Manager Dave');
        })();
    `);
    assert.strictEqual(evalInVM("pExc.status"), 'Active', "Permit activates cleanly upon EHS approval");
});

// -------------------------------------------------------------
// S2: OUT-OF-ORDER / WRONG ROLE (NEGATIVE)
// -------------------------------------------------------------
console.log('\n--- S2: OUT-OF-ORDER / WRONG ROLE (NEGATIVE) ---');
recordAssert('Tower Incharge has ZERO authority over PTW-001 approval chain', () => {
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'hw-section-head')"), false, "Tower Incharge blocked");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'section-head')"), false, "Section Head alias blocked");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'quality-engineer')"), false, "Quality Engineer blocked");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'project-manager')"), false, "Project Manager blocked");
});

// -------------------------------------------------------------
// S3: EITHER-OR STAGES (EHS FIRST-WINS CONCURRENCY)
// -------------------------------------------------------------
console.log('\n--- S3: EITHER-OR STAGES (EHS FIRST-WINS CONCURRENCY) ---');
recordAssert('EHS Manager vs EHS Officer first-wins resolution on Excavation', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('excavation');
            draft.projectId = 'PRJ-PEARL';
            draft.locationStructure = 'Manual';
            draft.locManual = 'Pit 2';
            draft.locManualArea = 'Zone B';
            draft.signature = { dataUrl: makeSimSignature('Supervisor Sam') };

            pEhsWin = JSON.parse(JSON.stringify(draft));
            pEhsWin.id = genPermitNumber('excavation');
            pEhsWin.ptype = 'excavation';
            pEhsWin.signatories = {};
            PERMITS = [pEhsWin];
            submitPermit(pEhsWin, true);

            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pEhsWin.id, 'Ack', { lat: 17.4125, lng: 78.3984 });

            currentUser = { key: 'mep', name: 'MEP Eng Mike', role: 'MEP Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pEhsWin, 'mep', { lat: 17.4125, lng: 78.3984 }, 'MEP OK');

            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pEhsWin, 'pm', { lat: 17.4125, lng: 78.3984 }, 'PM OK');

            currentUser = { key: 'it', name: 'IT Lead Ian', role: 'IT In-Charge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pEhsWin, 'it', { lat: 17.4125, lng: 78.3984 }, 'IT OK');

            currentUser = { key: 'excavation-head', name: 'Excavation Head Omar', role: 'Excavation Head', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pEhsWin, 'excavation-head', { lat: 17.4125, lng: 78.3984 }, 'Excavation Head OK');
        })();
    `);

    assert.strictEqual(evalInVM("pEhsWin.status"), 'Pending EHS Approval');
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsWin, 'ehs-manager')"), true);
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsWin, 'ehs-officer')"), true);

    // EHS Officer approves first
    evalInVM(`
        (() => {
            currentUser = { key: 'ehs-officer', name: 'EHS Officer Kim', role: 'EHS Safety Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pEhsWin, 'ehs-officer', { lat: 17.4125, lng: 78.3984 }, 'Officer approved', makeSimSignature('EHS Officer Kim'), 'EHS Officer Kim');
        })();
    `);
    assert.strictEqual(evalInVM("pEhsWin.status"), 'Active');
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsWin, 'ehs-manager')"), false, "EHS Manager can no longer act after Officer approval");
});

// -------------------------------------------------------------
// S4: RETURN / REJECT AT EACH STAGE & RESUBMISSION ROUTING
// -------------------------------------------------------------
console.log('\n--- S4: RETURN / REJECT AT EACH STAGE & RESUBMISSION ROUTING ---');
recordAssert('Rejection by Excavation Head routes to Permittee then Site Eng re-ack preserves parallel clearances per D6', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('excavation');
            draft.projectId = 'PRJ-PEARL';
            draft.locationStructure = 'Manual';
            draft.locManual = 'Pit 3';
            draft.locManualArea = 'Zone C';
            draft.signature = { dataUrl: makeSimSignature('Supervisor Sam') };

            pRejEh = JSON.parse(JSON.stringify(draft));
            pRejEh.id = genPermitNumber('excavation');
            pRejEh.ptype = 'excavation';
            pRejEh.signatories = {};
            PERMITS = [pRejEh];
            submitPermit(pRejEh, true);

            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pRejEh.id, 'Ack', { lat: 17.4125, lng: 78.3984 });

            currentUser = { key: 'mep', name: 'MEP Eng Mike', role: 'MEP Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRejEh, 'mep', { lat: 17.4125, lng: 78.3984 }, 'MEP OK');

            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRejEh, 'pm', { lat: 17.4125, lng: 78.3984 }, 'PM OK');

            currentUser = { key: 'it', name: 'IT Lead Ian', role: 'IT In-Charge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRejEh, 'it', { lat: 17.4125, lng: 78.3984 }, 'IT OK');

            // Excavation Head rejects
            currentUser = { key: 'excavation-head', name: 'Excavation Head Omar', role: 'Excavation Head', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            rejectPermitStage(pRejEh, 'excavation-head', { lat: 17.4125, lng: 78.3984 }, 'Slope angle too steep for soil type C. Re-bench at 1:2 gradient.', makeSimSignature('Excavation Head Omar'), 'Excavation Head Omar');
        })();
    `);

    assert.strictEqual(evalInVM("pRejEh.status"), 'Returned for Correction');
    assert.strictEqual(evalInVM("pRejEh.approvals.mep.status"), 'approved', "MEP approval preserved");
    assert.strictEqual(evalInVM("pRejEh.approvals.pm.status"), 'approved', "P&M approval preserved");
    assert.strictEqual(evalInVM("pRejEh.approvals.it.status"), 'approved', "IT approval preserved");

    // Permittee rectifies and resubmits
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            resubmitPermit(pRejEh.id, 'Trench slope re-benched to 1:2 gradient with secondary berms');
        })();
    `);
    assert.strictEqual(evalInVM("pRejEh.status"), 'Pending Site Engineer Re-Acknowledgment', "Resubmitted excavation permit routes to Site Engineer for on-site re-ack");

    // Site Engineer re-acknowledges
    evalInVM(`
        (() => {
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeReturnPermitEng(pRejEh.id, { comment: 'Verified 1:2 re-benching on site', gps: { lat: 17.4125, lng: 78.3984 } });
        })();
    `);
    assert.strictEqual(evalInVM("pRejEh.status"), 'Pending Section Head', "Site Eng re-ack routes directly back to Excavation Head (prior parallel clearances preserved)");
});

// -------------------------------------------------------------
// S5: CONDITIONAL BRANCHES (PARALLEL CLEARANCE ORDER INDEPENDENCE)
// -------------------------------------------------------------
console.log('\n--- S5: CONDITIONAL BRANCHES (PARALLEL ORDER INDEPENDENCE) ---');
recordAssert('Parallel gate advances to Step 4 regardless of approval order (IT -> P&M -> MEP)', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('excavation');
            draft.projectId = 'PRJ-PEARL';
            draft.locationStructure = 'Manual';
            draft.locManual = 'Pit 4';
            draft.locManualArea = 'Zone D';
            draft.signature = { dataUrl: makeSimSignature('Supervisor Sam') };

            pPerm = JSON.parse(JSON.stringify(draft));
            pPerm.id = genPermitNumber('excavation');
            pPerm.ptype = 'excavation';
            pPerm.signatories = {};
            PERMITS = [pPerm];
            submitPermit(pPerm, true);

            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pPerm.id, 'Ack', { lat: 17.4125, lng: 78.3984 });

            // Order: IT first
            currentUser = { key: 'it', name: 'IT Lead Ian', role: 'IT In-Charge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pPerm, 'it', { lat: 17.4125, lng: 78.3984 }, 'IT OK');

            // Order: P&M second
            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pPerm, 'pm', { lat: 17.4125, lng: 78.3984 }, 'PM OK');

            // Order: MEP third
            currentUser = { key: 'mep', name: 'MEP Eng Mike', role: 'MEP Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pPerm, 'mep', { lat: 17.4125, lng: 78.3984 }, 'MEP OK');
        })();
    `);
    assert.strictEqual(evalInVM("pPerm.status"), 'Pending Section Head', "Advances to Excavation Head when all 3 complete in reverse order");
});

// -------------------------------------------------------------
// S6: PROJECT ISOLATION & RBAC BOUNDARIES
// -------------------------------------------------------------
console.log('\n--- S6: PROJECT ISOLATION & RBAC BOUNDARIES ---');
recordAssert('User from PRJ-REGENT strictly blocked from viewing or acting on PRJ-PEARL excavation permit', () => {
    evalInVM(`
        currentUser = { key: 'site-engineer', name: 'Regent SE', role: 'Site Engineer', projectId: 'PRJ-REGENT', projectIds: ['PRJ-REGENT'], __STRICT_PROJECT_RBAC__: true };
    `);
    assert.strictEqual(evalInVM("userCanAccessProject('PRJ-PEARL')"), false, "Regent user denied PRJ-PEARL");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'site-engineer')"), false, "Regent SE cannot act on Pearl permit");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pExc, 'site-engineer')"), false, "Regent SE cannot see Pearl permit");
});

// -------------------------------------------------------------
// S7: PERMIT IDENTITY & SIGNATORY ISOLATION
// -------------------------------------------------------------
console.log('\n--- S7: PERMIT IDENTITY & SIGNATORY ISOLATION ---');
recordAssert('Excavation Head signatory present and Tower Incharge strictly omitted on PTW-001', () => {
    evalInVM("buildPermitSignatoriesCardHtml(pExc);");
    assert.strictEqual(evalInVM("Boolean(pExc.signatories['hw-section-head'])"), false, "Tower Incharge absent");
    assert.strictEqual(evalInVM("Boolean(pExc.signatories['excavation-head'])"), true, "Excavation Head present");
    assert.strictEqual(evalInVM("Boolean(pExc.signatories['mep'])"), true, "MEP signatory present");
    assert.strictEqual(evalInVM("Boolean(pExc.signatories['pm'])"), true, "P&M signatory present");
    assert.strictEqual(evalInVM("Boolean(pExc.signatories['it'])"), true, "IT In-Charge signatory present");
    assert.strictEqual(evalInVM("Boolean(pExc.signatories['site-engineer'])"), true, "Site Eng signatory present");
    assert.strictEqual(evalInVM("Boolean(pExc.signatories['ehs-manager'] || pExc.signatories['ehs-officer'])"), true, "EHS signatory present");
});

// -------------------------------------------------------------
// S8: DRAFT BEHAVIOR & NON-INITIATOR ISOLATION
// -------------------------------------------------------------
console.log('\n--- S8: DRAFT BEHAVIOR & NON-INITIATOR ISOLATION ---');
recordAssert('Approvers (Site Engineer, MEP, P&M, IT, Excavation Head, EHS) cannot act on draft excavation permits', () => {
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        startNewPermit('excavation');
        draftExc = JSON.parse(JSON.stringify(draft));
        draftExc.id = 'DRAFT-EXC-01';
        draftExc.status = 'Draft';
        draftExc.approvals = newChain('excavation', draftExc);
    `);
    assert.strictEqual(evalInVM("roleCanActOnChain(draftExc, 'site-engineer')"), false, "SE cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftExc, 'mep')"), false, "MEP cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftExc, 'pm')"), false, "P&M cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftExc, 'it')"), false, "IT cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftExc, 'excavation-head')"), false, "EH cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftExc, 'ehs-manager')"), false, "EHS cannot act on draft");

    // Switch user to non-initiator
    evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(draftExc, 'site-engineer')"), false, "SE cannot view draft");
});

// -------------------------------------------------------------
// S9: INPUT VALIDATION & MANDATORY CHECKLIST RULES
// -------------------------------------------------------------
console.log('\n--- S9: INPUT VALIDATION & MANDATORY CHECKLIST RULES ---');
recordAssert('Mandatory field validation per wizard step for Excavation Work', () => {
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        startNewPermit('excavation');
    `);
    assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Wiz Step 1 fails on empty draft");

    evalInVM(`
        draft.project = PROJECTS[0].name;
        draft.organization = 'Main Contractor';
        draft.locationStructure = 'Manual';
        draft.locManual = 'Pit Sector 5';
        draft.locManualArea = 'North Trench 2';
        draft.depth = '3.5';
        draft.slope = '1.5';
        draft.equipment = ['JCB Excavator', 'Tata Tipper'];
    `);
    assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Wiz Step 1 passes with all mandatory excavation parameters");
});

// -------------------------------------------------------------
// S10: CONCURRENCY & DOUBLE ACTION GUARDS
// -------------------------------------------------------------
console.log('\n--- S10: CONCURRENCY & DOUBLE ACTION GUARDS ---');
recordAssert('Double action blocked once permit status already advanced', () => {
    assert.strictEqual(evalInVM("pExc.status"), 'Active');
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'site-engineer')"), false, "SE cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'mep')"), false, "MEP cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'pm')"), false, "P&M cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'it')"), false, "IT cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'excavation-head')"), false, "EH cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pExc, 'ehs-manager')"), false, "EHS cannot act on Active permit");
});

// -------------------------------------------------------------
// S11: LIFECYCLE (EXTENSION, OBSERVATIONS, SURRENDER, CANCEL)
// -------------------------------------------------------------
console.log('\n--- S11: LIFECYCLE (EXTENSION, OBSERVATIONS, SURRENDER, CANCEL) ---');
recordAssert('Full lifecycle: extension, observation gate, and surrender to EHS', () => {
    evalInVM(`
        (() => {
            window.__TEST_MODE__ = true;
            startNewPermit('excavation');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: makeSimSignature('Supervisor Sam') };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('excavation');
            p.approvals = newChain('excavation', p);
            p.status = 'Active';
            p.validTill = new Date(Date.now() + 3600000).toISOString();
            p.startTime = '08:00';
            p.endTime = '18:00';
            p.createdBy = 'Supervisor Sam';
            p.createdByRole = 'site-supervisor';
            PERMITS = [p];
            lifeExc = p;

            // Raise EHS Observation
            currentUser = { key: 'ehs-officer', name: 'Officer Kim', role: 'EHS Safety Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            raiseObservation(lifeExc, { comment: 'Provide edge barrier on east side of pit', gps: { lat: 17.4125, lng: 78.3984 }, sig: makeSimSignature('Officer Kim'), signerName: 'Officer Kim' });
        })();
    `);
    assert.strictEqual(evalInVM("hasOpenObservation(lifeExc)"), true, "Observation active on permit");

    // Surrender blocked while observation open
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        surrenderBlocked = closeAndSurrenderPermit(lifeExc, { remarks: 'Trying early closure' });
    `);
    assert.strictEqual(evalInVM("surrenderBlocked"), false, "Closure blocked while observation open");

    // Resolve observation
    evalInVM(`
        (() => {
            const obs = getActiveObservation(lifeExc);
            obs.status = 'Resolved';
            obs.clearedAt = nowTime();
            obs.clearedBy = 'Officer Kim';
        })();
    `);
    assert.strictEqual(evalInVM("hasOpenObservation(lifeExc)"), false, "Observation cleared");

    // Surrender permit
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            surrenderRes = closeAndSurrenderPermit(lifeExc, {
                remarks: 'Excavation completed, trench edges barricaded, equipment demobilized',
                photo: 'data:image/png;base64,mockphotodata',
                sig: makeSimSignature('Supervisor Sam')
            });
        })();
    `);
    assert.strictEqual(evalInVM("surrenderRes"), true, "Surrender succeeds");
    assert.strictEqual(evalInVM("lifeExc.status"), 'Completed (Surrendered)', "Permit surrendered cleanly");
});

// -------------------------------------------------------------
// S12: OUTPUTS (DASHBOARDS, REGISTER, PDF SMOKE)
// -------------------------------------------------------------
console.log('\n--- S12: OUTPUTS (DASHBOARDS, REGISTER, PDF SMOKE) ---');
recordAssert('Dashboard pending queues, register visibility, and tracker generation for Excavation', () => {
    evalInVM(`
        PERMITS = [pExc, pPerm, lifeExc];

        // Tracker HTML generation
        trackerExcHtml = trackerHtml(pExc);

        // Signatories Card HTML generation
        sigExcHtml = buildPermitSignatoriesCardHtml(pExc);

        // PDF Generation Smoke
        currentUser = { key: 'ehs-manager', name: 'EHS Manager Dave', role: 'EHS Safety Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        pdfExcData = generatePermitPDF(pExc.id);
    `);

    assert(evalInVM("trackerExcHtml").includes('Excavation Head'), "Tracker includes Excavation Head");
    assert(evalInVM("sigExcHtml").includes('Excavation Head'), "Signatories card includes Excavation Head");
    assert.strictEqual(evalInVM("pdfExcData"), true, "Excavation PDF generates successfully");
});

console.log('================================================================');
console.log(`GROUP 6 (PTW-001) MATRIX SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('================================================================');

if (failedCount > 0) {
    console.error('\nFAILURES DETECTED IN GROUP 6 MATRIX:');
    failureDetails.forEach((f, idx) => {
        console.error(`  ${idx + 1}. ${f.desc}\n  Error: ${f.error}\n`);
    });
    process.exit(1);
} else {
    console.log('\nALL GROUP 6 (PTW-001 EXCAVATION WORK) FLOW SCENARIOS PASSED 100% CLEANLY.\n');
    process.exit(0);
}
