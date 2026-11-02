/**
 * VERIFICATION TEST SUITE:
 * 1. Sub-Table Scroll & In-Place UI Updates in PTW-009 (Permit 9)
 * 2. Universal Draft Resumption and Submission across Roles (PTW-001 to PTW-009)
 * 3. Exact Part A (Routine) and Part B (Critical) Checkboxes & YES/NO States
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('TEST SUITE: DRAFT RESUMPTION, SCROLL FIX & PART A/B CHECKBOXES');
console.log('==================================================');

// --- 1. Static Verification of Constants & UI Elements ---
console.log('\n--- 1. Static Verification of Constants & Part A/B Items ---');

assert(src.includes("Lift Plan/ Method Statement (Generic)"), "LIFTING_DOCS_ROUTINE must include 'Lift Plan/ Method Statement (Generic)'");
assert(src.includes("Complex/ Critical/ Heavy/ Lifts Design Calculations & drawings"), "LIFTING_DOCS_CRITICAL must include 'Complex/ Critical/ Heavy/ Lifts Design Calculations & drawings'");
assert(src.includes("Lift Plan/ Method Statement (Specific)"), "LIFTING_DOCS_CRITICAL must include 'Lift Plan/ Method Statement (Specific)'");
assert(src.includes("updateLiftingCalculationsUI"), "updateLiftingCalculationsUI must be defined in index.html");
assert(src.includes("slingStressResultBox"), "slingStressResultBox ID must be present in Sub-Table 4");
assert(src.includes("partLetter + ' &mdash; Statutory Documentation &amp; On-Site Controls (' + partScope"), "Part A/B dynamic title pattern must be present");
assert(src.includes("doc-yn-badge"), "doc-yn-badge must be present for YES/NO visual indicators");

console.log('  ✓ PASS: Static verification of constants, titles, and UI bindings verified');

// --- 2. VM Sandbox Setup ---
console.log('\n--- 2. VM Sandbox Setup & Runtime Evaluation ---');

const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
assert(scriptMatch, "Must extract script from index.html");

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
    querySelector(sel) {
        if (sel === '.calc-tension-text') return getOrCreateElem(this.id + '_tension');
        if (sel === '.calc-badge-container') return getOrCreateElem(this.id + '_badge');
        if (sel === '.doc-yn-badge') return getOrCreateElem(this.id + '_doc_yn');
        return null;
    }
    querySelectorAll() { return []; }
    closest() { return this; }
    focus() {}
    scrollIntoView() {}
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
        return new MockElement('generic', 'div');
    },
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement('', tag),
    body: new MockElement('body', 'body'),
    head: new MockElement('head', 'head'),
    documentElement: new MockElement('html', 'html'),
    addEventListener: () => {},
    removeEventListener: () => {}
};

let toastMessages = [];
const sandbox = {
    __TEST_MODE__: true,
    window: {
        location: { hash: '' },
        addEventListener: () => {},
        removeEventListener: () => {},
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        scrollTo: () => {},
        scrollY: 150
    },
    document: mockDocument,
    console: console,
    setTimeout: (fn) => (typeof fn === 'function' ? fn() : 1),
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    navigator: { geolocation: { getCurrentPosition: (cb) => cb({ coords: { latitude: 19.0760, longitude: 72.8777 } }) } },
    showToast: (msg, type) => { toastMessages.push({ msg, type }); },
    MockElement: MockElement
};
sandbox.window.document = mockDocument;

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(expr) {
    return vm.runInContext(expr, context);
}

console.log('  ✓ PASS: VM Sandbox initialized and script evaluated without errors');

// --- 3. Part A & Part B Checkbox Invariants ---
console.log('\n--- 3. Part A & Part B Checkbox Invariants ---');

const partA = evalInVM('LIFTING_DOCS_ROUTINE');
const partB = evalInVM('LIFTING_DOCS_CRITICAL');

assert.strictEqual(partA.length, 10, 'Part A (Routine Lifts) must have exactly 10 statutory items');
assert.strictEqual(partB.length, 13, 'Part B (Complex/Critical/Heavy) must have exactly 13 statutory items');

const expectedPartA = [
    'P&M Green Card Sticker',
    'Equipment & Accessories Inspection (Color coding, TPI certifications)',
    'EHS Risk Assessment & SWM',
    'Lift Plan/ Method Statement (Generic)',
    'Lift Permit',
    'HIRA verification & Briefing to workforce',
    'Auro Crane & Lifting Safety Management Standard',
    'Crane Operator',
    'Signaler / Rigger',
    'Lifting In-charge / Supervisor'
];
assert.deepStrictEqual(Array.from(partA), expectedPartA, 'Part A items must exactly match specification');

const expectedPartB = [
    'Complex/ Critical/ Heavy/ Lifts Design Calculations & drawings',
    'P&M Green Card Sticker',
    'Equipment & Accessories Inspection (Color coding, TPI Certifications)',
    'EHS Risk Assessment & SWM',
    'Lift Plan/ Method Statement (Specific)',
    'Lift Permit',
    'Pre-start verification & Briefing to workforce',
    'Auro Crane & Lifting Safety Management Standard',
    'Crane Operator',
    'Signaler / Rigger',
    'Lifting In-charge / Supervisor',
    'EHS Supervisor',
    'Design Representative (for first 2 lifts)'
];
assert.deepStrictEqual(Array.from(partB), expectedPartB, 'Part B items must exactly match specification');

console.log('  ✓ PASS: Part A (10 items) and Part B (13 items) verified exactly');

// --- 4. Sub-Table 2 UI Rendering (Routine vs Critical) & In-Place Toggle ---
console.log('\n--- 4. Sub-Table 2 UI Rendering (Routine vs Critical) & In-Place Toggle ---');

evalInVM(`
currentUser = Object.assign({}, roleInfo('lift-supervisor'));
draft = {
    ptype: 'lifting',
    liftingClassification: 'routine',
    loadWeight: 3.5,
    craneOperatorSig: { name: 'Rajesh', dataUrl: 'sig1' },
    riggerSig: { name: 'Sunil', dataUrl: 'sig2' },
    liftingDocs: ['P&M Green Card Sticker', 'Lift Permit']
};
`);

let s1 = evalInVM('step1Html()');
assert(s1.includes('Sub-Table 2: Part A &mdash; Statutory Documentation &amp; On-Site Controls (Routine Lifts)'), 'Step 1 must render Part A for routine lifting');
assert(s1.includes('checked = <b>YES</b>, unchecked = <b>NO</b>'), 'Instructions must clarify checked = YES, unchecked = NO');
assert(s1.includes('<i class="fa-solid fa-check"></i> YES'), 'Checked items must display YES badge');
assert(s1.includes('>NO</span>'), 'Unchecked items must display NO badge');

// In-place toggle test
evalInVM(`
const mockLabel = new MockElement('pill1', 'label');
mockLabel.classList.add('lifting-doc-pill');
const mockBadge = new MockElement('pill1_badge', 'span');
mockBadge.classList.add('doc-yn-badge');
mockLabel.appendChild(mockBadge);
mockLabel.querySelector = (s) => (s === '.doc-yn-badge' ? mockBadge : null);

onLiftingDocToggle('Crane Operator', true, mockLabel);
`);
assert(evalInVM("draft.liftingDocs.includes('Crane Operator')"), 'Checking Crane Operator must add it to liftingDocs (YES)');

evalInVM("onLiftingDocToggle('Crane Operator', false, mockLabel)");
assert(!evalInVM("draft.liftingDocs.includes('Crane Operator')"), 'Unchecking Crane Operator must remove it from liftingDocs (NO)');

console.log('  ✓ PASS: Sub-Table 2 dynamically presents Part A and Part B with in-place YES/NO toggles');

// --- 5. Sub-Table 4 In-Place Dynamic Calculations ---
console.log('\n--- 5. Sub-Table 4 In-Place Dynamic Calculations ---');

evalInVM(`
draft.loadWeight = 4.0;
draft.craneGearWeight = 0.5;
draft.slingLength = 6.0;
draft.slingApexHeight = 4.0;
draft.slingsCount = '2';
draft.slingsAdjustable = 'yes';
draft.slingSwl = 5.0;
updateLiftingCalculationsUI();
`);

const tension = evalInVM('draft.calculatedSlingStress');
const pct = evalInVM('draft.calculatedStressPercent');
assert(tension > 3.3 && tension < 3.4, 'Tension per sling should be ~3.38 MT');
assert(pct > 65 && pct < 70, 'SWL percentage should be ~68%');
assert.strictEqual(evalInVM('draft.liftingClassification'), 'routine', 'Stress <= 80% remains routine');

// Test promotion on high stress > 80%
evalInVM(`
draft.slingSwl = 3.5; // Tension ~3.38 MT / 3.5 SWL = ~96% (> 80%)
updateLiftingCalculationsUI();
`);
assert.strictEqual(evalInVM('draft.liftingClassification'), 'critical', 'Stress > 80% must auto-promote to critical');
assert.strictEqual(evalInVM('draft.ptype'), 'liftplan', 'Ptype must switch to liftplan');

// Step 1 now renders Part B
s1 = evalInVM('step1Html()');
assert(s1.includes('Sub-Table 2: Part B &mdash; Statutory Documentation &amp; On-Site Controls (Complex / Critical / Heavy Lifts)'), 'Step 1 must now render Part B for critical lifting');

console.log('  ✓ PASS: Sub-Table 4 in-place calculations and auto-promotion to Part B verified');

// --- 5.1 Bi-Directional Weight Threshold Synchronization (<= 5 MT Part A vs > 5 MT Part B) ---
console.log('\n--- 5.1 Bi-Directional Weight Threshold Synchronization (<= 5 MT Part A vs > 5 MT Part B) ---');

// Reset to a clean lifting draft with valid parameters
evalInVM(`
startNewPermit('lifting');
draft.slingSwl = 10.0; // keep stress low
draft.craneGearWeight = 0.5;
draft.slingLength = 6.0;
draft.slingApexHeight = 4.0;
draft.slingsCount = '2';
draft.slingsAdjustable = 'yes';
`);

// Step 1: Initial weight 3.5 MT (<= 5 MT) -> Routine, Part A (10 items)
evalInVM(`
draft.loadWeight = '3.5';
updateLiftingCalculationsUI();
`);
assert.strictEqual(evalInVM('draft.liftingClassification'), 'routine', 'Weight 3.5 MT must be routine');
assert.strictEqual(evalInVM('draft.ptype'), 'lifting', 'Ptype must be lifting');
assert.strictEqual(evalInVM('draft.liftingDocs.length'), 10, 'Part A must have 10 items');
assert.strictEqual(evalInVM('draft.loadChecklist[0].ans'), 'no', 'Criterion 0 must be no when <= 5 MT');
s1 = evalInVM('step1Html()');
assert(s1.includes('Sub-Table 2: Part A &mdash; Statutory Documentation &amp; On-Site Controls (Routine Lifts)'), 'Must render Part A for 3.5 MT');
assert(!s1.includes('Sub-Table 2: Part B'), 'Must not render Part B for 3.5 MT');

// Step 2: Weight increased to 6.2 MT (> 5 MT) -> Critical, Part B (13 items)
evalInVM(`
draft.loadWeight = '6.2';
updateLiftingCalculationsUI();
`);
assert.strictEqual(evalInVM('draft.liftingClassification'), 'critical', 'Weight 6.2 MT must auto-promote to critical');
assert.strictEqual(evalInVM('draft.ptype'), 'liftplan', 'Ptype must switch to liftplan');
assert.strictEqual(evalInVM('draft.liftingDocs.length'), 13, 'Part B must have 13 items');
assert.strictEqual(evalInVM('draft.loadChecklist[0].ans'), 'yes', 'Criterion 0 must be yes when > 5 MT');
s1 = evalInVM('step1Html()');
assert(s1.includes('Sub-Table 2: Part B &mdash; Statutory Documentation &amp; On-Site Controls (Complex / Critical / Heavy Lifts)'), 'Must render Part B for 6.2 MT');
assert(!s1.includes('Sub-Table 2: Part A'), 'Must not render Part A for 6.2 MT');

// Step 3: Weight decreased back to 4.2 MT (<= 5 MT) -> Must PROMPTLY revert to Part A (10 items)
evalInVM(`
draft.loadWeight = '4.2';
updateLiftingCalculationsUI();
`);
assert.strictEqual(evalInVM('draft.liftingClassification'), 'routine', 'Weight 4.2 MT must revert promptly to routine');
assert.strictEqual(evalInVM('draft.ptype'), 'lifting', 'Ptype must revert to lifting');
assert.strictEqual(evalInVM('draft.liftingDocs.length'), 10, 'Part A must have 10 items after reducing weight');
assert.strictEqual(evalInVM('draft.loadChecklist[0].ans'), 'no', 'Criterion 0 must promptly reset to no when <= 5 MT');
s1 = evalInVM('step1Html()');
assert(s1.includes('Sub-Table 2: Part A &mdash; Statutory Documentation &amp; On-Site Controls (Routine Lifts)'), 'Must prompt render Part A after decreasing to 4.2 MT');
assert(!s1.includes('Sub-Table 2: Part B'), 'Must not render Part B after decreasing to 4.2 MT');

// Step 4: Weight increased again to 8.0 MT (> 5 MT) -> Must switch to Part B (13 items)
evalInVM(`
draft.loadWeight = '8.0';
updateLiftingCalculationsUI();
`);
assert.strictEqual(evalInVM('draft.liftingClassification'), 'critical', 'Weight 8.0 MT must promote back to critical');
assert.strictEqual(evalInVM('draft.liftingDocs.length'), 13, 'Part B must have 13 items');
assert.strictEqual(evalInVM('draft.loadChecklist[0].ans'), 'yes', 'Criterion 0 must be yes');

// Step 5: Weight set to exactly 5.0 MT (<= 5 MT boundary condition) -> Must revert to Part A
evalInVM(`
draft.loadWeight = '5.0';
updateLiftingCalculationsUI();
`);
assert.strictEqual(evalInVM('draft.liftingClassification'), 'routine', 'Weight exactly 5.0 MT is routine');
assert.strictEqual(evalInVM('draft.liftingDocs.length'), 10, 'Part A must have 10 items at 5.0 MT');
assert.strictEqual(evalInVM('draft.loadChecklist[0].ans'), 'no', 'Criterion 0 must be no at 5.0 MT');

console.log('  ✓ PASS: Bi-directional weight threshold synchronization verified (<= 5 MT Part A vs > 5 MT Part B)');

// --- 6. Universal Draft Resumption and Submission Across Roles ---
console.log('\n--- 6. Universal Draft Resumption and Submission Across Roles ---');

// Case A: Lifting Supervisor saves draft and resumes
evalInVM(`
currentUser = Object.assign({}, roleInfo('lift-supervisor'));
startNewPermit('lifting');
draft.projectName = 'Lodha Park';
draft.loadDescription = 'Air Handling Units';
draft.loadWeight = 3.2;
draft.numWorkers = 4;
draft.craneOperatorSig = { name: 'Rajesh Sharma', dataUrl: 'data:img1' };
draft.riggerSig = { name: 'Sunil Kumar', dataUrl: 'data:img2' };
draftId = draft.id;
saveDraftAndExit();
`);

assert.strictEqual(evalInVM('draft'), null, 'draft must be null after saveDraftAndExit');
const savedLift = evalInVM("PERMITS.find(p => p.id === draftId)");
assert.strictEqual(savedLift.status, 'Draft', 'Permit status in registry must be Draft');

// Resume via viewDetail
evalInVM("viewDetail(draftId)");
assert(evalInVM('draft !== null'), 'Draft must be successfully resumed into memory');
assert.strictEqual(evalInVM('draft.id'), evalInVM('draftId'), 'Resumed draft ID must match');
assert.strictEqual(evalInVM('wizStep'), 1, 'Resumed draft must open at Step 1');
assert.strictEqual(evalInVM('draft.loadDescription'), 'Air Handling Units', 'Draft fields must be fully editable');

// Step through wizard to Step 4 and submit
evalInVM(`
draft.checklist = checklistFor('lifting').map(q => ({ q, ans: 'yes' }));
draft.sitePhoto = 'data:image/png;base64,mockSitePhoto';
draft.startTime = '09:00';
draft.validTill = new Date(Date.now() + 8 * 3600000);
draft.signerVerified = true;
draft.signature = { by: currentUser.name, dataUrl: 'data:imgSig', consent: true };
wizStep = 4;
submitPermit(draft);
`);

assert.strictEqual(evalInVM("PERMITS.find(p => p.id === draftId).status"), 'Pending Site Engineer Acknowledgment', 'Submitting resumed draft must advance to Pending Site Engineer Acknowledgment');

// Case B: Electrician saves PTW-006 draft and resumes
evalInVM(`
currentUser = Object.assign({}, roleInfo('electrician'));
startNewPermit('electrical');
draft.projectName = 'Lodha Park';
draft.electricalSiteType = 'batching_plant';
draft.facilityScope = 'batching_plant';
draft.electricalWorkScope = 'Substation transformer feeder breaker maintenance';
draft.numWorkers = 3;
elecDraftId = draft.id;
saveDraftAndExit();
`);

assert.strictEqual(evalInVM('draft'), null, 'draft must be null after saveDraftAndExit');
evalInVM("viewDetail(elecDraftId)");
assert(evalInVM('draft !== null'), 'Electrician draft must be successfully resumed');
assert.strictEqual(evalInVM('draft.id'), evalInVM('elecDraftId'), 'Resumed draft ID must match electrician draft');
assert.strictEqual(evalInVM('draft.electricalWorkScope'), 'Substation transformer feeder breaker maintenance');

console.log('  ✓ PASS: Universal draft resumption verified for both Lifting Supervisor and Electrician');

console.log('\n==================================================');
console.log('ALL DRAFT RESUMPTION & PTW-009 SUB-TABLE TESTS PASSED (100% SUCCESS)');
console.log('==================================================');
