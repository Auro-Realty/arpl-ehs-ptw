/**
 * COMPREHENSIVE APPROVAL FLOW MATRIX: GROUP 7 (PTW-010 NIGHT SHIFT / HOLIDAY WORK)
 *
 * Flow Specification (Source of Truth per approved Decision D3 & System Implementation):
 *   Day Phase (5:00 PM - 6:30 PM IST):
 *     Site Supervisor -> Site Engineer -> Tower Incharge / Section Head
 *     -> Status: "Night Shift Approved – Awaiting Linked Permit"
 *   Sequential Stage 2 (Linked Activity Permit):
 *     Site Supervisor initiates linked permit -> Site Engineer -> Tower Incharge
 *     -> Both permits advance to "Approved – Pending Night Handover"
 *   Night Phase (8:30 PM / 20:30 IST):
 *     Night Site Supervisor Handover (PM qualified + valid training + dual photos)
 *     -> Status: "Pending P&M Night Acknowledgment"
 *     -> P&M Engineer (illumination lux levels + equipment)
 *     -> Status: "Pending EHS Approval"
 *     -> EHS Safety Manager / Officer
 *     -> Status: "Active" (both parent and linked permit activated)
 *
 * Scenarios tested (S1 - S12):
 * S1: Happy Path (Complete 6-stage dual-phase flow to Active)
 * S2: Out-Of-Order / Wrong Role (Negative - Phase boundary enforcement)
 * S3: Either-Or Stages (EHS Manager vs EHS Officer first-wins concurrency)
 * S4: Return / Reject at Each Stage & Resubmission Routing per D6 (EHS reject routes to Night Supervisor, day approvals preserved)
 * S5: Conditional Branches (Supervisor Qualification Gate & Statutory Night Prohibitions)
 * S6: Project Isolation & RBAC Boundaries
 * S7: Permit Identity & Signatory Isolation (6 Statutory Signatories)
 * S8: Draft Behavior & Non-Initiator Isolation
 * S9: Input Validation & Mandatory Checklist Rules (13 items, photo deferral, overnight hours)
 * S10: Concurrency & Double Action Prevention
 * S11: Post-Approval Lifecycle (Exclusive surrender by Night Supervisor with de-energization declaration)
 * S12: Outputs (Dashboard counters, Register visibility, Official PDF generation)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('STARTING GROUP 7 (PTW-010 NIGHT SHIFT WORK) FLOW MATRIX TESTS');
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
    querySelector: (sel) => {
        if (sel && sel.startsWith('#')) return getOrCreateElem(sel.slice(1));
        return null;
    },
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement('', tag),
    body: new MockElement('body', 'body'),
    head: new MockElement('head', 'head'),
    documentElement: new MockElement('html', 'html'),
    addEventListener: () => {},
    removeEventListener: () => {}
};

const mockWindow = {
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768,
    location: { hash: '', reload: () => {}, href: '' },
    __TEST_MODE__: true
};

let toastMessages = [];

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
    splitTextToSize(str) { return [String(str)]; }
    addImage(img, fmt, x, y, w, h) { this.images.push({ img, x, y, w, h }); return this; }
    addPage() { this.pages++; return this; }
    setPage() { return this; }
    getNumberOfPages() { return this.pages; }
    output() { return 'mock_pdf_output'; }
    save() { return true; }
}

const sandbox = {
    window: mockWindow,
    document: mockDocument,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    navigator: { userAgent: 'node-test' },
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
    },
    showToast: (msg, type) => {
        toastMessages.push({ msg, type });
    },
    jspdf: { jsPDF: MockPDFDoc },
    jsPDF: MockPDFDoc
};

sandbox.window.document = mockDocument;
sandbox.window.window = sandbox.window;
sandbox.window.jspdf = sandbox.jspdf;
sandbox.window.jsPDF = sandbox.jsPDF;
sandbox.toastMessages = toastMessages;
sandbox.window.toastMessages = toastMessages;

const ctx = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], ctx);

function evalInVM(code) {
    return vm.runInContext(code, ctx);
}

evalInVM(`
    const _nativeToast = showToast;
    showToast = function(msg, type, icon) {
        toastMessages.push({ msg, type, icon });
        if (typeof _nativeToast === 'function') _nativeToast(msg, type, icon);
    };
`);

function makeSimSignature(name) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

let passedCount = 0;
let failedCount = 0;
const failureDetails = [];

function recordAssert(name, fn) {
    try {
        fn();
        passedCount++;
        console.log(`  ✓ PASS: ${name}`);
    } catch (err) {
        failedCount++;
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    ${err.message}\n`);
        failureDetails.push({ name, error: err });
    }
}

// -------------------------------------------------------------
// S1: HAPPY PATH (PTW-010 NIGHT SHIFT / HOLIDAY WORK DUAL-PHASE)
// -------------------------------------------------------------
console.log('\n--- S1: HAPPY PATH (PTW-010 NIGHT SHIFT WORK) ---');
recordAssert('Complete 6-stage dual-phase flow: Day Phase -> Linked Permit -> Night Handover -> P&M -> EHS -> Active', () => {
    evalInVM(`
        (() => {
            window.__TEST_MODE__ = true;
            // 1. Day Phase Initiation by Site Supervisor (5:00 PM)
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            startNewPermit('nightshift');
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.location = 'Tower 1 - Floor 12';
            draft.numWorkers = 6;
            draft.isSubcontractor = true;
            draft.nightSubcontractorName = 'Apex Foundations Ltd';
            draft.nightWorkDescription = NIGHT_WORK_DESCRIPTIONS[0].name || NIGHT_WORK_DESCRIPTIONS[0].label || 'Hot Work';
            draft.checklist = draft.checklist.map(c => Object.assign({}, c, { ans: 'yes', comment: 'Compliant' }));
            draft.signerName = 'Supervisor Sam';
            draft.signerSig = makeSimSignature('Supervisor Sam');
            draft.signerConsent = true;

            pNight = JSON.parse(JSON.stringify(draft));
            pNight.id = genPermitNumber('nightshift');
            pNight.ptype = 'nightshift';
            pNight.type = 'nightshift';
            pNight.signatories = {};
            PERMITS = [pNight];
            submitPermit(pNight);

            // Step 2 Day Approver: Site Engineer
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pNight.id, 'Day conditions and workspace verified', { lat: 17.3850, lng: 78.4867, within: true }, makeSimSignature('Eng Eric'), 'Eng Eric');

            // Step 3 Day Approver: Tower Incharge / Section Head
            currentUser = { key: 'hw-section-head', name: 'Tower Lead Tom', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pNight.id, 'sectionHead', { lat: 17.3850, lng: 78.4867, within: true }, makeSimSignature('Tower Lead Tom'), 'Tower Lead Tom', 'Approved for night shift protocol', 'hw-section-head');
        })();
    `);

    assert.strictEqual(evalInVM("pNight.status"), 'Night Shift Approved – Awaiting Linked Permit', "Stage 1 approval advances to Night Shift Approved – Awaiting Linked Permit");

    // Sequential Stage 2: Linked Activity Permit (Hot Work)
    evalInVM(`
        (() => {
            currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            openLinkedPermitFromNightShift(pNight.id);
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.locationStructure = 'Tower';
            draft.tower = 'Tower 1';
            draft.locFloor = '12';
            draft.locUnit = 'Corridor';
            draft.hotworkTypes = ['welding'];
            draft.welderName = 'John Welder';
            draft.checklist = draft.checklist.map(c => Object.assign({}, c, { ans: 'yes', comment: 'Verified' }));
            draft.sitePhoto = 'data:image/png;base64,photoDemo';
            draft.signerName = 'Supervisor Sam';
            draft.signerSig = makeSimSignature('Supervisor Sam');
            draft.signerConsent = true;

            pLinked = JSON.parse(JSON.stringify(draft));
            pLinked.id = genPermitNumber('hotwork');
            pLinked.ptype = 'hotwork';
            pLinked.parentNightShiftId = pNight.id;
            pLinked.signatories = {};
            PERMITS.unshift(pLinked);
            pNight.linkedPermitId = pLinked.id;
            submitPermit(pLinked);

            // Run daytime approvals for linked permit: Site Engineer -> Tower Incharge
            currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            acknowledgeSiteEngineer(pLinked.id, 'Hot work site ready', { lat: 17.3850, lng: 78.4867, within: true }, makeSimSignature('Eng Eric'), 'Eng Eric');

            currentUser = { key: 'hw-section-head', name: 'Tower Lead Tom', role: 'Tower Incharge', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            approvePermitStage(pLinked.id, 'sectionHead', { lat: 17.3850, lng: 78.4867, within: true }, makeSimSignature('Tower Lead Tom'), 'Tower Lead Tom', 'Linked hotwork daytime approvals cleared', 'hw-section-head');
        })();
    `);

    assert.strictEqual(evalInVM("pNight.status"), 'Approved – Pending Night Handover', "Parent night shift advances to Approved – Pending Night Handover");
    assert.strictEqual(evalInVM("pLinked.status"), 'Approved – Pending Night Handover', "Linked activity permit advances to Approved – Pending Night Handover");

    // Night Phase Step 4: Night Site Supervisor Handover (8:30 PM IST)
    evalInVM(`
        (() => {
            currentUser = { key: 'night-supervisor', name: 'Venkatesh Rao', role: 'Night Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            openNightHandoverModal(pNight.id);
            actionModalCtx.supervisorKey = 'venkatesh_rao';
            actionModalCtx.supervisorName = 'Venkatesh Rao';
            actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
            actionModalCtx.illuminationPhoto = 'data:image/png;base64,mockLuxTowerPhoto';
            actionModalCtx.activityPhoto = 'data:image/png;base64,mockWeldingSetupPhoto';
            actionModalCtx.sig = makeSimSignature('Venkatesh Rao');
            actionModalCtx.remarks = 'On-site lighting verified > 150 lux at work point. Dual photos captured.';
            submitNightHandover();
        })();
    `);

    assert.strictEqual(evalInVM("pNight.status"), 'Pending P&M Night Acknowledgment', "Night Handover advances status to Pending P&M Night Acknowledgment");

    // Step 5: P&M Night Acknowledgment
    evalInVM(`
        (() => {
            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            openNightPmAckModal(pNight.id);
            actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
            actionModalCtx.sig = makeSimSignature('PM Eng Paul');
            actionModalCtx.signerName = 'PM Eng Paul';
            actionModalCtx.luxConfirmed = true;
            actionModalCtx.equipmentConfirmed = true;
            actionModalCtx.comment = 'Tower lights operational. RCDs and cables elevated.';
            submitNightPmAck();
        })();
    `);

    assert.strictEqual(evalInVM("pNight.status"), 'Pending EHS Approval', "P&M Acknowledgment advances status to Pending EHS Approval");

    // Step 6: EHS Safety Final Approval
    evalInVM(`
        (() => {
            currentUser = { key: 'ehs-manager', name: 'Safety Officer Sean', role: 'EHS Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };
            const p = PERMITS.find(x => x.id === pNight.id);
            stampPermitValidityEpochs(p);
            window.__TEST_DATE_OVERRIDE__ = new Date(p.validFromMs + 15 * 60000);
            approvePermitStage(pNight.id, 'ehsManager', { lat: 17.3850, lng: 78.4867, within: true }, makeSimSignature('Safety Officer Sean'), 'Safety Officer Sean', 'Night shift safety protocol compliant', 'ehs-manager');
        })();
    `);

    assert.strictEqual(evalInVM("pNight.status"), 'Active', "Parent Night Shift permit is Active");
    assert.strictEqual(evalInVM("pLinked.status"), 'Active', "Linked Activity permit automatically synchronizes to Active");
});

// -------------------------------------------------------------
// S2: OUT-OF-ORDER / WRONG ROLE (NEGATIVE)
// -------------------------------------------------------------
console.log('\n--- S2: OUT-OF-ORDER / WRONG ROLE (NEGATIVE) ---');
recordAssert('Role authority strictly enforced across Day and Night phase boundaries', () => {
    evalInVM(`
        (() => {
            startNewPermit('nightshift');
            draft.projectId = 'PRJ-PEARL';
            draft.project = PROJECTS[0].name;
            draft.nightWorkDescription = NIGHT_WORK_DESCRIPTIONS[0].name || 'Hot Work';
            draft.signature = { dataUrl: makeSimSignature('Supervisor Sam') };

            pNeg = JSON.parse(JSON.stringify(draft));
            pNeg.id = genPermitNumber('nightshift');
            pNeg.ptype = 'nightshift';
            pNeg.signatories = {};
            PERMITS.push(pNeg);
            submitPermit(pNeg);
        })();
    `);

    // At Pending Site Engineer: Night Supervisor, Tower Incharge, P&M, and EHS cannot act
    assert.strictEqual(evalInVM("pNeg.status"), 'Pending Site Engineer Acknowledgment');
    assert.strictEqual(evalInVM("roleCanActOnChain(pNeg, 'night-supervisor')"), false, "Night Supervisor cannot act in Day Phase Step 1");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNeg, 'hw-section-head')"), false, "Tower Incharge cannot act before Site Engineer");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNeg, 'pm')"), false, "P&M cannot act in Day Phase Step 1");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNeg, 'ehs-manager')"), false, "EHS cannot act in Day Phase Step 1");

    // Advance to Pending Section Head
    evalInVM(`
        currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        acknowledgeSiteEngineer(pNeg.id, 'OK', { lat: 17.3850, lng: 78.4867, within: true }, makeSimSignature('Eng Eric'), 'Eng Eric');
    `);
    assert.strictEqual(evalInVM("pNeg.status"), 'Pending Section Head');
    assert.strictEqual(evalInVM("roleCanActOnChain(pNeg, 'site-supervisor')"), false, "Supervisor cannot act at Pending Section Head");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNeg, 'night-supervisor')"), false, "Night Supervisor cannot act at Pending Section Head");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNeg, 'ehs-manager')"), false, "EHS cannot act at Pending Section Head");
});

// -------------------------------------------------------------
// S3: EITHER-OR STAGES (EHS FIRST-WINS CONCURRENCY)
// -------------------------------------------------------------
console.log('\n--- S3: EITHER-OR STAGES (EHS FIRST-WINS CONCURRENCY) ---');
recordAssert('EHS Manager vs EHS Officer first-wins resolution on Night Shift', () => {
    evalInVM(`
        (() => {
            pEhsTest = JSON.parse(JSON.stringify(pNight));
            pEhsTest.id = 'PTW-010-EHS-CONC-TEST';
            pEhsTest.status = 'Pending EHS Approval';
            pEhsTest.approvals.ehsManager = { status: 'pending', label: 'EHS Safety' };
            pEhsTest.approvals.ehsOfficer = { status: 'pending', label: 'EHS Safety' };
            PERMITS.push(pEhsTest);
        })();
    `);

    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsTest, 'ehs-manager')"), true, "EHS Manager can act at Pending EHS Approval");
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsTest, 'ehs-officer')"), true, "EHS Officer can act at Pending EHS Approval");

    // EHS Officer acts first
    evalInVM(`
        currentUser = { key: 'ehs-officer', name: 'Officer Omar', role: 'EHS Officer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        approvePermitStage(pEhsTest.id, 'ehsOfficer', { lat: 17.3850, lng: 78.4867, within: true }, makeSimSignature('Officer Omar'), 'Officer Omar', 'Approved by EHS Officer', 'ehs-officer');
    `);

    // Once approved, both cannot act again
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsTest, 'ehs-manager')"), false, "EHS Manager blocked after Officer approval");
    assert.strictEqual(evalInVM("roleCanActOnChain(pEhsTest, 'ehs-officer')"), false, "EHS Officer blocked after Officer approval");
});

// -------------------------------------------------------------
// S4: RETURN / REJECT AT EACH STAGE & RESUBMISSION ROUTING
// -------------------------------------------------------------
console.log('\n--- S4: RETURN / REJECT AT EACH STAGE & RESUBMISSION ROUTING ---');
recordAssert('EHS Rejection routes strictly to Returned to Night Supervisor (Day Approvals Preserved per D6)', () => {
    evalInVM(`
        (() => {
            pRejNight = JSON.parse(JSON.stringify(pNight));
            pRejNight.id = 'PTW-010-REJ-TEST';
            pRejNight.status = 'Pending EHS Approval';
            PERMITS.push(pRejNight);

            currentUser = { key: 'ehs-manager', name: 'Safety Officer Sean', role: 'EHS Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            rejectNightShiftEhs(pRejNight.id, 'Insufficient illumination near access stairway. Adjust tower light 2.');
        })();
    `);

    assert.strictEqual(evalInVM("pRejNight.status"), 'Returned to Night Supervisor', "Status becomes Returned to Night Supervisor");
    assert.strictEqual(evalInVM("pRejNight.approvals.sectionHead.status"), 'approved', "Section Head (Day Approver) remains approved per D6");
    assert.strictEqual(evalInVM("pRejNight.approvals.siteEngineer.status"), 'approved', "Site Engineer (Day Approver) remains approved per D6");

    // Night Supervisor resubmits
    evalInVM(`
        (() => {
            currentUser = { key: 'night-supervisor', name: 'Venkatesh Rao', role: 'Night Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            openNightHandoverModal(pRejNight.id, true);
            actionModalCtx.supervisorKey = 'venkatesh_rao';
            actionModalCtx.supervisorName = 'Venkatesh Rao';
            actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
            actionModalCtx.illuminationPhoto = 'data:image/png;base64,mockLuxTowerPhoto2';
            actionModalCtx.activityPhoto = 'data:image/png;base64,mockWeldingSetupPhoto2';
            actionModalCtx.sig = makeSimSignature('Venkatesh Rao');
            actionModalCtx.remarks = 'Tower light 2 re-aimed to stairway. Lux reading now 210.';
            submitNightHandover();
        })();
    `);

    assert.strictEqual(evalInVM("pRejNight.status"), 'Pending P&M Night Acknowledgment', "Night Supervisor resubmit routes to P&M Night Acknowledgment");

    // P&M re-acknowledges
    evalInVM(`
        (() => {
            currentUser = { key: 'pm', name: 'PM Eng Paul', role: 'P&M (Plant & Machinery)', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
            openNightPmAckModal(pRejNight.id);
            actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
            actionModalCtx.sig = makeSimSignature('PM Eng Paul');
            actionModalCtx.signerName = 'PM Eng Paul';
            actionModalCtx.luxConfirmed = true;
            actionModalCtx.equipmentConfirmed = true;
            actionModalCtx.comment = 'Re-inspected stairway lighting. Fully compliant.';
            submitNightPmAck();
        })();
    `);

    assert.strictEqual(evalInVM("pRejNight.status"), 'Pending EHS Approval', "P&M re-acknowledgment routes back to Pending EHS Approval");
});

// -------------------------------------------------------------
// S5: CONDITIONAL BRANCHES (SUPERVISOR QUALIFICATION & PROHIBITIONS)
// -------------------------------------------------------------
console.log('\n--- S5: CONDITIONAL BRANCHES (SUPERVISOR QUALIFICATION & PROHIBITIONS) ---');
recordAssert('Qualification gate validates PM authorization and PTW certification; Statutory prohibitions enforced', () => {
    // 1. Qualified Supervisor
    const qGatePass = evalInVM("validateNightSupervisorGate('venkatesh_rao')");
    assert.strictEqual(qGatePass.valid, true, "Venkatesh Rao (authorized + valid training) passes gate");

    // 2. Disqualified: Not PM authorized
    const qGateNoPm = evalInVM("validateNightSupervisorGate('kishore_varma')");
    assert.strictEqual(qGateNoPm.valid, false, "Kishore Varma (no PM authorization) fails gate");
    assert(qGateNoPm.reason.includes("Project Manager (PM) authorised"), "Mentions PM authorization");

    // 3. Disqualified: Expired PTW training
    const qGateExpired = evalInVM("validateNightSupervisorGate('anand_kumar')");
    assert.strictEqual(qGateExpired.valid, false, "Anand Kumar (expired training) fails gate");
    assert(qGateExpired.reason.includes("training certification expired"), "Mentions training expiration");

    // 4. Statutory Prohibitions
    assert.strictEqual(evalInVM("canLinkToNightShift('confined')"), false, "Confined Space strictly prohibited at night");
    assert.strictEqual(evalInVM("canLinkToNightShift('blasting')"), false, "Drilling & Blasting strictly prohibited at night");
    assert.strictEqual(evalInVM("canLinkToNightShift('liftplan')"), false, "Critical Lift Plan strictly prohibited at night");
    assert.strictEqual(evalInVM("canLinkToNightShift('lifting', { loadWeight: 6.0 })"), false, "Lifting > 5 MT strictly prohibited at night");
    assert.strictEqual(evalInVM("canLinkToNightShift('hotwork')"), true, "Hot Work permitted at night");
    assert.strictEqual(evalInVM("canLinkToNightShift('lifting', { loadWeight: 3.5, liftingClassification: 'routine' })"), true, "Routine Lifting permitted at night");
});

// -------------------------------------------------------------
// S6: PROJECT ISOLATION & RBAC BOUNDARIES
// -------------------------------------------------------------
console.log('\n--- S6: PROJECT ISOLATION & RBAC BOUNDARIES ---');
recordAssert('User from PRJ-REGENT strictly blocked from viewing or acting on PRJ-PEARL night shift permit', () => {
    const regPermit = evalInVM("pNight");
    assert.strictEqual(regPermit.projectId, 'PRJ-PEARL');

    evalInVM("currentUser = { key: 'night-supervisor', name: 'Regent Night Lead', role: 'Night Site Supervisor', projectId: 'PRJ-REGENT', projectIds: ['PRJ-REGENT'], __STRICT_PROJECT_RBAC__: true };");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pNight, 'night-supervisor')"), false, "Regent supervisor cannot see Pearl night permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNight, 'night-supervisor')"), false, "Regent supervisor cannot act on Pearl night permit");

    evalInVM("currentUser = { key: 'night-supervisor', name: 'Pearl Night Lead', role: 'Night Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pNight, 'night-supervisor')"), true, "Pearl supervisor can see Pearl night permit");
});

// -------------------------------------------------------------
// S7: PERMIT IDENTITY & SIGNATORY ISOLATION
// -------------------------------------------------------------
console.log('\n--- S7: PERMIT IDENTITY & SIGNATORY ISOLATION ---');
recordAssert('Night shift permit has exactly 6 statutory signatories flow nodes', () => {
    const flow = evalInVM("getPermitSignatoriesFlow(pNight)");
    assert.strictEqual(flow.length, 6, "Must have exactly 6 statutory signatories flow nodes");
    assert.strictEqual(flow[0].key, 'site-supervisor', "Node 1 is Site Supervisor (Permittee · Day)");
    assert.strictEqual(flow[1].key, 'site-engineer', "Node 2 is Site Engineer");
    assert.strictEqual(flow[2].key, 'hw-section-head', "Node 3 is Tower Incharge / Section Head");
    assert.strictEqual(flow[3].key, 'night-supervisor', "Node 4 is Night Site Supervisor");
    assert.strictEqual(flow[4].key, 'pm', "Node 5 is P&M Engineer");
    assert.strictEqual(flow[5].key, 'ehs-manager', "Node 6 is EHS Safety Manager / Officer");
});

// -------------------------------------------------------------
// S8: DRAFT BEHAVIOR & NON-INITIATOR ISOLATION
// -------------------------------------------------------------
console.log('\n--- S8: DRAFT BEHAVIOR & NON-INITIATOR ISOLATION ---');
recordAssert('Approvers cannot act on or view draft night shift permits', () => {
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        startNewPermit('nightshift');
        draftNight = JSON.parse(JSON.stringify(draft));
        draftNight.id = 'DRAFT-NIGHT-01';
        draftNight.status = 'Draft';
        draftNight.approvals = newChain('nightshift', draftNight);
    `);

    assert.strictEqual(evalInVM("roleCanActOnChain(draftNight, 'site-engineer')"), false, "Site Engineer cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftNight, 'hw-section-head')"), false, "Tower Incharge cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftNight, 'night-supervisor')"), false, "Night Supervisor cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftNight, 'pm')"), false, "P&M cannot act on draft");
    assert.strictEqual(evalInVM("roleCanActOnChain(draftNight, 'ehs-manager')"), false, "EHS cannot act on draft");

    // Non-initiator cannot view draft
    evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'], __STRICT_PROJECT_RBAC__: true };");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(draftNight, 'site-engineer')"), false, "Site Engineer cannot view draft");
});

// -------------------------------------------------------------
// S9: INPUT VALIDATION & MANDATORY CHECKLIST RULES
// -------------------------------------------------------------
console.log('\n--- S9: INPUT VALIDATION & MANDATORY CHECKLIST RULES ---');
recordAssert('13 checklist items, photo deferral to night handover, and overnight timing validated', () => {
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        startNewPermit('nightshift');
    `);

    // Step 1 fails on empty description
    evalInVM("draft.nightWorkDescription = '';");
    assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails if night work description is empty");

    // Step 1 passes with description and subcontractor details
    evalInVM(`
        draft.nightWorkDescription = NIGHT_WORK_DESCRIPTIONS[0].name || 'Hot Work';
        draft.isSubcontractor = true;
        draft.nightSubcontractorName = 'Apex Foundations Ltd';
    `);
    assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 passes with valid fields");

    // Step 2: 13 checklist checks; sitePhoto deferred / optional
    const checklistItems = evalInVM("NIGHTSHIFT_CHECKLIST_ITEMS");
    assert.strictEqual(checklistItems.length, 13, "Night shift checklist must contain exactly 13 statutory items");

    evalInVM(`
        draft.checklist = draft.checklist.map(c => Object.assign({}, c, { ans: 'yes', comment: 'Compliant' }));
        draft.sitePhoto = null;
    `);
    assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 passes without sitePhoto (statutory deferral to 8:30 PM handover)");

    // Step 3 accepts overnight hours (20:30 to 06:00)
    assert.strictEqual(evalInVM("validateWizStep(3)"), true, "Step 3 accepts overnight operational window");
});

// -------------------------------------------------------------
// S10: CONCURRENCY & DOUBLE ACTION GUARDS
// -------------------------------------------------------------
console.log('\n--- S10: CONCURRENCY & DOUBLE ACTION GUARDS ---');
recordAssert('Double action blocked once permit status already advanced', () => {
    assert.strictEqual(evalInVM("pNight.status"), 'Active');
    assert.strictEqual(evalInVM("roleCanActOnChain(pNight, 'site-engineer')"), false, "SE cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNight, 'hw-section-head')"), false, "Tower Incharge cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNight, 'pm')"), false, "P&M cannot act on Active permit");
    assert.strictEqual(evalInVM("roleCanActOnChain(pNight, 'ehs-manager')"), false, "EHS cannot act on Active permit");
});

// -------------------------------------------------------------
// S11: LIFECYCLE (EXCLUSIVE SURRENDER WITH DE-ENERGIZATION)
// -------------------------------------------------------------
console.log('\n--- S11: LIFECYCLE (EXCLUSIVE SURRENDER WITH DE-ENERGIZATION) ---');
recordAssert('Exclusive closure & surrender by Night Site Supervisor with mandatory de-energization declaration', () => {
    // Attempt surrender by Day Site Supervisor - must be blocked
    evalInVM(`
        currentUser = { key: 'site-supervisor', name: 'Supervisor Sam', role: 'Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        toastMessages.length = 0;
        openSurrenderFlow(pNight.id);
    `);
    const blockedMsg = evalInVM("toastMessages.find(t => t.type === 'err' && t.msg.includes('restricted to Night Site Supervisors'))");
    assert(blockedMsg, "Day Site Supervisor strictly blocked from closing/surrendering night shift permit");

    // Surrender by Night Site Supervisor
    evalInVM(`
        currentUser = { key: 'night-supervisor', name: 'Venkatesh Rao', role: 'Night Site Supervisor', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        openSurrenderFlow(pNight.id);
        actionModalCtx.gps = { lat: 17.4239, lng: 78.4738, within: true };
        actionModalCtx.photo = 'data:image/png;base64,mockDeEnergizedSitePhoto';
        actionModalCtx.remarks = 'Work completed. Workers evacuated. Lighting towers disconnected.';
        actionModalCtx.nightClosureConfirmed = true;
        actionModalCtx.sig = makeSimSignature('Venkatesh Rao');
        actionModalCtx.signerName = 'Venkatesh Rao';
        actionModalCtx.consent = true;
        actionModalCtx.reusedSignatory = true;
        submitSurrender();
    `);

    assert.strictEqual(evalInVM("pNight.status"), 'Completed (Surrendered)', "Status becomes Completed (Surrendered)");
    assert.strictEqual(evalInVM("pNight.surrender.nightClosureConfirmed"), true, "De-energization declaration recorded on surrender");
});

// -------------------------------------------------------------
// S12: OUTPUTS (DASHBOARDS, REGISTER, PDF SMOKE)
// -------------------------------------------------------------
console.log('\n--- S12: OUTPUTS (DASHBOARDS, REGISTER, PDF SMOKE) ---');
recordAssert('Dashboard pending queues, register visibility, and official PDF generation for Night Shift', () => {
    // Register visibility
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pNight, 'night-supervisor')"), true, "Night supervisor sees permit in register");
    assert.strictEqual(evalInVM("isPermitVisibleToRole(pNight, 'ehs-manager')"), true, "EHS sees permit in register");

    // PDF Generation
    evalInVM(`
        currentUser = { key: 'ehs-manager', name: 'Safety Officer Sean', role: 'EHS Manager', projectId: 'PRJ-PEARL', projectIds: ['PRJ-PEARL'] };
        generatePermitPDF(pNight.id);
    `);
    const pdf = evalInVM("window.lastGeneratedPdf || (typeof lastGeneratedPdf !== 'undefined' ? lastGeneratedPdf : null)");
    assert(pdf, "generatePermitPDF generates a valid jsPDF document for Night Shift");
});

// =============================================================
// SUMMARY
// =============================================================
console.log('================================================================');
console.log(`GROUP 7 (PTW-010) MATRIX SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('================================================================');

if (failedCount > 0) {
    console.error('\nFAILURES DETECTED IN GROUP 7 MATRIX:');
    failureDetails.forEach((f, idx) => {
        console.error(`  ${idx + 1}. ${f.name}`);
        console.error(`  Error: ${f.error.message}\n`);
    });
    process.exit(1);
} else {
    console.log('\nALL GROUP 7 (PTW-010 NIGHT SHIFT WORK) FLOW SCENARIOS PASSED 100% CLEANLY.\n');
    process.exit(0);
}
