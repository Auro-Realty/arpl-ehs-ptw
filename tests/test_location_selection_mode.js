const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE 6: LOCATION SELECTION MODE & SAFETY RESTRICTION MATRIX');
console.log('==================================================');

// --- 1. Static Verification ---
console.log('\n--- 1. Static Verification of UI Elements & Matrix Definition ---');

// UI Label exact text
assert(src.includes('Location Selection Mode (Select either Tower or Basement/Podium or Manual) <span class="req">*</span>'),
    "HTML must include exact label: 'Location Selection Mode (Select either Tower or Basement/Podium or Manual)'");
console.log('  ✓ PASS: Section label matches exact specification');

// 3 Tile options
assert(src.includes('🏢 Tower') && src.includes('🏗️ Basement / Podium') && src.includes('📍 Manual'),
    "HTML must render all 3 tiles: Tower, Basement / Podium, and Manual");
console.log('  ✓ PASS: All three mode tiles (Tower, Basement/Podium, Manual) present');

// Matrix in code
assert(src.includes('LOCATION_MODES_BY_PERMIT'), "Must define LOCATION_MODES_BY_PERMIT");
assert(src.includes("excavation: ['Basement/Podium', 'Manual']"), "Excavation matrix must be Basement/Podium and Manual only");
assert(src.includes("hotwork: ['Tower', 'Basement/Podium', 'Manual']"), "Hot Work matrix must allow all 3");
assert(src.includes("guardrail: ['Tower', 'Basement/Podium']"), "Guardrail matrix must allow Tower and Basement/Podium only");
assert(src.includes("confined: ['Tower', 'Basement/Podium', 'Manual']"), "Confined space matrix must allow all 3");
assert(src.includes("shaft: ['Tower', 'Basement/Podium']"), "Shaft work matrix must allow Tower and Basement/Podium only");
console.log('  ✓ PASS: LOCATION_MODES_BY_PERMIT strictly mirrors construction safety best practices');

// Safety explanations present
assert(src.includes('cannot excavate on suspended slab'), "Safety explanation for excavation restriction must be present");
assert(src.includes('Removing edge protection creates critical fall hazards'), "Safety explanation for guardrail manual restriction must be present");
assert(src.includes('Working in shaft voids requires exact structural level mapping'), "Safety explanation for shaft manual restriction must be present");
console.log('  ✓ PASS: Explicit safety and operational rationales embedded in UI warnings');

// --- 2. Runtime VM Evaluation ---
console.log('\n--- 2. Runtime State, Logic & Validation Tests ---');

const scriptMatch = src.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, "Must extract script block from index.html");

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

// 2.1 Test Matrix Helper Function
console.log('Testing getAllowedLocationModes helper:');
assert.strictEqual(JSON.stringify(evalInVM("getAllowedLocationModes('excavation')")), JSON.stringify(['Basement/Podium', 'Manual']));
assert.strictEqual(JSON.stringify(evalInVM("getAllowedLocationModes('hotwork')")), JSON.stringify(['Tower', 'Basement/Podium', 'Manual']));
assert.strictEqual(JSON.stringify(evalInVM("getAllowedLocationModes('guardrail')")), JSON.stringify(['Tower', 'Basement/Podium']));
assert.strictEqual(JSON.stringify(evalInVM("getAllowedLocationModes('confined')")), JSON.stringify(['Tower', 'Basement/Podium', 'Manual']));
assert.strictEqual(JSON.stringify(evalInVM("getAllowedLocationModes('shaft')")), JSON.stringify(['Tower', 'Basement/Podium']));
console.log('  ✓ PASS: getAllowedLocationModes returns correct permitted modes for all 5 permit types');

// 2.2 Test Excavation Initial Defaults
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor' };");
evalInVM("startNewPermit('excavation');");
const excDraft = evalInVM("draft");
assert.strictEqual(excDraft.locationStructure, 'Basement/Podium', "Excavation must default to 'Basement/Podium' (not Tower)");
console.log('  ✓ PASS: Excavation default locationStructure is Basement/Podium');

// 2.3 Test UI Rendering for Excavation
const excHtml = evalInVM("renderUniversalOrgAndLocationHtml('')");
assert(excHtml.includes('input type="radio" name="univLocMode" value="Tower" disabled'),
    "Excavation must render Tower radio disabled");
assert(excHtml.includes('Tower &amp; Floor is restricted for Excavation Work (cannot excavate on suspended slab)'),
    "Excavation must include suspended slab restriction title tooltip");
assert(excHtml.includes('value="Basement/Podium" checked'), "Basement/Podium must be checked by default for Excavation");
assert(excHtml.includes('value="Manual"'), "Manual mode must be enabled for Excavation");
console.log('  ✓ PASS: Excavation UI enforces Tower restriction and enables Basement/Podium & Manual');

// 2.4 Test Attempting to select restricted Tower mode for Excavation
toastMessages = [];
evalInVM("onUniversalLocationStructureChange('Tower')");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Basement/Podium',
    "Selecting Tower on Excavation must be rejected and remain Basement/Podium");
const toastStack = getOrCreateElem('toastStack');
assert(toastStack.children.length > 0 || toastMessages.length > 0,
    "Selecting restricted mode must display warning toast");
console.log('  ✓ PASS: Illegal mode switch to Tower on Excavation blocked by event handler');

// 2.5 Test Switching to Manual mode on Excavation
evalInVM("onUniversalLocationStructureChange('Manual')");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Manual', "Must switch to Manual mode");
assert.strictEqual(evalInVM("draft.tower"), 'Manual', "draft.tower set for manual mode display");
console.log('  ✓ PASS: Switching to Manual mode succeeds');

// 2.6 Test Manual Mode Validation in validateWizStep(1)
evalInVM("draft.project = 'Auro Grand Residency';");
// Currently locManual and locManualArea are empty
const valResultEmpty = evalInVM("validateWizStep(1)");
assert.strictEqual(valResultEmpty, false, "Step 1 validation must fail when Manual location fields are empty");

// Set Specific Location only
evalInVM("draft.locManual = 'External drainage trench along East boundary';");
assert.strictEqual(evalInVM("validateWizStep(1)"), false, "Step 1 validation must fail without Area / Grid reference");

// Set Area / Grid reference
evalInVM("draft.locManualArea = 'Grid P12 to P18 near Gate 3';");
evalInVM("draft.depth = '2.0'; draft.slope = '1.0'; draft.equipment = ['Excavator'];");
evalInVM("draft.gps = { lat: 17.424, lng: 78.474, within: true };");
evalInVM("syncUniversalLocation();");
const valResultComplete = evalInVM("validateWizStep(1)");
assert.strictEqual(valResultComplete, true, "Step 1 validation must pass when Manual location fields are complete");
assert(evalInVM("draft.location").includes('External drainage trench along East boundary'),
    "draft.location formatted string must include manual location");
assert(evalInVM("draft.location").includes('Grid P12 to P18 near Gate 3'),
    "draft.location formatted string must include manual area");
console.log('  ✓ PASS: Manual mode fields validated and formatted cleanly into draft.location');

// 2.7 Test Guardrail Restrictions
evalInVM("startNewPermit('guardrail');");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Tower', "Guardrail defaults to Tower");
const grHtml = evalInVM("renderUniversalOrgAndLocationHtml('')");
assert(grHtml.includes('value="Tower" checked'), "Guardrail has Tower checked");
assert(grHtml.includes('value="Basement/Podium"'), "Guardrail has Basement/Podium enabled");
assert(grHtml.includes('input type="radio" name="univLocMode" value="Manual" disabled'),
    "Guardrail must have Manual mode disabled/restricted");
assert(grHtml.includes('Safety Rule (Guardrail Removal):</b> Manual location is restricted'),
    "Guardrail safety banner explains high-risk fall hazard rationale");

toastMessages = [];
evalInVM("onUniversalLocationStructureChange('Manual')");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Tower', "Selecting Manual on Guardrail must be rejected");
console.log('  ✓ PASS: Guardrail restricts Manual entry and enforces Tower / Basement structure');

// 2.8 Test Shaft Work Restrictions
evalInVM("startNewPermit('shaft');");
assert.strictEqual(evalInVM("draft.locationStructure"), 'Tower', "Shaft defaults to Tower");
const shaftHtml = evalInVM("renderUniversalOrgAndLocationHtml('')");
assert(shaftHtml.includes('input type="radio" name="univLocMode" value="Manual" disabled'),
    "Shaft work must have Manual mode disabled/restricted");
assert(shaftHtml.includes('Safety Rule (Shaft Work):</b> Manual location is restricted'),
    "Shaft safety banner explains high-risk void rationale");
console.log('  ✓ PASS: Shaft Work restricts Manual entry and enforces Tower / Basement structure');

// 2.9 Test Hot Work & Confined Space (All 3 modes enabled)
evalInVM("startNewPermit('hotwork');");
const hwHtml = evalInVM("renderUniversalOrgAndLocationHtml('')");
assert(!hwHtml.includes('value="Tower" disabled') && !hwHtml.includes('value="Basement/Podium" disabled') && !hwHtml.includes('value="Manual" disabled'),
    "Hot Work must enable all 3 modes");

evalInVM("startNewPermit('confined');");
const confHtml = evalInVM("renderUniversalOrgAndLocationHtml('')");
assert(!confHtml.includes('value="Tower" disabled') && !confHtml.includes('value="Basement/Podium" disabled') && !confHtml.includes('value="Manual" disabled'),
    "Confined Space must enable all 3 modes");
console.log('  ✓ PASS: Hot Work and Confined Space permit all 3 location modes');

// 2.10 Test Scope Summary / Detail View with Manual Mode
const mockPermitManual = {
    id: 'PTW-001-2026-0099',
    ptype: 'excavation',
    project: 'Auro Grand Residency',
    location: 'Temporary fabrication yard, Area: Grid F2-G4',
    locationStructure: {
        mode: 'manual',
        manualLocation: 'Temporary fabrication yard',
        manualArea: 'Grid F2-G4'
    },
    organization: 'ARPL',
    depth: '1.8',
    slope: '1.2',
    createdBy: 'Supervisor Ram',
    status: 'Active',
    checklist: []
};

context.mockPermitManual = mockPermitManual;
const detailHtml = evalInVM("buildScopeSummaryBoxHtml(mockPermitManual)");
assert(detailHtml.includes('Manual / External'), "Scope summary must display 'Manual / External' mode");
assert(detailHtml.includes('Temporary fabrication yard'), "Scope summary must display manual location");
assert(detailHtml.includes('Grid F2-G4'), "Scope summary must display manual area/grid");
console.log('  ✓ PASS: Scope summary box displays Manual location details accurately');

console.log('\n==================================================');
console.log('ALL LOCATION SELECTION MODE TESTS PASSED CLEANLY (100% PASS RATE)');
console.log('==================================================');
