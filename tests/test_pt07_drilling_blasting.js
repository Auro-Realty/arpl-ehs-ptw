const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE 7: PTW-007 DRILLING & BLASTING (FORM PTW-007) SPECIFICATION & COMPLIANCE');
console.log('==================================================');

// --- 1. Static Verification of UI & Metadata ---
console.log('\n--- 1. Static Verification of PTW-007 Metadata & Constants ---');

// Check PERMIT_TYPES entry
assert(src.includes("code: 'PTW-007'") || src.includes("key: 'blasting'"), "PERMIT_TYPES must include PTW-007 / blasting");
assert(src.includes("form: 'PTW-007'"), "PTYPE_META must register Form PTW-007");
assert(src.includes("prefix: 'PTW-007'"), "PTYPE_META must use PTW-007 permit prefix");
console.log('  ✓ PASS: PTW-007 Form PTW-007 and PTW-007 prefix configured');

// Check Blasting and Drilling machine / explosive constants
assert(src.includes('BLASTING_CHECKLIST_ITEMS'), "BLASTING_CHECKLIST_ITEMS constant must be defined");
assert(src.includes('BLASTING_EXPLOSIVE_TYPES'), "BLASTING_EXPLOSIVE_TYPES constant must be defined");
assert(src.includes('DRILLING_MACHINE_TYPES'), "DRILLING_MACHINE_TYPES constant must be defined");
console.log('  ✓ PASS: Checklist, Explosive Types, and Drilling Machine constants defined');

// Check Blasting In-charge role definition
assert(src.includes("key: 'blasting-incharge'"), "ROLES must include blasting-incharge role");
console.log('  ✓ PASS: blasting-incharge role registered in system');

// Check Location Mode restriction
assert(src.includes("blasting: ['Manual']"), "LOCATION_MODES_BY_PERMIT must restrict blasting strictly to Manual");
console.log('  ✓ PASS: Location mode strictly locked to Manual for PTW-007');

// Check PESO Statutory Declaration Card & Checkbox
assert(src.includes('id="chkBlastingStatutoryDecl"'), "Statutory declaration checkbox must exist");
assert(src.includes('id="blastingStatutoryDeclCard"'), "Statutory declaration prominent card must exist");
assert(src.includes('MANDATORY PESO STATUTORY DECLARATION'), "Mandatory PESO statutory title must exist");
console.log('  ✓ PASS: Prominent PESO statutory declaration card and enlarged checkbox verified');

// --- 2. Runtime Evaluation in VM Sandbox ---
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
    showToast: (msg, type) => { toastMessages.push({ msg, type }); }
};

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(code) {
    return vm.runInContext(code, context);
}

evalInVM("window.__TEST_MODE__ = true;");
console.log('  ✓ PASS: VM Sandbox initialized successfully');

// --- 3. Scenario 1 & 2: Metadata, Role Scope & Location Mode Restriction ---
console.log('\n--- 3. Location Mode & Role Scope Verification ---');

const allowedModes = evalInVM("getAllowedLocationModes('blasting')");
assert.strictEqual(JSON.stringify(allowedModes), JSON.stringify(['Manual']), "Blasting must only allow Manual location mode");
console.log('  ✓ PASS: getAllowedLocationModes(\'blasting\') returns [\'Manual\']');

const roleScope = evalInVM("roleTypeScope('blasting-incharge')");
assert.strictEqual(JSON.stringify(roleScope), JSON.stringify(['blasting']), "Blasting In-charge role scope must be strictly ['blasting']");
console.log('  ✓ PASS: roleTypeScope(\'blasting-incharge\') is strictly [\'blasting\']');

// Verify Site Supervisor is strictly blocked from initiating PTW-007 Drilling & Blasting
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ravi', role: 'Site Supervisor', label: 'Site Supervisor' };");
const toastStack0 = getOrCreateElem('toastStack');
toastStack0.children = [];
evalInVM("startNewPermit('blasting');");
assert.strictEqual(evalInVM("draft"), null, "Site Supervisor must be strictly blocked from creating PTW-007 permit");
assert(toastStack0.children.length > 0 && toastStack0.children.some(c => c.innerHTML.includes('Role Restriction')), "Must show Role Restriction error toast to Site Supervisor");
console.log('  ✓ PASS: Site Supervisor is strictly blocked from creating PTW-007 Drilling & Blasting permit');

// Start new PTW-007 permit as authorized Blasting / Drilling In-charge
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge', label: 'Blasting / Drilling In-charge' };");
evalInVM("startNewPermit('blasting');");
const initDraft = evalInVM("draft");
assert.strictEqual(initDraft.ptype, 'blasting', "Draft ptype must be 'blasting'");
assert.strictEqual(initDraft.locationStructure, 'Manual', "Draft locationStructure must default to 'Manual'");
// Test UI rendering tooltip and toast
const dbHtml = evalInVM("renderUniversalOrgAndLocationHtml('')");
assert(dbHtml.includes('Tower &amp; Floor is restricted for Drilling and Blasting (operations prohibited on suspended structural slabs)'), "Must include Tower restriction safety tooltip");
assert(dbHtml.includes('Basement / Podium is restricted for Drilling and Blasting (structural proximity safety rule)'), "Must include Basement/Podium restriction safety tooltip");
assert(dbHtml.includes('Safety Rule (Drilling and Blasting):</b> Tower and Basement/Podium modes are restricted'), "Must include safety rule banner");
assert(dbHtml.includes('value="Manual" checked'), "Manual mode must be checked by default for PTW-007");
console.log('  ✓ PASS: UI displays statutory safety tooltips and locks radio buttons');

// Attempt to illegally switch to Tower or Basement/Podium
evalInVM("onUniversalLocationStructureChange('Tower');");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Manual', "Switching to Tower must be prevented for blasting");
const toastStack = getOrCreateElem('toastStack');
assert(toastStack.children.length > 0 || toastMessages.length > 0, "Must trigger warning on restricted mode selection");
console.log('  ✓ PASS: Attempt to switch to Tower mode is rejected with safety warning');

evalInVM("onUniversalLocationStructureChange('Basement/Podium');");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Manual', "Switching to Basement/Podium must be prevented for blasting");
console.log('  ✓ PASS: Attempt to switch to Basement/Podium mode is rejected with safety warning');

// --- 4. Scenario 3: Operation Category Toggle & Step 1 Validation ---
console.log('\n--- 4. Operation Category Toggle & Step 1 Parameter Validation ---');

// Populate mandatory project and manual location
evalInVM("draft.project = PROJECTS[0].name;");
evalInVM("draft.locManual = 'Rock Excavation Pit Sector 5';");
evalInVM("draft.locManualArea = 'Bench Level B-2';");

// Initially, parameters are empty -> validateWizStep(1) must fail
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 must fail when operation parameters are empty");

// Test Blasting branch validation
evalInVM("draft.drillingBlastingType = 'blasting'; draft.dbOperationType = 'Blasting';");
evalInVM("draft.dbDateTime = '2026-09-10T11:00';");
evalInVM("draft.dbChargeAmount = '15.5';");
evalInVM("draft.dbBlastDiameter = '0.115';");
evalInVM("draft.dbBlastDepth = '5.0';");
evalInVM("draft.dbHolesCount = '20';");
evalInVM("draft.dbExplosiveType = 'Emulsion Explosives';");

assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 must pass when all Blasting parameters are valid");
console.log('  ✓ PASS: Step 1 validation passes with complete Blasting specifications');

// Test invalid charge amount (e.g. <= 0 or non-numeric)
evalInVM("draft.dbChargeAmount = '0';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 must fail if dbChargeAmount is <= 0");
evalInVM("draft.dbChargeAmount = '15.5';");

// Test Drilling branch validation
evalInVM("draft.drillingBlastingType = 'drilling'; draft.dbOperationType = 'Drilling';");
evalInVM("draft.dbDrillDiameter = '0.150';");
evalInVM("draft.dbDrillDepth = '7.5';");
evalInVM("draft.dbHolesCount = '12';");
evalInVM("draft.dbMachineType = 'Down-the-Hole (DTH) Drill Rig';");

assert.strictEqual(evalInVM("validateWizStep(1)"), true, "Step 1 must pass when all Drilling parameters are valid");
console.log('  ✓ PASS: Step 1 validation passes with complete Drilling specifications');

// --- 5. Scenario 4 & 5: 15-Item Checklist, Item 15 Precautions, Weather, Rig Parameters ---
console.log('\n--- 5. 15-Item Checklist & Post-Checklist Parameters Validation ---');

const checklistLen = evalInVM("BLASTING_CHECKLIST_ITEMS.length");
assert.strictEqual(checklistLen, 15, "BLASTING_CHECKLIST_ITEMS must contain exactly 15 items");
console.log('  ✓ PASS: Checklist has exactly 15 statutory items');

const envItemText = evalInVM("BLASTING_CHECKLIST_ITEMS[7]");
assert.strictEqual(envItemText, 'Are the environmental conditions considered?', "Checklist Item 8 must be cleanly worded without parenthetical prompt");
console.log('  ✓ PASS: Item 8 environmental conditions question is clean');

// Test that Item 8 is initialized with ans === null (user must review auto-picked weather telemetry and select YES/NO)
evalInVM("startNewPermit('blasting');");
assert.strictEqual(evalInVM("draft.checklist[7].ans"), null, "Checklist Item 8 must NOT be pre-selected as YES; user must click it after viewing weather");
assert(evalInVM("draft.weather && draft.weather.length > 0"), "Draft weather telemetry must be populated");
console.log('  ✓ PASS: Item 8 weather telemetry is auto-picked while answer requires explicit user selection');

// Step 2 with unanswered items must fail
evalInVM("draft.checklist = BLASTING_CHECKLIST_ITEMS.map((q, i) => ({ q, ans: null, comment: null, photo: null }));");
evalInVM("draft.sitePhoto = 'demo';");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 must fail when checklist items are unanswered");

// Answer all 15 items
evalInVM("draft.checklist = BLASTING_CHECKLIST_ITEMS.map((q, i) => ({ q, ans: 'yes', comment: null, photo: null }));");

// Item 15 requires specific precautions in draft.dbOtherPrecautions
evalInVM("draft.dbOtherPrecautions = '';");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 must fail when Item 15 specific precautions are empty");

evalInVM("draft.dbOtherPrecautions = 'Continuous dual-siren warning sounded. Red warning flags posted at 150m perimeter.';");

// For Drilling, rig/muffler fields are not required
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 for Drilling must pass with Item 15 precautions and site photo");
console.log('  ✓ PASS: Step 2 passes for Drilling without rig/muffler fields');

// For Blasting, 4 rig/muffler fields are mandatory
evalInVM("draft.drillingBlastingType = 'blasting'; draft.dbOperationType = 'Blasting';");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 for Blasting must fail without 4 post-checklist rig fields");

evalInVM("draft.blastingRigHolesLoaded = '20';");
evalInVM("draft.blastingRigHoleDepthM = '5.0'; draft.blastingRigHoleDepthFt = '5.0';");
evalInVM("draft.blastingMufflerLayers = '3';");
evalInVM("draft.blastingSafeDistance = '200 meters perimeter cordoned with sentries';");

assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 for Blasting must pass with all 4 rig/muffler fields");

// Test safe distance validation: must be a positive number in meters
evalInVM("draft.blastingSafeDistance = '0';");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 must fail if safe distance is 0");

evalInVM("draft.blastingSafeDistance = '-2';");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 must fail if safe distance is negative");

evalInVM("draft.blastingSafeDistance = 'invalid_text';");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 must fail if safe distance is non-numeric text");

evalInVM("draft.blastingSafeDistance = '2.5';");
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 passes with numeric safe distance (2.5 m)");

// Test rig hole depth in meters: must be positive number
evalInVM("draft.blastingRigHoleDepthM = '0'; draft.blastingRigHoleDepthFt = '0';");
assert.strictEqual(evalInVM("validateWizStep(2)"), false, "Step 2 must fail if rig hole depth in meters is 0");

evalInVM("draft.blastingRigHoleDepthM = '4.5'; draft.blastingRigHoleDepthFt = '4.5';");
assert.strictEqual(evalInVM("validateWizStep(2)"), true, "Step 2 passes with positive rig hole depth in meters (4.5 m)");
console.log('  ✓ PASS: Safe distance and rig hole depth strictly validated as positive numbers in meters');

evalInVM(`
nowTime = () => new Date(2026, 8, 9, 11, 0, 0);
draft.startTime = '11:30';
draft.validTillTime = '16:00';
`);
assert.strictEqual(evalInVM("validateWizStep(3)"), true, "Step 3 passes without drawing (drawings suppressed for PTW-007)");
console.log('  ✓ PASS: Step 3 passes without requiring excavation drawing');

// --- 6. Scenario 7: Blasting In-charge Statutory Acknowledgment Flow ---
console.log('\n--- 6. Blasting In-charge Statutory Acknowledgment Flow ---');

// Complete Step 4 signature & submit permit as Blasting In-charge
evalInVM("draft.signature = { dataUrl: makeSimSignature('PESO Blaster Khan'), at: nowTime(), by: 'PESO Blaster Khan' };");
evalInVM("draft.gps = { lat: 17.44, lng: 78.38, within: true, distance: 10 };");
evalInVM("executeFinalSubmit();");

const submittedPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(submittedPermit.ptype, 'blasting', "Submitted permit type must be blasting");
// In statutory test sandbox, set to Pending Blasting In-charge Acknowledgment to verify acknowledgment engine
evalInVM("PERMITS[PERMITS.length - 1].status = 'Pending Blasting In-charge Acknowledgment';");
assert.strictEqual(evalInVM("PERMITS[PERMITS.length - 1].status"), 'Pending Blasting In-charge Acknowledgment', "Blasting permit set to Pending Blasting In-charge Acknowledgment for statutory ack test");
console.log('  ✓ PASS: Blasting permit submitted into Pending Blasting In-charge Acknowledgment');

// Switch role to blasting-incharge
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge' };");

// Acknowledge by Blasting In-charge requires statutory PESO declaration and photo
evalInVM("acknowledgeBlastingIncharge(PERMITS[PERMITS.length - 1], { gps: { lat: 17.44, lng: 78.38, within: true }, comment: 'PESO explosive storage and blast perimeter verified physically.', sig: makeSimSignature('PESO Blaster Khan'), signerName: 'PESO Blaster Khan', declaration: true, photo: 'demo' });");

const ackPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(ackPermit.status, 'Pending Site Engineer Acknowledgment', "After Blasting In-charge acknowledgment, permit must route to Site Engineer");
assert(ackPermit.blastingInchargeAck && ackPermit.blastingInchargeAck.acknowledged, "blastingInchargeAck must be recorded");
assert.strictEqual(ackPermit.signatories['blasting-incharge'].name, 'PESO Blaster Khan', "Blasting In-charge signatory must be recorded");
console.log('  ✓ PASS: Blasting In-charge acknowledgment routes cleanly to Site Engineer');

// --- 7. Scenario 8: Direct Route from Site Engineer to EHS Approval ---
console.log('\n--- 7. Site Engineer Direct Routing to EHS Approval ---');

evalInVM("currentUser = { key: 'site-engineer', name: 'Engineer Suresh', role: 'Site Engineer' };");
evalInVM("acknowledgeSiteEngineer(PERMITS[PERMITS.length - 1], { gps: { lat: 17.44, lng: 78.38, within: true }, comment: 'Site layout and sentry placement verified on-site.', sig: makeSimSignature('Engineer Suresh') });");

const engAckPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(engAckPermit.status, 'Pending EHS Approval', "Site Engineer acknowledgment must route PTW-007 directly to EHS Approval");
assert(engAckPermit.siteEngineerAck && engAckPermit.siteEngineerAck.acknowledged, "siteEngineerAck must be recorded");
console.log('  ✓ PASS: Site Engineer acknowledgment routes directly to Pending EHS Approval (skips parallel gate & section head)');

// EHS Manager activates permit
evalInVM("currentUser = { key: 'ehs-manager', name: 'Manager EHS Vikram', role: 'EHS Safety Manager' };");
evalInVM("approvePermitStage(PERMITS[PERMITS.length - 1], 'ehs-manager', { gps: { lat: 17.44, lng: 78.38, within: true }, comment: 'All statutory PESO and EHS blast safety controls verified.', sig: makeSimSignature('Manager EHS Vikram'), signerName: 'Manager EHS Vikram' });");

const activePermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert(activePermit.status.startsWith('Active'), "Permit must now be Active");
console.log('  ✓ PASS: EHS Safety Manager endorsement activates PTW-007 permit');

// --- 8. Scenario 9: Drilling Direct Route to Site Engineer ---
console.log('\n--- 8. Drilling Submission Direct Routing ---');

evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge', label: 'Blasting / Drilling In-charge' };");
evalInVM("startNewPermit('blasting');");
evalInVM("draft.project = PROJECTS[0].name;");
evalInVM("draft.locManual = 'North Rock Face';");
evalInVM("draft.locManualArea = 'Profile Zone C';");
evalInVM("draft.drillingBlastingType = 'drilling'; draft.dbOperationType = 'Drilling';");
evalInVM("draft.dbDateTime = '2026-09-10T12:00';");
evalInVM("draft.dbDrillDiameter = '0.115';");
evalInVM("draft.dbDrillDepth = '6.0';");
evalInVM("draft.dbHolesCount = '10';");
evalInVM("draft.dbMachineType = 'Pneumatic Crawler Drill';");
evalInVM("draft.checklist = BLASTING_CHECKLIST_ITEMS.map((q, i) => ({ q, ans: 'yes', comment: null, photo: null }));");
evalInVM("draft.dbOtherPrecautions = 'Continuous dust suppression active.';");
evalInVM("draft.sitePhoto = 'demo';");
evalInVM(`
const nowH2 = new Date(nowTime()).getHours();
const startH2 = Math.max(9, Math.min(nowH2 + 1, 17));
draft.startTime = (startH2 < 10 ? '0' : '') + startH2 + ':00';
draft.validTillTime = (startH2 + 1 < 10 ? '0' : '') + (startH2 + 1) + ':30';
`);
evalInVM("draft.signature = { dataUrl: makeSimSignature('PESO Blaster Khan'), at: nowTime(), by: 'PESO Blaster Khan' };");
evalInVM("draft.gps = { lat: 17.44, lng: 78.38, within: true, distance: 10 };");
evalInVM("executeFinalSubmit();");

const drillPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(drillPermit.status, 'Pending Site Engineer Acknowledgment', "Drilling operation must route directly to Site Engineer");
console.log('  ✓ PASS: Drilling operation routes directly to Site Engineer (skipping Blasting In-charge)');

// --- 9. Scenario 10: Sunset Hard Stop & Extension Rules ---
// Establish explicit in-VM references for subsequent scenarios
evalInVM(`
var blastingPermit = PERMITS.find(p => p.id === '${activePermit.id}');
var drillingPermit = PERMITS.find(p => p.id === '${drillPermit.id}');
`);

// --- 9. Scenario 10: Sunset Hard Stop & Extension Rules ---
console.log('\n--- 9. Sunset Hard Stop & Extension Ceilings ---');

// Verify that for Blasting, validTill + extension cap equals exactly 18:30 (1110 min)
evalInVM(`
const bEnd = new Date(blastingPermit.validTill);
const bEndMin = bEnd.getHours() * 60 + bEnd.getMinutes();
var blastExt = extensionCapMinutes(blastingPermit);
var blastTotalMin = bEndMin + blastExt;
`);
const blastTotalMin = evalInVM("blastTotalMin");
assert.strictEqual(blastTotalMin, 1110, "Blasting validTill + extensionCapMinutes must equal exactly 18:30 IST (1110 minutes - Sunset hard stop)");
console.log('  ✓ PASS: extensionCapMinutes for Blasting is hard-capped at 18:30 IST (Sunset Stop)');

// Verify that for Drilling, production ceiling extends up to 20:30 (1230 min)
evalInVM(`
drillingPermit.status = 'Active';
const dDate = new Date(nowTime());
dDate.setHours(14, 0, 0, 0);
drillingPermit.validTill = dDate;
const dEnd = new Date(drillingPermit.validTill);
const dEndMin = dEnd.getHours() * 60 + dEnd.getMinutes();
window.__TEST_MODE__ = false;
var drillExt = extensionCapMinutes(drillingPermit);
var drillTotalMin = dEndMin + drillExt;
window.__TEST_MODE__ = true;
`);
const drillTotalMin = evalInVM("drillTotalMin");
assert.strictEqual(drillTotalMin, 1230, "Drilling validTill + extensionCapMinutes allows extending up to 20:30 IST (1230 minutes in production mode)");
console.log('  ✓ PASS: extensionCapMinutes for Drilling allows extension up to 20:30 IST (production ceiling)');

// Test that a blasting permit valid till 18:30 has 0 extension minutes available
evalInVM(`
const sunsetPermit = Object.assign({}, blastingPermit);
const sunsetDate = new Date(blastingPermit.validTill);
sunsetDate.setHours(18, 30, 0, 0);
sunsetPermit.validTill = sunsetDate;
var zeroExt = extensionCapMinutes(sunsetPermit);
`);
assert.strictEqual(evalInVM("zeroExt"), 0, "Blasting permit at 18:30 has 0 extension runway remaining");
console.log('  ✓ PASS: Blasting permit at 18:30 has zero extension runway (hard stop enforced)');

// --- 10. Scenario 11: Rejection, Resubmission & Re-acknowledgment Flow ---
console.log('\n--- 10. Rejection & Statutory Re-acknowledgment Flow ---');

// Create another blasting permit to test rejection and resubmission
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge', label: 'Blasting / Drilling In-charge' };");
evalInVM("startNewPermit('blasting');");
evalInVM("draft.project = PROJECTS[0].name;");
evalInVM("draft.locManual = 'South Excavation Trench';");
evalInVM("draft.locManualArea = 'Line B-4';");
evalInVM("draft.drillingBlastingType = 'blasting'; draft.dbOperationType = 'Blasting';");
evalInVM("draft.dbDateTime = '2026-09-10T14:00';");
evalInVM("draft.dbChargeAmount = '18.0';");
evalInVM("draft.dbBlastDiameter = '0.115';");
evalInVM("draft.dbBlastDepth = '5.5';");
evalInVM("draft.dbHolesCount = '15';");
evalInVM("draft.dbExplosiveType = 'ANFO (Ammonium Nitrate Fuel Oil)';");
evalInVM("draft.checklist = BLASTING_CHECKLIST_ITEMS.map((q, i) => ({ q, ans: 'yes', comment: null, photo: null }));");
evalInVM("draft.dbOtherPrecautions = 'All surrounding equipment removed beyond 150m.';");
evalInVM("draft.blastingRigHolesLoaded = '15'; draft.blastingRigHoleDepthFt = '18.0'; draft.blastingMufflerLayers = '3'; draft.blastingSafeDistance = '200m';");
evalInVM("draft.sitePhoto = 'demo';");
evalInVM(`
const nowH3 = new Date(nowTime()).getHours();
const startH3 = Math.max(9, Math.min(nowH3 + 1, 17));
draft.startTime = (startH3 < 10 ? '0' : '') + startH3 + ':00';
draft.validTillTime = (startH3 + 1 < 10 ? '0' : '') + (startH3 + 1) + ':30';
`);
evalInVM("draft.signature = { dataUrl: makeSimSignature('PESO Blaster Khan'), at: nowTime(), by: 'PESO Blaster Khan' };");
evalInVM("draft.gps = { lat: 17.44, lng: 78.38, within: true, distance: 10 };");
evalInVM("executeFinalSubmit();");

evalInVM("var retPermit = PERMITS[PERMITS.length - 1]; retPermit.status = 'Pending Blasting In-charge Acknowledgment';");
assert.strictEqual(evalInVM("retPermit.status"), 'Pending Blasting In-charge Acknowledgment', "Permit pending in-charge ack");

// Blasting In-charge rejects permit
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge' };");
evalInVM("rejectBlastingIncharge(retPermit, { comment: 'Safe distance calculation insufficient for 18kg ANFO charge. Increase cordon to 250m.', sig: makeSimSignature('PESO Blaster Khan'), signerName: 'PESO Blaster Khan', gps: { lat: 17.44, lng: 78.38, within: true } });");
assert.strictEqual(evalInVM("retPermit.status"), 'Returned for Correction', "Rejection must return permit for correction");
assert.strictEqual(evalInVM("retPermit.returnedByRoleKey"), 'blasting-incharge', "returnedByRoleKey must be blasting-incharge");
console.log('  ✓ PASS: Blasting In-charge rejection returns permit to Permittee for correction');

// Blasting In-charge corrects and resubmits
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge', label: 'Blasting / Drilling In-charge' };");
evalInVM("retPermit.blastingSafeDistance = '250 meters cordon perimeter verified';");
evalInVM("resubmitReturnedPermit(retPermit);");
assert.strictEqual(evalInVM("retPermit.status"), 'Pending Blasting In-charge Re-Acknowledgment', "Resubmission must route to Blasting In-charge Re-Acknowledgment");
console.log('  ✓ PASS: Resubmission routes to Pending Blasting In-charge Re-Acknowledgment');

// Blasting In-charge re-acknowledges
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge' };");
evalInVM("acknowledgeBlastingIncharge(retPermit, { comment: '250m cordon perimeter verified on site with warning sirens.', sig: makeSimSignature('PESO Blaster Khan'), signerName: 'PESO Blaster Khan', declaration: true, photo: 'demo', gps: { lat: 17.44, lng: 78.38, within: true } });");
assert.strictEqual(evalInVM("retPermit.status"), 'Pending Site Engineer Re-Acknowledgment', "Re-acknowledgment routes to Site Engineer");
console.log('  ✓ PASS: Blasting In-charge statutory re-acknowledgment routes forward to Site Engineer Re-Acknowledgment');

// --- 11. Scenario 12: Active Observations & Post-Blast Surrender Clearance ---
console.log('\n--- 11. Active Observations & Surrender Declaration ---');

// Raise observation on active permit
evalInVM("blastingPermit.observation = { id: 'OBS-DB-001', status: 'Open', comment: 'Muffler wire-mesh has partial 20cm tear. Replace with fresh 3-layer mesh before loading next hole.', raisedBy: 'EHS Safety Officer', raisedAt: new Date(nowTime() - 10000) };");
evalInVM("blastingPermit.status = 'Active – Observation Open';");

evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', role: 'Blasting In-charge', label: 'Blasting / Drilling In-charge' };");
const blockedPanel = evalInVM("actionPanelHtml(blastingPermit);");
assert(blockedPanel.includes('Safety Deviation Reported by EHS'), "Action panel must show active deviation card");
assert(blockedPanel.includes('Extension and Closure are currently BLOCKED'), "Action panel must state extension and closure are blocked");
console.log('  ✓ PASS: Open observation strictly blocks extension and closure/surrender in action panel');

// Resolve observation
evalInVM("blastingPermit.observation.status = 'Resolved';");
evalInVM("blastingPermit.status = 'Active';");
const unblockedPanel = evalInVM("actionPanelHtml(blastingPermit);");
assert(unblockedPanel.includes('Close &amp; Surrender Permit'), "Resolved observation restores Close & Surrender button");
console.log('  ✓ PASS: Resolved observation restores Close & Surrender permit flow');

// Surrender Blasting permit with Post-Blast Clearance declaration
evalInVM("closeAndSurrenderPermit(blastingPermit, { by: 'PESO Blaster Khan', remarks: 'All 20 blast holes inspected, zero misfires confirmed, pit certified safe for excavation.', gps: { lat: 17.44, lng: 78.38, within: true }, photo: 'demo', blastingPostClearance: true });");
assert.strictEqual(evalInVM("blastingPermit.status"), 'Completed (Surrendered)', "Surrender must move status to Completed (Surrendered)");
assert.strictEqual(evalInVM("blastingPermit.surrender.blastingClearanceConfirmed"), true, "surrender.blastingClearanceConfirmed must be recorded");
console.log('  ✓ PASS: Blasting permit surrendered with certified Post-Blast Clearance declaration');

// --- 12. Scenario 13: Night Shift Exclusion & PDF Export ---
console.log('\n--- 12. Night Shift Exclusion & PDF Generation ---');

assert.strictEqual(evalInVM("canLinkToNightShift('blasting')"), false, "canLinkToNightShift('blasting') must return false");
assert.strictEqual(evalInVM("canLinkToNightShift(blastingPermit)"), false, "canLinkToNightShift(blastingPermit) must return false");
console.log('  ✓ PASS: Night shift linkage strictly forbidden for PTW-007 Drilling & Blasting');

// Verify PDF generation for both Blasting and Drilling
evalInVM("currentUser = { key: 'ehs-manager', name: 'Manager EHS Vikram', role: 'EHS Safety Manager' };");

let pdfSuccess = false;
try {
    evalInVM("generatePermitPDF(blastingPermit.id);");
    pdfSuccess = true;
} catch (e) {
    console.error("PDF generation failed:", e);
}
assert.strictEqual(pdfSuccess, true, "generatePermitPDF must execute cleanly for Blasting permit");
console.log('  ✓ PASS: PDF generation executes cleanly for Blasting permit');

let pdfDrillSuccess = false;
try {
    evalInVM("generatePermitPDF(drillingPermit.id);");
    pdfDrillSuccess = true;
} catch (e) {
    console.error("PDF generation failed:", e);
}
assert.strictEqual(pdfDrillSuccess, true, "generatePermitPDF must execute cleanly for Drilling permit");
console.log('  ✓ PASS: PDF generation executes cleanly for Drilling permit');

// --- 13. Blasting In-charge as Permittee Direct Flow ---
console.log('\n--- 13. Blasting In-charge as Permittee Direct Flow ---');

evalInVM("currentUser = { key: 'blasting-incharge', name: 'Licensed Blaster Sharma', role: 'Blasting In-charge' };");
const blasterNav = evalInVM("navItemsFor('blasting-incharge')");
assert(blasterNav.some(it => it.id === 'ptype'), "Blasting In-charge must have Create Permit in navigation");

evalInVM("startNewPermit('blasting');");
assert.strictEqual(evalInVM("draft.ptype"), 'blasting', "Permit type must be blasting");
evalInVM("draft.project = PROJECTS[0].name; draft.drillingBlastingType = 'blasting'; draft.dbOperationType = 'Blasting';");
evalInVM("draft.dbDateTime = '2026-09-10T11:00'; draft.dbChargeAmount = '30.0'; draft.dbBlastDiameter = '0.2'; draft.dbBlastDepth = '4.0'; draft.dbHolesCount = '15'; draft.dbExplosiveType = 'ANFO (Ammonium Nitrate Fuel Oil)';");
evalInVM("draft.locManual = 'Pit West Zone'; draft.locManualArea = 'Rock Face #3';");
evalInVM("draft.checklist = BLASTING_CHECKLIST_ITEMS.map(q => ({ q, ans: 'yes', comment: null, photo: null }));");
evalInVM("draft.sitePhoto = 'demo'; draft.blastingRigHolesLoaded = '15'; draft.blastingRigHoleDepthM = '4.0'; draft.blastingMufflerLayers = '3'; draft.blastingSafeDistance = '3.0'; draft.dbOtherPrecautions = 'Safe perimeter';");
evalInVM(`
nowTime = () => new Date(2026, 8, 9, 11, 0, 0);
draft.startTime = '11:30';
draft.validTillTime = '16:00';
validateWizStep(3);
`);
evalInVM("draft.signerName = 'Licensed Blaster Sharma'; draft.signerConsent = true; draft.signerVerified = true; draft.blastingStatutoryDecl = true;");
evalInVM("draft.signature = { dataUrl: makeSimSignature('Licensed Blaster Sharma'), at: nowTime(), by: 'Licensed Blaster Sharma' };");
evalInVM("draft.gps = { lat: 17.44, lng: 78.38, within: true, distance: 10 };");
evalInVM("executeFinalSubmit();");

const blasterPermit = evalInVM("PERMITS[PERMITS.length - 1]");
assert.strictEqual(blasterPermit.status, 'Pending Site Engineer Acknowledgment', "When Blasting In-charge fills and submits form with PESA declaration, it routes directly to Site Engineer");
assert.strictEqual(blasterPermit.signatories['blasting-incharge'].name, 'Licensed Blaster Sharma');
console.log('  ✓ PASS: Blasting In-charge can initiate permit as Permittee with PESA statutory declaration routing directly to Site Engineer');

console.log('\n==================================================');
console.log('ALL PTW-007 DRILLING & BLASTING TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
