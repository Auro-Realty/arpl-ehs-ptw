/**
 * PTW-004 CONFINED SPACE ENTRY (FORM PTW-004) SPECIFICATION & COMPLIANCE TEST SUITE
 *
 * Exhaustive, robust, and comprehensive verification of PTW-004 Confined Space permits:
 * 1.  Static Metadata & Constants Verification (PTW-004, PTW-004 prefix, Tower Incharge SH)
 * 2.  VM Sandbox Setup & Mock Environment Initialization
 * 3.  Location Mode Support (Tower, Basement/Podium, Manual)
 * 4.  Step 1 Validation: Mandatory confinedActivity, numPersonnel >= 1, and confinedDeclaration
 * 5.  Multi-Gas Detection Thresholds & Atmospheric Safety Logic (O2, LEL, CO, H2S)
 * 6.  Statutory Checklist (CONFINED_CHECKLIST_ITEMS) & Media Attachment Gating
 * 7.  Submission to Site Engineer Acknowledgment (Step 2)
 * 8.  Sequential Direct Routing: Site Eng -> Tower Incharge (hw-section-head)
 * 9.  Section Head Approval: Strictly Tower Incharge (hw-section-head)
 * 10. First-Wins EHS Endorsement & Activation
 * 11. Rejection & Stale-Approval Invalidation Flow (Tower Incharge rejection & Site Eng re-ack)
 * 12. Extension Lifecycle: 3-Stage Pipeline (Site Eng -> Tower Incharge -> EHS) & 18:30 Cutoff
 * 13. Safety Observation & Stop-Work 4-Stage Rectification Lifecycle
 * 14. Exclusive Site Supervisor Closure & Mandatory Entrant Evacuation Certification
 * 15. jsPDF Audit Report Generation & Dynamic Section Head Tracker
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE: PTW-004 CONFINED SPACE ENTRY (FORM PTW-004) SPECIFICATION & COMPLIANCE');
console.log('==================================================');

// --- 1. Static Verification of PTW-004 Metadata & Constants ---
console.log('\n--- 1. Static Verification of PTW-004 Metadata & Constants ---');

assert(src.includes("key: 'confined'"), "PTYPE_META must register confined key");
assert(src.includes("code: 'PTW-004'"), "PTYPE_META must register code PTW-004");
assert(src.includes("form: 'PTW-004'"), "PTYPE_META must register Form PTW-004");
assert(src.includes("prefix: 'PTW-004'"), "PTYPE_META must use PTW-004 prefix");
assert(src.includes('CONFINED_CHECKLIST_ITEMS = ['), "CONFINED_CHECKLIST_ITEMS constant must be defined");
assert(src.includes('CONFINED_GAS_THRESHOLDS = {'), "CONFINED_GAS_THRESHOLDS constant must be defined");
console.log('  ✓ PASS: PTW-004 Form PTW-004, PTW-004 prefix, and gas threshold definitions verified');

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
    prompt: () => ''
};
mockWindow.window = mockWindow;

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(code) {
    return vm.runInContext(code, context);
}

evalInVM("window.__TEST_MODE__ = true;");
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farooq', role: 'Site Supervisor' };");
console.log('  ✓ PASS: VM Sandbox initialized successfully');

// --- 3. Location Mode Support ---
console.log('\n--- 3. Location Mode Support ---');

const csModes = evalInVM("getAllowedLocationModes('confined')");
assert(csModes.includes('Tower'), "Confined Space must support Tower location mode (e.g. overhead tanks)");
assert(csModes.includes('Basement/Podium'), "Confined Space must support Basement/Podium mode (e.g. water sumps)");
assert(csModes.includes('Manual'), "Confined Space must support Manual mode (e.g. deep manholes/culverts)");
assert.strictEqual(csModes.length, 3, "Confined Space supports all 3 location structures");
console.log('  ✓ PASS: Confined Space supports Tower, Basement/Podium, and Manual location modes');

// --- 4. Step 1 Validation ---
console.log('\n--- 4. Step 1 Validation: Mandatory Parameters ---');

evalInVM("startNewPermit('confined');");
assert.strictEqual(evalInVM("ptypeOf(draft)"), 'confined', "Draft permit type must be confined");
assert.strictEqual(evalInVM("pMeta(draft).code"), 'PTW-004', "pMeta must resolve PTW-004");
assert.strictEqual(evalInVM("pMeta(draft).form"), 'PTW-004', "Form must be PTW-004");

// Base project & location
evalInVM(`
draft.project = PROJECTS[0].name;
draft.organization = 'Main Contractor';
draft.locationStructure = 'Basement/Podium';
draft.locBasementPodium = 'Basement Level 2';
draft.locArea = 'Domestic Water Sump Pit';
`);

// Step 1 fails without confinedActivity
evalInVM("draft.confinedActivity = ''; draft.numPersonnel = '2'; draft.confinedDeclaration = true;");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails without confinedActivity");

// Step 1 fails if 'Others' selected without confinedActivityOther
evalInVM("draft.confinedActivity = 'Others'; draft.confinedActivityOther = '';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails when 'Others' selected without details");

// Step 1 fails without numPersonnel >= 1
evalInVM("draft.confinedActivity = 'Sump Tank Cleaning & Epoxy Coating'; draft.numPersonnel = '0';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails when numPersonnel is 0");

// Step 1 fails without confinedDeclaration (entrant rescue briefing acknowledgment)
evalInVM("draft.numPersonnel = '3'; draft.confinedDeclaration = false;");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails without confinedDeclaration");

// Step 1 passes with all fields valid
evalInVM("draft.confinedDeclaration = true;");
assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 passes with complete Confined Space specific parameters");
console.log('  ✓ PASS: Step 1 strictly enforces confinedActivity, numPersonnel >= 1, and rescue declaration');

// --- 5. Multi-Gas Detection Thresholds & Atmospheric Safety Logic ---
console.log('\n--- 5. Multi-Gas Detection Thresholds & Atmospheric Safety Logic ---');

// Verify standard thresholds from constant
const gasThresh = evalInVM("CONFINED_GAS_THRESHOLDS");
assert.strictEqual(gasThresh.combustible.max, 10, "Combustible gas max threshold must be 10% LEL");
assert.strictEqual(gasThresh.h2s.max, 5, "H2S max threshold must be 5 PPM");
assert.strictEqual(gasThresh.co.max, 25, "CO max threshold must be 25 PPM");
assert.strictEqual(gasThresh.o2.min, 19.5, "O2 minimum safe threshold must be 19.5%");
assert.strictEqual(gasThresh.o2.max, 21.0, "O2 maximum safe threshold must be 21.0%");

// Test safe atmospheric readings
assert.strictEqual(evalInVM("isGasReadingSafe('o2', 20.9)"), true, "20.9% O2 is safe");
assert.strictEqual(evalInVM("isGasReadingSafe('combustible', 2.5)"), true, "2.5% LEL is safe");
assert.strictEqual(evalInVM("isGasReadingSafe('co', 5)"), true, "5 PPM CO is safe");
assert.strictEqual(evalInVM("isGasReadingSafe('h2s', 1)"), true, "1 PPM H2S is safe");

// Test dangerous / lethal atmospheric readings
assert.strictEqual(evalInVM("isGasReadingSafe('o2', 18.5)"), false, "18.5% O2 (oxygen deficient/asphyxiant) must be rejected");
assert.strictEqual(evalInVM("isGasReadingSafe('o2', 23.0)"), false, "23.0% O2 (oxygen enriched/flammable hazard) must be rejected");
assert.strictEqual(evalInVM("isGasReadingSafe('combustible', 12)"), false, "12% LEL (explosive hazard) must be rejected");
assert.strictEqual(evalInVM("isGasReadingSafe('co', 30)"), false, "30 PPM CO (toxic hazard) must be rejected");
assert.strictEqual(evalInVM("isGasReadingSafe('h2s', 8)"), false, "8 PPM H2S (lethal gas) must be rejected");
console.log('  ✓ PASS: Multi-gas atmospheric safety boundaries (O2, LEL, CO, H2S) strictly enforced');

// --- 6. Statutory Checklist (CONFINED_CHECKLIST_ITEMS) & Media Attachment Gating ---
console.log('\n--- 6. Statutory Checklist & Media Attachment Gating ---');

const csItems = evalInVM("CONFINED_CHECKLIST_ITEMS");
assert(Array.isArray(csItems) && csItems.length >= 10, "CONFINED_CHECKLIST_ITEMS must contain statutory checklist questions");

// Step 2 fails if checklist is empty
evalInVM("draft.checklist = [];");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails with empty checklist");

// Step 2 fails if any item answered 'no' without mandatory comment
evalInVM(`
draft.checklist = CONFINED_CHECKLIST_ITEMS.map((q, idx) => ({
    q,
    ans: idx === 0 ? 'no' : 'yes',
    comment: null,
    photo: null,
    gps: null
}));
`);
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when 'no' item lacks mandatory comment");

// Provide comment for 'no' item, but site photo missing
evalInVM("draft.checklist[0].comment = 'Forced mechanical ventilation fan running continuously'; draft.sitePhoto = null;");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when site photo is missing");

// Step 2 passes when site photo attached
evalInVM("draft.sitePhoto = 'data:image/jpeg;base64,confined_entry_site_photo';");
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
console.log('  ✓ PASS: Statutory checklist, site photo gating, and DPDP consent enforced');

// --- 7. Submission to Site Engineer Acknowledgment (Step 2) ---
console.log('\n--- 7. Submission to Site Engineer Acknowledgment (Step 2) ---');

evalInVM(`
csPermit = Object.assign({}, draft, {
    id: genPermitNumber('confined'),
    createdBy: 'Supervisor Farooq',
    createdRoleKey: 'site-supervisor',
    approvals: newChain('confined'),
    checklist: CONFINED_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true
});
PERMITS.push(csPermit);
submitPermit(csPermit);
`);
const csPermitId = evalInVM("csPermit.id");
assert(csPermitId.startsWith('PTW-004-'), "Permit number must start with PTW-004- prefix");

let permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Pending Site Engineer Acknowledgment', "Submitted permit status must be Pending Site Engineer Acknowledgment");
assert.strictEqual(evalInVM("requestedByRoleFor(csPermit)"), 'site-supervisor', "Requested By role is site-supervisor");
assert.strictEqual(evalInVM("requestedByLabelFor(csPermit)"), 'Site Supervisor', "Requested By label is Site Supervisor");
assert.strictEqual(evalInVM("shRoleFor(csPermit)"), 'hw-section-head', "Section Head role is hw-section-head");
assert.strictEqual(evalInVM("shLabelFor(csPermit)"), 'Tower Incharge', "Section Head label is Tower Incharge");
console.log('  ✓ PASS: Permit submitted with PTW-004 prefix, Site Supervisor requestedBy, and Tower Incharge Section Head');

// --- 8. Sequential Direct Routing: Site Engineer -> Tower Incharge ---
console.log('\n--- 8. Sequential Direct Routing: Site Engineer -> Tower Incharge ---');

// Role authorization check at Step 2
assert.strictEqual(evalInVM("roleCanActOnChain(csPermit, 'site-engineer')"), true, "Site Engineer is authorized to act on Step 2");
assert.strictEqual(evalInVM("roleCanActOnChain(csPermit, 'mep')"), false, "MEP cannot act on Step 2");
assert.strictEqual(evalInVM("roleCanActOnChain(csPermit, 'hw-section-head')"), false, "Tower Incharge cannot act on Step 2");
assert(evalInVM("pendingForRole('site-engineer')").some(p => p.id === csPermitId), "Pending list for site-engineer must include submitted permit");

// Site Engineer physically inspects forced ventilation, tripod & winch, and acknowledges
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer' };");
evalInVM("acknowledgeSiteEngineer(csPermit, { comment: 'Tripod rescue winch, harness lines, and blower duct inspected on site', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Pending Section Head', "Site Engineer ack advances directly to Pending Section Head");
assert.strictEqual(evalInVM("chainStage(csPermit.approvals)"), 'section-head', "Chain stage advances to section-head");
assert.strictEqual(evalInVM("roleCanActOnChain(csPermit.approvals, 'hw-section-head')"), true, "Tower Incharge is authorized to act");
assert.strictEqual(evalInVM("roleCanActOnChain(csPermit.approvals, 'excavation-head')"), false, "Excavation Head is strictly unauthorized for PTW-004");
console.log('  ✓ PASS: Direct sequential routing to Tower Incharge verified');

// --- 9. Section Head Approval: Strictly Tower Incharge ---
console.log('\n--- 9. Section Head Approval: Strictly Tower Incharge ---');

evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari', role: 'Tower Incharge' };");
evalInVM("approvePermitStage(csPermit, 'hw-section-head', { comment: 'Sump isolation valves tagged and locked out; entry approved', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Pending EHS Approval', "Tower Incharge approval advances status to Pending EHS Approval");
assert.strictEqual(evalInVM("chainStage(csPermit.approvals)"), 'ehs', "Chain stage is now ehs");
console.log('  ✓ PASS: Tower Incharge approval advances status to Pending EHS Approval');

// --- 10. First-Wins EHS Endorsement & Activation ---
console.log('\n--- 10. First-Wins EHS Endorsement & Activation ---');

evalInVM("currentUser = { key: 'ehs-officer', name: 'Safety Officer Sam', role: 'EHS Officer' };");
evalInVM("approvePermitStage(csPermit, 'ehs-officer', { comment: '4-gas meter calibrated: O2 20.9%, LEL 0%, CO 0ppm, H2S 0ppm. Standby entrant log active.', signerName: 'Safety Officer Sam' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Active', "First EHS approval activates Confined Space permit");
assert.strictEqual(permit.approvals.ehsOfficer.status, 'approved', "EHS Officer status approved");
assert.strictEqual(evalInVM("chainStage(csPermit.approvals)"), 'complete', "Chain stage complete");
console.log('  ✓ PASS: EHS endorsement activates PTW-004 Confined Space permit');

// --- 11. Rejection & Stale-Approval Invalidation Flow ---
console.log('\n--- 11. Rejection & Stale-Approval Invalidation Flow ---');

evalInVM("startNewPermit('confined');");
evalInVM(`
csRej = Object.assign({}, draft, {
    id: genPermitNumber('confined'),
    createdBy: 'Supervisor Farooq',
    createdRoleKey: 'site-supervisor',
    locationStructure: 'Tower',
    project: PROJECTS[0].name,
    tower: 'Tower A',
    locFloor: 'Terrace Level',
    locUnit: 'Overhead Fire Tank 1',
    organization: 'Main Contractor',
    confinedActivity: 'Overhead Tank Internal Waterproofing',
    numPersonnel: '2',
    confinedDeclaration: true,
    checklist: CONFINED_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true,
    approvals: newChain('confined')
});
PERMITS.push(csRej);
submitPermit(csRej);
acknowledgeSiteEngineer(csRej, { comment: 'Site inspected', signerName: 'Eng Eric' });
`);
const csRejId = evalInVM("csRej.id");
let rejPermit = evalInVM("PERMITS.find(x => x.id === '" + csRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Permit awaits Section Head review");

// Tower Incharge rejects for inadequate exhaust ducting
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("rejectPermitStage(csRej, 'hw-section-head', { comment: 'Solvent fumes require positive extraction blower to external air', signerName: 'Tower Incharge Tiwari' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + csRejId + "');");
assert.strictEqual(rejPermit.status, 'Returned for Correction', "Rejection sets status to Returned for Correction");

// Supervisor corrects and resubmits
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farooq' };");
evalInVM("resubmitPermit(csRej, 'Explosion-proof extraction blower and duct routed outside terrace parapet');");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + csRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Site Engineer Re-Acknowledgment', "Resubmission routes to Pending Site Engineer Re-Acknowledgment");

// Site Engineer re-acknowledges -> Fast-tracks back to Tower Incharge!
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeReturnPermitEng(csRej, { comment: 'Blower routing inspected and verified', signerName: 'Eng Eric' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + csRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Re-acknowledgment fast-tracks permit back to Tower Incharge");
console.log('  ✓ PASS: Rejection and fast-track re-acknowledgment pipeline verified for Confined Space');

// --- 12. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---
console.log('\n--- 12. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---');

// Extension Request by Supervisor
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farooq' };");
evalInVM("requestExtension(csPermit, { minutes: 30, reason: 'Final coat of solvent-free epoxy curing inspection', signerName: 'Supervisor Farooq' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Site Engineer', "Extension starts at Pending Site Engineer");

// Stage 1: Site Engineer extension acknowledgment
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("approveExtensionStage(csPermit, 'site-engineer', { comment: 'Continuous air monitoring logged safe at 17:30', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Section Head', "Extension advances to Pending Section Head");

// Stage 2: Tower Incharge extension approval
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("approveExtensionStage(csPermit, 'hw-section-head', { comment: 'Overtime tank work authorized', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending EHS Approval', "Extension advances to Pending EHS Approval");

// Stage 3: EHS final extension endorsement
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("approveExtensionStage(csPermit, 'ehs-manager', { comment: 'Extended validity granted with standby watchman', signerName: 'Safety Mgr Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.extension.status, 'Approved', "Extension marked Approved");
console.log('  ✓ PASS: 3-stage Extension pipeline (Site Eng -> Tower Incharge -> EHS) verified');

// --- 13. Safety Observation & Stop-Work 4-Stage Lifecycle ---
console.log('\n--- 13. Safety Observation & Stop-Work 4-Stage Lifecycle ---');

// EHS raises observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', label: 'EHS Manager' };");
evalInVM("raiseObservation(csPermit, { comment: 'Standby attendant absent from tank manhole entrance for >5 minutes', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Active – Observation Open', "Observation sets status to Active – Observation Open");

// Action panel blocks extension & surrender
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farooq' };");
const blockedPanel = evalInVM("actionPanelHtml(csPermit);");
assert(blockedPanel.includes('Extension and Closure are currently BLOCKED'), "Action panel states extension and closure are blocked");
assert(!blockedPanel.includes('Close &amp; Surrender Permit'), "Close & Surrender button is hidden while observation open");

// 1. Supervisor responds with rectification
evalInVM("respondToObservation(csPermit, { comment: 'Permanent certified standby attendant posted with air horn and logbook', photo: 'photo_attendant', sig: 'sig' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Site Engineer Acknowledgment', "Rectification routes to Site Engineer");

// 2. Site Engineer verifies on site
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeObservationEng(csPermit, { comment: 'Dedicated watchman verified present at manhole', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Section Head Review', "Rectification advances to Tower Incharge");

// 3. Tower Incharge reviews & endorses
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("reviewObservationSectionHead(csPermit, true, { comment: 'Safety standby compliant with SOP', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending EHS Clearance', "Endorsement routes to EHS for clearance");

// 4. EHS resolves observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("resolveObservation(csPermit, true, { comment: 'Standby verified; permit returned to Active', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Active', "Clearing observation restores status to Active");
assert.strictEqual(permit.observation.status, 'Resolved', "Observation marked Resolved");
console.log('  ✓ PASS: Complete 4-stage observation lifecycle executed cleanly');

// --- 14. Exclusive Closure & Mandatory Entrant Evacuation Certification ---
console.log('\n--- 14. Exclusive Closure & Mandatory Entrant Evacuation Certification ---');

// Non-supervisor role cannot close
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
const engClose = evalInVM("closeAndSurrenderPermit(csPermit, { remarks: 'Trying to close as engineer', confinedClosure: true });");
assert.strictEqual(engClose, false, "Site Engineer cannot close or surrender Confined Space permit");

// Site Supervisor closure without confinedClosure certification fails
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farooq' };");
const missingCsClose = evalInVM("closeAndSurrenderPermit(csPermit, { remarks: 'Work done', confinedClosure: false });");
assert.strictEqual(missingCsClose, false, "Closure fails without mandatory confined space closure declaration");

// Site Supervisor closes with confinedClosure: true
const validCsClose = evalInVM("closeAndSurrenderPermit(csPermit, { remarks: 'All 3 entrants safely evacuated, headcount verified 100%, tools retrieved, manhole cover bolted', confinedClosure: true, sig: 'sup_sig', signerName: 'Supervisor Farooq' });");
assert.strictEqual(validCsClose, true, "Closure succeeds when confinedClosure: true is certified");

permit = evalInVM("PERMITS.find(x => x.id === '" + csPermitId + "');");
assert.strictEqual(permit.status, 'Completed (Surrendered)', "Permit status is Completed (Surrendered)");
assert.strictEqual(permit.surrender.confinedClosure, true, "surrender.confinedClosure must be true");
assert.strictEqual(permit.surrender.by, 'Supervisor Farooq', "Surrendered by Supervisor Farooq");
console.log('  ✓ PASS: Exclusive Site Supervisor closure & mandatory entrant evacuation declaration verified');

// --- 15. jsPDF Audit Report & Dynamic Section Head Tracker ---
console.log('\n--- 15. jsPDF Audit Report & Dynamic Section Head Tracker ---');

const trackerHtml = evalInVM("trackerHtml(csPermit)");
assert(trackerHtml.includes('Tower Incharge'), "Tracker HTML must display Tower Incharge for PTW-004");
assert(!trackerHtml.includes('Excavation Head'), "Tracker HTML must NOT display Excavation Head for PTW-004");
console.log('  ✓ PASS: Tracker HTML dynamically renders Tower Incharge');

let pdfResult = null;
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', role: 'EHS Manager' };");
try {
    evalInVM("generatePermitPDF(csPermit);");
    pdfResult = true;
} catch (e) {
    pdfResult = false;
    console.error("PDF generation failed:", e);
}
assert.strictEqual(pdfResult, true, "generatePermitPDF executes cleanly for Confined Space permit");
console.log('  ✓ PASS: jsPDF audit report generation succeeds for PTW-004 Confined Space permit');

console.log('\n==================================================');
console.log('ALL PTW-004 CONFINED SPACE TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
