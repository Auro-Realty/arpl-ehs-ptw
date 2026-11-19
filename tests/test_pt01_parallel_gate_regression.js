const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('================================================================');
console.log('SUITE: PTW-001 EXCAVATION PARALLEL CLEARANCE GATE & OPTION B REGRESSION');
console.log('================================================================');

// --- 1. Static AST & Logic Presence Checks ---
console.log('\n--- 1. Static Verification of Parallel Gate & Slot Reset Logic ---');
assert(src.includes('resetExcavationParallelSlotsOnResubmit'), "index.html must define resetExcavationParallelSlotsOnResubmit");
assert(src.includes('snapshotDisciplineFields'), "index.html must define snapshotDisciplineFields");
assert(src.includes('canActParallel'), "actionPanelHtml must use canActParallel for slot check");
console.log('  ✓ PASS: Static code invariants confirmed');

// --- 2. VM Sandbox Setup ---
console.log('\n--- 2. Setting Up Test Environment in VM ---');
const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
assert(scriptMatch, "Must extract script content from index.html");

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
    getContext() {
        return {
            clearRect() {}, beginPath() {}, arc() {}, stroke() {}, fill() {},
            moveTo() {}, lineTo() {}, fillText() {}, setLineDash() {}, strokeRect() {}, fillRect() {}
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
    addEventListener: () => {}
};

const mockStorage = new Map();
const mockLocalStorage = {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear()
};

const mockWindow = {
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    localStorage: mockLocalStorage,
    document: mockDocument,
    location: { reload: () => {} },
    open: () => ({ document: { write: () => {}, close: () => {} } }),
    __TEST_MODE__: true,
    __SIMULATED_TIME_MS__: new Date('2026-11-17T12:00:00+05:30').getTime()
};

const sandbox = {
    window: mockWindow,
    document: mockDocument,
    localStorage: mockLocalStorage,
    console: console,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    JSON: JSON,
    RegExp: RegExp,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Event: function (type) { this.type = type; },
    navigator: { userAgent: 'NodeTest' },
    haversine: (lat1, lng1, lat2, lng2) => 10
};

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(code) {
    return vm.runInContext(code, context);
}

evalInVM("window.__TEST_MODE__ = true;");
console.log('  ✓ PASS: Sandbox initialized and index.html script loaded successfully');

// --- 3. Parallel Clearance Gate Test Lifecycle ---
console.log('\n--- 3. Testing Excavation Permit Parallel Gate & Option B Snapshot Comparison ---');

evalInVM(`
const p = {
    id: 'PTW-001-2026-TEST01',
    ptype: 'excavation',
    type: 'PTW-001',
    project: 'PRJ-PEARL',
    location: 'Tower A - North Footing',
    depth: '3.5',
    slope: '1:1',
    equipment: ['JCB', 'Excavator'],
    equipmentOther: '',
    checklist: [
        { id: 1, ans: 'yes' },
        { id: 2, ans: 'yes' },
        { id: 3, ans: 'yes' }, // q3
        { id: 4, ans: 'yes' }, // q4: overhead/underground lines
        { id: 5, ans: 'yes' }, // q5: pedestrian/vehicle movement
        { id: 6, ans: 'yes' },
        { id: 7, ans: 'yes' }, // q7: operator experienced
        { id: 8, ans: 'yes' }  // q8: shoring/slope maintained
    ],
    createdBy: 'Site Supervisor John',
    createdByRole: 'site-supervisor',
    createdByUid: 'uid-supervisor-01',
    status: 'Pending Site Engineer Acknowledgment',
    approvals: newChain('excavation'),
    siteEngineerAck: { acknowledged: false }
};
PERMITS.push(p);

// Step 2: Site Engineer acknowledges
currentUser = { key: 'site-engineer', role: 'site-engineer', name: 'Eng. Alice', uid: 'uid-se-01' };
acknowledgeSiteEngineer(p, { gps: { lat: 17.4, lng: 78.3, within: true }, sig: 'data:image/png;base64,sig', comment: 'Ground verified' });
`);

const pStatusStep2 = evalInVM("p.status");
assert.strictEqual(pStatusStep2, 'Pending Parallel Approval', 'Permit should advance to Pending Parallel Approval');
console.log('  ✓ Step 2 -> Step 3 transition verified');

// Check Button Visibility for Dracula (it-in-charge), MEP, and P&M
evalInVM("currentUser = { key: 'it-in-charge', role: 'it-in-charge', name: 'Dracula', uid: 'uid-dracula-01' };");
let panelHtml = evalInVM("actionPanelHtml(p);");
assert(panelHtml.includes('Step 3: Parallel Approval Required'), 'Dracula (it-in-charge) MUST see Parallel Approval Required card');
assert(panelHtml.includes('Approve') && panelHtml.includes('Reject'), 'Dracula (it-in-charge) MUST see Approve and Reject buttons');
console.log('  ✓ Dracula (it-in-charge) sees active Approve/Reject buttons');

evalInVM("currentUser = { key: 'mep', role: 'mep', name: 'MEP Eng. Bob', uid: 'uid-mep-01' };");
panelHtml = evalInVM("actionPanelHtml(p);");
assert(panelHtml.includes('Step 3: Parallel Approval Required (MEP Engineer)'), 'MEP Engineer MUST see Parallel Approval Required card');
console.log('  ✓ MEP Engineer sees active Approve/Reject buttons');

evalInVM("currentUser = { key: 'pm', role: 'pm', name: 'P&M Eng. Charlie', uid: 'uid-pm-01' };");
panelHtml = evalInVM("actionPanelHtml(p);");
assert(panelHtml.includes('Step 3: Parallel Approval Required (P&M Engineer)'), 'P&M Engineer MUST see Parallel Approval Required card');
console.log('  ✓ P&M Engineer sees active Approve/Reject buttons');

// Step 3 Actions: MEP approves, Dracula approves, P&M rejects
evalInVM(`
currentUser = { key: 'mep', role: 'mep', name: 'MEP Eng. Bob', uid: 'uid-mep-01' };
approvePermitStage(p, 'mep', { lat: 17.4, lng: 78.3, within: true }, 'MEP clear', 'data:image/png;base64,sig', 'MEP Eng. Bob');
`);
assert.strictEqual(evalInVM("p.approvals.mep.status"), 'approved', 'MEP should be approved');

evalInVM(`
currentUser = { key: 'it-in-charge', role: 'it-in-charge', name: 'Dracula', uid: 'uid-dracula-01' };
approvePermitStage(p, 'it-in-charge', { lat: 17.4, lng: 78.3, within: true }, 'IT clear', 'data:image/png;base64,sig', 'Dracula');
`);
assert.strictEqual(evalInVM("p.approvals.it.status"), 'approved', 'IT should be approved');

// Dracula and MEP now see read-only "Awaiting Parallel Discipline Clearances"
panelHtml = evalInVM("actionPanelHtml(p);");
assert(panelHtml.includes('Step 3: Awaiting Parallel Discipline Clearances'), 'Dracula should now see read-only awaiting clearances');
assert(!panelHtml.includes('renderActionButton'), 'Dracula must not see Approve button once already approved');
console.log('  ✓ Post-approval read-only card displayed to Dracula and MEP');

// P&M Rejection
evalInVM(`
currentUser = { key: 'pm', role: 'pm', name: 'P&M Eng. Charlie', uid: 'uid-pm-01' };
rejectPermitStage(p, 'pm', { lat: 17.4, lng: 78.3, within: true }, 'Insufficient trench slope and missing excavator fitness certificate', 'data:image/png;base64,sig', 'P&M Eng. Charlie');
`);

assert.strictEqual(evalInVM("p.status"), 'Returned for Correction', 'Permit should be Returned for Correction');
assert.strictEqual(evalInVM("p.approvals.pm.status"), 'rejected', 'P&M slot should be rejected');
assert(evalInVM("!!p._preCorrectionSnapshot"), 'Snapshot of discipline fields must be captured at rejection');
console.log('  ✓ P&M rejection captured pre-correction snapshot');

// Step 4: Supervisor rectifies (without modifying MEP or IT domain fields)
evalInVM(`
currentUser = { key: 'site-supervisor', role: 'site-supervisor', name: 'Site Supervisor John', uid: 'uid-supervisor-01' };
p.slope = '1:1.5';
p.checklist[7].ans = 'yes';
resubmitExcavationCorrection(p.id);
`);

assert.strictEqual(evalInVM("p.status"), 'Pending Parallel Approval', 'Permit should return directly to Pending Parallel Approval (W1)');
// Verify Option B selective preservation
assert.strictEqual(evalInVM("p.approvals.mep.status"), 'approved', 'Option B: MEP approval MUST be preserved (domain fields unchanged)');
assert.strictEqual(evalInVM("p.approvals.it.status"), 'approved', 'Option B: IT approval MUST be preserved (domain fields unchanged)');
assert.strictEqual(evalInVM("p.approvals.pm.status"), 'pending', 'Option B: P&M slot MUST be reset from rejected to pending');
console.log('  ✓ Option B verification: MEP & IT preserved, P&M successfully reset to pending');

// Check tracker HTML does NOT show Rejected for P&M
const trHtml = evalInVM("trackerHtml(p);");
assert(!trHtml.includes('Rejected'), 'Tracker MUST NOT show Rejected for P&M after resubmission');
assert(trHtml.includes('Action Req.'), 'Tracker MUST show Action Req. for pending P&M clearance');
console.log('  ✓ Tracker correctly displays Action Req. (no stuck rejected slot)');

// Check getNextApproverLabel does NOT omit P&M
const nextLbl = evalInVM("getNextApproverLabel(p);");
assert.strictEqual(nextLbl, 'P&M (Clearance Approver)', 'Next approver must strictly be P&M (Clearance Approver)');
console.log('  ✓ getNextApproverLabel correctly displays P&M (Clearance Approver)');

// Check P&M sees active buttons, while Dracula and MEP see read-only awaiting card
evalInVM("currentUser = { key: 'pm', role: 'pm', name: 'P&M Eng. Charlie', uid: 'uid-pm-01' };");
panelHtml = evalInVM("actionPanelHtml(p);");
assert(panelHtml.includes('Step 3: Parallel Approval Required (P&M Engineer)'), 'P&M Engineer MUST see active approval card');
assert(panelHtml.includes('Approve') && panelHtml.includes('Reject'), 'P&M Engineer MUST see interactive action buttons');

evalInVM("currentUser = { key: 'it-in-charge', role: 'it-in-charge', name: 'Dracula', uid: 'uid-dracula-01' };");
panelHtml = evalInVM("actionPanelHtml(p);");
assert(panelHtml.includes('Step 3: Awaiting Parallel Discipline Clearances'), 'Dracula must see awaiting card');
assert(panelHtml.includes('P&amp;M Engineer') || panelHtml.includes('P&M'), 'Card must state awaiting clearance from P&M');
console.log('  ✓ P&M sees active buttons; Dracula sees awaiting P&M card');

// Step 6: P&M approves -> should advance to Section Head (Excavation Head)
evalInVM(`
currentUser = { key: 'pm', role: 'pm', name: 'P&M Eng. Charlie', uid: 'uid-pm-01' };
approvePermitStage(p, 'pm', { lat: 17.4, lng: 78.3, within: true }, 'Fit for use', 'data:image/png;base64,sig', 'P&M Eng. Charlie');
`);

assert.strictEqual(evalInVM("p.status"), 'Pending Section Head', 'Permit should advance to Pending Section Head after all 3 parallel approvals');
assert.strictEqual(evalInVM("p.approvals.pm.status"), 'approved', 'P&M should be approved');
console.log('  ✓ All 3 parallel clearances complete -> Advanced to Excavation Head (Pending Section Head)');

// Step 7: Test Domain Modification Invalidation (Option B reset when domain field changes)
console.log('\n--- 4. Testing Option B Domain Invalidation when Domain Field Changes ---');
evalInVM(`
const p2 = {
    id: 'PTW-001-2026-TEST02',
    ptype: 'excavation',
    type: 'PTW-001',
    project: 'PRJ-PEARL',
    location: 'Sector 1',
    depth: '2.0',
    slope: '1:1',
    equipment: ['Excavator'],
    equipmentOther: '',
    checklist: [
        { id: 1, ans: 'yes' },
        { id: 2, ans: 'yes' },
        { id: 3, ans: 'yes' },
        { id: 4, ans: 'yes' },
        { id: 5, ans: 'yes' },
        { id: 6, ans: 'yes' },
        { id: 7, ans: 'yes' },
        { id: 8, ans: 'yes' }
    ],
    createdBy: 'Site Supervisor John',
    createdByRole: 'site-supervisor',
    status: 'Pending Parallel Approval',
    approvals: newChain('excavation')
};
p2.approvals.mep = { status: 'approved', by: 'MEP Eng' };
p2.approvals.it = { status: 'approved', by: 'Dracula' };
p2.approvals.pm = { status: 'rejected', by: 'P&M Eng' };
p2._preCorrectionSnapshot = snapshotDisciplineFields(p2);

// Supervisor modifies depth (which belongs to MEP domain snapshot)
p2.depth = '4.5';
resetExcavationParallelSlotsOnResubmit(p2);
`);

assert.strictEqual(evalInVM("p2.approvals.pm.status"), 'pending', 'P&M must reset to pending (was rejected)');
assert.strictEqual(evalInVM("p2.approvals.mep.status"), 'pending', 'MEP MUST reset to pending because depth changed');
assert.strictEqual(evalInVM("p2.approvals.it.status"), 'approved', 'IT remains approved because location/q4 did not change');
console.log('  ✓ Option B domain invalidation correctly invalidated MEP and preserved IT');

console.log('\n================================================================');
console.log('ALL PARALLEL GATE & OPTION B REGRESSION TESTS PASSED (100%)');
console.log('================================================================\n');
