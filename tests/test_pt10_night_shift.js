/**
 * PTW-010 NIGHT SHIFT / HOLIDAY WORK & DUAL-PHASE HANDOVER GOVERNANCE TEST SUITE
 *
 * Exhaustive, robust, and comprehensive verification of PTW-010 (Night Shift / Holiday Work):
 * 1.  Static Metadata & Constants Verification (Single Catalog Tile PTW-010, 13 statutory checklist checks, 7 valid night work descriptions, supervisor qualification registry)
 * 2.  VM Sandbox Setup & Mock Environment Initialization
 * 3.  Strict Statutory Prohibitions (Confined Space PTW-004, Drilling & Blasting PTW-007, Critical Lift Plan PTW-009B strictly forbidden)
 * 4.  Stage 1 Day Phase (5:00 PM – 6:30 PM):
 *     - Initiated by Site Supervisor (Permittee · Day)
 *     - Pre-fills ARPL project, Subcontractor checkbox, Description of Work dropdown
 *     - 13 statutory checklist checks, signature
 *     - Mandatory site photo deferred to 8:30 PM handover (no Step 2 photo blocker)
 *     - Step 3 accepts overnight hours (20:30 to 06:00) without daytime office hour errors
 *     - Approval spine: Site Supervisor -> Site Engineer -> Tower Incharge (P&M notified, EHS held)
 *     - Status advances to: "Night Shift Approved – Awaiting Linked Permit"
 * 5.  Sequential Stage 2 Day Phase (Linked Activity Permit):
 *     - Linked permit unlocked only once Stage 1 completes
 *     - Routes through daytime chain -> Both advance to "Approved – Pending Night Handover"
 * 6.  8:30 PM (20:30 IST) Handover Gate & Qualification Validation:
 *     - Evaluated by Night Site Supervisor (Permittee · Night)
 *     - PM authorization & valid PTW training (< 365 days) qualification gate
 *     - 21:00 IST Cutoff auto-cancel engine (No-Show Auto-Cancel)
 *     - Mandatory Dual Site Photo capture (Illumination + Activity Setup)
 *     - Status advances to: "Pending P&M Night Acknowledgment"
 * 7.  Step 5 P&M Night Acknowledgment:
 *     - P&M Engineer verifies equipment, lighting towers (lux levels), operators, signs
 *     - Status advances to: "Pending EHS Approval"
 * 8.  Step 6 EHS Final Verification & Rejection Routing:
 *     - Rejection strictly routes back to Night Site Supervisor ("Returned to Night Supervisor"), DAY APPROVERS NOT RE-ENGAGED
 *     - Resubmission returns to night workflow
 *     - Approval activates both parent night shift and linked permit ("Active")
 * 9.  Exclusive Closure & Surrender with Illumination De-energization Declaration:
 *     - Restricted to Night Site Supervisor
 *     - Mandatory Night Shift Handover & Illumination De-energization Declaration
 * 10. Official Permit Report PDF Generation & 6-Signatory Flow:
 *     - Embeds dual photos and night supervisor & P&M signatures
 *     - 6-stage statutory signatories flow verification
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE 23: PTW-010 NIGHT SHIFT / HOLIDAY WORK & DUAL-PHASE HANDOVER');
console.log('==================================================');

// --- 1. Static Verification of Metadata, Constants & Schema ---
console.log('\n--- 1. Static Verification of Metadata, Constants & Schema ---');

assert(src.includes("key: 'nightshift'"), "PTYPE_META must register nightshift key");
assert(src.includes("code: 'PTW-010'"), "PTYPE_META must register PTW-010 code");
assert(src.includes("form: 'PTW-010'"), "PTYPE_META must register Form PTW-010");
assert(src.includes("Night Shift Work"), "PTYPE_META title must contain Night Shift Work");
assert(src.includes("NIGHTSHIFT_CHECKLIST_ITEMS"), "NIGHTSHIFT_CHECKLIST_ITEMS must be defined (13 items)");
assert(src.includes("NIGHT_WORK_DESCRIPTIONS"), "NIGHT_WORK_DESCRIPTIONS must be defined");
assert(src.includes("NIGHT_SUPERVISORS"), "NIGHT_SUPERVISORS registry must be defined");
assert(src.includes("canLinkToNightShift"), "canLinkToNightShift function must be defined");
assert(src.includes("validateNightSupervisorGate"), "validateNightSupervisorGate function must be defined");
assert(src.includes("checkNightHandoverCutoff"), "checkNightHandoverCutoff function must be defined");
assert(src.includes("Night Shift Approved – Awaiting Linked Permit"), "APP_CONFIG.statuses must contain Stage 1 status");
assert(src.includes("Approved – Pending Night Handover"), "APP_CONFIG.statuses must contain Stage 2 status");
assert(src.includes("Pending P&M Night Acknowledgment"), "APP_CONFIG.statuses must contain Stage 3 status");
assert(src.includes("Returned to Night Supervisor"), "APP_CONFIG.statuses must contain rejection status");
assert(src.includes("night_shift_protocol"), "APP_CONFIG.workflows must contain night_shift_protocol");

console.log('  ✓ PASS: PTW-010 metadata, 13 checklist points, registry, statutory descriptions, and status schemas statically verified');

// --- 2. Runtime Setup & VM Sandbox Initialization ---
console.log('\n--- 2. Runtime Setup & VM Sandbox Initialization ---');

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
    toDataURL() { return 'data:image/png;base64,mockSigPadData'; }
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

// Extract inline scripts from index.html
const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
while ((match = scriptRegex.exec(src)) !== null) {
    const code = match[1];
    if (code.trim().length > 0) {
        try {
            vm.runInContext(code, ctx, { filename: 'index.html#script' + (++scriptIdx) });
        } catch (e) {
            console.error('Error in script block ' + scriptIdx + ':', e.message);
            throw e;
        }
    }
}

function evalInVM(expr) {
    return vm.runInContext(expr, ctx);
}

evalInVM(`
    const _nativeToast = showToast;
    showToast = function(msg, type, icon) {
        toastMessages.push({ msg, type, icon });
        if (typeof _nativeToast === 'function') _nativeToast(msg, type, icon);
    };
`);

console.log('  ✓ PASS: VM Sandbox initialized and script evaluated without errors');

// --- 3. Strict Statutory Prohibitions ---
console.log('\n--- 3. Strict Statutory Prohibitions Verification ---');

// Confined Space Entry PTW-004 is strictly prohibited
assert.strictEqual(evalInVM("canLinkToNightShift('confined')"), false, "Confined Space Entry PTW-004 must be strictly PROHIBITED at night");
// Drilling & Blasting PTW-007 is strictly prohibited
assert.strictEqual(evalInVM("canLinkToNightShift('blasting')"), false, "Drilling & Blasting PTW-007 must be strictly PROHIBITED at night");
// Critical Lift Plan PTW-009B is strictly prohibited
assert.strictEqual(evalInVM("canLinkToNightShift('liftplan')"), false, "Critical Lift Plan PTW-009B must be strictly PROHIBITED at night");
// Lifting permit with load > 5 MT is strictly prohibited
assert.strictEqual(evalInVM("canLinkToNightShift('lifting', { loadWeight: 6.5 })"), false, "Lifting permit with load > 5 MT must be PROHIBITED at night");
assert.strictEqual(evalInVM("canLinkToNightShift('lifting', { liftingClassification: 'critical' })"), false, "Critical Lifting must be PROHIBITED at night");

// Allowed permit types:
assert.strictEqual(evalInVM("canLinkToNightShift('hotwork')"), true, "Hot Work must be permitted at night");
assert.strictEqual(evalInVM("canLinkToNightShift('shaft')"), true, "Shaft Work must be permitted at night");
assert.strictEqual(evalInVM("canLinkToNightShift('guardrail')"), true, "Guardrail removal must be permitted at night");
assert.strictEqual(evalInVM("canLinkToNightShift('electrical')"), true, "Electrical Work must be permitted at night");
assert.strictEqual(evalInVM("canLinkToNightShift('general')"), true, "General Work must be permitted at night");
assert.strictEqual(evalInVM("canLinkToNightShift('excavation')"), true, "Excavation must be permitted at night");
assert.strictEqual(evalInVM("canLinkToNightShift('lifting', { loadWeight: 3.2, liftingClassification: 'routine' })"), true, "Routine Lifting (<= 5 MT) must be permitted at night");

console.log('  ✓ PASS: Statutory prohibitions strictly enforced: Confined Space, Blasting, and Critical Lifts blocked; Routine permits authorized');

// --- 4. 13 Statutory Checklist Items & Descriptions Registry ---
console.log('\n--- 4. 13 Statutory Checklist Items & Descriptions Registry ---');

const checklist = evalInVM("NIGHTSHIFT_CHECKLIST_ITEMS");
assert(Array.isArray(checklist), "NIGHTSHIFT_CHECKLIST_ITEMS must be an array");
assert.strictEqual(checklist.length, 13, "NIGHTSHIFT_CHECKLIST_ITEMS must contain exactly 13 statutory points");

// Verify illumination, alcohol, vehicle, telecom, and PPE checks
const strChecklist = checklist.map(item => typeof item === 'string' ? item : (item.text || item.label || ''));
const hasLux = strChecklist.some(s => /lighting|illumination/i.test(s));
const hasVehicle = strChecklist.some(s => /vehicle|emergency/i.test(s));
const hasAlcohol = strChecklist.some(s => /alcohol/i.test(s));
const hasComm = strChecklist.some(s => /walkie[- ]talkie|signal/i.test(s));
const hasPpe = strChecklist.some(s => /ppe/i.test(s));

assert(hasLux, "Checklist must mandate minimum lighting tower lux levels");
assert(hasVehicle, "Checklist must mandate emergency vehicle at site");
assert(hasAlcohol, "Checklist must mandate random alcohol test");
assert(hasComm, "Checklist must mandate emergency communication / walkie-talkie");
assert(hasPpe, "Checklist must mandate required PPE for the task");

const descriptions = evalInVM("NIGHT_WORK_DESCRIPTIONS");
assert(Array.isArray(descriptions), "NIGHT_WORK_DESCRIPTIONS must be an array");
assert(descriptions.length >= 7, "Must have at least 7 authorized night work activities");

console.log('  ✓ PASS: 13 statutory checklist checks and authorized activity catalog validated');

// --- 5. Stage 1 Day Phase (5:00 PM – 6:30 PM) Form & Validation ---
console.log('\n--- 5. Stage 1 Day Phase (5:00 PM – 6:30 PM) Form & Validation ---');

// Set user to site-supervisor
evalInVM("switchRole('site-supervisor')");
const currentUser = evalInVM("currentUser");
assert.strictEqual(currentUser.key, 'site-supervisor', "Must be logged in as site-supervisor");

// Initialize nightshift permit draft
evalInVM("startNewPermit('nightshift')");
const draft = evalInVM("draft");
assert.strictEqual(draft.ptype, 'nightshift', "Draft type must be nightshift");
assert.strictEqual(draft.project, 'ARPL', "Night shift must default to ARPL corporate project");
assert.strictEqual(draft.startTime, '20:30', "Night shift must default start at 20:30 (8:30 PM IST)");
assert.strictEqual(draft.validTillTime, '06:00', "Night shift must default end at 06:00 (6:00 AM IST)");

// Step 1 Validation: description mandatory
evalInVM("draft.nightWorkDescription = ''");
evalInVM("draft.location = 'Tower 4 - Basement 2'");
evalInVM("draft.numWorkers = 8");
evalInVM("draft.subcontractor = 'Apex Foundations Ltd'");
evalInVM("draft.isSubcontractor = true");
evalInVM("draft.nightSubcontractorName = 'Apex Foundations Ltd'");

let step1Valid = evalInVM("validateWizStep(1)");
assert.strictEqual(step1Valid, false, "Step 1 must fail if night work description is empty");

evalInVM("const hwItem = NIGHT_WORK_DESCRIPTIONS.find(d => d.type === 'hotwork') || NIGHT_WORK_DESCRIPTIONS[0]; draft.nightWorkDescription = hwItem.name || hwItem.text || hwItem.label;");
step1Valid = evalInVM("validateWizStep(1)");
assert.strictEqual(step1Valid, true, "Step 1 must pass when description and mandatory fields are filled");

// Step 2 Validation: 13 checklist checks; sitePhoto deferred / optional
evalInVM(`
    draft.checklist = draft.checklist.map(c => Object.assign({}, c, { ans: 'yes', comment: 'Compliant' }));
    draft.sitePhoto = null;
`);
let step2Valid = evalInVM("validateWizStep(2)");
assert.strictEqual(step2Valid, true, "Step 2 must PASS without sitePhoto for nightshift (statutory deferral to 8:30 PM)");

// Step 3 Validation: Overnight hours (20:30 to 06:00) must be accepted without office-hour errors
let step3Valid = evalInVM("validateWizStep(3)");
assert.strictEqual(step3Valid, true, "Step 3 must accept overnight operating hours (20:30 to 06:00)");

console.log('  ✓ PASS: Stage 1 wizard fields, subcontractor toggle, photo deferral, and overnight time window validated');

// --- 6. Stage 1 Daytime Approval Spine (5:00 PM – 6:30 PM) ---
console.log('\n--- 6. Stage 1 Daytime Approval Spine ---');

// Fill signature and submit permit
evalInVM(`
    draft.signerName = 'V. Ramanathan';
    draft.signerSig = 'data:image/png;base64,sigDemo';
    draft.signerConsent = true;
    PERMITS.unshift(draft);
    submitPermit(draft);
`);

const p1 = evalInVM("PERMITS[0]");
assert(p1.id.startsWith('PTW-010-'), "Permit ID must have PTW-010- prefix");
assert.strictEqual(p1.status, 'Pending Site Engineer Acknowledgment', "Initial status must be Pending Site Engineer Acknowledgment");

// Step 2 Day Approver: Site Engineer
evalInVM("switchRole('site-engineer')");
evalInVM(`acknowledgeSiteEngineer('${p1.id}', 'Site layout and daylight conditions verified safe for scheduled night work', { lat: 17.3850, lng: 78.4867, within: true }, 'data:image/png;base64,sigSE', 'K. V. Rao')`);
assert.strictEqual(evalInVM(`PERMITS.find(x => x.id === '${p1.id}').status`), 'Pending Section Head', "Status after Site Engineer must be Pending Section Head");

// Step 3 Day Approver: Tower Incharge / Section Head
evalInVM("switchRole('hw-section-head')");
evalInVM(`approvePermitStage('${p1.id}', 'sectionHead', { lat: 17.3850, lng: 78.4867, within: true }, 'data:image/png;base64,sigSH', 'Tower Incharge', 'Approved for night shift protocol. EHS held for night on-site inspection.', 'hw-section-head')`);

const p1Approved = evalInVM(`PERMITS.find(x => x.id === '${p1.id}')`);
assert.strictEqual(p1Approved.status, 'Night Shift Approved – Awaiting Linked Permit', "Stage 1 approval must set status to 'Night Shift Approved – Awaiting Linked Permit'");

// Verify P&M is in chain for night phase (pmNight) and Night Handover node exists
assert(p1Approved.approvals.pmNight, "P&M night acknowledgment node must exist in approvals chain");
assert(p1Approved.approvals.nightHandover, "Night Handover node must exist in approvals chain");

console.log('  ✓ PASS: Stage 1 daytime approval spine complete: Site Supervisor -> Site Engineer -> Tower Incharge -> Night Shift Approved – Awaiting Linked Permit');

// --- 7. Sequential Stage 2 Day Phase (Linked Activity Permit) ---
console.log('\n--- 7. Sequential Stage 2 Day Phase (Linked Activity Permit) ---');

// Unlocks linked permit for Site Supervisor
evalInVM("switchRole('site-supervisor')");
evalInVM(`openLinkedPermitFromNightShift('${p1.id}')`);
const linkedDraft = evalInVM("draft");
assert.strictEqual(linkedDraft.ptype, 'hotwork', "Linked permit type must match night work description");
assert.strictEqual(linkedDraft.parentNightShiftId, p1.id, "Linked permit must reference parent night shift ID");

// Fill and submit linked hotwork permit
evalInVM(`
    draft.location = 'Tower 4 - Basement 2';
    draft.subcontractor = 'Apex Foundations Ltd';
    draft.numWorkers = 4;
    draft.hotworkType = 'welding';
    draft.checklist = draft.checklist.map(c => Object.assign({}, c, { ans: 'yes', comment: 'Checked' }));
    draft.sitePhoto = 'data:image/png;base64,photoDemo';
    draft.signerName = 'V. Ramanathan';
    draft.signerSig = 'data:image/png;base64,sigDemo';
    draft.signerConsent = true;
    PERMITS.unshift(draft);
    submitPermit(draft);
`);

const pLinked = evalInVM(`PERMITS.find(x => x.parentNightShiftId === '${p1.id}')`);
assert(pLinked, "Linked permit must be created in PERMITS registry");
assert(pLinked.id.startsWith('PTW-002-'), "Linked permit must be Hot Work (PTW-002)");

// Link back to parent
assert.strictEqual(evalInVM(`PERMITS.find(x => x.id === '${p1.id}').linkedPermitId`), pLinked.id, "Parent permit must store linkedPermitId");

// Run daytime approvals for linked permit: Site Engineer -> Section Head
evalInVM("switchRole('site-engineer')");
evalInVM(`acknowledgeSiteEngineer('${pLinked.id}', 'Hot work location checked', { lat: 17.3850, lng: 78.4867, within: true }, 'data:image/png;base64,sigSE', 'K. V. Rao')`);

evalInVM("switchRole('hw-section-head')");
evalInVM(`approvePermitStage('${pLinked.id}', 'sectionHead', { lat: 17.3850, lng: 78.4867, within: true }, 'data:image/png;base64,sigSH', 'Tower Incharge', 'Hot work daytime approvals cleared.', 'hw-section-head')`);

// Once both daytime approvals complete, both permits advance to "Approved – Pending Night Handover"
const p1PendingHandover = evalInVM(`PERMITS.find(x => x.id === '${p1.id}')`);
const pLinkedPendingHandover = evalInVM(`PERMITS.find(x => x.id === '${pLinked.id}')`);
assert.strictEqual(p1PendingHandover.status, 'Approved – Pending Night Handover', "Parent permit must advance to 'Approved – Pending Night Handover'");
assert.strictEqual(pLinkedPendingHandover.status, 'Approved – Pending Night Handover', "Linked permit must advance to 'Approved – Pending Night Handover'");

console.log('  ✓ PASS: Sequential Stage 2 linked permit unlocked, daytime approvals completed, and both permits synchronized to Approved – Pending Night Handover');

// --- 8. 8:30 PM (20:30 IST) Handover Gate & Qualification Engine ---
console.log('\n--- 8. 8:30 PM Handover Gate & Qualification Engine ---');

// Verify qualification rules: PM authorized + training < 365 days
const qualifiedGate = evalInVM("validateNightSupervisorGate('venkatesh_rao')");
assert.strictEqual(qualifiedGate.valid, true, "Venkatesh Rao (authorized + valid training) must PASS qualification gate");

const qualifiedGate2 = evalInVM("validateNightSupervisorGate('ramesh_naidu')");
assert.strictEqual(qualifiedGate2.valid, true, "Ramesh Naidu (authorized + valid training) must PASS qualification gate");

const disqualifiedGate1 = evalInVM("validateNightSupervisorGate('kishore_varma')");
assert.strictEqual(disqualifiedGate1.valid, false, "Kishore Varma (not PM authorized) must FAIL qualification gate");
assert(disqualifiedGate1.reason.includes("Project Manager (PM) authorised"), "Failure reason must mention missing PM authorization");

const disqualifiedGate2 = evalInVM("validateNightSupervisorGate('anand_kumar')");
assert.strictEqual(disqualifiedGate2.valid, false, "Anand Kumar (expired PTW training) must FAIL qualification gate");
assert(disqualifiedGate2.reason.includes("training certification expired"), "Failure reason must mention expired training");

// 21:00 IST Cutoff Engine Test
evalInVM(`
    const testCutoffPermit = {
        id: 'PTW-010-CUTOFF-TEST',
        ptype: 'nightshift',
        type: 'nightshift',
        status: 'Approved – Pending Night Handover'
    };
    testCutoffResult = checkNightHandoverCutoff(testCutoffPermit, new Date('2026-09-17T21:05:00+05:30'));
`);
const cutoffRes = evalInVM("testCutoffResult");
assert.strictEqual(cutoffRes.cutoffReached, true, "21:00 cutoff must trigger when time >= 21:00 without supervisor handover");

// Night Supervisor Handover Execution (8:30 PM IST)
evalInVM("switchRole('night-supervisor')");
evalInVM(`openNightHandoverModal('${p1.id}')`);

// Submit Handover with qualified supervisor (Venkatesh Rao) and Dual Photos
evalInVM(`
    actionModalCtx.supervisorKey = 'venkatesh_rao';
    actionModalCtx.supervisorName = 'Venkatesh Rao';
    actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
    actionModalCtx.illuminationPhoto = 'data:image/png;base64,mockLuxTowerPhoto';
    actionModalCtx.activityPhoto = 'data:image/png;base64,mockWeldingSetupPhoto';
    actionModalCtx.sig = 'data:image/png;base64,mockNightSupSig';
    actionModalCtx.remarks = 'On-site lighting verified > 150 lux at work point. Dual photos captured.';
    submitNightHandover();
`);

const p1AfterHandover = evalInVM(`PERMITS.find(x => x.id === '${p1.id}')`);
assert.strictEqual(p1AfterHandover.status, 'Pending P&M Night Acknowledgment', "Handover must advance status to Pending P&M Night Acknowledgment");
assert(p1AfterHandover.nightHandover, "Permit must record nightHandover metadata");
assert.strictEqual(p1AfterHandover.nightHandover.supervisorName, 'Venkatesh Rao', "Supervisor name must be Venkatesh Rao");
assert(p1AfterHandover.nightHandover.illuminationPhoto, "Illumination photo must be captured");
assert(p1AfterHandover.nightHandover.activityPhoto, "Linked activity photo must be captured");

console.log('  ✓ PASS: Handover qualification gate verified, 21:00 cutoff engine validated, and dual photo handover successfully executed');

// --- 9. Step 5 P&M Night Acknowledgment ---
console.log('\n--- 9. Step 5 P&M Night Acknowledgment ---');

evalInVM("switchRole('pm')");
evalInVM(`openNightPmAckModal('${p1.id}')`);
evalInVM(`
    actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
    actionModalCtx.sig = 'data:image/png;base64,mockPmNightSig';
    actionModalCtx.signerName = 'S. Chidambaram';
    actionModalCtx.luxConfirmed = true;
    actionModalCtx.equipmentConfirmed = true;
    actionModalCtx.comment = 'Tower lights operational. RCDs and cables elevated. Diesel generator fueled.';
    submitNightPmAck();
`);

const p1AfterPmAck = evalInVM(`PERMITS.find(x => x.id === '${p1.id}')`);
assert.strictEqual(p1AfterPmAck.status, 'Pending EHS Approval', "P&M Acknowledgment must advance status to Pending EHS Approval");
assert(p1AfterPmAck.pmNightAck, "pmNightAck object must be populated");
assert.strictEqual(p1AfterPmAck.pmNightAck.acknowledged, true, "pmNightAck acknowledged flag must be true");

console.log('  ✓ PASS: P&M Night Acknowledgment verified lux levels, equipment, and advanced to Pending EHS Approval');

// --- 10. Step 6 EHS Verification & Strict Rejection Routing ---
console.log('\n--- 10. Step 6 EHS Verification & Strict Rejection Routing ---');

evalInVM("switchRole('ehs-manager')");

// Test Rejection: must route STRICTLY to 'Returned to Night Supervisor', day approvers NOT re-engaged
evalInVM(`rejectNightShiftEhs('${p1.id}', 'Insufficient illumination near access stairway. Adjust tower light 2.')`);
const p1Rejected = evalInVM(`PERMITS.find(x => x.id === '${p1.id}')`);
assert.strictEqual(p1Rejected.status, 'Returned to Night Supervisor', "EHS Rejection must route strictly to 'Returned to Night Supervisor'");
assert.strictEqual(p1Rejected.approvals.sectionHead.status, 'approved', "Section Head (Day Approver) must REMAIN approved");
assert.strictEqual(p1Rejected.approvals.siteEngineer.status, 'approved', "Site Engineer (Day Approver) must REMAIN approved");

// Resubmit by Night Supervisor
evalInVM("switchRole('night-supervisor')");
evalInVM(`openNightHandoverModal('${p1.id}', true)`);
evalInVM(`
    actionModalCtx.supervisorKey = 'venkatesh_rao';
    actionModalCtx.supervisorName = 'Venkatesh Rao';
    actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
    actionModalCtx.illuminationPhoto = 'data:image/png;base64,mockLuxTowerPhoto2';
    actionModalCtx.activityPhoto = 'data:image/png;base64,mockWeldingSetupPhoto2';
    actionModalCtx.sig = 'data:image/png;base64,mockNightSupSig2';
    actionModalCtx.remarks = 'Adjusted tower light 2 towards stairway. Lux reading now 210 lux.';
    submitNightHandover();
`);

// P&M re-acknowledges
evalInVM("switchRole('pm')");
evalInVM(`
    actionModalCtx = { p: PERMITS.find(x => x.id === '${p1.id}') };
    actionModalCtx.gps = { lat: 17.3850, lng: 78.4867, within: true };
    actionModalCtx.sig = 'data:image/png;base64,mockPmNightSig';
    actionModalCtx.signerName = 'S. Chidambaram';
    actionModalCtx.luxConfirmed = true;
    actionModalCtx.equipmentConfirmed = true;
    actionModalCtx.comment = 'Re-inspected stairway lighting. Fully compliant.';
    submitNightPmAck();
`);

// EHS Approves
evalInVM("switchRole('ehs-manager')");
evalInVM(`approvePermitStage('${p1.id}', 'ehsManager', { lat: 17.3850, lng: 78.4867, within: true }, 'data:image/png;base64,sigEHS', 'EHS Manager', 'Stairway and work zone illumination verified compliant. Authorized.', 'ehs-manager')`);

const p1Active = evalInVM(`PERMITS.find(x => x.id === '${p1.id}')`);
const pLinkedActive = evalInVM(`PERMITS.find(x => x.id === '${pLinked.id}')`);
assert.strictEqual(p1Active.status, 'Active', "Parent Night Shift permit must be Active");
assert.strictEqual(pLinkedActive.status, 'Active', "Linked Activity permit must automatically synchronize to Active");

console.log('  ✓ PASS: Rejection routing strictly isolates night supervisor without re-engaging day approvers; EHS approval activates both permits');

// --- 11. Exclusive Closure & Surrender with De-energization Declaration ---
console.log('\n--- 11. Exclusive Closure & Surrender with De-energization Declaration ---');

// Attempt surrender by Site Supervisor (Day) - should be blocked
evalInVM("switchRole('site-supervisor')");
toastMessages.length = 0;
evalInVM(`openSurrenderFlow('${p1.id}')`);
const blockedToast = toastMessages.find(t => t.type === 'err' && t.msg.includes('restricted to Night Site Supervisors'));
assert(blockedToast, "Day Site Supervisor must be strictly blocked from closing/surrendering night shift permit");

// Surrender by Night Site Supervisor
evalInVM("switchRole('night-supervisor')");
evalInVM(`openSurrenderFlow('${p1.id}')`);

evalInVM(`
    actionModalCtx.gps = { lat: 17.4239, lng: 78.4738, within: true };
    actionModalCtx.photo = 'data:image/png;base64,mockDeEnergizedSitePhoto';
    actionModalCtx.remarks = 'All hot work completed. Night workers safely evacuated. Lighting towers turned off and disconnected.';
    actionModalCtx.nightClosureConfirmed = true;
    actionModalCtx.sig = 'data:image/png;base64,sigSurrenderNight';
    actionModalCtx.signerName = 'Venkatesh Rao';
    actionModalCtx.consent = true;
    actionModalCtx.reusedSignatory = true;
    submitSurrender();
`);

const p1Surrendered = evalInVM(`PERMITS.find(x => x.id === '${p1.id}')`);
assert.strictEqual(p1Surrendered.status, 'Completed (Surrendered)', "Status must be Completed (Surrendered)");
assert(p1Surrendered.surrender.nightClosureConfirmed, "Night closure declaration must be recorded on surrender");

console.log('  ✓ PASS: Exclusive closure & surrender by Night Site Supervisor with mandatory de-energization declaration validated');

// --- 12. Dynamic 6-Signatory Flow & Official PDF Generation ---
console.log('\n--- 12. Dynamic 6-Signatory Flow & Official PDF Generation ---');

const signatoriesFlow = evalInVM(`getPermitSignatoriesFlow(PERMITS.find(x => x.id === '${p1.id}'))`);
assert.strictEqual(signatoriesFlow.length, 6, "Night shift permit must have exactly 6 statutory signatories flow nodes");

assert.strictEqual(signatoriesFlow[0].key, 'site-supervisor', "Node 1 must be Site Supervisor (Permittee · Day)");
assert.strictEqual(signatoriesFlow[1].key, 'site-engineer', "Node 2 must be Site Engineer");
assert.strictEqual(signatoriesFlow[2].key, 'hw-section-head', "Node 3 must be Section Head / Tower Incharge");
assert.strictEqual(signatoriesFlow[3].key, 'night-supervisor', "Node 4 must be Night Site Supervisor");
assert.strictEqual(signatoriesFlow[4].key, 'pm', "Node 5 must be P&M Engineer");
assert.strictEqual(signatoriesFlow[5].key, 'ehs-manager', "Node 6 must be EHS Safety Manager / Officer");

// Official jsPDF report generation test (restricted to EHS Safety)
evalInVM("switchRole('ehs-manager')");
evalInVM(`generatePermitPDF('${p1.id}')`);
const pdfDoc = evalInVM("window.lastGeneratedPdf || (typeof lastGeneratedPdf !== 'undefined' ? lastGeneratedPdf : null)");
assert(pdfDoc, "generatePermitPDF must produce a jsPDF document");

// Verify PDF text content
const pdfTexts = pdfDoc.lines.map(l => l.str).join(' ');
assert(pdfTexts.includes("PTW-010"), "PDF must mention PTW-010");
assert(pdfTexts.includes("Night Shift"), "PDF must mention Night Shift");
assert(pdfTexts.includes("Venkatesh Rao"), "PDF must mention Night Site Supervisor name");
assert(pdfTexts.includes("P&M Engineer"), "PDF must mention P&M Engineer");

console.log('  ✓ PASS: Dynamic 6-signatory flow validated and official Permit Report PDF generation succeeded');

console.log('==================================================');
console.log('ALL PTW-010 NIGHT SHIFT & DUAL-PHASE TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
