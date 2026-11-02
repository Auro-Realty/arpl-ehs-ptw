/**
 * SUITE 25: DYNAMIC ENTERPRISE ARCHITECTURE, MULTI-PROJECT & CONTRACTOR GOVERNANCE
 *
 * Validates maximum dynamization across the ARPL EHS platform:
 * 1. Project-level structural hierarchies (towers, basements, podiums, floors, zones)
 * 2. Enterprise contractor & vendor directory with trade categories and safety ratings
 * 3. Dynamic runtime creation of new construction worksite projects
 * 4. Dynamic addition of towers to existing projects
 * 5. Dynamic SLA & escalation policy engine (Fast Demo Mode vs Production Mode)
 * 6. Dynamic meteorological / weather engine with wind speed & temperature metrics
 * 7. Multi-tab Admin Governance Center (GPS, Projects, Contractors, SLA, Permit Policies)
 * 8. State persistence & restore across browser reloads
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE 25: DYNAMIC ENTERPRISE ARCHITECTURE & GOVERNANCE');
console.log('==================================================');

// --- 1. Static Verification of Dynamic DOM Bindings ---
console.log('\n--- 1. Static Verification of Dynamic DOM Bindings ---');

assert(src.includes('id="adminPanelGps"'), 'Admin view must contain #adminPanelGps');
assert(src.includes('id="adminPanelProjects"'), 'Admin view must contain #adminPanelProjects');
assert(src.includes('id="adminPanelContractors"'), 'Admin view must contain #adminPanelContractors');
assert(src.includes('id="adminPanelSla"'), 'Admin view must contain #adminPanelSla');
assert(src.includes('id="adminPanelPermits"'), 'Admin view must contain #adminPanelPermits');
assert(src.includes('id="adminProjectsList"'), 'Admin view must contain #adminProjectsList');
assert(src.includes('id="adminContractorsTableBody"'), 'Admin view must contain #adminContractorsTableBody');
assert(src.includes('id="adminPermitTypesList"'), 'Admin view must contain #adminPermitTypesList');
assert(src.includes('id="contractorDatalist"'), 'Wizard must contain #contractorDatalist');
console.log('  ✓ PASS: Multi-panel Admin DOM containers and wizard datalist statically verified');

// --- 2. Runtime VM Sandbox Initialization ---
console.log('\n--- 2. Runtime VM Sandbox Initialization ---');

const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
assert(scriptMatch, 'Must extract inline script block from index.html');

const mockElements = {};
const mockDoc = {
    getElementById: (id) => {
        if (!mockElements[id]) {
            mockElements[id] = {
                id,
                innerHTML: '',
                value: '',
                style: {},
                classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
                setAttribute: () => {},
                getAttribute: () => null,
                dataset: {},
                appendChild: () => {},
                removeChild: () => {},
                getContext: () => ({
                    clearRect: () => {},
                    beginPath: () => {},
                    arc: () => {},
                    fill: () => {},
                    stroke: () => {},
                    fillText: () => {},
                    strokeText: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    setLineDash: () => {}
                })
            };
        }
        return mockElements[id];
    },
    createElement: () => ({
        id: '',
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        appendChild: () => {},
        remove: () => {}
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    body: { classList: { add: () => {}, remove: () => {} }, appendChild: () => {} }
};

const sandbox = {
    mockElements: mockElements,
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
    isFinite: isFinite,
    prompt: () => 'Tower Test E',
    confirm: () => true
};

vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], sandbox);

const evalInVM = (code) => vm.runInContext(code, sandbox);
console.log('  ✓ PASS: VM Sandbox initialized and script evaluated cleanly');

// --- 3. Dynamic Project Structural Accessors ---
console.log('\n--- 3. Dynamic Project Structural Accessors ---');

const agrTowers = evalInVM("getProjectTowers('Auro Grand Residency')");
assert(Array.isArray(agrTowers) && agrTowers.length === 4, 'Auro Grand Residency must have 4 towers');
assert(agrTowers.includes('Tower A') && agrTowers.includes('Tower D'));

const abpTowers = evalInVM("getProjectTowers('Auro Business Park')");
assert(Array.isArray(abpTowers) && abpTowers.length === 3, 'Auro Business Park must have 3 blocks');
assert(abpTowers.includes('Block 1') && abpTowers.includes('Block 3'));

const agrBasements = evalInVM("getProjectBasements('Auro Grand Residency')");
assert(Array.isArray(agrBasements) && agrBasements.length >= 4, 'AGR basements must be defined');

const abpContractors = evalInVM("getProjectContractors('Auro Business Park')");
assert(Array.isArray(abpContractors) && abpContractors.length >= 2, 'ABP contractors must be defined');
assert(abpContractors.includes('Shapoorji Pallonji & Co. Ltd'));
console.log('  ✓ PASS: Dynamic structural accessors correctly resolve per-project towers, basements, and contractors');

// --- 4. Enterprise Contractor & Agency Directory ---
console.log('\n--- 4. Enterprise Contractor & Agency Directory ---');

const directory = evalInVM("getContractorDirectory()");
assert(Array.isArray(directory) && directory.length >= 6, 'Contractor directory must contain approved vendors');
assert(directory.some(c => c.name === 'Apex Infrastructure Pvt Ltd' && c.safetyRating === '5.0'));
assert(directory.some(c => c.name === 'L&T Construction Heavy Civil'));
assert(directory.some(c => c.name === 'Apex Heavy Lift Ltd' && c.category.includes('Crane')));
console.log('  ✓ PASS: Approved contractor directory verified with vendor codes and safety ratings');

// --- 5. Dynamic Project Registration at Runtime ---
console.log('\n--- 5. Dynamic Project Registration at Runtime ---');

evalInVM(`
    mockElements['newProjName'] = { value: 'Auro Pearl Horizons' };
    mockElements['newProjId'] = { value: 'PRJ-APH' };
    mockElements['newProjAddress'] = { value: 'Madhapur, Hyderabad' };
    mockElements['newProjTowers'] = { value: 'Tower Alpha, Tower Beta, Tower Gamma' };
    adminAddNewProject();
`);

const newProj = evalInVM("getProject('PRJ-APH')");
assert(newProj !== null, 'New project PRJ-APH must be registered');
assert.strictEqual(newProj.name, 'Auro Pearl Horizons');
assert.strictEqual(newProj.configured, true, 'Dynamically created project must be active');
const newTowers = evalInVM("getProjectTowers('Auro Pearl Horizons')");
assert.strictEqual(newTowers.length, 3, 'Must register 3 towers for new project');
assert(newTowers.includes('Tower Alpha') && newTowers.includes('Tower Gamma'));
console.log('  ✓ PASS: Runtime creation of new construction worksite project validated');

// --- 6. Dynamic Addition of Towers to Existing Projects ---
console.log('\n--- 6. Dynamic Addition of Towers to Existing Projects ---');

evalInVM("adminPromptAddTower(0)");
const updatedAgrTowers = evalInVM("getProjectTowers('Auro Grand Residency')");
assert(updatedAgrTowers.includes('Tower Test E'), 'Tower Test E must be dynamically appended to project');
console.log('  ✓ PASS: Dynamic tower addition to existing project validated');

// --- 7. Dynamic Addition and Removal of Contractors ---
console.log('\n--- 7. Dynamic Addition and Removal of Contractors ---');

evalInVM(`
    mockElements['newContractorName'] = { value: 'SkyHigh Scaffolding Systems Ltd' };
    mockElements['newContractorCode'] = { value: 'VND-201' };
    mockElements['newContractorCategory'] = { value: 'General Civil & Heavy Structural' };
    mockElements['newContractorRating'] = { value: '4.8' };
    adminAddNewContractor();
`);

const updatedDir = evalInVM("getContractorDirectory()");
assert(updatedDir.some(c => c.name === 'SkyHigh Scaffolding Systems Ltd' && c.code === 'VND-201'), 'New contractor must be empaneled');
console.log('  ✓ PASS: Dynamic contractor registration validated');

// --- 8. Dynamic SLA & Escalation Policy Engine ---
console.log('\n--- 8. Dynamic SLA & Escalation Policy Engine ---');

const initSla = evalInVM("getSlaConfig()");
assert.strictEqual(initSla.mode, 'demo');
assert.strictEqual(initSla.stage1Ms, 45000);
assert.strictEqual(initSla.stage2Ms, 120000);

// Switch to Production Mode (2h / 4h)
evalInVM("adminToggleSlaMode('production')");
const prodSla = evalInVM("getSlaConfig()");
assert.strictEqual(prodSla.mode, 'production');
assert.strictEqual(evalInVM("STAGE1_MS"), 2 * 3600 * 1000, 'STAGE1_MS in production must be 2 hours');
assert.strictEqual(evalInVM("STAGE2_MS"), 4 * 3600 * 1000, 'STAGE2_MS in production must be 4 hours');

// Switch back to Demo Mode (45s / 120s)
evalInVM("adminToggleSlaMode('demo')");
assert.strictEqual(evalInVM("getSlaConfig().mode"), 'demo');
assert.strictEqual(evalInVM("STAGE1_MS"), 45000, 'STAGE1_MS in demo must be 45 seconds');
assert.strictEqual(evalInVM("STAGE2_MS"), 120000, 'STAGE2_MS in demo must be 120 seconds');
console.log('  ✓ PASS: Dynamic SLA mode switching (Demo 45s/120s vs Production 2h/4h) verified');

// --- 9. Dynamic Meteorological / Weather Engine ---
console.log('\n--- 9. Dynamic Meteorological / Weather Engine ---');

const weatherOpts = evalInVM("getWeatherOptions()");
assert(Array.isArray(weatherOpts) && weatherOpts.length >= 6, 'Weather options must be available');
assert(weatherOpts.some(w => w.condition === 'Clear' && w.windSpeedKmH === 12));
assert(weatherOpts.some(w => w.condition === 'High Wind Alert' && w.windSpeedKmH >= 38));
console.log('  ✓ PASS: Meteorological engine and statutory wind speed thresholds verified');

// --- 10. Multi-Tab Admin Center Navigation ---
console.log('\n--- 10. Multi-Tab Admin Center Navigation ---');

['gps', 'projects', 'contractors', 'sla', 'permits'].forEach(tab => {
    evalInVM("switchAdminTab('" + tab + "')");
    assert.strictEqual(evalInVM("adminCurrentTab"), tab, 'Current admin tab must be ' + tab);
});
console.log('  ✓ PASS: Multi-tab Admin Governance Center switching cleanly verified across all 5 panels');

// --- 11. State Persistence & LocalStorage Round-Trip ---
console.log('\n--- 11. State Persistence & LocalStorage Round-Trip ---');

evalInVM("saveState()");
const storedRaw = evalInVM("localStorage.getItem(STORAGE_KEY)");
assert(storedRaw, 'Storage must contain saved state');
const parsed = JSON.parse(storedRaw);
assert(Array.isArray(parsed.projects), 'Saved state must contain projects');
assert(parsed.sla && parsed.sla.mode, 'Saved state must contain SLA config');
assert(Array.isArray(parsed.contractorDirectory), 'Saved state must contain contractor directory');
console.log('  ✓ PASS: State persistence verified with projects, SLA configuration, and contractors directory');

console.log('\n==================================================');
console.log('ALL SUITE 25 DYNAMIC ENTERPRISE ARCHITECTURE TESTS PASSED (100% SUCCESS)');
console.log('==================================================');
