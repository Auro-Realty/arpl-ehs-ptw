/**
 * Suite 26: Permit-Specific Master Data & Unified Contractor/Subcontractor Manual Entry
 * Tests compliance for:
 * 1. Excavation Equipment (JCB, Excavator, Dumper, Tipper, Tractor, Trolley, Others)
 * 2. Confined Space Activity (Batching plant mixer drum cleaning single-select)
 * 3. Drilling (removal of rock drills) & Blasting (removal of slurry explosives)
 * 4. Lifting Work (Primary & Rigging gears: Wire rope sling, hook chook, winch; Comms: Blinker, flags, whistles)
 * 5. Single Unified Contractor / Subcontractor Manual Field (No Dropdown / Datalist)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('==================================================');
console.log('SUITE 26: PERMIT-SPECIFIC MASTER DATA & MANUAL CONTRACTOR ENTRY');
console.log('==================================================');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// --- 1. Static Verification of Master Data Constants ---
console.log('\n--- 1. Static Verification of Master Data Constants ---');

// Excavation Equipment
assert(src.includes("const EQUIPMENT_OPTIONS = ['JCB', 'Excavator', 'Dumper', 'Tipper', 'Tractor', 'Trolley', 'Others'];"),
    "EQUIPMENT_OPTIONS must match exact specification");
assert(!src.includes("'Hydra', 'Poclain'"), "EQUIPMENT_OPTIONS must not contain legacy Hydra or Poclain");
assert(!src.includes("'Manual Excavation'"), "EQUIPMENT_OPTIONS must not contain legacy Manual Excavation");
console.log('  ✓ PASS: PTW-001 Excavation Equipment master data verified (JCB, Excavator, Dumper, Tipper, Tractor, Trolley, Others)');

// Confined Space Activity
assert(src.includes("'Batching plant mixer drum cleaning'"),
    "CONFINED_ACTIVITIES must include Batching plant mixer drum cleaning");
console.log('  ✓ PASS: PTW-004 Confined Space includes Batching plant mixer drum cleaning');

// Blasting Explosives & Drilling Machines
const blastingSlurryMatch = src.match(/const BLASTING_EXPLOSIVE_TYPES = \[([\s\S]*?)\];/);
assert(blastingSlurryMatch, "BLASTING_EXPLOSIVE_TYPES constant must be defined");
assert(!blastingSlurryMatch[1].toLowerCase().includes('slurry'),
    "BLASTING_EXPLOSIVE_TYPES must have all slurry explosives removed");

const drillingRockDrillMatch = src.match(/const DRILLING_MACHINE_TYPES = \[([\s\S]*?)\];/);
assert(drillingRockDrillMatch, "DRILLING_MACHINE_TYPES constant must be defined");
assert(!drillingRockDrillMatch[1].toLowerCase().includes('rock drill'),
    "DRILLING_MACHINE_TYPES must have all rock drills removed");
console.log('  ✓ PASS: PTW-007 Drilling & Blasting verified (rock drills & slurry explosives removed)');

// Lifting Gear & Communications
const liftingGearsMatch = src.match(/const LIFTING_GEAR_TYPES = \[([\s\S]*?)\];/);
assert(liftingGearsMatch, "LIFTING_GEAR_TYPES constant must be defined");
assert(liftingGearsMatch[1].includes("'Wire Rope Sling'"), "LIFTING_GEAR_TYPES must include Wire Rope Sling");
assert(liftingGearsMatch[1].includes("'Hook Chook'"), "LIFTING_GEAR_TYPES must include Hook Chook");
assert(liftingGearsMatch[1].includes("'Winch'"), "LIFTING_GEAR_TYPES must include Winch");

const liftingCommsMatch = src.match(/const LIFTING_COMMUNICATION_METHODS = \[([\s\S]*?)\];/);
assert(liftingCommsMatch, "LIFTING_COMMUNICATION_METHODS constant must be defined");
assert(liftingCommsMatch[1].includes("'Blinker'"), "LIFTING_COMMUNICATION_METHODS must include Blinker");
assert(liftingCommsMatch[1].includes("'Flags'"), "LIFTING_COMMUNICATION_METHODS must include Flags");
assert(liftingCommsMatch[1].includes("'Whistles'"), "LIFTING_COMMUNICATION_METHODS must include Whistles");
console.log('  ✓ PASS: PTW-009A/B Lifting Gears (Wire rope sling, Hook Chook, Winch) & Comms (Blinker, Flags, Whistles) verified');

// Single Unified Contractor / Subcontractor Field (Manual Entry, No Dropdown)
assert(src.includes('> Contractor / Subcontractor</label>'), "Universal Org must render unified 'Contractor / Subcontractor' radio option");
assert(src.includes('Enter Contractor or Subcontractor agency / company name...'), "Must render manual text placeholder");
assert(src.includes('Manual text entry for Contractor / Subcontractor name (no dropdown required)'), "Must declare manual text entry without dropdown");
assert(!src.includes('list="contractorDatalist"'), "inContractor input must NOT have list attribute (manual entry only)");
console.log('  ✓ PASS: Unified Contractor / Subcontractor field is a single manual text box (no dropdown required)');

// --- 2. Runtime Evaluation in Sandbox ---
console.log('\n--- 2. Runtime Sandbox Evaluation ---');

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

const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
assert(scriptMatch, "Must extract main script from index.html");

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
    showToast: () => {}
};

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(code) {
    return vm.runInContext(code, context);
}

evalInVM("window.__TEST_MODE__ = true;");
console.log('  ✓ PASS: Script evaluated without runtime errors');

// --- 3. Functional Invariant Checks ---
console.log('\n--- 3. Functional Invariant Checks ---');

// Excavation equipment array
const vmEquip = evalInVM("EQUIPMENT_OPTIONS");
assert.deepStrictEqual(JSON.parse(JSON.stringify(vmEquip)), ['JCB', 'Excavator', 'Dumper', 'Tipper', 'Tractor', 'Trolley', 'Others'],
    "EQUIPMENT_OPTIONS in VM must match exact updated list");
console.log('  ✓ PASS: VM EQUIPMENT_OPTIONS evaluated accurately');

// Confined Space activity list
const vmConfined = evalInVM("CONFINED_ACTIVITIES");
assert(vmConfined.includes('Batching plant mixer drum cleaning'),
    "CONFINED_ACTIVITIES must include Batching plant mixer drum cleaning");
console.log('  ✓ PASS: VM CONFINED_ACTIVITIES includes Batching plant mixer drum cleaning');

// Lifting Gear array
const vmLiftingGear = evalInVM("LIFTING_GEAR_TYPES");
assert(vmLiftingGear.includes('Wire Rope Sling'), "Must contain Wire Rope Sling");
assert(vmLiftingGear.includes('Hook Chook'), "Must contain Hook Chook");
assert(vmLiftingGear.includes('Winch'), "Must contain Winch");
console.log('  ✓ PASS: VM LIFTING_GEAR_TYPES includes Wire Rope Sling, Hook Chook, Winch');

// Single Unified Contractor/Subcontractor validation in Step 1
evalInVM(`
    currentUser = { key: 'site-supervisor', name: 'Supervisor Dave', role: 'Site Supervisor' };
    startNewPermit('excavation');
    draft.project = PROJECTS[0].name;
    draft.locationStructure = 'Basement/Podium';
    draft.locBasementPodium = 'Basement Level 2';
    draft.locArea = 'Zone 2 East';
    draft.workerCount = 8;
    draft.validFrom = '2026-09-10';
    draft.startTime = '08:30';
    draft.validTill = '2026-09-10T17:30';
    draft.depth = '3.5';
    draft.slope = '1.5';
    draft.equipment = ['JCB', 'Dumper'];
    draft.gps = { lat: 12.97, lng: 77.59, within: true };
    draft.organization = 'Contractor';
    draft.contractor = '';
`);

const validWithoutName = evalInVM("validateWizStep(1)");
assert.strictEqual(validWithoutName, false, "Step 1 must fail if Contractor / Subcontractor has no agency name");

evalInVM("draft.contractor = 'Reliable Deep Earthworks LLP';");
const validWithName = evalInVM("validateWizStep(1)");
assert.strictEqual(validWithName, true, "Step 1 must pass with Contractor / Subcontractor manual name and complete details");
console.log('  ✓ PASS: Unified Contractor / Subcontractor manual text entry validation verified');

// Universal Org HTML renders single manual textbox without dropdown
evalInVM("draft.organization = 'Contractor';");
const orgHtml = evalInVM("renderUniversalOrgAndLocationHtml('')");
assert(orgHtml.includes('Contractor / Subcontractor Agency Name'), "Must render Contractor / Subcontractor label");
assert(orgHtml.includes('Enter Contractor or Subcontractor agency / company name...'), "Must render manual textbox");
assert(!orgHtml.includes('list="contractorDatalist"'), "Must NOT bind input to datalist (pure manual entry)");
console.log('  ✓ PASS: renderUniversalOrgAndLocationHtml renders one manual field with no dropdown');

console.log('\n==================================================');
console.log('ALL SUITE 26 MASTER DATA & MANUAL CONTRACTOR TESTS PASSED (100% SUCCESS)');
console.log('==================================================');
