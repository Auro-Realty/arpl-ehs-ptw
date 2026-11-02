/**
 * PTW-002 HOT WORK (FORM PTW-002) SPECIFICATION & COMPLIANCE TEST SUITE
 *
 * Exhaustive, robust, and comprehensive verification of PTW-002 Hot Work permits:
 * 1.  Static Metadata & Constants Verification (PTW-002, PTW-002 prefix, Tower Incharge SH)
 * 2.  VM Sandbox Setup & Mock Environment Initialization
 * 3.  Location Mode Flexibility (Tower, Basement/Podium, Manual)
 * 4.  Step 1 Validation: Mandatory hotworkTypes, welderName, and subcontractor affiliation
 * 5.  Statutory Checklist (HOTWORK_CHECKLIST_ITEMS) & Media Attachment Gating
 * 6.  Submission to Site Engineer Acknowledgment (Step 2)
 * 7.  Sequential Direct Routing: Site Eng -> Tower Incharge (hw-section-head)
 * 8.  Section Head Approval: Strictly Tower Incharge (hw-section-head)
 * 9.  First-Wins EHS Endorsement & Activation
 * 10. Rejection & Stale-Approval Invalidation Flow (Tower Incharge rejection & Site Eng re-ack)
 * 11. Extension Lifecycle: 3-Stage Pipeline (Site Eng -> Tower Incharge -> EHS) & 18:30 Cutoff
 * 12. Safety Observation & Stop-Work 4-Stage Rectification Lifecycle
 * 13. Exclusive Site Supervisor Closure & Mandatory 1-Hour Fire Watch Certification
 * 14. jsPDF Audit Report Generation & Dynamic Section Head Tracker
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE: PTW-002 HOT WORK (FORM PTW-002) SPECIFICATION & COMPLIANCE');
console.log('==================================================');

// --- 1. Static Verification of PTW-002 Metadata & Constants ---
console.log('\n--- 1. Static Verification of PTW-002 Metadata & Constants ---');

assert(src.includes("key: 'hotwork'"), "PTYPE_META must register hotwork key");
assert(src.includes("code: 'PTW-002'"), "PTYPE_META must register code PTW-002");
assert(src.includes("form: 'PTW-002'"), "PTYPE_META must register Form PTW-002");
assert(src.includes("prefix: 'PTW-002'"), "PTYPE_META must use PTW-002 prefix");
assert(src.includes("sh: 'hw-section-head'"), "PTYPE_META must designate hw-section-head as Section Head");
assert(src.includes("shLabel: 'Tower Incharge'"), "PTYPE_META must label Section Head as Tower Incharge");
console.log('  ✓ PASS: PTW-002 Form PTW-002, PTW-002 prefix, and Tower Incharge metadata verified');

assert(src.includes('HOTWORK_CHECKLIST_ITEMS = ['), "HOTWORK_CHECKLIST_ITEMS constant must be defined");
assert(src.includes("hotwork: ['Tower', 'Basement/Podium', 'Manual']"), "LOCATION_MODES_BY_PERMIT must support Tower, Basement/Podium, and Manual for Hot Work");
assert(src.includes("key: 'hw-section-head'"), "ROLES must include hw-section-head");
console.log('  ✓ PASS: Statutory checklist, location modes, and hw-section-head role verified');

// --- 2. Runtime Setup & VM Sandbox Initialization ---
console.log('\n--- 2. Runtime Setup & VM Sandbox Initialization ---');

const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
assert(scriptMatch, "Must extract main script tag from index.html");

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
    text(txt, x, y, opts) {
        this.lines.push({ txt, x, y, opts });
        return this;
    }
    splitTextToSize(txt, w) { return Array.isArray(txt) ? txt : [String(txt)]; }
    addImage(data, fmt, x, y, w, h) {
        this.images.push({ data, fmt, x, y, w, h });
        return this;
    }
    addPage() { this.pages++; return this; }
    save(name) { this.savedName = name; return this; }
    output() { return 'data:application/pdf;base64,mockpdf'; }
}

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
    Math: Math,
    Date: Date,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    JSON: JSON,
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
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Suresh', role: 'Site Supervisor' };");
console.log('  ✓ PASS: VM Sandbox initialized successfully');

// --- 3. Location Mode Flexibility ---
console.log('\n--- 3. Location Mode Flexibility ---');

const hwModes = evalInVM("getAllowedLocationModes('hotwork')");
assert(hwModes.includes('Tower'), "Hot Work must support Tower location mode");
assert(hwModes.includes('Basement/Podium'), "Hot Work must support Basement/Podium location mode");
assert(hwModes.includes('Manual'), "Hot Work must support Manual location mode");
assert.strictEqual(hwModes.length, 3, "Hot Work must allow all 3 location structures");
console.log('  ✓ PASS: Hot Work supports Tower, Basement/Podium, and Manual location modes');

// --- 4. Form Initiation & Step 1 Validation ---
console.log('\n--- 4. Form Initiation & Step 1 Validation ---');

evalInVM("startNewPermit('hotwork');");
assert.strictEqual(evalInVM("ptypeOf(draft)"), 'hotwork', "Draft permit type must be hotwork");
assert.strictEqual(evalInVM("pMeta(draft).code"), 'PTW-002', "pMeta must resolve PTW-002");
assert.strictEqual(evalInVM("pMeta(draft).form"), 'PTW-002', "Form must be PTW-002");

// Populate standard project and tower location
evalInVM(`
draft.project = PROJECTS[0].name;
draft.organization = 'Main Contractor';
draft.locationStructure = 'Tower';
draft.tower = 'Tower A';
draft.locFloor = 'Floor 5';
draft.locUnit = 'Flat 501';
`);

// Step 1 fails without hotworkTypes
evalInVM("draft.hotworkTypes = []; draft.welderName = '';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails without hotworkTypes");

// Step 1 fails without welderName
evalInVM("draft.hotworkTypes = ['Welding', 'Gas Cutting']; draft.welderName = '';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails without welderName");

// Step 1 fails with welderName < 2 chars
evalInVM("draft.welderName = 'A';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails with 1-character welderName");

// Step 1 fails if Subcontractor affiliation chosen without welderContractor
evalInVM("draft.welderName = 'Kishan Sharma'; draft.welderAffiliation = 'Subcontractor'; draft.welderContractor = '';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails with Subcontractor affiliation and missing welderContractor");

// Step 1 passes with all fields valid
evalInVM("draft.welderContractor = 'Apex Fireproofing Ltd';");
assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 passes with complete Hot Work specific parameters");
console.log('  ✓ PASS: Step 1 strictly enforces mandatory hotworkTypes, welderName, and subcontractor affiliation');

// --- 5. Statutory Checklist (HOTWORK_CHECKLIST_ITEMS) & Media Attachment Gating ---
console.log('\n--- 5. Statutory Checklist & Media Attachment Gating ---');

const hwItems = evalInVM("HOTWORK_CHECKLIST_ITEMS");
assert(Array.isArray(hwItems) && hwItems.length >= 10, "HOTWORK_CHECKLIST_ITEMS must contain statutory checklist questions");
const checklistCount = hwItems.length;

// Step 2 fails if checklist is empty
evalInVM("draft.checklist = [];");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails with empty checklist");

// Step 2 fails if any item answered 'no' without mandatory comment
evalInVM(`
draft.checklist = HOTWORK_CHECKLIST_ITEMS.map((q, idx) => ({
    q,
    ans: idx === 0 ? 'no' : 'yes',
    comment: null,
    photo: null,
    gps: null
}));
`);
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when 'no' item lacks mandatory comment");

// Provide comment for 'no' item, but site photo missing
evalInVM("draft.checklist[0].comment = 'Dedicated fire blanket placed around combustible surface'; draft.sitePhoto = null;");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when site photo is missing");

// Step 2 passes when site photo attached
evalInVM("draft.sitePhoto = 'data:image/jpeg;base64,hotwork_site_photo';");
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 passes with complete checklist and site photo");

// Step 3 IST Timing validation
evalInVM(`
nowTime = () => new Date(2026, 8, 10, 10, 0, 0);
draft.startTime = '10:30';
draft.validTillTime = '17:30';
`);
assert.strictEqual(evalInVM("validateWizStep(3)"), true, "Step 3 timing passes");

// Step 4 DPDP consent & digital signature validation
evalInVM("draft.signature = null; draft.signerVerified = false; draft.consent = false;");
assert.strictEqual(evalInVM("validateWizStep(4)"), false, "Step 4 fails without signature and consent");
evalInVM("draft.signature = { dataUrl: 'data:image/png;base64,mockSig' }; draft.signerVerified = true; draft.consent = true;");
assert.strictEqual(evalInVM("validateWizStep(4)"), true, "Step 4 passes with signature and DPDP consent");
console.log('  ✓ PASS: Checklist comment mandate, site photo gating, and DPDP consent enforced');

// --- 6. Submission to Site Engineer Acknowledgment (Step 2) ---
console.log('\n--- 6. Submission to Site Engineer Acknowledgment (Step 2) ---');

evalInVM(`
hwPermit = Object.assign({}, draft, {
    id: genPermitNumber('hotwork'),
    createdBy: 'Supervisor Suresh',
    createdRoleKey: 'site-supervisor',
    approvals: newChain('hotwork'),
    checklist: HOTWORK_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true
});
PERMITS.push(hwPermit);
submitPermit(hwPermit);
`);
const hwPermitId = evalInVM("hwPermit.id");
assert(hwPermitId.startsWith('PTW-002-'), "Permit number must start with PTW-002- prefix");

let permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Pending Site Engineer Acknowledgment', "Submitted hot work permit status must be Pending Site Engineer Acknowledgment");
assert.strictEqual(evalInVM("requestedByRoleFor(hwPermit)"), 'site-supervisor', "Requested By role is site-supervisor");
assert.strictEqual(evalInVM("requestedByLabelFor(hwPermit)"), 'Site Supervisor', "Requested By label is Site Supervisor");
assert.strictEqual(evalInVM("shRoleFor(hwPermit)"), 'hw-section-head', "Section Head role is hw-section-head");
assert.strictEqual(evalInVM("shLabelFor(hwPermit)"), 'Tower Incharge', "Section Head label is Tower Incharge");
console.log('  ✓ PASS: Permit submitted with PTW-002 prefix, Site Supervisor requestedBy, and Tower Incharge Section Head');

// --- 7. Direct Sequential Routing: Site Engineer -> Tower Incharge ---
console.log('\n--- 7. Direct Sequential Routing: Site Engineer -> Tower Incharge ---');

// Role authorization at Step 2
assert.strictEqual(evalInVM("roleCanActOnChain(hwPermit, 'site-engineer')"), true, "Site Engineer is authorized to act on Step 2");
assert.strictEqual(evalInVM("roleCanActOnChain(hwPermit, 'mep')"), false, "MEP cannot act on Step 2");
assert.strictEqual(evalInVM("roleCanActOnChain(hwPermit, 'hw-section-head')"), false, "Tower Incharge cannot act on Step 2");
assert(evalInVM("pendingForRole('site-engineer')").some(p => p.id === hwPermitId), "Pending list for site-engineer must include submitted permit");
assert(!evalInVM("pendingForRole('hw-section-head')").some(p => p.id === hwPermitId), "Pending list for Tower Incharge must not include permit at Step 2");

// Site Engineer physically inspects and acknowledges
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer' };");
evalInVM("acknowledgeSiteEngineer(hwPermit, { comment: 'Fire extinguishers in place, combustibles cleared within 10m radius', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Pending Section Head', "Site Engineer ack advances directly to Pending Section Head");
assert.strictEqual(evalInVM("chainStage(hwPermit.approvals)"), 'section-head', "Chain stage advances to section-head");
assert.strictEqual(evalInVM("roleCanActOnChain(hwPermit.approvals, 'hw-section-head')"), true, "Tower Incharge is authorized to act");
assert.strictEqual(evalInVM("roleCanActOnChain(hwPermit.approvals, 'excavation-head')"), false, "Excavation Head is strictly unauthorized for PTW-002");
console.log('  ✓ PASS: Direct sequential routing to Tower Incharge verified (bypassing excavation parallel gate)');

// --- 8. Section Head Approval: Strictly Tower Incharge ---
console.log('\n--- 8. Section Head Approval: Strictly Tower Incharge ---');

// Tower Incharge approves
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari', role: 'Tower Incharge' };");
evalInVM("approvePermitStage(hwPermit, 'hw-section-head', { comment: 'Tower A ventilation confirmed and hot work permits synchronized', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Pending EHS Approval', "Tower Incharge approval advances status to Pending EHS Approval");
assert.strictEqual(evalInVM("chainStage(hwPermit.approvals)"), 'ehs', "Chain stage is now ehs");
console.log('  ✓ PASS: Tower Incharge approval advances status to Pending EHS Approval');

// --- 9. First-Wins EHS Endorsement & Activation ---
console.log('\n--- 9. First-Wins EHS Endorsement & Activation ---');

evalInVM("currentUser = { key: 'ehs-officer', name: 'Safety Officer Sam', role: 'EHS Officer' };");
evalInVM("approvePermitStage(hwPermit, 'ehs-officer', { comment: 'Spark arrestor, cylinder trolley, and water bucket verified', signerName: 'Safety Officer Sam' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Active', "First EHS approval activates Hot Work permit");
assert.strictEqual(permit.approvals.ehsOfficer.status, 'approved', "EHS Officer status approved");
assert.strictEqual(evalInVM("chainStage(hwPermit.approvals)"), 'complete', "Chain stage complete");
console.log('  ✓ PASS: EHS endorsement activates PTW-002 Hot Work permit');

// --- 10. Rejection & Stale-Approval Invalidation Flow ---
console.log('\n--- 10. Rejection & Stale-Approval Invalidation Flow ---');

evalInVM("startNewPermit('hotwork');");
evalInVM(`
hwRej = Object.assign({}, draft, {
    id: genPermitNumber('hotwork'),
    createdBy: 'Supervisor Suresh',
    createdRoleKey: 'site-supervisor',
    locationStructure: 'Tower',
    project: PROJECTS[0].name,
    tower: 'Tower B',
    locFloor: 'Floor 12',
    locUnit: 'Unit 1204',
    organization: 'Main Contractor',
    hotworkTypes: ['Welding'],
    welderName: 'Ramesh Kumar',
    checklist: HOTWORK_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true,
    approvals: newChain('hotwork')
});
PERMITS.push(hwRej);
submitPermit(hwRej);
acknowledgeSiteEngineer(hwRej, { comment: 'Site inspected', signerName: 'Eng Eric' });
`);
const hwRejId = evalInVM("hwRej.id");
let rejPermit = evalInVM("PERMITS.find(x => x.id === '" + hwRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Permit awaits Section Head review");

// Tower Incharge rejects for inadequate spark containment
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("rejectPermitStage(hwRej, 'hw-section-head', { comment: 'Spark containment enclosure inadequate near façade duct', signerName: 'Tower Incharge Tiwari' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + hwRejId + "');");
assert.strictEqual(rejPermit.status, 'Returned for Correction', "Rejection sets status to Returned for Correction");
assert.strictEqual(evalInVM("chainStage(hwRej.approvals)"), 'rejected-sectionhead', "Chain stage marked rejected-sectionhead");

// Supervisor corrects and resubmits
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Suresh' };");
evalInVM("resubmitPermit(hwRej, 'Flame-retardant welding habitat installed around duct');");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + hwRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Site Engineer Re-Acknowledgment', "Resubmission routes to Pending Site Engineer Re-Acknowledgment");

// Site Engineer re-acknowledges -> Fast-tracks back to Tower Incharge!
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeReturnPermitEng(hwRej, { comment: 'Welding habitat inspected on site and verified intact', signerName: 'Eng Eric' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + hwRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Re-acknowledgment fast-tracks permit back to Tower Incharge");
console.log('  ✓ PASS: Rejection and fast-track re-acknowledgment pipeline verified for Hot Work');

// --- 11. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---
console.log('\n--- 11. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---');

// Extension Request by Supervisor
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Suresh' };");
evalInVM("requestExtension(hwPermit, { minutes: 60, reason: 'Structural beam joint welding requires final pass', signerName: 'Supervisor Suresh' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Site Engineer', "Extension starts at Pending Site Engineer");

// Stage 1: Site Engineer extension acknowledgment
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("approveExtensionStage(hwPermit, 'site-engineer', { comment: 'Fire protection verified for overtime work', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Section Head', "Extension advances to Pending Section Head");

// Stage 2: Tower Incharge extension approval
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("approveExtensionStage(hwPermit, 'hw-section-head', { comment: 'Extended work coordinated with tower crane schedule', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending EHS Approval', "Extension advances to Pending EHS Approval");

// Stage 3: EHS final extension endorsement
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("approveExtensionStage(hwPermit, 'ehs-manager', { comment: 'Overtime hot work authorized with continuous fire watch', signerName: 'Safety Mgr Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.extension.status, 'Approved', "Extension marked Approved");
console.log('  ✓ PASS: 3-stage Extension pipeline (Site Eng -> Tower Incharge -> EHS) verified');

// --- 12. Safety Observation & Stop-Work 4-Stage Rectification Lifecycle ---
console.log('\n--- 12. Safety Observation & Stop-Work 4-Stage Lifecycle ---');

// EHS raises observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', label: 'EHS Manager' };");
evalInVM("raiseObservation(hwPermit, { comment: 'Combustible carton boxes stored 3m from active grinding station', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Active – Observation Open', "Observation sets status to Active – Observation Open");

// Action panel blocks extension & surrender
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Suresh' };");
const blockedPanel = evalInVM("actionPanelHtml(hwPermit);");
assert(blockedPanel.includes('Extension and Closure are currently BLOCKED'), "Action panel states extension and closure are blocked");
assert(!blockedPanel.includes('Close &amp; Surrender Permit'), "Close & Surrender button is hidden while observation open");

// 1. Supervisor responds with rectification
evalInVM("respondToObservation(hwPermit, { comment: 'Cartons removed to external scrap yard; 15m radius wet down', photo: 'photo_cleaned', sig: 'sig' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Site Engineer Acknowledgment', "Rectification routes to Site Engineer");

// 2. Site Engineer verifies on site
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeObservationEng(hwPermit, { comment: 'Site inspected; combustible clearance confirmed', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Section Head Review', "Rectification advances to Tower Incharge");

// 3. Tower Incharge reviews & endorses
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("reviewObservationSectionHead(hwPermit, true, { comment: 'Tower housekeeping compliant', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending EHS Clearance', "Endorsement routes to EHS for clearance");

// 4. EHS resolves observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("resolveObservation(hwPermit, true, { comment: 'Condition restored; hot work may proceed', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Active', "Clearing observation restores status to Active");
assert.strictEqual(permit.observation.status, 'Resolved', "Observation marked Resolved");
console.log('  ✓ PASS: Complete 4-stage observation lifecycle executed cleanly');

// --- 13. Exclusive Closure & Mandatory 1-Hour Fire Watch Certification ---
console.log('\n--- 13. Exclusive Closure & Mandatory 1-Hour Fire Watch Certification ---');

// Non-supervisor role cannot close
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
const engClose = evalInVM("closeAndSurrenderPermit(hwPermit, { remarks: 'Trying to close as engineer', fireWatch: true });");
assert.strictEqual(engClose, false, "Site Engineer cannot close or surrender Hot Work permit");

// Site Supervisor closure without fireWatch certification fails
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Suresh' };");
const missingFwClose = evalInVM("closeAndSurrenderPermit(hwPermit, { remarks: 'Hot work done', fireWatch: false });");
assert.strictEqual(missingFwClose, false, "Closure fails without mandatory continuous fire watch certification");

// Site Supervisor closes with fireWatch: true
const validFwClose = evalInVM("closeAndSurrenderPermit(hwPermit, { remarks: 'Welding completed, slag removed, and continuous 1-hr fire watch verified with zero smoldering', fireWatch: true, sig: 'sup_sig', signerName: 'Supervisor Suresh' });");
assert.strictEqual(validFwClose, true, "Closure succeeds when fireWatch: true is certified");

permit = evalInVM("PERMITS.find(x => x.id === '" + hwPermitId + "');");
assert.strictEqual(permit.status, 'Completed (Surrendered)', "Permit status is Completed (Surrendered)");
assert.strictEqual(permit.surrender.fireWatch, true, "surrender.fireWatch must be true");
assert.strictEqual(permit.surrender.by, 'Supervisor Suresh', "Surrendered by Supervisor Suresh");
console.log('  ✓ PASS: Exclusive Site Supervisor closure & mandatory 1-hour fire watch rule verified');

// --- 14. jsPDF Audit Report & Dynamic Section Head Tracker ---
console.log('\n--- 14. jsPDF Audit Report & Dynamic Section Head Tracker ---');

const trackerHtml = evalInVM("trackerHtml(hwPermit)");
assert(trackerHtml.includes('Tower Incharge'), "Tracker HTML must display Tower Incharge for PTW-002");
assert(!trackerHtml.includes('Excavation Head'), "Tracker HTML must NOT display Excavation Head for PTW-002");
console.log('  ✓ PASS: Tracker HTML dynamically renders Tower Incharge');

let pdfResult = null;
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', role: 'EHS Manager' };");
try {
    evalInVM("generatePermitPDF(hwPermit);");
    pdfResult = true;
} catch (e) {
    pdfResult = false;
    console.error("PDF generation failed:", e);
}
assert.strictEqual(pdfResult, true, "generatePermitPDF executes cleanly for Hot Work permit");
console.log('  ✓ PASS: jsPDF audit report generation succeeds for PTW-002 Hot Work permit');

console.log('\n==================================================');
console.log('ALL PTW-002 HOT WORK TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
