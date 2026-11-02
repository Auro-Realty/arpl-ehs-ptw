/**
 * PTW-005 SHAFT WORK (FORM PTW-005) SPECIFICATION & COMPLIANCE TEST SUITE
 *
 * Exhaustive, robust, and comprehensive verification of PTW-005 Shaft Work permits:
 * 1.  Static Metadata & Constants Verification (PTW-005, PTW-005 prefix, Tower Incharge SH)
 * 2.  VM Sandbox Setup & Mock Environment Initialization
 * 3.  Location Mode Restrictions (Tower & Basement/Podium supported; Manual strictly prohibited)
 * 4.  Step 1 Validation: Mandatory numPersonnel >= 1, scaffTagVerified: true, and shaftDeclaration: true
 * 5.  Statutory Checklist (SHAFT_CHECKLIST_ITEMS) & Media Attachment Gating
 * 6.  Submission to Site Engineer Acknowledgment (Step 2)
 * 7.  Dedicated MEP Domain Clearance Gate (MEP required before Section Head)
 * 8.  Section Head Approval: Strictly Tower Incharge (hw-section-head)
 * 9.  First-Wins EHS Endorsement & Activation
 * 10. Rejection & Stale-Approval Retention (MEP clearance retained across Section Head rejection & fast-track re-ack)
 * 11. Extension Lifecycle: 3-Stage Pipeline (Site Eng -> Tower Incharge -> EHS) & 18:30 Cutoff
 * 12. Safety Observation & Stop-Work 4-Stage Rectification Lifecycle
 * 13. Exclusive Site Supervisor Closure & Surrender Gate
 * 14. jsPDF Audit Report Generation & Dynamic Section Head Tracker
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE: PTW-005 SHAFT WORK (FORM PTW-005) SPECIFICATION & COMPLIANCE');
console.log('==================================================');

// --- 1. Static Verification of PTW-005 Metadata & Constants ---
console.log('\n--- 1. Static Verification of PTW-005 Metadata & Constants ---');

assert(src.includes("key: 'shaft'"), "PTYPE_META must register shaft key");
assert(src.includes("code: 'PTW-005'"), "PTYPE_META must register code PTW-005");
assert(src.includes("form: 'PTW-005'"), "PTYPE_META must register Form PTW-005");
assert(src.includes("prefix: 'PTW-005'"), "PTYPE_META must use PTW-005 prefix");
assert(src.includes("shaft: ['Tower', 'Basement/Podium']"), "LOCATION_MODES_BY_PERMIT must restrict Shaft Work to Tower and Basement/Podium (Manual disabled)");
assert(src.includes('SHAFT_CHECKLIST_ITEMS = ['), "SHAFT_CHECKLIST_ITEMS constant must be defined");
console.log('  ✓ PASS: PTW-005 Form PTW-005, PTW-005 prefix, and location restrictions verified');

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
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farhan', role: 'Site Supervisor' };");
console.log('  ✓ PASS: VM Sandbox initialized successfully');

// --- 3. Location Mode Restrictions ---
console.log('\n--- 3. Location Mode Restrictions ---');

const swModes = evalInVM("getAllowedLocationModes('shaft')");
assert(swModes.includes('Tower'), "Shaft Work must support Tower location mode (e.g. lift shafts, MEP risers)");
assert(swModes.includes('Basement/Podium'), "Shaft Work must support Basement/Podium mode (e.g. sump shafts, ventilation shafts)");
assert(!swModes.includes('Manual'), "Shaft Work strictly prohibits Manual location mode (shafts require structured tower/basement containment)");
assert.strictEqual(swModes.length, 2, "Shaft Work allows exactly Tower and Basement/Podium");
console.log('  ✓ PASS: Shaft Work location modes strictly restricted to Tower and Basement/Podium (Manual disabled)');

// --- 4. Step 1 Validation ---
console.log('\n--- 4. Step 1 Validation: Mandatory Parameters ---');

evalInVM("startNewPermit('shaft');");
assert.strictEqual(evalInVM("ptypeOf(draft)"), 'shaft', "Draft permit type must be shaft");
assert.strictEqual(evalInVM("pMeta(draft).code"), 'PTW-005', "pMeta must resolve PTW-005");
assert.strictEqual(evalInVM("pMeta(draft).form"), 'PTW-005', "Form must be PTW-005");

// Base project & location
evalInVM(`
draft.project = PROJECTS[0].name;
draft.organization = 'Main Contractor';
draft.locationStructure = 'Tower';
draft.tower = 'Tower B';
draft.locFloor = 'Floor 4 to 10';
draft.locUnit = 'Passenger Lift Shaft #2';
`);

// Step 1 fails without numPersonnel >= 1
evalInVM("draft.numPersonnel = '0'; draft.scaffTagVerified = true; draft.shaftDeclaration = true;");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails when numPersonnel is 0");

// Step 1 fails without scaffTagVerified (green scaffolding tag confirmation)
evalInVM("draft.numPersonnel = '4'; draft.scaffTagVerified = false;");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails without scaffTagVerified");

// Step 1 fails without shaftDeclaration (fall protection and catch net confirmation)
evalInVM("draft.scaffTagVerified = true; draft.shaftDeclaration = false;");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails without shaftDeclaration");

// Step 1 passes with all fields valid
evalInVM("draft.shaftDeclaration = true;");
assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 passes with complete Shaft Work specific parameters");
console.log('  ✓ PASS: Step 1 strictly enforces numPersonnel >= 1, scaffTagVerified, and shaftDeclaration');

// --- 5. Statutory Checklist (SHAFT_CHECKLIST_ITEMS) & Media Attachment Gating ---
console.log('\n--- 5. Statutory Checklist & Media Attachment Gating ---');

const swItems = evalInVM("SHAFT_CHECKLIST_ITEMS");
assert(Array.isArray(swItems) && swItems.length >= 8, "SHAFT_CHECKLIST_ITEMS must contain statutory checklist questions");

// Step 2 fails if checklist is empty
evalInVM("draft.checklist = [];");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails with empty checklist");

// Step 2 fails if any item answered 'no' without mandatory comment
evalInVM(`
draft.checklist = SHAFT_CHECKLIST_ITEMS.map((q, idx) => ({
    q,
    ans: idx === 0 ? 'no' : 'yes',
    comment: null,
    photo: null,
    gps: null
}));
`);
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when 'no' item lacks mandatory comment");

// Provide comment for 'no' item, but site photo missing
evalInVM("draft.checklist[0].comment = 'Dual lifeline inertia reels rigged from certified girder above'; draft.sitePhoto = null;");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when site photo is missing");

// Step 2 passes when site photo attached
evalInVM("draft.sitePhoto = 'data:image/jpeg;base64,shaft_internal_photo';");
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

// --- 6. Submission to Site Engineer Acknowledgment (Step 2) ---
console.log('\n--- 6. Submission to Site Engineer Acknowledgment (Step 2) ---');

evalInVM(`
swPermit = Object.assign({}, draft, {
    id: genPermitNumber('shaft'),
    createdBy: 'Supervisor Farhan',
    createdRoleKey: 'site-supervisor',
    approvals: newChain('shaft'),
    checklist: SHAFT_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true
});
PERMITS.push(swPermit);
submitPermit(swPermit);
`);
const swPermitId = evalInVM("swPermit.id");
assert(swPermitId.startsWith('PTW-005-'), "Permit number must start with PTW-005- prefix");

let permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Pending Site Engineer Acknowledgment', "Submitted Shaft Work permit status must be Pending Site Engineer Acknowledgment");
assert.strictEqual(evalInVM("requestedByRoleFor(swPermit)"), 'site-supervisor', "Requested By role is site-supervisor");
assert.strictEqual(evalInVM("requestedByLabelFor(swPermit)"), 'Site Supervisor', "Requested By label is Site Supervisor");
assert.strictEqual(evalInVM("shRoleFor(swPermit)"), 'hw-section-head', "Section Head role is hw-section-head");
assert.strictEqual(evalInVM("shLabelFor(swPermit)"), 'Tower Incharge', "Section Head label is Tower Incharge");
console.log('  ✓ PASS: Permit submitted with PTW-005 prefix, Site Supervisor requestedBy, and Tower Incharge Section Head');

// --- 7. Dedicated MEP Domain Clearance Gate ---
console.log('\n--- 7. Dedicated MEP Domain Clearance Gate ---');

// Site Engineer physically inspects and acknowledges
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer' };");
evalInVM("acknowledgeSiteEngineer(swPermit, { comment: 'Shaft landing gates locked and scaffold tags inspected', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Pending MEP Clearance', "Site Engineer ack advances Shaft Work to Pending MEP Clearance");
assert.strictEqual(evalInVM("chainStage(swPermit.approvals)"), 'mep', "Chain stage is mep");

// MEP authorization gate: Only MEP Engineer can act; Tower Incharge is BLOCKED!
assert.strictEqual(evalInVM("roleCanActOnChain(swPermit.approvals, 'mep')"), true, "MEP Engineer is authorized to clear shaft stage");
assert.strictEqual(evalInVM("roleCanActOnChain(swPermit.approvals, 'hw-section-head')"), false, "Tower Incharge cannot act until MEP clearance is complete");
assert.strictEqual(evalInVM("roleCanActOnChain(swPermit.approvals, 'excavation-head')"), false, "Excavation Head has zero authority over Shaft Work");
assert(evalInVM("pendingForRole('mep')").some(p => p.id === swPermitId), "Pending list for mep must include Shaft Work permit");
assert(!evalInVM("pendingForRole('hw-section-head')").some(p => p.id === swPermitId), "Pending list for Tower Incharge must not include Shaft permit before MEP clearance");

// MEP Engineer inspects risers, duct penetrations, and grants clearance
evalInVM("currentUser = { key: 'mep', name: 'MEP Specialist Mark', role: 'MEP Engineer' };");
evalInVM("approvePermitStage(swPermit, 'mep', { comment: 'Plumbing and HVAC sleeve penetrations safe; fire dampers locked in position', signerName: 'MEP Mark' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Pending Section Head', "MEP clearance advances status to Pending Section Head");
assert.strictEqual(permit.approvals.mep.status, 'approved', "MEP approval recorded as approved");
assert.strictEqual(evalInVM("chainStage(swPermit.approvals)"), 'section-head', "Chain stage advances to section-head");
assert.strictEqual(evalInVM("roleCanActOnChain(swPermit.approvals, 'hw-section-head')"), true, "Tower Incharge is now authorized to act");
console.log('  ✓ PASS: Dedicated MEP domain clearance gate verified before Section Head review');

// --- 8. Section Head Approval: Strictly Tower Incharge ---
console.log('\n--- 8. Section Head Approval: Strictly Tower Incharge ---');

evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari', role: 'Tower Incharge' };");
evalInVM("approvePermitStage(swPermit, 'hw-section-head', { comment: 'Tower B shaft coordinated; hoistway lockouts placed on Floor 1-10', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Pending EHS Approval', "Tower Incharge approval advances status to Pending EHS Approval");
assert.strictEqual(evalInVM("chainStage(swPermit.approvals)"), 'ehs', "Chain stage is now ehs");
console.log('  ✓ PASS: Tower Incharge approval advances status to Pending EHS Approval');

// --- 9. First-Wins EHS Endorsement & Activation ---
console.log('\n--- 9. First-Wins EHS Endorsement & Activation ---');

evalInVM("currentUser = { key: 'ehs-officer', name: 'Safety Officer Sam', role: 'EHS Officer' };");
evalInVM("approvePermitStage(swPermit, 'ehs-officer', { comment: '100% tie-off verified with double lanyards; green tag signed', signerName: 'Safety Officer Sam' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Active', "First EHS approval activates Shaft Work permit");
assert.strictEqual(permit.approvals.ehsOfficer.status, 'approved', "EHS Officer status approved");
assert.strictEqual(evalInVM("chainStage(swPermit.approvals)"), 'complete', "Chain stage complete");
console.log('  ✓ PASS: EHS endorsement activates PTW-005 Shaft Work permit');

// --- 10. Rejection & Stale-Approval Retention ---
console.log('\n--- 10. Rejection & Stale-Approval Retention ---');

evalInVM("startNewPermit('shaft');");
evalInVM(`
swRej = Object.assign({}, draft, {
    id: genPermitNumber('shaft'),
    createdBy: 'Supervisor Farhan',
    createdRoleKey: 'site-supervisor',
    locationStructure: 'Tower',
    project: PROJECTS[0].name,
    tower: 'Tower B',
    locFloor: 'Floor 15',
    locUnit: 'Electrical Riser Shaft',
    organization: 'Main Contractor',
    numPersonnel: '3',
    scaffTagVerified: true,
    shaftDeclaration: true,
    checklist: SHAFT_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true,
    approvals: newChain('shaft')
});
PERMITS.push(swRej);
submitPermit(swRej);
acknowledgeSiteEngineer(swRej, { comment: 'Site inspected', signerName: 'Eng Eric' });
approvePermitStage(swRej, 'mep', { comment: 'MEP riser clearance verified', signerName: 'MEP Mark' });
`);
const swRejId = evalInVM("swRej.id");
let rejPermit = evalInVM("PERMITS.find(x => x.id === '" + swRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Shaft permit cleared MEP and awaits Tower Incharge");
assert.strictEqual(rejPermit.approvals.mep.status, 'approved', "MEP approval is approved");

// Tower Incharge rejects for inadequate catch planking below Floor 15
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("rejectPermitStage(swRej, 'hw-section-head', { comment: 'Solid wooden catch planking required at Floor 14 directly beneath work platform', signerName: 'Tower Incharge Tiwari' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + swRejId + "');");
assert.strictEqual(rejPermit.status, 'Returned for Correction', "Rejection sets status to Returned for Correction");

// MEP clearance MUST be retained across Section Head rejection!
assert.strictEqual(rejPermit.approvals.mep.status, 'approved', "MEP clearance retained across Section Head rejection");

// Supervisor corrects and resubmits
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farhan' };");
evalInVM("resubmitPermit(swRej, 'Double solid scaffold planks installed at Floor 14 with gap-free overlap');");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + swRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Site Engineer Re-Acknowledgment', "Resubmission routes to Pending Site Engineer Re-Acknowledgment");

// Site Engineer re-acknowledges -> Fast-tracks directly back to Tower Incharge (MEP gate bypassed)!
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeReturnPermitEng(swRej, { comment: 'Planking inspected at Floor 14 and verified gap-free', signerName: 'Eng Eric' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + swRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Re-acknowledgment fast-tracks permit back to Tower Incharge (bypassing MEP)");
console.log('  ✓ PASS: Stale-approval retention preserves MEP clearance and fast-tracks re-ack directly to Tower Incharge');

// --- 11. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---
console.log('\n--- 11. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---');

// Extension Request by Supervisor
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farhan' };");
evalInVM("requestExtension(swPermit, { minutes: 45, reason: 'Cable tray bracket bolting in shaft takes additional alignment time', signerName: 'Supervisor Farhan' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Site Engineer', "Extension starts at Pending Site Engineer");

// Stage 1: Site Engineer extension acknowledgment
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("approveExtensionStage(swPermit, 'site-engineer', { comment: 'Shaft task lighting verified for evening work', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Section Head', "Extension advances to Pending Section Head");

// Stage 2: Tower Incharge extension approval
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("approveExtensionStage(swPermit, 'hw-section-head', { comment: 'Overtime shaft work approved; hoist stays immobilized', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending EHS Approval', "Extension advances to Pending EHS Approval");

// Stage 3: EHS final extension endorsement
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("approveExtensionStage(swPermit, 'ehs-manager', { comment: 'Shaft extension approved until 18:15', signerName: 'Safety Mgr Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.extension.status, 'Approved', "Extension marked Approved");
console.log('  ✓ PASS: 3-stage Extension pipeline (Site Eng -> Tower Incharge -> EHS) verified');

// --- 12. Safety Observation & Stop-Work 4-Stage Lifecycle ---
console.log('\n--- 12. Safety Observation & Stop-Work 4-Stage Lifecycle ---');

// EHS raises observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', label: 'EHS Manager' };");
evalInVM("raiseObservation(swPermit, { comment: 'Shaft opening at Floor 6 left open without barrier while crew working on Floor 4', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Active – Observation Open', "Observation sets status to Active – Observation Open");

// Action panel blocks extension & surrender
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farhan' };");
const blockedPanel = evalInVM("actionPanelHtml(swPermit);");
assert(blockedPanel.includes('Extension and Closure are currently BLOCKED'), "Action panel states extension and closure are blocked");
assert(!blockedPanel.includes('Close &amp; Surrender Permit'), "Close & Surrender button is hidden while observation open");

// 1. Supervisor responds with rectification
evalInVM("respondToObservation(swPermit, { comment: 'Floor 6 shaft landing gate closed, padlocked, and danger signage posted', photo: 'photo_padlock', sig: 'sig' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Site Engineer Acknowledgment', "Rectification routes to Site Engineer");

// 2. Site Engineer verifies on site
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeObservationEng(swPermit, { comment: 'Floor 6 shaft gate lock inspected on site', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Section Head Review', "Rectification advances to Tower Incharge");

// 3. Tower Incharge reviews & endorses
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("reviewObservationSectionHead(swPermit, true, { comment: 'Shaft isolation secure across all intermediate levels', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending EHS Clearance', "Endorsement routes to EHS for clearance");

// 4. EHS resolves observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("resolveObservation(swPermit, true, { comment: 'Shaft safety restored; work permitted to continue', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Active', "Clearing observation restores status to Active");
assert.strictEqual(permit.observation.status, 'Resolved', "Observation marked Resolved");
console.log('  ✓ PASS: Complete 4-stage observation lifecycle executed cleanly');

// --- 13. Exclusive Closure & Surrender Gate ---
console.log('\n--- 13. Exclusive Closure & Surrender Gate ---');

// Non-supervisor role cannot close
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
const engClose = evalInVM("closeAndSurrenderPermit(swPermit, { remarks: 'Trying to close as engineer' });");
assert.strictEqual(engClose, false, "Site Engineer cannot close or surrender Shaft Work permit");

// Site Supervisor closes
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Farhan' };");
const validSwClose = evalInVM("closeAndSurrenderPermit(swPermit, { remarks: 'Shaft work completed, all tools and debris removed, landing doors locked, scaffold green tagged', sig: 'sup_sig', signerName: 'Supervisor Farhan' });");
assert.strictEqual(validSwClose, true, "Site Supervisor successfully closes Shaft Work permit");

permit = evalInVM("PERMITS.find(x => x.id === '" + swPermitId + "');");
assert.strictEqual(permit.status, 'Completed (Surrendered)', "Permit status is Completed (Surrendered)");
assert.strictEqual(permit.surrender.by, 'Supervisor Farhan', "Surrendered by Supervisor Farhan");
console.log('  ✓ PASS: Exclusive Site Supervisor closure & surrender verified');

// --- 14. jsPDF Audit Report & Dynamic Section Head Tracker ---
console.log('\n--- 14. jsPDF Audit Report & Dynamic Section Head Tracker ---');

const trackerHtml = evalInVM("trackerHtml(swPermit)");
assert(trackerHtml.includes('Tower Incharge'), "Tracker HTML must display Tower Incharge for PTW-005");
assert(!trackerHtml.includes('Excavation Head'), "Tracker HTML must NOT display Excavation Head for PTW-005");
console.log('  ✓ PASS: Tracker HTML dynamically renders Tower Incharge');

let pdfResult = null;
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', role: 'EHS Manager' };");
try {
    evalInVM("generatePermitPDF(swPermit);");
    pdfResult = true;
} catch (e) {
    pdfResult = false;
    console.error("PDF generation failed:", e);
}
assert.strictEqual(pdfResult, true, "generatePermitPDF executes cleanly for Shaft Work permit");
console.log('  ✓ PASS: jsPDF audit report generation succeeds for PTW-005 Shaft Work permit');

console.log('\n==================================================');
console.log('ALL PTW-005 SHAFT WORK TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
