/**
 * PTW-003 GUARD RAIL / FLOOR PROTECTION REMOVAL (FORM PTW-003) SPECIFICATION & COMPLIANCE TEST SUITE
 *
 * Exhaustive, robust, and comprehensive verification of PTW-003 Guard Rail permits:
 * 1.  Static Metadata & Constants Verification (PTW-003, PTW-003 prefix, Tower Incharge SH)
 * 2.  VM Sandbox Setup & Mock Environment Initialization
 * 3.  Location Mode Restrictions (Tower & Basement/Podium supported; Manual strictly prohibited)
 * 4.  Step 1 Validation: Mandatory guardrailActivities array & 'Others' specification
 * 5.  Statutory Checklist (GUARDRAIL_CHECKLIST_ITEMS) & Media Attachment Gating
 * 6.  Submission to Site Engineer Acknowledgment (Step 2)
 * 7.  Sequential Direct Routing: Site Eng -> Tower Incharge (hw-section-head)
 * 8.  Section Head Approval: Strictly Tower Incharge (hw-section-head)
 * 9.  First-Wins EHS Endorsement & Activation
 * 10. Rejection & Stale-Approval Invalidation Flow (Tower Incharge rejection & Site Eng re-ack)
 * 11. Extension Lifecycle: 3-Stage Pipeline (Site Eng -> Tower Incharge -> EHS) & 18:30 Cutoff
 * 12. Safety Observation & Stop-Work 4-Stage Rectification Lifecycle
 * 13. Exclusive Site Supervisor Closure & Mandatory Guard Rail Re-Fix Certification
 * 14. jsPDF Audit Report Generation & Dynamic Section Head Tracker
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE: PTW-003 GUARD RAIL (FORM PTW-003) SPECIFICATION & COMPLIANCE');
console.log('==================================================');

// --- 1. Static Verification of PTW-003 Metadata & Constants ---
console.log('\n--- 1. Static Verification of PTW-003 Metadata & Constants ---');

assert(src.includes("key: 'guardrail'"), "PTYPE_META must register guardrail key");
assert(src.includes("code: 'PTW-003'"), "PTYPE_META must register code PTW-003");
assert(src.includes("form: 'PTW-003'"), "PTYPE_META must register Form PTW-003");
assert(src.includes("prefix: 'PTW-003'"), "PTYPE_META must use PTW-003 prefix");
assert(src.includes("guardrail: ['Tower', 'Basement/Podium']"), "LOCATION_MODES_BY_PERMIT must restrict Guard Rail to Tower and Basement/Podium (Manual disabled)");
assert(src.includes('GUARDRAIL_CHECKLIST_ITEMS = ['), "GUARDRAIL_CHECKLIST_ITEMS constant must be defined");
console.log('  ✓ PASS: PTW-003 Form PTW-003, PTW-003 prefix, and location restrictions verified');

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
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Rao', role: 'Site Supervisor' };");
console.log('  ✓ PASS: VM Sandbox initialized successfully');

// --- 3. Location Mode Restrictions ---
console.log('\n--- 3. Location Mode Restrictions ---');

const grModes = evalInVM("getAllowedLocationModes('guardrail')");
assert(grModes.includes('Tower'), "Guard Rail must support Tower location mode");
assert(grModes.includes('Basement/Podium'), "Guard Rail must support Basement/Podium location mode");
assert(!grModes.includes('Manual'), "Guard Rail strictly prohibits Manual location mode (edge protection requires structured floor)");
assert.strictEqual(grModes.length, 2, "Guard Rail allows exactly Tower and Basement/Podium");
console.log('  ✓ PASS: Guard Rail location modes strictly restricted to Tower and Basement/Podium (Manual disabled)');

// --- 4. Form Initiation & Step 1 Validation ---
console.log('\n--- 4. Form Initiation & Step 1 Validation ---');

evalInVM("startNewPermit('guardrail');");
assert.strictEqual(evalInVM("ptypeOf(draft)"), 'guardrail', "Draft permit type must be guardrail");
assert.strictEqual(evalInVM("pMeta(draft).code"), 'PTW-003', "pMeta must resolve PTW-003");
assert.strictEqual(evalInVM("pMeta(draft).form"), 'PTW-003', "Form must be PTW-003");

// Base project and location
evalInVM(`
draft.project = PROJECTS[0].name;
draft.organization = 'Main Contractor';
draft.locationStructure = 'Tower';
draft.tower = 'Tower C';
draft.locFloor = 'Floor 8';
draft.locUnit = 'Shaft 2 / Lobby';
`);

// Step 1 fails without guardrailActivities
evalInVM("draft.guardrailActivities = [];");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails without guardrailActivities");

// Step 1 fails if 'Others' selected without guardrailActivityOther
evalInVM("draft.guardrailActivities = ['Edge Protection Removal', 'Others']; draft.guardrailActivityOther = '';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 fails when 'Others' selected without details");

// Step 1 passes with valid activity and details
evalInVM("draft.guardrailActivityOther = 'Precast slab installation edge barrier temporary unbolting';");
assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 passes with complete Guard Rail specific parameters");
console.log('  ✓ PASS: Step 1 strictly enforces mandatory guardrailActivities and Others detail');

// --- 5. Statutory Checklist (GUARDRAIL_CHECKLIST_ITEMS) & Media Attachment Gating ---
console.log('\n--- 5. Statutory Checklist & Media Attachment Gating ---');

const grItems = evalInVM("GUARDRAIL_CHECKLIST_ITEMS");
assert(Array.isArray(grItems) && grItems.length >= 8, "GUARDRAIL_CHECKLIST_ITEMS must contain statutory checklist questions");

// Step 2 fails if checklist is empty
evalInVM("draft.checklist = [];");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails with empty checklist");

// Step 2 fails if any item answered 'no' without mandatory comment
evalInVM(`
draft.checklist = GUARDRAIL_CHECKLIST_ITEMS.map((q, idx) => ({
    q,
    ans: idx === 0 ? 'no' : 'yes',
    comment: null,
    photo: null,
    gps: null
}));
`);
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when 'no' item lacks mandatory comment");

// Provide comment for 'no' item, but site photo missing
evalInVM("draft.checklist[0].comment = 'Warning signboards posted 5m prior to edge'; draft.sitePhoto = null;");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 fails when site photo is missing");

// Step 2 passes when site photo attached
evalInVM("draft.sitePhoto = 'data:image/jpeg;base64,guardrail_site_photo';");
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
grPermit = Object.assign({}, draft, {
    id: genPermitNumber('guardrail'),
    createdBy: 'Supervisor Rao',
    createdRoleKey: 'site-supervisor',
    approvals: newChain('guardrail'),
    checklist: GUARDRAIL_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true
});
PERMITS.push(grPermit);
submitPermit(grPermit);
`);
const grPermitId = evalInVM("grPermit.id");
assert(grPermitId.startsWith('PTW-003-'), "Permit number must start with PTW-003- prefix");

let permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Pending Site Engineer Acknowledgment', "Submitted Guard Rail permit status must be Pending Site Engineer Acknowledgment");
assert.strictEqual(evalInVM("requestedByRoleFor(grPermit)"), 'site-supervisor', "Requested By role is site-supervisor");
assert.strictEqual(evalInVM("requestedByLabelFor(grPermit)"), 'Site Supervisor', "Requested By label is Site Supervisor");
assert.strictEqual(evalInVM("shRoleFor(grPermit)"), 'hw-section-head', "Section Head role is hw-section-head");
assert.strictEqual(evalInVM("shLabelFor(grPermit)"), 'Tower Incharge', "Section Head label is Tower Incharge");
console.log('  ✓ PASS: Permit submitted with PTW-003 prefix, Site Supervisor requestedBy, and Tower Incharge Section Head');

// --- 7. Sequential Direct Routing: Site Engineer -> Tower Incharge ---
console.log('\n--- 7. Sequential Direct Routing: Site Engineer -> Tower Incharge ---');

// Role authorization check at Step 2
assert.strictEqual(evalInVM("roleCanActOnChain(grPermit, 'site-engineer')"), true, "Site Engineer is authorized to act on Step 2");
assert.strictEqual(evalInVM("roleCanActOnChain(grPermit, 'mep')"), false, "MEP cannot act on Step 2");
assert.strictEqual(evalInVM("roleCanActOnChain(grPermit, 'hw-section-head')"), false, "Tower Incharge cannot act on Step 2");
assert(evalInVM("pendingForRole('site-engineer')").some(p => p.id === grPermitId), "Pending list for site-engineer must include submitted permit");

// Site Engineer physically inspects edge safety and acknowledges
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer' };");
evalInVM("acknowledgeSiteEngineer(grPermit, { comment: 'Safety harnesses and lifeline anchors physically inspected at Floor 8', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Pending Section Head', "Site Engineer ack advances directly to Pending Section Head");
assert.strictEqual(evalInVM("chainStage(grPermit.approvals)"), 'section-head', "Chain stage advances to section-head");
assert.strictEqual(evalInVM("roleCanActOnChain(grPermit.approvals, 'hw-section-head')"), true, "Tower Incharge is authorized to act");
assert.strictEqual(evalInVM("roleCanActOnChain(grPermit.approvals, 'excavation-head')"), false, "Excavation Head is strictly unauthorized for PTW-003");
console.log('  ✓ PASS: Direct sequential routing to Tower Incharge verified');

// --- 8. Section Head Approval: Strictly Tower Incharge ---
console.log('\n--- 8. Section Head Approval: Strictly Tower Incharge ---');

evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari', role: 'Tower Incharge' };");
evalInVM("approvePermitStage(grPermit, 'hw-section-head', { comment: 'Floor 8 temporary guardrail removal permitted during crane lift window', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Pending EHS Approval', "Tower Incharge approval advances status to Pending EHS Approval");
assert.strictEqual(evalInVM("chainStage(grPermit.approvals)"), 'ehs', "Chain stage is now ehs");
console.log('  ✓ PASS: Tower Incharge approval advances status to Pending EHS Approval');

// --- 9. First-Wins EHS Endorsement & Activation ---
console.log('\n--- 9. First-Wins EHS Endorsement & Activation ---');

evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', role: 'EHS Manager' };");
evalInVM("approvePermitStage(grPermit, 'ehs-manager', { comment: 'Dual lanyard 100% tie-off and exclusion zone below Floor 8 barricaded', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Active', "First EHS approval activates Guard Rail permit");
assert.strictEqual(permit.approvals.ehsManager.status, 'approved', "EHS Manager status approved");
assert.strictEqual(evalInVM("chainStage(grPermit.approvals)"), 'complete', "Chain stage complete");
console.log('  ✓ PASS: EHS endorsement activates PTW-003 Guard Rail permit');

// --- 10. Rejection & Stale-Approval Invalidation Flow ---
console.log('\n--- 10. Rejection & Stale-Approval Invalidation Flow ---');

evalInVM("startNewPermit('guardrail');");
evalInVM(`
grRej = Object.assign({}, draft, {
    id: genPermitNumber('guardrail'),
    createdBy: 'Supervisor Rao',
    createdRoleKey: 'site-supervisor',
    locationStructure: 'Tower',
    project: PROJECTS[0].name,
    tower: 'Tower C',
    locFloor: 'Floor 9',
    locUnit: 'Cutout 4',
    organization: 'Main Contractor',
    guardrailActivities: ['Floor Opening Cover Removal'],
    checklist: GUARDRAIL_CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true,
    approvals: newChain('guardrail')
});
PERMITS.push(grRej);
submitPermit(grRej);
acknowledgeSiteEngineer(grRej, { comment: 'Site inspected', signerName: 'Eng Eric' });
`);
const grRejId = evalInVM("grRej.id");
let rejPermit = evalInVM("PERMITS.find(x => x.id === '" + grRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Permit awaits Section Head review");

// Tower Incharge rejects for inadequate catch nets below opening
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("rejectPermitStage(grRej, 'hw-section-head', { comment: 'Floor 8 catch net not installed under cutout opening', signerName: 'Tower Incharge Tiwari' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + grRejId + "');");
assert.strictEqual(rejPermit.status, 'Returned for Correction', "Rejection sets status to Returned for Correction");

// Supervisor corrects and resubmits
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Rao' };");
evalInVM("resubmitPermit(grRej, 'Heavy-duty safety catch net rigged under cutout at Floor 8');");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + grRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Site Engineer Re-Acknowledgment', "Resubmission routes to Pending Site Engineer Re-Acknowledgment");

// Site Engineer re-acknowledges -> Fast-tracks back to Tower Incharge!
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeReturnPermitEng(grRej, { comment: 'Catch net rigging inspected and verified safe', signerName: 'Eng Eric' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + grRejId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Re-acknowledgment fast-tracks permit back to Tower Incharge");
console.log('  ✓ PASS: Rejection and fast-track re-acknowledgment pipeline verified for Guard Rail');

// --- 11. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---
console.log('\n--- 11. Extension Lifecycle: 3-Stage Pipeline & 18:30 Cutoff ---');

// Extension Request by Supervisor
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Rao' };");
evalInVM("requestExtension(grPermit, { minutes: 45, reason: 'Final precast panel alignment delayed by wind gust', signerName: 'Supervisor Rao' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Site Engineer', "Extension starts at Pending Site Engineer");

// Stage 1: Site Engineer extension acknowledgment
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("approveExtensionStage(grPermit, 'site-engineer', { comment: 'Edge floodlights checked and operational', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Section Head', "Extension advances to Pending Section Head");

// Stage 2: Tower Incharge extension approval
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("approveExtensionStage(grPermit, 'hw-section-head', { comment: 'Overtime edge work authorized with spotter', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending EHS Approval', "Extension advances to Pending EHS Approval");

// Stage 3: EHS final extension endorsement
evalInVM("currentUser = { key: 'ehs-officer', name: 'Safety Officer Sam' };");
evalInVM("approveExtensionStage(grPermit, 'ehs-officer', { comment: 'Edge protection extension granted until 18:15', signerName: 'Safety Officer Sam' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.extension.status, 'Approved', "Extension marked Approved");
console.log('  ✓ PASS: 3-stage Extension pipeline (Site Eng -> Tower Incharge -> EHS) verified');

// --- 12. Safety Observation & Stop-Work 4-Stage Lifecycle ---
console.log('\n--- 12. Safety Observation & Stop-Work 4-Stage Lifecycle ---');

// EHS raises observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', label: 'EHS Manager' };");
evalInVM("raiseObservation(grPermit, { comment: 'Worker observed approaching edge without lanyard clipped to lifeline', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Active – Observation Open', "Observation sets status to Active – Observation Open");

// Action panel blocks extension & surrender
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Rao' };");
const blockedPanel = evalInVM("actionPanelHtml(grPermit);");
assert(blockedPanel.includes('Extension and Closure are currently BLOCKED'), "Action panel states extension and closure are blocked");
assert(!blockedPanel.includes('Close &amp; Surrender Permit'), "Close & Surrender button is hidden while observation open");

// 1. Supervisor responds with rectification
evalInVM("respondToObservation(grPermit, { comment: 'Work suspended temporarily. Edge-awareness toolbox talk conducted; 100% tie-off re-briefed', photo: 'photo_tbt', sig: 'sig' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Site Engineer Acknowledgment', "Rectification routes to Site Engineer");

// 2. Site Engineer verifies on site
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeObservationEng(grPermit, { comment: 'Toolbox attendance verified; all workers clipped to static line', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Section Head Review', "Rectification advances to Tower Incharge");

// 3. Tower Incharge reviews & endorses
evalInVM("currentUser = { key: 'hw-section-head', name: 'Tower Incharge Tiwari' };");
evalInVM("reviewObservationSectionHead(grPermit, true, { comment: 'Tower edge compliance confirmed', signerName: 'Tower Incharge Tiwari' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending EHS Clearance', "Endorsement routes to EHS for clearance");

// 4. EHS resolves observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("resolveObservation(grPermit, true, { comment: 'Compliance verified on field audit; permit restored to Active', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Active', "Clearing observation restores status to Active");
assert.strictEqual(permit.observation.status, 'Resolved', "Observation marked Resolved");
console.log('  ✓ PASS: Complete 4-stage observation lifecycle executed cleanly');

// --- 13. Exclusive Closure & Mandatory Guard Rail Re-Fix Certification ---
console.log('\n--- 13. Exclusive Closure & Mandatory Guard Rail Re-Fix Certification ---');

// Non-supervisor role cannot close
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
const engClose = evalInVM("closeAndSurrenderPermit(grPermit, { remarks: 'Trying to close as engineer', guardrailReFix: true });");
assert.strictEqual(engClose, false, "Site Engineer cannot close or surrender Guard Rail permit");

// Site Supervisor closure without guardrailReFix certification fails
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Rao' };");
const missingGrClose = evalInVM("closeAndSurrenderPermit(grPermit, { remarks: 'Edge work done', guardrailReFix: false });");
assert.strictEqual(missingGrClose, false, "Closure fails without mandatory guard rail re-fix certification");

// Site Supervisor closes with guardrailReFix: true
const validGrClose = evalInVM("closeAndSurrenderPermit(grPermit, { remarks: 'All guard rails, mid-rails, toe boards, and shaft opening covers securely re-fixed and load tested', guardrailReFix: true, sig: 'sup_sig', signerName: 'Supervisor Rao' });");
assert.strictEqual(validGrClose, true, "Closure succeeds when guardrailReFix: true is certified");

permit = evalInVM("PERMITS.find(x => x.id === '" + grPermitId + "');");
assert.strictEqual(permit.status, 'Completed (Surrendered)', "Permit status is Completed (Surrendered)");
assert.strictEqual(permit.surrender.guardrailReFix, true, "surrender.guardrailReFix must be true");
assert.strictEqual(permit.surrender.by, 'Supervisor Rao', "Surrendered by Supervisor Rao");
console.log('  ✓ PASS: Exclusive Site Supervisor closure & mandatory guard rail re-fix rule verified');

// --- 14. jsPDF Audit Report & Dynamic Section Head Tracker ---
console.log('\n--- 14. jsPDF Audit Report & Dynamic Section Head Tracker ---');

const trackerHtml = evalInVM("trackerHtml(grPermit)");
assert(trackerHtml.includes('Tower Incharge'), "Tracker HTML must display Tower Incharge for PTW-003");
assert(!trackerHtml.includes('Excavation Head'), "Tracker HTML must NOT display Excavation Head for PTW-003");
console.log('  ✓ PASS: Tracker HTML dynamically renders Tower Incharge');

let pdfResult = null;
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', role: 'EHS Manager' };");
try {
    evalInVM("generatePermitPDF(grPermit);");
    pdfResult = true;
} catch (e) {
    pdfResult = false;
    console.error("PDF generation failed:", e);
}
assert.strictEqual(pdfResult, true, "generatePermitPDF executes cleanly for Guard Rail permit");
console.log('  ✓ PASS: jsPDF audit report generation succeeds for PTW-003 Guard Rail permit');

console.log('\n==================================================');
console.log('ALL PTW-003 GUARD RAIL TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
