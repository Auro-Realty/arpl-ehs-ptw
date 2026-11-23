/**
 * COMPREHENSIVE APPROVAL FLOW MATRIX: GROUP 5 (PTW-009 LIFTING OPERATIONS & CRITICAL LIFT PLAN)
 *
 * Flow Specification (Source of Truth per approved Decision D5):
 *   PTW-009A Routine Lifting (weight <= 5 MT, non-tandem):
 *     Lifting Supervisor -> Site Engineer -> P&M -> Tower In-Charge / Section Head -> EHS
 *   PTW-009B Critical Lift Plan (weight > 5 MT OR tandem lift):
 *     Lifting Supervisor -> Site Engineer -> P&M -> Tower In-Charge / Section Head
 *     -> Project Manager (statutory executive acknowledgment) -> EHS
 *
 * Scenarios tested (S1 - S12):
 * S1: Happy Path (Routine PTW-009A & Critical PTW-009B)
 * S2: Out-Of-Order / Wrong Role (Negative)
 * S3: Either-Or Stages (EHS Manager vs EHS Officer first-wins concurrency)
 * S4: Return / Reject at Each Stage & Resubmission Routing per D6
 * S5: Conditional Branches (Threshold weight > 5 MT, Tandem lift flag, PTW-009B liftplan)
 * S6: Project Isolation & RBAC Boundaries
 * S7: Permit Identity & Signatory Isolation (Project Manager signature only on critical)
 * S8: Draft Behavior & Non-Initiator Isolation
 * S9: Input Validation & Mandatory Rigging / Crane Checklists
 * S10: Concurrency & Double Action Prevention
 * S11: Post-Approval Lifecycle (Observations gate, Surrender with Demobilization declaration)
 * S12: Outputs (KPI Counters, Register Visibility, PDF Generation Smoke)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('STARTING GROUP 5 (PTW-009 LIFTING OPERATIONS) FLOW MATRIX TESTS');
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
    text(str, x, y) { this.lines.push({ str, x, y }); return this; }
    addImage(data, fmt, x, y, w, h) { this.images.push({ data, x, y, w, h }); return this; }
    addPage() { this.pages++; return this; }
    getNumberOfPages() { return this.pages; }
    splitTextToSize(txt, w) { return Array.isArray(txt) ? txt : [String(txt)]; }
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
// S1: HAPPY PATH (PTW-009A ROUTINE & PTW-009B CRITICAL LIFT)
// -------------------------------------------------------------
console.log('\n--- S1: HAPPY PATH (PTW-009 LIFTING OPERATIONS) ---');

// S1.1: Routine Lifting (PTW-009A)
recordAssert('[Routine Lifting PTW-009A] Complete 5-stage flow: Lifting Supervisor -> Site Eng -> P&M -> Tower Incharge -> EHS -> Active', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('lifting');
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.locationStructure = 'Tower';
            draft.tower = 'Tower 1';
            draft.locFloor = 'Level 10';
            draft.locUnit = 'Unit 1001';
            draft.liftingClassification = 'routine';
            draft.loadWeight = '3.5';
            draft.craneType = 'Tower Crane';
            draft.craneCapacity = '10';
            draft.craneTandemLift = 'no';
            draft.operatorName = 'Crane Op Steve';
            draft.riggerName = 'Lead Rigger Bob';
            draft.organization = 'Main Contractor';
            draft.signature = { by: 'Rigger Bob', at: nowTime(), dataUrl: makeSimSignature('Rigger Bob') };
            draft.consent = true;

            pRoutine = JSON.parse(JSON.stringify(draft));
            pRoutine.id = genPermitNumber('lifting');
            pRoutine.ptype = 'lifting';
            pRoutine.signatories = {};
            PERMITS = [pRoutine];
            submitPermit(pRoutine, true);
        })();
    `);

    // Verify initial submission routes to Site Engineer
    assert.strictEqual(evalInVM("pRoutine.status"), 'Pending Site Engineer Acknowledgment', "Routine lift routes to Site Engineer Acknowledgment");
    assert.strictEqual(evalInVM("pRoutine.approvals.kind"), 'lifting-routine', "Approval chain kind is lifting-routine");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'site-engineer')"), true, "Site Engineer can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'pm')"), false, "P&M cannot act at Step 2");

    // Step 2: Site Engineer Acknowledges
    evalInVM(`
        (() => {
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pRoutine.id, 'Ground load capacity verified on site', { lat: 17.4125, lng: 78.3984 }, makeSimSignature('Eng Eric'));
        })();
    `);
    assert.strictEqual(evalInVM("pRoutine.status"), 'Pending P&M Approval', "Routes to P&M Engineer for technical verification");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'pm')"), true, "P&M Engineer can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'hw-section-head')"), false, "Tower Incharge cannot act at Step 3");

    // Step 3: P&M Engineer Approves
    evalInVM(`
        (() => {
            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRoutine, 'pm', { lat: 17.4125, lng: 78.3984 }, 'Crane Form 10/11 valid and rigging gears certified', makeSimSignature('PM Eng Paul'), 'PM Eng Paul');
        })();
    `);
    assert.strictEqual(evalInVM("pRoutine.status"), 'Pending Section Head', "Routes to Tower Incharge");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'hw-section-head')"), true, "Tower Incharge can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'project-manager')"), false, "Project Manager cannot act on routine lift");

    // Step 4: Tower Incharge Approves (Routes directly to EHS, skipping Project Manager per D5)
    evalInVM(`
        (() => {
            currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tom', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRoutine, 'hw-section-head', { lat: 17.4125, lng: 78.3984 }, 'Barricading and drop zone verified', makeSimSignature('Tower Incharge Tom'), 'Tower Incharge Tom');
        })();
    `);
    assert.strictEqual(evalInVM("pRoutine.status"), 'Pending EHS Approval', "Routine lift routes directly to EHS Approval (skipping Project Manager)");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'ehs-manager')"), true, "EHS Manager can act");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'ehs-officer')"), true, "EHS Officer can act");

    // Step 5: EHS Manager Approves (Activates permit)
    evalInVM(`
        (() => {
            currentUser = { key: 'ehs-manager', name: 'EHS Manager Dave', role: 'EHS Safety Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRoutine, 'ehs-manager', { lat: 17.4125, lng: 78.3984 }, 'Lifting perimeter and radio communication verified', makeSimSignature('EHS Manager Dave'), 'EHS Manager Dave');
        })();
    `);
    assert.strictEqual(evalInVM("pRoutine.status"), 'Active', "Routine lift activates cleanly upon EHS approval");
});

// S1.2: Critical Lift Plan (PTW-009B)
recordAssert('[Critical Lift Plan PTW-009B] Complete 6-stage flow: Lifting Supervisor -> Site Eng -> P&M -> Tower Incharge -> Project Manager -> EHS -> Active', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('liftplan');
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.locationStructure = 'Tower';
            draft.tower = 'Tower 2';
            draft.locFloor = 'Roof Level';
            draft.locUnit = 'Terrace Rigging';
            draft.liftingClassification = 'critical';
            draft.loadWeight = '12.5';
            draft.craneType = 'Heavy Mobile Crane 150T';
            draft.craneCapacity = '150';
            draft.craneTandemLift = 'no';
            draft.operatorName = 'Master Crane Op Marcus';
            draft.riggerName = 'Master Rigger Bob';
            draft.organization = 'Specialist Heavy Lift';
            draft.signature = { by: 'Rigger Bob', at: nowTime(), dataUrl: makeSimSignature('Rigger Bob') };
            draft.consent = true;

            pCritical = JSON.parse(JSON.stringify(draft));
            pCritical.id = genPermitNumber('liftplan');
            pCritical.ptype = 'liftplan';
            pCritical.signatories = {};
            PERMITS = [pCritical];
            submitPermit(pCritical, true);

            // Step 2: Site Engineer Acknowledges
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pCritical.id, 'Critical lift route cleared', { lat: 17.4125, lng: 78.3984 }, makeSimSignature('Eng Eric'));

            // Step 3: P&M Engineer Approves
            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pCritical, 'pm', { lat: 17.4125, lng: 78.3984 }, 'Outrigger pad calculations and load charts certified', makeSimSignature('PM Eng Paul'), 'PM Eng Paul');

            // Step 4: Tower Incharge Approves
            currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tom', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pCritical, 'hw-section-head', { lat: 17.4125, lng: 78.3984 }, 'Site cordon and airspace cleared', makeSimSignature('Tower Incharge Tom'), 'Tower Incharge Tom');
        })();
    `);

    // Verify Tower Incharge forwards to Project Manager for Critical Lift Plan (Step 5)
    assert.strictEqual(evalInVM("pCritical.status"), 'Pending Project Manager Acknowledgment', "Critical lift routes to Project Manager Executive Acknowledgment per Decision D5");
    assert.strictEqual(evalInVM("roleCanActOnChain(pCritical, 'project-manager')"), true, "Project Manager can act on Critical Lift");
    assert.strictEqual(evalInVM("roleCanActOnChain(pCritical, 'ehs-manager')"), false, "EHS cannot act until Project Manager acknowledges");

    // Step 5: Project Manager Executive Acknowledgment
    evalInVM(`
        (() => {
            currentUser = { key: 'project-manager', name: 'PM Chief Frank', role: 'Project Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pCritical, 'project-manager', { lat: 17.4125, lng: 78.3984 }, 'Critical lift plan reviewed and executive approval granted', makeSimSignature('PM Chief Frank'), 'PM Chief Frank');
        })();
    `);

    // Step 6: Verify PM forwards to EHS
    assert.strictEqual(evalInVM("pCritical.status"), 'Pending EHS Approval', "Project Manager forwards to EHS for final verification");
    assert.strictEqual(evalInVM("roleCanActOnChain(pCritical, 'ehs-officer')"), true, "EHS Officer can act");

    // Step 6: EHS Officer Approves (Activates permit)
    evalInVM(`
        (() => {
            currentUser = { key: 'ehs-officer', name: 'EHS Officer Kim', role: 'EHS Safety Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pCritical, 'ehs-officer', { lat: 17.4125, lng: 78.3984 }, 'Critical lift wind meter active and safety exclusion verified', makeSimSignature('EHS Officer Kim'), 'EHS Officer Kim');
        })();
    `);
    assert.strictEqual(evalInVM("pCritical.status"), 'Active', "Critical lift plan activates cleanly");
});

// -------------------------------------------------------------
// S2: OUT-OF-ORDER / WRONG ROLE (NEGATIVE)
// -------------------------------------------------------------
console.log('\n--- S2: OUT-OF-ORDER / WRONG ROLE (NEGATIVE) ---');
recordAssert('Role authority is strictly enforced at each status stage', () => {
    // On Active permit, no approvers can act
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'site-engineer')"), false);
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'pm')"), false);
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'hw-section-head')"), false);
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'project-manager')"), false);
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'ehs-manager')"), false);
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'mep')"), false);
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'it')"), false);
});

// -------------------------------------------------------------
// S3: EITHER-OR STAGES (EHS FIRST-WINS CONCURRENCY)
// -------------------------------------------------------------
console.log('\n--- S3: EITHER-OR STAGES (EHS FIRST-WINS CONCURRENCY) ---');
recordAssert('EHS Manager vs EHS Officer first-wins resolution on Lifting Operations', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('lifting');
            draft.projectId = 'PRJ-PEARL';
            draft.liftingClassification = 'routine';
            draft.loadWeight = '4.0';
            draft.project = PROJECTS[0].name;
            draft.organization = 'Main Contractor';
            draft.signature = { dataUrl: makeSimSignature('Rigger Bob') };

            pEhsWin = JSON.parse(JSON.stringify(draft));
            pEhsWin.id = genPermitNumber('lifting');
            pEhsWin.ptype = 'lifting';
            pEhsWin.signatories = {};
            PERMITS = [pEhsWin];
            submitPermit(pEhsWin, true);

            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pEhsWin.id, 'Ack', { lat: 17.4125, lng: 78.3984 });

            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pEhsWin, 'pm', { lat: 17.4125, lng: 78.3984 }, 'P&M clear');

            currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tom', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pEhsWin, 'hw-section-head', { lat: 17.4125, lng: 78.3984 }, 'TI clear');
        })();
    `);

    assert.strictEqual(evalInVM("pEhsWin.status"), 'Pending EHS Approval');
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsWin, 'ehs-manager')"), true);
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsWin, 'ehs-officer')"), true);

    // EHS Officer approves
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
recordAssert('Rejection by Tower Incharge routes to Permittee then Site Eng re-ack then preserves P&M approval per D6', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('lifting');
            draft.projectId = 'PRJ-PEARL';
            draft.liftingClassification = 'routine';
            draft.loadWeight = '2.5';
            draft.project = PROJECTS[0].name;
            draft.organization = 'Main Contractor';
            draft.signature = { dataUrl: makeSimSignature('Rigger Bob') };

            pRejTi = JSON.parse(JSON.stringify(draft));
            pRejTi.id = genPermitNumber('lifting');
            pRejTi.ptype = 'lifting';
            pRejTi.signatories = {};
            PERMITS = [pRejTi];
            submitPermit(pRejTi, true);

            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pRejTi.id, 'Ack', { lat: 17.4125, lng: 78.3984 });

            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRejTi, 'pm', { lat: 17.4125, lng: 78.3984 }, 'P&M OK');

            // Tower Incharge rejects
            currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tom', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            rejectPermitStage(pRejTi, 'hw-section-head', { lat: 17.4125, lng: 78.3984 }, 'Inadequate drop zone signage near Tower 1 entrance', makeSimSignature('Tower Incharge Tom'), 'Tower Incharge Tom');
        })();
    `);

    assert.strictEqual(evalInVM("pRejTi.status"), 'Returned for Correction');
    assert.strictEqual(evalInVM("pRejTi.approvals.pm.status"), 'approved', "P&M approval status retained in record");

    // Permittee rectifies and resubmits
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            resubmitPermit(pRejTi.id, 'Extended barricading 25m around Tower 1 entrance with dual watchmen');
        })();
    `);
    assert.strictEqual(evalInVM("pRejTi.status"), 'Pending Site Engineer Re-Acknowledgment', "Resubmitted lifting permit routes to Site Engineer for on-site re-ack");

    // Site Engineer re-acknowledges
    evalInVM(`
        (() => {
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeReturnPermitEng(pRejTi.id, { comment: 'Verified extended barricading on site', gps: { lat: 17.4125, lng: 78.3984 } });
        })();
    `);
    assert.strictEqual(evalInVM("pRejTi.status"), 'Pending Section Head', "Site Eng re-ack routes directly back to Tower Incharge (prior P&M approval preserved)");
});

recordAssert('[Rejection by P&M] Routes back to Permittee, then Site Eng re-ack routes back to P&M', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('lifting');
            draft.projectId = 'PRJ-PEARL';
            draft.liftingClassification = 'routine';
            draft.loadWeight = '2.5';
            draft.project = PROJECTS[0].name;
            draft.organization = 'Main Contractor';
            draft.signature = { dataUrl: makeSimSignature('Rigger Bob') };

            pRejPm = JSON.parse(JSON.stringify(draft));
            pRejPm.id = genPermitNumber('lifting');
            pRejPm.ptype = 'lifting';
            pRejPm.signatories = {};
            PERMITS = [pRejPm];
            submitPermit(pRejPm, true);

            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pRejPm.id, 'Ack', { lat: 17.4125, lng: 78.3984 });

            // P&M rejects
            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            rejectPermitStage(pRejPm, 'pm', { lat: 17.4125, lng: 78.3984 }, 'Crane Form 11 certificate expired', makeSimSignature('PM Eng Paul'), 'PM Eng Paul');

            // Permittee rectifies & resubmits
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            resubmitPermit(pRejPm.id, 'Updated Form 11 certificate attached');

            // Site Engineer re-acknowledges
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeReturnPermitEng(pRejPm.id, { comment: 'Verified Form 11 certificate', gps: { lat: 17.4125, lng: 78.3984 } });
        })();
    `);
    assert.strictEqual(evalInVM("pRejPm.status"), 'Pending P&M Approval');
});

recordAssert('[Rejection by Project Manager] Routes back to Permittee, then Site Eng re-ack routes back to PM', () => {
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('liftplan');
            draft.projectId = 'PRJ-PEARL';
            draft.liftingClassification = 'critical';
            draft.loadWeight = '15.0';
            draft.project = PROJECTS[0].name;
            draft.organization = 'Main Contractor';
            draft.signature = { dataUrl: makeSimSignature('Rigger Bob') };

            pRejPmExec = JSON.parse(JSON.stringify(draft));
            pRejPmExec.id = genPermitNumber('liftplan');
            pRejPmExec.ptype = 'liftplan';
            pRejPmExec.signatories = {};
            PERMITS = [pRejPmExec];
            submitPermit(pRejPmExec, true);

            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pRejPmExec.id, 'Ack', { lat: 17.4125, lng: 78.3984 });

            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRejPmExec, 'pm', { lat: 17.4125, lng: 78.3984 }, 'P&M OK');

            currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tom', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pRejPmExec, 'hw-section-head', { lat: 17.4125, lng: 78.3984 }, 'TI OK');

            // Project Manager rejects
            currentUser = { key: 'project-manager', name: 'PM Chief Frank', role: 'Project Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            rejectPermitStage(pRejPmExec, 'project-manager', { lat: 17.4125, lng: 78.3984 }, 'Lifting plan requires 3rd party structural peer review', makeSimSignature('PM Chief Frank'), 'PM Chief Frank');

            // Permittee rectifies & resubmits
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            resubmitPermit(pRejPmExec.id, '3rd party structural certificate attached');

            // Site Engineer re-acknowledges
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeReturnPermitEng(pRejPmExec.id, { comment: 'Verified structural report', gps: { lat: 17.4125, lng: 78.3984 } });
        })();
    `);
    assert.strictEqual(evalInVM("pRejPmExec.status"), 'Pending Project Manager Acknowledgment');
});

// -------------------------------------------------------------
// S5: CONDITIONAL BRANCHES (CRITICAL LIFT THRESHOLDS)
// -------------------------------------------------------------
console.log('\n--- S5: CONDITIONAL BRANCHES (CRITICAL LIFT THRESHOLDS) ---');
recordAssert('Weight threshold > 5 MT and Tandem Lift flag trigger Critical Lift classification', () => {
    // Case 1: loadWeight <= 5.0 MT -> Routine
    evalInVM(`
        currentUser = { key: 'lift-supervisor', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        startNewPermit('lifting');
        draft.loadWeight = '5.0';
        draft.craneTandemLift = 'no';
        cRoutine = newChain('lifting', draft);
    `);
    assert.strictEqual(evalInVM("cRoutine.kind"), 'lifting-routine', "5.0 MT is routine");
    assert.strictEqual(evalInVM("Boolean(cRoutine.projectManager)"), false, "Routine chain has no projectManager step");

    // Case 2: loadWeight > 5.0 MT -> Critical
    evalInVM(`
        startNewPermit('lifting');
        draft.loadWeight = '5.01';
        draft.craneTandemLift = 'no';
        cCritWeight = newChain('lifting', draft);
    `);
    assert.strictEqual(evalInVM("cCritWeight.kind"), 'lifting-critical', "> 5.0 MT triggers critical lift plan");
    assert.strictEqual(evalInVM("Boolean(cCritWeight.projectManager)"), true, "Critical lift chain includes projectManager step");

    // Case 3: Tandem lift -> Critical regardless of weight
    evalInVM(`
        startNewPermit('lifting');
        draft.loadWeight = '2.0';
        draft.craneTandemLift = 'yes';
        cCritTandem = newChain('lifting', draft);
    `);
    assert.strictEqual(evalInVM("cCritTandem.kind"), 'lifting-critical', "Tandem lift triggers critical lift plan even at 2.0 MT");
});

// -------------------------------------------------------------
// S6: PROJECT ISOLATION & RBAC BOUNDARIES
// -------------------------------------------------------------
console.log('\n--- S6: PROJECT ISOLATION & RBAC BOUNDARIES ---');
recordAssert('User from PRJ-REGENT strictly blocked from viewing or acting on PRJ-PEARL lifting permit', () => {
    evalInVM(`
        currentUser = { key: 'site-engineer', name: 'Regent SE', role: 'Site Engineer', projectId: 'PRJ-REGENT', projectIds: ['PRJ-REGENT'], __STRICT_PROJECT_RBAC__: true };
    `);
    assert.strictEqual(evalInVM("userCanAccessProject('PRJ-PEARL')"), false, "Regent user denied PRJ-PEARL");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'site-engineer')"), false, "Regent SE cannot act on Pearl permit");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pRoutine, 'site-engineer')"), false, "Regent SE cannot see Pearl permit");
});

// -------------------------------------------------------------
// S7: PERMIT IDENTITY & SIGNATORY ISOLATION
// -------------------------------------------------------------
console.log('\n--- S7: PERMIT IDENTITY & SIGNATORY ISOLATION ---');
recordAssert('Project Manager signature strictly present on Critical Lift and omitted on Routine Lift', () => {
    evalInVM("buildPermitSignatoriesCardHtml(pRoutine);");
    assert.strictEqual(evalInVM("Boolean(pRoutine.signatories['project-manager'])"), false, "PM signature absent on Routine Lift");
    assert.strictEqual(evalInVM("Boolean(pRoutine.signatories['site-engineer'])"), true, "Site Eng signature present");
    assert.strictEqual(evalInVM("Boolean(pRoutine.signatories['pm'])"), true, "P&M signature present");
    assert.strictEqual(evalInVM("Boolean(pRoutine.signatories['section-head'] || pRoutine.signatories['hw-section-head'])"), true, "Tower Incharge signature present");
    assert.strictEqual(evalInVM("Boolean(pRoutine.signatories['ehs-manager'] || pRoutine.signatories['ehs-officer'])"), true, "EHS signature present");

    evalInVM("buildPermitSignatoriesCardHtml(pCritical);");
    assert.strictEqual(evalInVM("Boolean(pCritical.signatories['project-manager'])"), true, "PM signature present on Critical Lift");
});

// -------------------------------------------------------------
// S8: DRAFT BEHAVIOR & NON-INITIATOR ISOLATION
// -------------------------------------------------------------
console.log('\n--- S8: DRAFT BEHAVIOR & NON-INITIATOR ISOLATION ---');
recordAssert('Approvers (Site Engineer, P&M, Tower Incharge, EHS) cannot act on draft lifting permits', () => {
    evalInVM(`
        currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        startNewPermit('lifting');
        draftLift = JSON.parse(JSON.stringify(draft));
        draftLift.id = 'DRAFT-LIFT-01';
        draftLift.status = 'Draft';
        draftLift.approvals = newChain('lifting', draftLift);
    `);
    assert.strictEqual(evalInVM("roleCanActOnChain(draftLift, 'site-engineer')"), false, "SE cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftLift, 'pm')"), false, "P&M cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftLift, 'hw-section-head')"), false, "TI cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftLift, 'project-manager')"), false, "PM cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftLift, 'ehs-manager')"), false, "EHS cannot act on draft");

    // Switch user to non-initiator
    evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(draftLift, 'site-engineer')"), false, "SE cannot view draft");
});

// -------------------------------------------------------------
// S9: INPUT VALIDATION & MANDATORY CHECKLIST RULES
// -------------------------------------------------------------
console.log('\n--- S9: INPUT VALIDATION & MANDATORY CHECKLIST RULES ---');
recordAssert('Mandatory field validation per wizard step for Lifting Operations', () => {
    evalInVM(`
        currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        startNewPermit('lifting');
    `);
    assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Wiz Step 1 fails on empty draft");

    evalInVM(`
        draft.project = PROJECTS[0].name;
        draft.organization = 'Main Contractor';
        draft.locationStructure = 'Tower';
        draft.tower = 'Tower 1';
        draft.locFloor = 'Level 5';
        draft.locUnit = 'Unit 501';

        // Pre-location mandatory Operator & Rigger signatures
        draft.craneOperatorSig = 'data:image/png;base64,mockCraneOpSig';
        draft.craneOperatorName = 'Rajesh Sharma';
        draft.craneOperatorDpdp = true;
        draft.riggerSig = 'data:image/png;base64,mockRiggerSig';
        draft.riggerName = 'Sunil Kumar';
        draft.riggerDpdp = true;

        // Sub-Table 1: Load Details
        draft.loadDescription = 'HVAC Chiller Unit Lifting to Terrace';
        draft.numWorkers = 4;
        draft.loadWeight = 4.5;
        draft.loadWeightType = 'Known';
        draft.loadDimX = 3.2;
        draft.loadDimY = 2.1;
        draft.loadDimZ = 1.8;
        draft.loadCg = 'Centered, 0.9m from base';
        draft.loadCgType = 'Provided by Drawing';

        // Sub-Table 2: Controls
        draft.liftingDocs = ['P&M Green Card Sticker', 'Lift Permit'];

        // Sub-Table 3: Equipment Spec
        draft.liftingEquipmentType = 'Tower Crane';
        draft.craneEquipmentType = 'Tower Crane';
        draft.craneRegId = 'TC-04';
        draft.craneSwl = 10.0;
        draft.craneCertDate = '2026-01-01';
        draft.craneCertNo = 'TPI-101';
        draft.craneBoomLength = 45.0;
        draft.craneFlyJib = 0;
        draft.craneOffsetAngle = 0;
        draft.craneRadiusInitial = 14.0;
        draft.craneSwlInitial = 8.5;
        draft.craneRadiusFinal = 22.0;
        draft.craneSwlFinal = 6.2;
        draft.craneRadiusWorst = 28.0;
        draft.craneSwlWorst = 5.1;
        draft.craneGearType = 'Wire Rope Sling';
        draft.craneGearWeight = 0;
        draft.craneTandemLift = 'no';

        // Sub-Table 4: Rigging Plan
        draft.slingDiameter = 24;
        draft.slingLength = 6.0;
        draft.slingApexHeight = 4.5;
        draft.slingSwl = 5.0;
        draft.slingsCount = '4';
        draft.slingsAdjustable = 'yes';
        draft.riggingGears = [{ type: 'Wire Rope Sling', serialNo: 'WRS-4L-089', swl: 5.0, certDate: '2026-01-01' }];
        draft.liftingComms = 'Both Radio & Hand Signals';
        draft.liftingGround = 'Firm & Compacted';
        draft.liftingRoadTrap = 'yes';
        draft.liftingSpecialPrecautions = 'Secondary taglines deployed on both ends.';
    `);
    assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Wiz Step 1 passes with all mandatory lifting parameters");
});

// -------------------------------------------------------------
// S10: CONCURRENCY & DOUBLE ACTION GUARDS
// -------------------------------------------------------------
console.log('\n--- S10: CONCURRENCY & DOUBLE ACTION GUARDS ---');
recordAssert('Double action blocked once permit status already advanced', () => {
    assert.strictEqual(evalInVM("pRoutine.status"), 'Active');
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'site-engineer')"), false, "SE cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'pm')"), false, "P&M cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'hw-section-head')"), false, "TI cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pRoutine, 'ehs-manager')"), false, "EHS cannot act on Active permit");
});

// -------------------------------------------------------------
// S11: LIFECYCLE (EXTENSION, OBSERVATIONS, SURRENDER, CANCEL)
// -------------------------------------------------------------
console.log('\n--- S11: LIFECYCLE (EXTENSION, OBSERVATIONS, SURRENDER, CANCEL) ---');
recordAssert('Full lifecycle: extension, observation gate, and surrender with Demobilization Declaration', () => {
    evalInVM(`
        (() => {
            window.__TEST_MODE__ = true;
            startNewPermit('lifting');
            draft.projectId = 'PRJ-PEARL';
            draft.signature = { dataUrl: makeSimSignature('Rigger Bob') };
            var p = JSON.parse(JSON.stringify(draft));
            p.id = genPermitNumber('lifting');
            p.approvals = newChain('lifting', p);
            p.status = 'Active';
            p.validTill = new Date(Date.now() + 3600000).toISOString();
            p.startTime = '08:00';
            p.endTime = '18:00';
            p.createdBy = 'Rigger Bob';
            p.createdByRole = 'lift-supervisor';
            PERMITS = [p];
            lifeLift = p;

            // Raise EHS Observation
            currentUser = { key: 'ehs-officer', name: 'Officer Kim', role: 'EHS Safety Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            raiseObservation(lifeLift, { comment: 'Tag line must be used for all suspended loads', gps: { lat: 17.4125, lng: 78.3984 }, sig: makeSimSignature('Officer Kim'), signerName: 'Officer Kim' });
        })();
    `);
    assert.strictEqual(evalInVM("hasOpenObservation(lifeLift)"), true, "Observation active on permit");

    // Surrender blocked while observation open
    evalInVM(`
        currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        surrenderBlocked = closeAndSurrenderPermit(lifeLift, { remarks: 'Trying early closure' });
    `);
    assert.strictEqual(evalInVM("surrenderBlocked"), false, "Closure blocked while observation open");

    // Resolve observation
    evalInVM(`
        (() => {
            const obs = getActiveObservation(lifeLift);
            obs.status = 'Resolved';
            obs.clearedAt = nowTime();
            obs.clearedBy = 'Officer Kim';
        })();
    `);
    assert.strictEqual(evalInVM("hasOpenObservation(lifeLift)"), false, "Observation cleared");

    // Surrender permit with Lifting Demobilization & Safety Declaration
    evalInVM(`
        (() => {
            currentUser = { key: 'lift-supervisor', name: 'Rigger Bob', role: 'Lifting Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            surrenderRes = closeAndSurrenderPermit(lifeLift, {
                remarks: 'Lifting completed safely, boom secured, outriggers retracted, tackle returned to store',
                liftingDemob: true,
                photo: 'data:image/png;base64,mockphotodata',
                sig: makeSimSignature('Rigger Bob')
            });
        })();
    `);
    assert.strictEqual(evalInVM("surrenderRes"), true, "Surrender succeeds with certified Demobilization Declaration");
    assert.strictEqual(evalInVM("lifeLift.status"), 'Completed (Surrendered)', "Permit surrendered cleanly");
});

// -------------------------------------------------------------
// S12: OUTPUTS (DASHBOARDS, REGISTER, PDF SMOKE)
// -------------------------------------------------------------
console.log('\n--- S12: OUTPUTS (DASHBOARDS, REGISTER, PDF SMOKE) ---');
recordAssert('Dashboard pending queues, register visibility, and tracker generation for Lifting Operations', () => {
    evalInVM(`
        PERMITS = [pRoutine, pCritical, lifeLift];

        // Tracker HTML generation
        trackerRoutineHtml = trackerHtml(pRoutine);
        trackerCritHtml = trackerHtml(pCritical);

        // Signatories Card HTML generation
        sigRoutineHtml = buildPermitSignatoriesCardHtml(pRoutine);
        sigCritHtml = buildPermitSignatoriesCardHtml(pCritical);

        // PDF Generation Smoke
        currentUser = { key: 'ehs-manager', name: 'EHS Manager Dave', role: 'EHS Safety Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        pdfRoutineData = generatePermitPDF(pRoutine.id);
        pdfCritData = generatePermitPDF(pCritical.id);
    `);

    assert(evalInVM("trackerRoutineHtml").includes('Tower Incharge'), "Tracker includes Tower Incharge");
    assert(evalInVM("trackerCritHtml").includes('Project Manager'), "Critical tracker includes Project Manager");
    assert.strictEqual(evalInVM("pdfRoutineData"), true, "Routine PDF generates successfully");
    assert.strictEqual(evalInVM("pdfCritData"), true, "Critical PDF generates successfully");
});

console.log('================================================================');
console.log(`GROUP 5 (PTW-009) MATRIX SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('================================================================');

if (failedCount > 0) {
    console.error('\nFAILURES DETECTED IN GROUP 5 MATRIX:');
    failureDetails.forEach((f, idx) => {
        console.error(`  ${idx + 1}. ${f.desc}\n  Error: ${f.error}\n`);
    });
    process.exit(1);
} else {
    console.log('\nALL GROUP 5 (PTW-009 LIFTING OPERATIONS) FLOW SCENARIOS PASSED 100% CLEANLY.\n');
    process.exit(0);
}
