/**
 * Verification Test: Permit Submission Flow & Mandatory Drawing Plan Verification
 *
 * Verifies:
 * 1. Step 4 renders complete review AND Digital Signature section (Permittee signature pad, DPDP consent).
 * 2. Submit Permit button becomes enabled when signed.
 * 3. Excavation drawing plan is MANDATORY for PTW-001 Excavation permits.
 * 4. Drawing plan is NOT required for non-excavation permits (Electrical, Drilling & Blasting).
 * 5. Permits for Excavation, Electrical, Drilling & Blasting submit cleanly into workflow.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('==================================================');
console.log('TEST: PERMIT SUBMISSION FLOW & MANDATORY DRAWING PLAN VERIFICATION');
console.log('==================================================\n');

const htmlPath = path.join(__dirname, '..', 'index.html');
const src = fs.readFileSync(htmlPath, 'utf8');

// 1. Static checks
console.log('--- 1. Static Verification ---');
assert(src.includes('const drawingOk = !isExcavation || !!draft.drawing;'), "validateWizStep(2) must require draft.drawing for excavation");
console.log('  ✓ PASS: validateWizStep(2) requires drawing plan for excavation permits');

assert(src.includes("pend.push('Excavation drawing pending')"), "Excavation drawing pending must appear in Step 2 pending list");
console.log('  ✓ PASS: Excavation drawing pending message present in pending requirements');

assert(src.includes('Drawing Indicating Proposed Excavation <span class="req">*</span>'), "Step 2 drawing upload card marked as Required");
console.log('  ✓ PASS: Drawing upload card marked as Required * in UI');

// Step 4 structure check
const step4Match = src.match(/function step4Html\(\) \{([\s\S]*?)\n        \}/);
assert(step4Match, "step4Html function must exist");
assert(step4Match[1].includes('let html ='), "step4Html must define let html =");
assert(step4Match[1].includes('return html;'), "step4Html must return html at end");
assert(step4Match[1].includes('wizSigSection'), "step4Html must include wizSigSection");
console.log('  ✓ PASS: step4Html properly constructs and returns html including wizSigSection');

// 2. Runtime VM environment
console.log('\n--- 2. Runtime Evaluation & Full Flow Verification ---');

class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.value = '';
        this.checked = false;
        this.style = {};
        this.classes = new Set();
        this.classList = {
            add: (c) => this.classes.add(c),
            remove: (c) => this.classes.delete(c),
            contains: (c) => this.classes.has(c),
            toggle: (c) => { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); }
        };
        this.children = [];
        this.disabled = false;
    }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) { return child; }
    remove() {}
    classListAdd(c) { this.classes.add(c); }
    classListRemove(c) { this.classes.delete(c); }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    addEventListener() {}
    focus() {}
    scrollIntoView() {}
}

const mockElements = {};
function getOrCreateElem(id, tag = 'div') {
    if (!mockElements[id]) mockElements[id] = new MockElement(id, tag);
    return mockElements[id];
}

const sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    Infinity: Infinity,
    String: String,
    Array: Array,
    Object: Object,
    RegExp: RegExp,
    JSON: JSON,
    document: {
        getElementById: (id) => getOrCreateElem(id),
        querySelector: (sel) => {
            if (sel && sel.startsWith('#')) return getOrCreateElem(sel.substring(1));
            return new MockElement('', 'div');
        },
        querySelectorAll: () => [],
        createElement: (tag) => new MockElement('', tag),
        addEventListener: () => {},
        body: new MockElement('body', 'body')
    },
    window: {
        scrollTo: () => {},
        history: { pushState: () => {}, replaceState: () => {} },
        location: { hash: '' }
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    },
    setInterval: () => {},
    clearInterval: () => {},
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); },
    clearTimeout: () => {},
    showToast: () => {},
    closeModal: () => {},
    openModal: () => {}
};

vm.createContext(sandbox);

const scriptMatches = src.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
let fullScript = '';
scriptMatches.forEach(m => {
    fullScript += m.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '') + '\n';
});

vm.runInContext(fullScript, sandbox);
console.log('  ✓ PASS: VM Sandbox initialized');

function evalInVM(code) {
    return vm.runInContext(code, sandbox);
}

// 3. Test Excavation Submission Flow (PTW-001) — Drawing is MANDATORY
console.log('\n--- 3. PTW-001 Excavation Submission Flow — Mandatory Drawing Plan ---');
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ravi', role: 'Site Supervisor' };");
evalInVM("startNewPermit('excavation');");

let draft = evalInVM("draft");
assert.strictEqual(draft.ptype, 'excavation');
assert.strictEqual(draft.drawing, null, "Drawing starts as null");

// Fill Step 1
draft.project = 'Auro Grand Residency';
draft.projectNum = 'PRJ-AGR';
draft.organization = 'Internal';
draft.locationStructure = 'Basement/Podium';
draft.locBasementPodium = 'Basement 1';
draft.locArea = 'North Trench Zone';
draft.depth = '1.5';
draft.slope = '45';
draft.equipment = ['Excavator'];
draft.gps = { lat: 12.9716, lng: 77.5946, within: true, distance: 20 };
draft.weather = 'Clear';
draft.sitePhoto = 'data:image/jpeg;base64,mocksitephoto';

assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 must pass");
console.log('  ✓ PASS: Step 1 validates successfully');

// Step 2: Answer checklist, NO drawing provided — must FAIL
evalInVM("wizStep = 2;");
draft.checklist.forEach(item => {
    item.ans = 'yes';
    item.comment = 'Verified safe';
});
draft.drawing = null; // Explicitly ensure NO drawing plan attached

assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 MUST FAIL without drawing plan for excavation");
console.log('  ✓ PASS: Step 2 correctly BLOCKS progression without excavation drawing attached');

// Now attach drawing — Step 2 must pass
draft.drawing = {
    name: 'excavation_plan_trench_north.pdf',
    isImage: false,
    dataUrl: null,
    at: new Date().toISOString()
};
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 MUST pass with drawing plan attached");
console.log('  ✓ PASS: Step 2 validates successfully WITH excavation drawing attached');

// Step 3: Timings
evalInVM("wizStep = 3;");
evalInVM("nowTime = () => new Date(2026, 8, 10, 11, 0, 0);");
draft.startTime = '11:30';
draft.validTillTime = '17:30';
assert.strictEqual(evalInVM("validateWizStep(3)"), true, "Step 3 validates successfully");
console.log('  ✓ PASS: Step 3 validates successfully');

// Step 4: Review and Digital Signature
evalInVM("wizStep = 4;");
const step4HtmlOutput = evalInVM("step4Html()");
assert(step4HtmlOutput.includes('Permit Validity'), "Step 4 must contain Permit Validity");
assert(step4HtmlOutput.includes('Digital Signature of Permittee'), "Step 4 MUST render Digital Signature section");
assert(step4HtmlOutput.includes('Signatory Identification &amp; DPDP Consent'), "Step 4 must render DPDP Identification box");
assert(step4HtmlOutput.includes('excavation_plan_trench_north.pdf'), "Step 4 review MUST show excavation drawing attachment filename");
console.log('  ✓ PASS: step4Html() renders Permit Validity, Permittee Digital Signature, AND Excavation Drawing');

// Before signing, Step 4 is not ok
assert.strictEqual(evalInVM("validateWizStep(4)"), false, "Step 4 is not ok before signing");

// Permittee enters name, grants DPDP consent, signs
draft.signerName = 'Supervisor Ravi';
draft.signerVerified = true;
draft.signerConsent = true;
draft.signature = {
    dataUrl: 'data:image/png;base64,mockdigitalsignature',
    by: 'Supervisor Ravi',
    at: new Date().toISOString(),
    consent: true
};

assert.strictEqual(evalInVM("validateWizStep(4)"), true, "Step 4 is OK after digital signature & consent");
console.log('  ✓ PASS: Step 4 validates and enables Submit Permit button');

// Final Submit
evalInVM("executeFinalSubmit();");
const submittedPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(submittedPermit.ptype, 'excavation');
assert.strictEqual(submittedPermit.status, 'Pending Site Engineer Acknowledgment');
assert.ok(submittedPermit.drawing, "Permit must have drawing attached on submission");
assert.strictEqual(submittedPermit.drawing.name, 'excavation_plan_trench_north.pdf', "Drawing filename must persist");
console.log('  ✓ PASS: PTW-001 Excavation submitted successfully with mandatory drawing attached');

// 4. Test Electrical Work Submission Flow (PTW-006)
console.log('\n--- 4. PTW-006 Electrical Work Flow Verification ---');
evalInVM("currentUser = { key: 'electrician', name: 'Electrician M. Kumar', role: 'Licensed Electrician' };");
evalInVM("startNewPermit('electrical');");
draft = evalInVM("draft");
draft.facilityScope = 'batching_plant';
draft.electricalSiteType = 'batching_plant';
draft.locationStructure = 'Manual';
draft.locManual = 'Main Batching Plant Yard';
draft.locManualArea = 'MCC Feeder Panel 01';
draft.shutdownRequester = 'Electrician M. Kumar';
draft.shutdownWhy = 'Preventive maintenance on PCC breaker';
draft.electricalApparatus = ['LT Main Distribution Panels (PCC / MCC)'];
draft.apparatusList = ['LT Main Distribution Panels (PCC / MCC)'];
draft.shutdownTimeFrom = '12:00';
draft.shutdownTimeTo = '15:00';
draft.approxShutdownFrom = '12:00';
draft.approxShutdownTo = '15:00';
draft.electricalSafeToWork = true;
draft.elecSafeToWork = true;
draft.lotoDone = true;
draft.elecLotoDone = true;
draft.lotoRegisterNo = 'LOT-2026-091';
draft.elecLotoRegisterNo = 'LOT-2026-091';
draft.lotoDateTime = '2026-09-10T12:00';
draft.elecLotoTime = '12:00';
draft.elecLotoDate = '2026-09-10';
draft.electricalStatutoryDecl = true;
draft.elecStatutoryDecl = true;
draft.organization = 'Internal';
draft.sitePhoto = 'demo';
draft.gps = { lat: 12.9716, lng: 77.5946, within: true, distance: 10 };

assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 validates without project for batching plant");

draft.checklist.forEach(item => { item.ans = 'yes'; });
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 validates without drawing");

draft.startTime = '12:00';
draft.validTillTime = '15:00';
assert.strictEqual(evalInVM("validateWizStep(3)"), true, "Step 3 validates");

evalInVM("wizStep = 4;");
draft.signerName = 'Electrician M. Kumar';
draft.signerVerified = true;
draft.signerConsent = true;
draft.signature = {
    dataUrl: 'data:image/png;base64,mockdigitalsignature',
    by: 'Electrician M. Kumar',
    at: new Date().toISOString(),
    consent: true
};
assert.strictEqual(evalInVM("validateWizStep(4)"), true, "Step 4 validates");

evalInVM("executeFinalSubmit();");
const elecPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(elecPermit.ptype, 'electrical');
assert.strictEqual(elecPermit.status, 'Pending P&M Acknowledgment');
console.log('  ✓ PASS: PTW-006 Electrical Work submitted successfully into workflow');

// 5. Test Drilling & Blasting Submission Flow (PTW-007)
console.log('\n--- 5. PTW-007 Drilling & Blasting Flow Verification ---');
evalInVM("currentUser = { key: 'blasting-incharge', name: 'Blaster V. Rao', role: 'Blasting / Drilling In-charge' };");
evalInVM("startNewPermit('blasting');");
draft = evalInVM("draft");
draft.project = 'Auro Grand Residency';
draft.projectNum = 'PRJ-AGR';
draft.locationStructure = 'Manual';
draft.locManual = 'Bench 2 East Face';
draft.locManualArea = 'Zone B';
draft.location = 'Bench 2 East Face';
draft.drillingBlastingType = 'drilling';
draft.organization = 'Subcontractor';
draft.contractor = 'ExploTech Contractors';
draft.dbDateTime = '2026-09-10 11:00';
draft.dbDrillDiameter = '32';
draft.dbDrillDepth = '2.5';
draft.dbHolesCount = '10';
draft.dbMachineType = 'Crawler Drill';
draft.gps = { lat: 12.9716, lng: 77.5946, within: true, distance: 15 };
draft.weather = 'Dry';
draft.sitePhoto = 'data:image/jpeg;base64,mocksitephoto';

assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 validates for drilling");

draft.checklist.forEach(item => { item.ans = 'yes'; });
draft.dbOtherPrecautions = 'Standard drill dust containment';
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 validates without drawing");

draft.startTime = '11:00';
draft.validTillTime = '17:00';
assert.strictEqual(evalInVM("validateWizStep(3)"), true, "Step 3 validates");

evalInVM("wizStep = 4;");
draft.signerName = 'Blaster V. Rao';
draft.signerVerified = true;
draft.signerConsent = true;
draft.signature = {
    dataUrl: 'data:image/png;base64,mockdigitalsignature',
    by: 'Blaster V. Rao',
    at: new Date().toISOString(),
    consent: true
};
assert.strictEqual(evalInVM("validateWizStep(4)"), true, "Step 4 validates for drilling");

evalInVM("executeFinalSubmit();");
const drillPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(drillPermit.ptype, 'blasting');
assert.strictEqual(drillPermit.status, 'Pending Site Engineer Acknowledgment');
console.log('  ✓ PASS: PTW-007 Drilling submitted successfully into workflow');

console.log('\n==================================================');
console.log('ALL VERIFICATION CHECKS PASSED (100% SUCCESS)');
console.log('==================================================\n');
