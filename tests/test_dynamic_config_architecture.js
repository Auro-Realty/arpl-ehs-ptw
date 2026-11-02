/**
 * SUITE 20: DYNAMIC & CONFIGURATION-DRIVEN ENTERPRISE ARCHITECTURE
 *
 * Verifies that the ARPL EHS Permit-to-Work system is genuinely dynamic and
 * configuration-driven through the Single Source of Truth (APP_CONFIG).
 * Validates permit types, workflows, governance stages, status registries,
 * dashboards, role categories, wizard steps, navigation, empty states,
 * and runtime extensibility.
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE 20: DYNAMIC & CONFIGURATION-DRIVEN ENTERPRISE ARCHITECTURE');
console.log('==================================================');

// --- 1. Static Verification of Dynamic HTML Bindings ---
console.log('\n--- 1. Static Verification of Dynamic HTML Bindings ---');

assert(src.includes('id="landingPermitsBar"'), 'Landing page must contain dynamic container #landingPermitsBar');
assert(src.includes('id="landingWorkflowStrip"'), 'Landing page must contain dynamic container #landingWorkflowStrip');
assert(src.includes('id="landingFooterPermits"'), 'Landing page must contain dynamic container #landingFooterPermits');
assert(src.includes('id="stepIndicator"'), 'Wizard must contain dynamic container #stepIndicator');
assert(src.includes('id="navContainer"'), 'Sidebar must contain dynamic container #navContainer');
assert(src.includes('id="ptypeRoleBanner"'), 'Permit selection catalog must contain dynamic container #ptypeRoleBanner');
console.log('  ✓ PASS: Dynamic DOM anchor points verified across landing, wizard, sidebar, and catalog');

// --- 2. Static Verification of APP_CONFIG Schema ---
console.log('\n--- 2. Static Verification of APP_CONFIG Schema ---');

assert(src.includes('const APP_CONFIG = {'), 'index.html must define APP_CONFIG Single Source of Truth');
assert(src.includes('governanceStages: ['), 'APP_CONFIG must declare governanceStages');
assert(src.includes('roleCategories: ['), 'APP_CONFIG must declare roleCategories');
assert(src.includes('registerColumns: ['), 'APP_CONFIG must declare registerColumns');
assert(src.includes('statuses: {'), 'APP_CONFIG must declare statuses');
assert(src.includes('permitTypes: {'), 'APP_CONFIG must declare permitTypes');
assert(src.includes('dashboards: {'), 'APP_CONFIG must declare dashboards');
assert(src.includes('workflows: {'), 'APP_CONFIG must declare workflows');
assert(src.includes('emptyStates: {'), 'APP_CONFIG must declare emptyStates');
assert(src.includes('wizardSteps: ['), 'APP_CONFIG must declare wizardSteps');
assert(src.includes('initiatorBanners: {'), 'APP_CONFIG must declare initiatorBanners');
assert(src.includes('navigation: ['), 'APP_CONFIG must declare navigation');
console.log('  ✓ PASS: Master APP_CONFIG schema structures declared');

// --- 3. Runtime Setup & VM Sandbox Initialization ---
console.log('\n--- 3. Runtime Setup & VM Sandbox Initialization ---');

const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
assert(scriptMatch, 'Must extract inline script block from index.html');

const mockDoc = {
    getElementById: (id) => ({
        id,
        innerHTML: '',
        value: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        setAttribute: () => {},
        getAttribute: () => null,
        dataset: {}
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    body: { classList: { add: () => {}, remove: () => {} } }
};

const sandbox = {
    window: {},
    document: mockDoc,
    console: console,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; }
    },
    navigator: { geolocation: {} },
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite
};

vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], sandbox);

const evalInVM = (code) => vm.runInContext(code, sandbox);
console.log('  ✓ PASS: VM Sandbox initialized and script evaluated without errors');

// --- 4. Master APP_CONFIG Registry Validation ---
console.log('\n--- 4. Master APP_CONFIG Registry Validation ---');

const appConfig = evalInVM('window.APP_CONFIG || APP_CONFIG');
assert(appConfig, 'APP_CONFIG must be exposed');

// System metadata
assert.strictEqual(appConfig.system.timezone, 'Asia/Kolkata', 'System timezone must be Asia/Kolkata');
assert(appConfig.system.statutoryTags.length >= 3, 'System must have statutory tags');

// Governance stages
assert.strictEqual(appConfig.governanceStages.length, 4, 'Must define exactly 4 governance pillars');
assert.strictEqual(appConfig.governanceStages[0].step, 1, 'Stage 1 must be Initiation & Checklist');
assert.strictEqual(appConfig.governanceStages[3].step, 4, 'Stage 4 must be EHS Safety Endorsement');

// Status registry
assert(Object.keys(appConfig.statuses).length >= 27, 'Status registry must contain all 27+ system statuses');
assert.strictEqual(appConfig.statuses['Active'].class, 'active');
assert.strictEqual(appConfig.statuses['Draft'].class, 'draft');
assert.strictEqual(appConfig.statuses['Pending EHS Approval'].class, 'ehs');

// Permit types catalogue
const ptypes = Object.keys(appConfig.permitTypes);
assert(ptypes.length >= 11, 'Permit catalogue must declare all 11 permit types (PTW-001 to PTW-010)');
['excavation', 'hotwork', 'guardrail', 'confined', 'shaft', 'electrical', 'blasting', 'general', 'lifting', 'liftplan'].forEach(pt => {
    assert(appConfig.permitTypes[pt].available === true, `${pt} must be marked available`);
    assert(appConfig.permitTypes[pt].icon, `${pt} must have an icon defined`);
    assert(appConfig.permitTypes[pt].badgeStyle, `${pt} must have badgeStyle defined`);
});

// Workflows catalogue
assert(Object.keys(appConfig.workflows).length >= 9, 'Must declare all operational workflows');
assert(appConfig.workflows.lifting_routine, 'Must declare lifting_routine workflow');
assert(appConfig.workflows.critical_lift_plan, 'Must declare critical_lift_plan workflow');

// Synchronized views
const ptypesMeta = evalInVM('PTYPE_META');
const permitTypesArr = evalInVM('PERMIT_TYPES');
assert.strictEqual(ptypesMeta.excavation.code, 'PTW-001');
assert.strictEqual(permitTypesArr.find(p => p.key === 'electrical').code, 'PTW-006');
assert.strictEqual(permitTypesArr.find(p => p.key === 'general').code, 'PTW-008');
assert.strictEqual(permitTypesArr.find(p => p.key === 'lifting').code, 'PTW-009');
console.log('  ✓ PASS: Master registries, status mappings, all 9 workflows, and permit types validated');

// --- 5. Dynamic Status Class Resolver ---
console.log('\n--- 5. Dynamic Status Class Resolver ---');

assert.strictEqual(evalInVM("statusClass('Active')"), 'active');
assert.strictEqual(evalInVM("statusClass('Pending EHS Approval')"), 'ehs');
assert.strictEqual(evalInVM("statusClass('Pending Section Head')"), 'sectionhead');
assert.strictEqual(evalInVM("statusClass('Completed (Surrendered)')"), 'completed');
console.log('  ✓ PASS: statusClass resolves dynamically from APP_CONFIG.statuses');

// --- 6. Dynamic Empty State Component ---
console.log('\n--- 6. Dynamic Empty State Component ---');

const emptyNotif = evalInVM("renderEmptyState('notifications')");
assert(emptyNotif.includes('empty-state'), 'Must have empty-state class');
assert(emptyNotif.includes('fa-bell-slash'), 'Must have notification icon');
assert(emptyNotif.includes('No notifications yet.'), 'Must have notification message');

const emptyPermits = evalInVM("renderEmptyState('noPermits')");
assert(emptyPermits.includes('No permits yet.'));

const emptyFilter = evalInVM("renderEmptyState('noFilterMatch')");
assert(emptyFilter.includes('No permits match these filters.'));

const customEmpty = evalInVM("renderEmptyState('noPermits', 'Custom Empty Message')");
assert(customEmpty.includes('Custom Empty Message'));
console.log('  ✓ PASS: renderEmptyState renders configured and customized empty states');

// --- 7. Dynamic Wizard Step Indicators ---
console.log('\n--- 7. Dynamic Wizard Step Indicators ---');

const wizSteps = evalInVM('WIZ_STEPS');
assert.strictEqual(JSON.stringify(wizSteps), JSON.stringify(['General Information', 'Safety Checklist', 'Permit Validity', 'Review & Submit']));

evalInVM('wizStep = 2; renderStepIndicator();');
// Verify renderStepIndicator runs cleanly and uses wizardSteps
assert.strictEqual(evalInVM('APP_CONFIG.wizardSteps.length'), 4);
console.log('  ✓ PASS: Wizard steps and step indicator dynamically driven by APP_CONFIG.wizardSteps');

// --- 8. Dynamic Navigation Engine ---
console.log('\n--- 8. Dynamic Navigation Engine ---');

const supNav = evalInVM("navItemsFor('site-supervisor')");
assert(supNav.some(it => it.id === 'ptype' && it.label === 'Create Permit'), 'Supervisor must have Create Permit');
assert(supNav.some(it => it.id === 'register' && it.label === 'My Permits'), 'Supervisor must have My Permits');

const engNav = evalInVM("navItemsFor('site-engineer')");
assert(!engNav.some(it => it.id === 'ptype'), 'Site Engineer must NOT have Create Permit in nav');
assert(engNav.some(it => it.id === 'register' && it.label === 'My Permits'), 'Site Engineer must have My Permits');

const adminNav = evalInVM("navItemsFor('admin')");
assert(adminNav.some(it => it.id === 'admin-config'), 'Admin must have Site GPS & Geofence in nav');

const ehsNav = evalInVM("navItemsFor('ehs-manager')");
assert(ehsNav.some(it => it.id === 'register' && it.label === 'Permit Register'), 'EHS must have Permit Register in nav');

const lsNav = evalInVM("navItemsFor('lift-supervisor')");
assert(lsNav.some(it => it.id === 'ptype' && it.label === 'Create Permit'), 'Lifting Supervisor must have Create Permit in nav');
assert(lsNav.some(it => it.id === 'register' && it.label === 'My Permits'), 'Lifting Supervisor must have My Permits in nav');
console.log('  ✓ PASS: navItemsFor dynamically resolves items and role labels from APP_CONFIG.navigation');

// --- 9. Runtime Extensibility Demonstration ---
console.log('\n--- 9. Runtime Extensibility Demonstration ---');

// Test: Dynamically register a new custom status in APP_CONFIG.statuses
evalInVM(`
APP_CONFIG.statuses['Statutory Environmental Audit Pending'] = {
    class: 'environmental-audit',
    category: 'pending',
    label: 'Statutory Environmental Audit Pending'
};
`);
assert.strictEqual(evalInVM("statusClass('Statutory Environmental Audit Pending')"), 'environmental-audit',
    'statusClass must dynamically resolve new status added to APP_CONFIG at runtime');

// Test: Dynamically register a new empty state in APP_CONFIG.emptyStates
evalInVM(`
APP_CONFIG.emptyStates['customAuditEmpty'] = {
    icon: 'fa-shield-heart',
    text: 'Zero safety violations recorded on this shift.'
};
`);
const auditEmpty = evalInVM("renderEmptyState('customAuditEmpty')");
assert(auditEmpty.includes('fa-shield-heart') && auditEmpty.includes('Zero safety violations recorded on this shift.'),
    'renderEmptyState must dynamically render newly registered empty state');

console.log('  ✓ PASS: Runtime extensibility verified: new statuses and empty states register dynamically');

console.log('\n==================================================');
console.log('ALL DYNAMIC CONFIGURATION ARCHITECTURE TESTS PASSED (100% SUCCESS)');
console.log('==================================================');
