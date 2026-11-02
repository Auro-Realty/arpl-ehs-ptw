const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE: PTW-001 EXCAVATION WORK (FORM PTW-001) SPECIFICATION & COMPLIANCE');
console.log('==================================================');

// --- 1. Static Verification of PTW-001 Metadata & Constants ---
console.log('\n--- 1. Static Verification of PTW-001 Metadata & Constants ---');

assert(src.includes("key: 'excavation'"), "PTYPE_META must register excavation key");
assert(src.includes("code: 'PTW-001'"), "PTYPE_META must register code PTW-001");
assert(src.includes("form: 'PTW-001'"), "PTYPE_META must register Form PTW-001");
assert(src.includes("prefix: 'PTW-001'"), "PTYPE_META must use PTW-001 prefix");
assert(src.includes("sh: 'excavation-head'"), "PTYPE_META must designate excavation-head as Section Head");
assert(src.includes("shLabel: 'Excavation Head'"), "PTYPE_META must label Section Head as Excavation Head");
console.log('  ✓ PASS: PTW-001 Form PTW-001, PTW-001 prefix, and Excavation Head metadata verified');

assert(src.includes('CHECKLIST_ITEMS = ['), "CHECKLIST_ITEMS constant must be defined");
assert(src.includes("excavation: ['Basement/Podium', 'Manual']"), "LOCATION_MODES_BY_PERMIT must restrict excavation to Basement/Podium and Manual");
assert(src.includes("key: 'excavation-head'"), "ROLES must include excavation-head");
console.log('  ✓ PASS: 12-item checklist, location restriction, and excavation-head role verified');

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
    addEventListener: () => {}
};

const mockWindow = {
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768,
    location: { hash: '' }
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
}

const sandbox = {
    window: mockWindow,
    document: mockDocument,
    history: { pushState: () => {} },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout: (fn) => fn(),
    setInterval: () => 1,
    clearTimeout: () => {},
    clearInterval: () => {},
    Math: Math,
    Date: Date,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    JSON: JSON,
    jspdf: { jsPDF: MockPDFDoc },
    showToast: (msg, type) => { toastMessages.push({ msg, type }); }
};

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(code) {
    return vm.runInContext(code, context);
}

evalInVM("window.__TEST_MODE__ = true;");
console.log('  ✓ PASS: VM Sandbox initialized successfully');

// --- 3. Location Mode & Suspended Slab Protection ---
console.log('\n--- 3. Location Mode & Suspended Slab Protection ---');

const excModes = evalInVM("getAllowedLocationModes('excavation')");
assert.strictEqual(JSON.stringify(excModes), JSON.stringify(['Basement/Podium', 'Manual']), "Excavation allowed modes must be Basement/Podium and Manual");
console.log('  ✓ PASS: getAllowedLocationModes(\'excavation\') strictly excludes Tower');

// Switching to Tower must be prevented for Excavation
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Dave', role: 'Site Supervisor' };");
evalInVM("startNewPermit('excavation');");
evalInVM("draft.locationStructure = 'Basement/Podium';");
evalInVM("onUniversalLocationStructureChange('Tower');");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Basement/Podium', "Switching to Tower must be blocked for Excavation");
console.log('  ✓ PASS: Switching to Tower mode safely blocked with suspended slab protection');

evalInVM("onUniversalLocationStructureChange('Manual');");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Manual', "Switching to Manual mode succeeds for Excavation");
console.log('  ✓ PASS: Switching to Manual mode succeeds for Excavation');

// --- 4. Form Initiation & Step 1 Validation ---
console.log('\n--- 4. Form Initiation & Step 1 Validation ---');

evalInVM("startNewPermit('excavation');");
evalInVM("draft.locationStructure = 'Basement/Podium';");
evalInVM("draft.project = PROJECTS[0].name;");
evalInVM("draft.locBasementPodium = 'Basement Level 2';");
evalInVM("draft.locArea = 'Zone North Pit';");
evalInVM("draft.organization = 'Contractor';");
evalInVM("draft.contractor = 'TerraCore Earthmovers';");
evalInVM("draft.workerCount = 8;");
evalInVM("draft.validFrom = '2026-09-10';");
evalInVM("draft.startTime = '08:30';");
evalInVM("draft.validTill = '2026-09-10T17:30';");

// Missing mandatory parameters
evalInVM("draft.depth = ''; draft.slope = '1.5'; draft.equipment = ['Excavator'];");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 must fail when depth is missing");

evalInVM("draft.depth = '3.5'; draft.slope = '';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 must fail when slope is missing");

evalInVM("draft.slope = '1.5'; draft.equipment = [];");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 must fail when equipment is empty");

// Fully valid Step 1
evalInVM("draft.equipment = ['Excavator', 'Dump Truck'];");
assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 passes when all excavation parameters are valid");
console.log('  ✓ PASS: Step 1 strictly enforces mandatory excavation parameters (depth, slope, equipment)');

// --- 5. 12-Item Statutory Checklist & Media Gating ---
console.log('\n--- 5. 12-Item Statutory Checklist & Media Gating ---');

const excChecklist = evalInVM("checklistFor('excavation')");
assert.strictEqual(excChecklist.length, 12, "Excavation checklist must have exactly 12 statutory items");
console.log('  ✓ PASS: 12-item statutory checklist verified');

// Test checklist item completeness rules
const itemNoNoComment = { q: excChecklist[0], ans: 'no', comment: '' };
assert.strictEqual(evalInVM("checklistItemComplete(" + JSON.stringify(itemNoNoComment) + ", 0, 'excavation')"), false, "Item NO without comment is incomplete");
const itemNoWithComment = { q: excChecklist[0], ans: 'no', comment: 'Shoring boxes installed' };
assert.strictEqual(evalInVM("checklistItemComplete(" + JSON.stringify(itemNoWithComment) + ", 0, 'excavation')"), true, "Item NO with comment is complete");
const itemNa = { q: excChecklist[0], ans: 'na', comment: null };
assert.strictEqual(evalInVM("checklistItemComplete(" + JSON.stringify(itemNa) + ", 0, 'excavation')"), true, "Item N/A without comment is complete");
console.log('  ✓ PASS: Checklist NO comment mandate and N/A rules verified');

// Populate complete checklist and site photo
evalInVM("draft.checklist = CHECKLIST_ITEMS.map((q, i) => ({ q, ans: 'yes', comment: null, photo: null, gps: null }));");
evalInVM("draft.sitePhoto = 'data:image/jpeg;base64,trench_photo';");

// Verify Step 2 fails WITHOUT drawing (mandatory for excavation)
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 must FAIL without excavation drawing");
console.log('  ✓ PASS: Step 2 correctly blocks without mandatory excavation drawing');

// Attach mandatory excavation drawing
evalInVM("draft.drawing = { name: 'trench_section_plan.pdf', isImage: false, dataUrl: null, at: new Date().toISOString() };");
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 passes with 100% checklist completion, site photo, and excavation drawing");
console.log('  ✓ PASS: Step 2 validation passes when all 12 items answered, site photo attached, and excavation drawing attached');

// Step 3 Timing & Step 4 Signature Validation
evalInVM(`
nowTime = () => new Date(2026, 8, 10, 10, 0, 0);
draft.startTime = '10:30';
draft.validTillTime = '17:30';
`);
assert.strictEqual(evalInVM("validateWizStep(3)"), true, "Step 3 timing passes");

evalInVM("draft.signature = null; draft.signerVerified = false;");
assert.strictEqual(evalInVM("validateWizStep(4)"), false, "Step 4 fails without signature");
evalInVM("draft.signature = { dataUrl: 'data:image/png;base64,mockSig' }; draft.signerVerified = true; draft.consent = true;");
assert.strictEqual(evalInVM("validateWizStep(4)"), true, "Step 4 passes with signature and consent");
console.log('  ✓ PASS: Step 4 DPDP consent and digital signature enforced');

// --- 6. Submission to Site Engineer Acknowledgment (Step 2) ---
console.log('\n--- 6. Submission to Site Engineer Acknowledgment (Step 2) ---');

evalInVM(`
p = Object.assign({}, draft, {
    id: genPermitNumber('excavation'),
    createdBy: 'Supervisor Dave',
    createdRoleKey: 'site-supervisor',
    approvals: newChain('excavation'),
    checklist: CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null })),
    sitePhoto: 'data:image/jpeg;base64,photo',
    signature: { dataUrl: 'data:image/png;base64,sig' },
    signerVerified: true,
    consent: true
});
PERMITS.push(p);
submitPermit(p);
`);
const excPermitId = evalInVM("p.id");

let permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Pending Site Engineer Acknowledgment', "Submitted excavation permit status must be Pending Site Engineer Acknowledgment");
assert.strictEqual(evalInVM("requestedByRoleFor(p)"), 'site-supervisor', "Requested By role is site-supervisor");
assert.strictEqual(evalInVM("requestedByLabelFor(p)"), 'Site Supervisor', "Requested By label is Site Supervisor");
assert.strictEqual(evalInVM("shRoleFor(p)"), 'excavation-head', "Section Head role is excavation-head");
assert.strictEqual(evalInVM("shLabelFor(p)"), 'Excavation Head', "Section Head label is Excavation Head");
console.log('  ✓ PASS: Permit submitted to Pending Site Engineer Acknowledgment with statutory Requested By & Section Head');

// Site Engineer physical check & acknowledgment
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric', role: 'Site Engineer' };");
evalInVM("acknowledgeSiteEngineer(p, { comment: 'Trench physical check verified safe', signerName: 'Eng Eric' });");

permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Pending Parallel Approval', "Site Engineer ack advances Excavation to Pending Parallel Approval");
assert.strictEqual(permit.approvals.kind, 'exc', "Approvals chain kind is 'exc'");
console.log('  ✓ PASS: Site Engineer acknowledgment successfully routes to 3-Way Parallel Gate');

// --- 7. 3-Way Parallel Domain Clearance Gate (MEP · P&M · IT Concurrency) ---
console.log('\n--- 7. 3-Way Parallel Domain Clearance Gate ---');

assert.strictEqual(evalInVM("chainStage(p.approvals)"), 'parallel', "Chain stage is parallel");
assert.strictEqual(evalInVM("roleCanActOnChain(p.approvals, 'mep')"), true, "MEP can act on parallel stage");
assert.strictEqual(evalInVM("roleCanActOnChain(p.approvals, 'pm')"), true, "P&M can act on parallel stage");
assert.strictEqual(evalInVM("roleCanActOnChain(p.approvals, 'it')"), true, "IT can act on parallel stage");
assert.strictEqual(evalInVM("roleCanActOnChain(p.approvals, 'excavation-head')"), false, "Excavation Head cannot act before parallel stage is complete");
assert.strictEqual(evalInVM("roleCanActOnChain(p.approvals, 'hw-section-head')"), false, "Tower Incharge has zero authority over Excavation");

// 1. MEP approves first
evalInVM("currentUser = { key: 'mep', name: 'MEP Specialist Mark', role: 'MEP Engineer' };");
evalInVM("approvePermitStage(p, 'mep', { comment: 'Plumbing & drainage pipes surveyed clear', signerName: 'MEP Mark' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Pending Parallel Approval', "Permit remains in Pending Parallel Approval after MEP alone");
assert.strictEqual(permit.approvals.mep.status, 'approved', "MEP status is approved");
console.log('  ✓ PASS: MEP clearance recorded; parallel gate remains open for P&M and IT');

// 2. IT approves second
evalInVM("currentUser = { key: 'it', name: 'IT Eng Ian', role: 'IT Engineer' };");
evalInVM("approvePermitStage(p, 'it', { comment: 'Fibre optic lines located 15m away', signerName: 'IT Ian' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Pending Parallel Approval', "Permit remains in Pending Parallel Approval after MEP and IT");
assert.strictEqual(permit.approvals.it.status, 'approved', "IT status is approved");
console.log('  ✓ PASS: IT clearance recorded; parallel gate awaits P&M');

// 3. P&M approves third -> Parallel gate clears to Section Head!
evalInVM("currentUser = { key: 'pm', name: 'P&M Eng Paul', role: 'P&M Engineer' };");
evalInVM("approvePermitStage(p, 'pm', { comment: 'Excavator and backhoe boom certified', signerName: 'PM Paul' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Pending Section Head', "All 3 parallel clearances advance status to Pending Section Head");
assert.strictEqual(evalInVM("chainStage(p.approvals)"), 'section-head', "Chain stage advances to section-head");
assert.strictEqual(evalInVM("roleCanActOnChain(p.approvals, 'excavation-head')"), true, "Excavation Head is now authorized to act");
assert.strictEqual(evalInVM("roleCanActOnChain(p.approvals, 'hw-section-head')"), false, "Tower Incharge remains unauthorized");
console.log('  ✓ PASS: 3-Way Parallel Gate successfully clears concurrently and advances to Excavation Head');

// --- 8. Section Head Approval: Strictly Excavation Head ---
console.log('\n--- 8. Section Head Approval: Strictly Excavation Head ---');

evalInVM("currentUser = { key: 'excavation-head', name: 'Chief Excavator Evans', role: 'Excavation Head' };");
evalInVM("approvePermitStage(p, 'excavation-head', { comment: 'Shoring calculations and slope stable', signerName: 'Chief Evans' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Pending EHS Approval', "Excavation Head approval advances status to Pending EHS Approval");
assert.strictEqual(evalInVM("chainStage(p.approvals)"), 'ehs', "Chain stage is now ehs");
console.log('  ✓ PASS: Excavation Head approval routes directly to Pending EHS Approval');

// --- 9. First-Wins EHS Final Endorsement & Activation ---
console.log('\n--- 9. First-Wins EHS Final Endorsement & Activation ---');

evalInVM("currentUser = { key: 'ehs-officer', name: 'Safety Officer Sam', role: 'EHS Officer' };");
evalInVM("approvePermitStage(p, 'ehs-officer', { comment: 'Site inspection verified compliant', signerName: 'Safety Officer Sam' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Active', "First EHS approval activates Excavation permit");
assert.strictEqual(permit.approvals.ehsOfficer.status, 'approved', "EHS Officer status approved");
assert.strictEqual(evalInVM("chainStage(p.approvals)"), 'complete', "Chain stage complete");
console.log('  ✓ PASS: EHS endorsement activates PTW-001 Excavation permit');

// --- 10. Rejection & Stale-Approval Invalidation Flow ---
console.log('\n--- 10. Rejection & Stale-Approval Invalidation Flow ---');

// Create a new permit to test Excavation Head rejection preserving parallel clearances
evalInVM("startNewPermit('excavation');");
evalInVM("draft.id = genPermitNumber('excavation');");
evalInVM("draft.createdBy = 'Supervisor Dave'; draft.createdRoleKey = 'site-supervisor';");
evalInVM("draft.locationStructure = 'Basement/Podium'; draft.project = PROJECTS[0].name; draft.locBasementPodium = 'Basement Level 1'; draft.locArea = 'Zone West Pit'; draft.contractor = 'TerraCore'; draft.workerCount = 6; draft.validFrom = '2026-09-10'; draft.startTime = '08:00'; draft.validTill = '2026-09-10T17:00';");
evalInVM("draft.depth = '2.5'; draft.slope = '1.0'; draft.equipment = ['Excavator'];");
evalInVM("draft.checklist = CHECKLIST_ITEMS.map((q) => ({ q, ans: 'yes', comment: null, photo: null, gps: null }));");
evalInVM("draft.signature = 'sig_data'; draft.consent = true;");
evalInVM("draft.approvals = newChain('excavation');");
evalInVM("PERMITS.push(draft);");
const rejPermitId = evalInVM("draft.id");
evalInVM("pRej = PERMITS.find(x => x.id === '" + rejPermitId + "'); submitPermit(pRej);");
evalInVM("acknowledgeSiteEngineer(pRej, { comment: 'Verified ok', signerName: 'Eng Eric' });");
evalInVM("approvePermitStage(pRej, 'mep', { comment: 'MEP ok', signerName: 'MEP Mark' });");
evalInVM("approvePermitStage(pRej, 'pm', { comment: 'PM ok', signerName: 'PM Paul' });");
evalInVM("approvePermitStage(pRej, 'it', { comment: 'IT ok', signerName: 'IT Ian' });");

let rejPermit = evalInVM("PERMITS.find(x => x.id === '" + rejPermitId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Ready for Section Head review");

// Excavation Head rejects for slope corrections
evalInVM("currentUser = { key: 'excavation-head', name: 'Chief Evans' };");
evalInVM("rejectPermitStage(pRej, 'excavation-head', { comment: 'Slope angle too steep, benching required', signerName: 'Chief Evans' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + rejPermitId + "');");
assert.strictEqual(rejPermit.status, 'Returned for Correction', "Rejection by Excavation Head sets status to Returned for Correction");

// Parallel clearances must be preserved!
assert.strictEqual(rejPermit.approvals.mep.status, 'approved', "MEP approval preserved across Section Head rejection");
assert.strictEqual(rejPermit.approvals.pm.status, 'approved', "PM approval preserved across Section Head rejection");
assert.strictEqual(rejPermit.approvals.it.status, 'approved', "IT approval preserved across Section Head rejection");

// Supervisor corrects and resubmits
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Dave' };");
evalInVM("resubmitPermit(pRej, 'Benching 1:1 slope added');");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + rejPermitId + "');");
assert.strictEqual(rejPermit.status, 'Pending Site Engineer Re-Acknowledgment', "Resubmission routes to Pending Site Engineer Re-Acknowledgment");

// Site Engineer re-acknowledges -> Fast-tracks directly to Section Head!
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeReturnPermitEng(pRej, { comment: 'Benching confirmed on site', signerName: 'Eng Eric' });");
rejPermit = evalInVM("PERMITS.find(x => x.id === '" + rejPermitId + "');");
assert.strictEqual(rejPermit.status, 'Pending Section Head', "Site Engineer re-ack fast-tracks directly to Excavation Head (parallel gates bypassed)");
console.log('  ✓ PASS: Stale-approval retention preserves parallel clearances and fast-tracks re-ack to Excavation Head');

// --- 11. Extension Lifecycle ---
console.log('\n--- 11. Extension Lifecycle ---');

evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Dave' };");
evalInVM("requestExtension(p, { minutes: 60, reason: 'Extra depth trenching required', signerName: 'Supervisor Dave' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Site Engineer', "Extension status is Pending Site Engineer");

// Site Engineer extension ack
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("approveExtensionStage(p, 'site-engineer', { comment: 'Trench lighting adequate', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending Section Head', "Extension advances to Pending Section Head");

// Excavation Head extension approval
evalInVM("currentUser = { key: 'excavation-head', name: 'Chief Evans' };");
evalInVM("approveExtensionStage(p, 'excavation-head', { comment: 'Extended excavation approved', signerName: 'Chief Evans' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.extension.status, 'Pending EHS Approval', "Extension advances to Pending EHS Approval");

// EHS extension endorsement
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("approveExtensionStage(p, 'ehs-manager', { comment: 'Extension authorized', signerName: 'Safety Mgr Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.extension.status, 'Approved', "Extension marked Approved");
console.log('  ✓ PASS: 3-stage Extension pipeline (Site Eng -> Excavation Head -> EHS) verified');

// --- 13. Safety Observation & Stop-Work Lifecycle ---
console.log('\n--- 13. Safety Observation & Stop-Work Lifecycle ---');

// EHS raises observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', label: 'EHS Manager' };");
evalInVM("raiseObservation(p, { comment: 'Excavated soil placed too close to trench edge (<1m)', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Active – Observation Open', "Observation sets status to Active – Observation Open");

// Observation blocks closure & extension in action panel
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Dave' };");
const blockedPanel = evalInVM("actionPanelHtml(p);");
assert(blockedPanel.includes('Extension and Closure are currently BLOCKED'), "Action panel must state extension and closure are blocked");
assert(!blockedPanel.includes('Close &amp; Surrender Permit'), "Close & Surrender button must be omitted while observation open");

// 1. Supervisor responds with rectification
evalInVM("respondToObservation(p, { comment: 'Spoil heap pushed back 2.5 meters from edge', photo: 'photo_data', sig: 'sig' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Site Engineer Acknowledgment', "Rectification routes to Site Engineer");

// 2. Site Engineer verifies on site
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
evalInVM("acknowledgeObservationEng(p, { comment: 'Edge clearance verified on site', signerName: 'Eng Eric' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending Section Head Review', "Verified rectification routes to Excavation Head");

// 3. Excavation Head reviews & endorses
evalInVM("currentUser = { key: 'excavation-head', name: 'Chief Evans' };");
evalInVM("reviewObservationSectionHead(p, true, { comment: 'Spoil distance compliant with SOP', signerName: 'Chief Evans' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Observation Pending EHS Clearance', "Endorsement routes to EHS for clearance");

// 4. EHS clears observation
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith' };");
evalInVM("resolveObservation(p, true, { comment: 'Restored compliant condition', signerName: 'Safety Manager Smith' });");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Active', "Clearing observation restores status to Active");
assert.strictEqual(permit.observation.status, 'Resolved', "Observation status is Resolved");
console.log('  ✓ PASS: Complete 4-stage observation lifecycle executed cleanly');

// --- 13. Exclusive Closure & Surrender Gate ---
console.log('\n--- 13. Exclusive Closure & Surrender Gate ---');

// Non-supervisor role cannot close
evalInVM("currentUser = { key: 'site-engineer', name: 'Eng Eric' };");
const engClose = evalInVM("closeAndSurrenderPermit(p, { remarks: 'Trying to close as engineer' });");
assert.strictEqual(engClose, false, "Site Engineer cannot close or surrender Excavation permit");

// Site Supervisor closes with backfilling certification
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Dave' };");
const supClose = evalInVM("closeAndSurrenderPermit(p, { remarks: 'Trench backfilled, compacted, and area made safe', sig: 'sup_sig', signerName: 'Supervisor Dave' });");
assert.strictEqual(supClose, true, "Site Supervisor successfully closes and surrenders Excavation permit");
permit = evalInVM("PERMITS.find(x => x.id === '" + excPermitId + "');");
assert.strictEqual(permit.status, 'Completed (Surrendered)', "Status updated to Completed (Surrendered)");
assert.strictEqual(permit.surrender.by, 'Supervisor Dave', "Surrendered by Supervisor Dave");
console.log('  ✓ PASS: Exclusive Site Supervisor closure & surrender verified');

// --- 15. PDF Audit Report & Dynamic Section Head Tracker Verification ---
console.log('\n--- 15. PDF Audit Report & Dynamic Section Head Tracker ---');

const trackerHtml = evalInVM("trackerHtml(p)");
assert(trackerHtml.includes('Excavation Head'), "Tracker HTML must display Excavation Head");
assert(!trackerHtml.includes('Tower Incharge'), "Tracker HTML must NOT display Tower Incharge for PTW-001");
console.log('  ✓ PASS: Approval tracker dynamically resolves Excavation Head');

// PDF export execution
let pdfResult = null;
evalInVM("currentUser = { key: 'ehs-manager', name: 'Safety Manager Smith', role: 'EHS Manager' };");
try {
    evalInVM("generatePermitPDF(p);");
    pdfResult = true;
} catch (e) {
    pdfResult = false;
    console.error("PDF generation failed:", e);
}
assert.strictEqual(pdfResult, true, "generatePermitPDF executes cleanly for Excavation permit");
console.log('  ✓ PASS: jsPDF audit report generation succeeds for PTW-001 Excavation permit');

console.log('\n==================================================');
console.log('ALL PTW-001 EXCAVATION WORK TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
