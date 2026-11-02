const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('TEST SUITE 10: PERMIT REGISTER COMMON HEADING, ACTORS & APPROVAL-FLOW VISIBILITY');
console.log('==================================================');

// --- 1. Static Verification of UI & Metadata ---
console.log('\n--- 1. Static Verification of UI Elements & Metadata ---');

// Check common heading in HTML
assert(src.includes('<h1 id="registerTitle"><i class="fa-solid fa-table-list"></i> Permit Register</h1>'),
    "HTML registerTitle must be '<i class=\"fa-solid fa-table-list\"></i> Permit Register'");
assert(src.includes('<p id="registerSub">Digital safety authorization &amp; permit-to-work tracking register</p>') ||
    src.includes('<p id="registerSub">Digital safety authorization & permit-to-work tracking register</p>'),
    "HTML registerSub must be standardized");

// Check electrical option in regTypeFilter
assert(src.includes('<option value="electrical">Electrical Work (PTW-006)</option>'),
    "regTypeFilter must include Electrical Work (PTW-006)");

// Check PTYPE_META for blasting has Tower Incharge as Section Head
assert(src.includes("blasting: { key: 'blasting', code: 'PTW-007', name: 'Drilling and Blasting', short: 'Drilling & Blasting', prefix: 'PTW-007', form: 'PTW-007', sh: 'hw-section-head', shLabel: 'Tower Incharge' }"),
    "PTYPE_META.blasting must have sh: 'hw-section-head' and shLabel: 'Tower Incharge'");

console.log('  ✓ PASS: Static UI headings, filter options, and PTW-007 Section Head metadata verified');

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
    console: console,
    setTimeout: (fn) => fn(),
    setInterval: () => {},
    clearInterval: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    navigator: { geolocation: {} },
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    showToast: (msg, type) => { toastMessages.push({ msg, type }); },
    jspdf: { jsPDF: class { constructor() {} } }
};

sandbox.toastMessages = [];
mockWindow.toastMessages = sandbox.toastMessages;

vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], sandbox);

function evalInVM(code) {
    return vm.runInContext(code, sandbox);
}

evalInVM("showToast = (msg, type) => { window.toastMessages.push({ msg, type }); };");

console.log('  ✓ PASS: VM Sandbox initialized successfully');

// --- 3. Verification of Common Permit Register Heading Across All Roles ---
console.log('\n--- 3. Common Permit Register Heading Across All Roles ---');

const allRoles = evalInVM("ROLES").map(r => r.key);
assert(allRoles.length >= 12, "System must configure all project roles");

allRoles.forEach(roleKey => {
    evalInVM(`currentUser = { key: '${roleKey}', name: 'Test User', label: '${roleKey}' };`);
    evalInVM("buildRegisterFilters();");

    const heading = domElements.get('registerTitle').innerHTML;
    const sub = domElements.get('registerSub').textContent;

    assert(heading.includes('Permit Register') && heading.includes('fa-table-list'),
        `Role ${roleKey} must see '<i class="fa-solid fa-table-list"></i> Permit Register', got: ${heading}`);
    assert(!heading.includes('My Permits (Supervisor)') && !heading.includes('Site Permits'),
        `Role ${roleKey} must not see role-divergent register heading`);
    assert(sub.includes('Digital safety authorization'),
        `Role ${roleKey} must see common subtitle, got: ${sub}`);
});
console.log(`  ✓ PASS: All ${allRoles.length} roles display identical "Permit Register" heading & subtitle`);

// --- 4. Section Head & Requested By Verification Across All Permit Types ---
console.log('\n--- 4. Section Head & Requested By Actor Flow Rules ---');

const mockPermits = {
    excavation: { id: 'TEST-EXC', ptype: 'excavation', createdBy: 'Supervisor Ramesh', createdRoleKey: 'site-supervisor' },
    hotwork: { id: 'TEST-HW', ptype: 'hotwork', createdBy: 'Supervisor Ramesh', createdRoleKey: 'site-supervisor' },
    guardrail: { id: 'TEST-GR', ptype: 'guardrail', createdBy: 'Supervisor Ramesh', createdRoleKey: 'site-supervisor' },
    confined: { id: 'TEST-CS', ptype: 'confined', createdBy: 'Supervisor Ramesh', createdRoleKey: 'site-supervisor' },
    shaft: { id: 'TEST-SW', ptype: 'shaft', createdBy: 'Supervisor Ramesh', createdRoleKey: 'site-supervisor' },
    electricalSite: { id: 'TEST-EW-SITE', ptype: 'electrical', electricalSiteType: 'site', facilityScope: 'site', createdBy: 'Electrician Ali', createdRoleKey: 'electrician' },
    electricalBatching: { id: 'TEST-EW-BP', ptype: 'electrical', electricalSiteType: 'batching_plant', facilityScope: 'batching_plant', createdBy: 'Electrician Ali', createdRoleKey: 'electrician' },
    blasting: { id: 'TEST-DB', ptype: 'blasting', status: 'Active', createdBy: 'PESO Blaster Khan', createdRoleKey: 'blasting-incharge', checklist: [] }
};

// Test Excavation
sandbox.p = mockPermits.excavation;
assert.strictEqual(evalInVM("requestedByLabelFor(p)"), 'Site Supervisor', "Excavation Requested By must be Site Supervisor");
assert.strictEqual(evalInVM("shLabelFor(p)"), 'Excavation Head', "Excavation Section Head must be Excavation Head");
assert.strictEqual(evalInVM("shRoleFor(p)"), 'excavation-head', "Excavation Section Head role must be excavation-head");

// Test Hot Work, Guard Rail, Confined Space, Shaft Work
['hotwork', 'guardrail', 'confined', 'shaft'].forEach(pt => {
    sandbox.p = mockPermits[pt];
    assert.strictEqual(evalInVM("requestedByLabelFor(p)"), 'Site Supervisor', `${pt} Requested By must be Site Supervisor`);
    assert.strictEqual(evalInVM("shLabelFor(p)"), 'Tower Incharge', `${pt} Section Head must be Tower Incharge`);
    assert.strictEqual(evalInVM("shRoleFor(p)"), 'hw-section-head', `${pt} Section Head role must be hw-section-head`);
});

// Test Electrical Work (Site)
sandbox.p = mockPermits.electricalSite;
assert.strictEqual(evalInVM("requestedByLabelFor(p)"), 'Electrician', "Site Electrical Requested By must be Electrician");
assert.strictEqual(evalInVM("shLabelFor(p)"), 'Tower Incharge', "Site Electrical Section Head must be Tower Incharge");
assert.strictEqual(evalInVM("shRoleFor(p)"), 'hw-section-head', "Site Electrical Section Head role must be hw-section-head");

// Test Electrical Work (Batching Plant)
sandbox.p = mockPermits.electricalBatching;
assert.strictEqual(evalInVM("requestedByLabelFor(p)"), 'Electrician', "Batching Plant Electrical Requested By must be Electrician");
assert.strictEqual(evalInVM("shLabelFor(p)"), 'Quality Engineer', "Batching Plant Electrical Section Head must be Quality Engineer");
assert.strictEqual(evalInVM("shRoleFor(p)"), 'quality-engineer', "Batching Plant Electrical Section Head role must be quality-engineer");

// Test Drilling & Blasting
sandbox.p = mockPermits.blasting;
assert.strictEqual(evalInVM("requestedByLabelFor(p)"), 'Blasting In-charge', "Drilling & Blasting Requested By must be Blasting In-charge");
assert.strictEqual(evalInVM("shLabelFor(p)"), 'Tower Incharge', "Drilling & Blasting Section Head must be Tower Incharge");
assert.strictEqual(evalInVM("shRoleFor(p)"), 'hw-section-head', "Drilling & Blasting Section Head role must be hw-section-head");

console.log('  ✓ PASS: Statutory Requested By and Section Head actor rules strictly verified across all 7 permit types');

// --- 5. Approval-Flow Visibility Matrix ---
console.log('\n--- 5. Approval-Flow Visibility Matrix Enforcement ---');

// Check stakeholdersFor for each permit
sandbox.p = mockPermits.excavation;
const excFlow = evalInVM("stakeholdersFor(p)");
assert(excFlow.includes('site-supervisor') && excFlow.includes('site-engineer') && excFlow.includes('mep') && excFlow.includes('pm') && excFlow.includes('it') && excFlow.includes('excavation-head') && excFlow.includes('ehs-manager'));
assert(!excFlow.includes('electrician') && !excFlow.includes('blasting-incharge') && !excFlow.includes('quality-engineer') && !excFlow.includes('hw-section-head'));

sandbox.p = mockPermits.electricalBatching;
const bpElecFlow = evalInVM("stakeholdersFor(p)");
assert(bpElecFlow.includes('electrician') && bpElecFlow.includes('pm') && bpElecFlow.includes('quality-engineer') && bpElecFlow.includes('ehs-manager'));
assert(!bpElecFlow.includes('site-supervisor') && !bpElecFlow.includes('site-engineer') && !bpElecFlow.includes('mep') && !bpElecFlow.includes('excavation-head') && !bpElecFlow.includes('hw-section-head') && !bpElecFlow.includes('blasting-incharge'));

sandbox.p = mockPermits.electricalSite;
const siteElecFlow = evalInVM("stakeholdersFor(p)");
assert(siteElecFlow.includes('electrician') && siteElecFlow.includes('site-engineer') && siteElecFlow.includes('mep') && siteElecFlow.includes('pm') && siteElecFlow.includes('hw-section-head') && siteElecFlow.includes('ehs-manager'));
assert(!siteElecFlow.includes('site-supervisor') && !siteElecFlow.includes('quality-engineer') && !siteElecFlow.includes('excavation-head') && !siteElecFlow.includes('blasting-incharge'));

sandbox.p = mockPermits.blasting;
const blastFlow = evalInVM("stakeholdersFor(p)");
assert(blastFlow.includes('blasting-incharge') && blastFlow.includes('site-engineer') && blastFlow.includes('hw-section-head') && blastFlow.includes('ehs-manager'));
assert(!blastFlow.includes('site-supervisor') && !blastFlow.includes('electrician') && !blastFlow.includes('quality-engineer') && !blastFlow.includes('excavation-head') && !blastFlow.includes('mep') && !blastFlow.includes('pm'));

// Role visibility checks using isPermitVisibleToRole
// Site Supervisor visibility
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'site-supervisor')"), false, "Blasting permit must NOT be visible to Site Supervisor");
sandbox.p = mockPermits.electricalBatching;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'site-supervisor')"), false, "Batching Plant Electrical permit must NOT be visible to Site Supervisor");
sandbox.p = mockPermits.electricalSite;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'site-supervisor')"), false, "Site Electrical permit must NOT be visible to Site Supervisor");
sandbox.p = mockPermits.excavation;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'site-supervisor')"), true, "Excavation permit MUST be visible to Site Supervisor");
sandbox.p = mockPermits.hotwork;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'site-supervisor')"), true, "Hot Work permit MUST be visible to Site Supervisor");

// Electrician visibility
sandbox.p = mockPermits.electricalBatching;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'electrician')"), true, "Electrical permit MUST be visible to Electrician");
sandbox.p = mockPermits.excavation;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'electrician')"), false, "Excavation permit must NOT be visible to Electrician");
sandbox.p = mockPermits.blasting;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'electrician')"), false, "Blasting permit must NOT be visible to Electrician");

// Blasting In-charge visibility
sandbox.p = mockPermits.blasting;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'blasting-incharge')"), true, "Blasting permit MUST be visible to Blasting In-charge");
sandbox.p = mockPermits.electricalSite;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'blasting-incharge')"), false, "Electrical permit must NOT be visible to Blasting In-charge");
sandbox.p = mockPermits.excavation;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'blasting-incharge')"), false, "Excavation permit must NOT be visible to Blasting In-charge");

// Quality Engineer visibility
sandbox.p = mockPermits.electricalBatching;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'quality-engineer')"), true, "Batching Plant Electrical permit MUST be visible to Quality Engineer");
sandbox.p = mockPermits.electricalSite;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'quality-engineer')"), false, "Site Electrical permit must NOT be visible to Quality Engineer");
sandbox.p = mockPermits.excavation;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'quality-engineer')"), false, "Excavation permit must NOT be visible to Quality Engineer");

// Tower Incharge visibility
sandbox.p = mockPermits.blasting;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'hw-section-head')"), true, "Blasting permit MUST be visible to Tower Incharge (Section Head)");
sandbox.p = mockPermits.electricalSite;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'hw-section-head')"), true, "Site Electrical permit MUST be visible to Tower Incharge");
sandbox.p = mockPermits.electricalBatching;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'hw-section-head')"), false, "Batching Plant Electrical must NOT be visible to Tower Incharge");
sandbox.p = mockPermits.excavation;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'hw-section-head')"), false, "Excavation permit must NOT be visible to Tower Incharge");

// Excavation Head visibility
sandbox.p = mockPermits.excavation;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'excavation-head')"), true, "Excavation permit MUST be visible to Excavation Head");
sandbox.p = mockPermits.blasting;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'excavation-head')"), false, "Blasting permit must NOT be visible to Excavation Head");
sandbox.p = mockPermits.hotwork;
assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'excavation-head')"), false, "Hot Work permit must NOT be visible to Excavation Head");

// Admin visibility
Object.keys(mockPermits).forEach(k => {
    sandbox.p = mockPermits[k];
    assert.strictEqual(evalInVM("isPermitVisibleToRole(p, 'admin')"), true, `Permit ${k} MUST be visible to admin`);
});

console.log('  ✓ PASS: Complete approval-flow role visibility matrix verified');

// --- 6. Table Rendering & Column Verification ---
console.log('\n--- 6. Table Rendering & Columns Verification ---');

// Populate test permits into PERMITS
evalInVM("PERMITS = [];");
const testList = Object.values(mockPermits);
testList.forEach(p => {
    evalInVM(`PERMITS.push(${JSON.stringify(p)});`);
});

// Build register as Admin
evalInVM("currentUser = { key: 'admin', name: 'Super Admin', label: 'Administrator' };");
evalInVM("document.getElementById('regSearch').value = '';");
evalInVM("document.getElementById('regStatusFilter').value = '';");
evalInVM("document.getElementById('regProjectFilter').value = '';");
evalInVM("document.getElementById('regTypeFilter').value = '';");
evalInVM("buildRegisterTable();");

const adminHtml = domElements.get('registerTbody').innerHTML;
assert(adminHtml.includes('TEST-EXC') && adminHtml.includes('TEST-HW') && adminHtml.includes('TEST-EW-BP') && adminHtml.includes('TEST-DB'),
    "Admin must see all permits in table");
assert(adminHtml.includes('Excavation Head'), "Section Head column must render Excavation Head");
assert(adminHtml.includes('Tower Incharge'), "Section Head column must render Tower Incharge");
assert(adminHtml.includes('Quality Engineer'), "Section Head column must render Quality Engineer");
assert(adminHtml.includes('Electrician'), "Requested By column must render Electrician");
assert(adminHtml.includes('Blasting In-charge'), "Requested By column must render Blasting In-charge");
assert(adminHtml.includes('Site Supervisor'), "Requested By column must render Site Supervisor");

// Build register as Site Supervisor
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ramesh', label: 'Site Supervisor' };");
evalInVM("buildRegisterTable();");
const supHtml = domElements.get('registerTbody').innerHTML;
assert(supHtml.includes('TEST-EXC') && supHtml.includes('TEST-HW'), "Site Supervisor must see excavation & hot work");
assert(!supHtml.includes('TEST-EW-BP') && !supHtml.includes('TEST-EW-SITE'), "Site Supervisor must NOT see electrical permits");
assert(!supHtml.includes('TEST-DB'), "Site Supervisor must NOT see drilling & blasting permits");

// Build register as Electrician
evalInVM("currentUser = { key: 'electrician', name: 'Electrician Ali', label: 'Electrician' };");
evalInVM("buildRegisterTable();");
const elecHtml = domElements.get('registerTbody').innerHTML;
assert(elecHtml.includes('TEST-EW-BP') && elecHtml.includes('TEST-EW-SITE'), "Electrician must see electrical permits");
assert(!elecHtml.includes('TEST-EXC') && !elecHtml.includes('TEST-HW') && !elecHtml.includes('TEST-DB'),
    "Electrician must NOT see excavation, hot work, or blasting permits");

// Build register as Blasting In-charge
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', label: 'Blasting In-charge' };");
evalInVM("buildRegisterTable();");
const blastHtml = domElements.get('registerTbody').innerHTML;
assert(blastHtml.includes('TEST-DB'), "Blasting In-charge must see drilling & blasting permit");
assert(!blastHtml.includes('TEST-EXC') && !blastHtml.includes('TEST-EW-BP'),
    "Blasting In-charge must NOT see excavation or electrical permits");

// Build register as Quality Engineer
evalInVM("currentUser = { key: 'quality-engineer', name: 'Lead QE Rao', label: 'Quality Engineer' };");
evalInVM("buildRegisterTable();");
const qeHtml = domElements.get('registerTbody').innerHTML;
assert(qeHtml.includes('TEST-EW-BP'), "Quality Engineer must see Batching Plant electrical permit");
assert(!qeHtml.includes('TEST-EW-SITE'), "Quality Engineer must NOT see Site electrical permit");
assert(!qeHtml.includes('TEST-EXC') && !qeHtml.includes('TEST-DB'), "Quality Engineer must NOT see excavation or blasting permits");

// Build register as Tower Incharge
evalInVM("currentUser = { key: 'hw-section-head', name: 'Incharge Sharma', label: 'Tower Incharge' };");
evalInVM("buildRegisterTable();");
const tiHtml = domElements.get('registerTbody').innerHTML;
assert(tiHtml.includes('TEST-HW') && tiHtml.includes('TEST-EW-SITE') && tiHtml.includes('TEST-DB'),
    "Tower Incharge must see hot work, site electrical, and drilling & blasting");
assert(!tiHtml.includes('TEST-EXC'), "Tower Incharge must NOT see excavation");
assert(!tiHtml.includes('TEST-EW-BP'), "Tower Incharge must NOT see batching plant electrical");

console.log('  ✓ PASS: Table rendering strictly verifies actor labels and flow-based isolation for all roles');

// --- 7. Detail View Access Gate Verification ---
console.log('\n--- 7. Detail View Flow-Based Access Gate ---');

sandbox.toastMessages.length = 0;
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ramesh', label: 'Site Supervisor' };");
evalInVM("viewDetail('TEST-EW-BP', false, true);");
assert(sandbox.toastMessages.some(t => t.msg.includes('outside your approval flow domain')),
    "Site Supervisor opening Batching Plant electrical permit must be blocked with restriction toast");

sandbox.toastMessages.length = 0;
evalInVM("currentUser = { key: 'electrician', name: 'Electrician Ali', label: 'Electrician' };");
evalInVM("viewDetail('TEST-EXC', false, true);");
assert(sandbox.toastMessages.some(t => t.msg.includes('outside your approval flow domain')),
    "Electrician opening Excavation permit must be blocked with restriction toast");

sandbox.toastMessages.length = 0;
evalInVM("currentUser = { key: 'blasting-incharge', name: 'PESO Blaster Khan', label: 'Blasting In-charge' };");
evalInVM("viewDetail('TEST-DB', false, true);");
assert(!sandbox.toastMessages.some(t => t.msg.includes('outside your approval flow domain')),
    "Blasting In-charge opening Blasting permit must succeed without restriction toast");

console.log('  ✓ PASS: Detail view access gate strictly enforces workflow approval permissions');

console.log('\n==================================================');
console.log('ALL PERMIT REGISTER HEADING, ACTOR & VISIBILITY TESTS PASSED (100% SUCCESS RATE)');
console.log('==================================================');
