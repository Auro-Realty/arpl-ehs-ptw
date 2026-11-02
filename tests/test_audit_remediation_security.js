/**
 * SUITE 19: FORENSIC AUDIT REMEDIATION, SECURITY & RUNTIME ROBUSTNESS
 *
 * Verifies all security hardening, dead code eliminations, null-guards,
 * timer lifecycle management, timezone forcing, and role boundary invariants
 * identified during the deep architectural and forensic audit.
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE 19: FORENSIC AUDIT REMEDIATION, SECURITY & RUNTIME ROBUSTNESS');
console.log('==================================================');

// --- 1. Static Security, SRI Hashes & HTML Standards ---
console.log('\n--- 1. Static Security, SRI Hashes & HTML Standards ---');

assert(src.includes('integrity="sha384-t1nt8BQoYMLFN5p42tRAtuAAFQaCQODekUVeKKZrEnEyp4H2R0RHFz0KWpmj7i8g"'), 
    'Font Awesome link must contain SHA-384 Subresource Integrity (SRI) hash');
assert(src.includes('integrity="sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk"'), 
    'jsPDF script must contain SHA-384 Subresource Integrity (SRI) hash');
assert(/<script[^>]*jspdf[^>]*defer[^>]*>/i.test(src) || /<script[^>]*defer[^>]*jspdf[^>]*>/i.test(src),
    'jsPDF script tag must have defer attribute to prevent parser blocking');
assert(src.includes('crossorigin="anonymous"'),
    'CDN scripts/stylesheets must declare crossorigin="anonymous"');
assert(src.includes('<noscript>'),
    'HTML body must contain accessible <noscript> banner');
assert(/<meta\s+name=["']description["']/i.test(src),
    'HTML head must declare standard <meta name="description">');
assert(src.includes('data:image/svg+xml'),
    'HTML head must declare an SVG shield favicon');
console.log('  ✓ PASS: Static SRI hashes, defer, noscript, meta description, and favicon verified');

// --- 2. Dead Code Elimination Verification ---
console.log('\n--- 2. Dead Code Elimination Verification ---');

// Extract acknowledgeSiteEngineer source
const ackEngMatch = src.match(/function acknowledgeSiteEngineer\s*\([^)]*\)\s*\{([\s\S]*?)function rejectSiteEngineer/);
assert(ackEngMatch, 'acknowledgeSiteEngineer function must be present');
const ackEngBody = ackEngMatch[1];
const elecCount = (ackEngBody.match(/ptypeOf\(p\)\s*===\s*['"]electrical['"]/g) || []).length;
assert.strictEqual(elecCount, 1, 'acknowledgeSiteEngineer must contain exactly 1 electrical handling block (duplicate removed)');

// Extract submitPermit source
const submitMatch = src.match(/function submitPermit\s*\([^)]*\)\s*\{([\s\S]*?)function acknowledgePmEngineer/);
assert(submitMatch, 'submitPermit function must be present');
const submitBody = submitMatch[1];
assert(!submitBody.includes("ptypeOf(p) === 'blasting' && currentUser.role === 'supervisor'"), 
    'submitPermit must not have unreachable supervisor-blasting submission branch');
console.log('  ✓ PASS: Dead code branches verified eliminated from acknowledgeSiteEngineer and submitPermit');

// --- 3. Runtime Setup & VM Sandbox Initialization ---
console.log('\n--- 3. Runtime Setup & VM Sandbox Initialization ---');

const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
assert(scriptMatch, 'Main script tag must be extracted');

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
                } else if (force) this.classes.add(c);
                else this.classes.delete(c);
            }
        };
    }
    querySelector(sel) { return new MockElement(); }
    querySelectorAll(sel) { return []; }
    setAttribute(k, v) { this[k] = v; }
    getAttribute(k) { return this[k] || null; }
    removeAttribute(k) { delete this[k]; }
    addEventListener() {}
    removeEventListener() {}
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
        return child;
    }
    focus() {}
    scrollIntoView() {}
}

const domElements = new Map();
function getOrCreateElement(id) {
    if (!domElements.has(id)) {
        domElements.set(id, new MockElement(id));
    }
    return domElements.get(id);
}

const storageMap = new Map();
const mockLocalStorage = {
    getItem: (k) => storageMap.get(k) || null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear()
};

let activeIntervals = new Set();
let nextIntervalId = 1;

const sandbox = {
    window: {
        location: { hash: '', reload: () => {} },
        addEventListener: () => {},
        removeEventListener: () => {},
        scrollTo: () => {}
    },
    document: {
        getElementById: (id) => getOrCreateElement(id),
        querySelector: (sel) => {
            if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
            return new MockElement('', sel);
        },
        querySelectorAll: () => [],
        createElement: (tag) => new MockElement('', tag),
        addEventListener: () => {},
        body: new MockElement('body', 'body')
    },
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    console: {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {}
    },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (fn, ms) => {
        const id = nextIntervalId++;
        activeIntervals.add(id);
        return id;
    },
    clearInterval: (id) => {
        activeIntervals.delete(id);
    },
    navigator: { userAgent: 'NodeTestVM', geolocation: { getCurrentPosition: () => {} } },
    alert: () => {},
    confirm: () => true,
    prompt: () => ''
};

sandbox.window.document = sandbox.document;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

function evalInVM(expr) {
    return vm.runInContext(expr, context);
}

console.log('  ✓ PASS: VM Sandbox initialized cleanly');

// --- 4. Null Guard in applyRoleVisibility ---
console.log('\n--- 4. Null Guard in applyRoleVisibility ---');

evalInVM('currentUser = null');
assert.doesNotThrow(() => {
    evalInVM('applyRoleVisibility()');
}, 'applyRoleVisibility must not throw when currentUser is null');
console.log('  ✓ PASS: applyRoleVisibility safely handles null currentUser without exceptions');

// --- 5. Escalation Tick Robustness & Lifecycle ---
console.log('\n--- 5. Escalation Tick Robustness & Lifecycle ---');

// Test runEscalationTick with empty or non-array PERMITS
evalInVM('PERMITS = []');
assert.doesNotThrow(() => {
    evalInVM('runEscalationTick()');
}, 'runEscalationTick must safely return without error when PERMITS is empty');

evalInVM('PERMITS = null');
assert.doesNotThrow(() => {
    evalInVM('runEscalationTick()');
}, 'runEscalationTick must safely return without error when PERMITS is null');

// Test startEscalationTimer and stopEscalationTimer lifecycle
evalInVM('PERMITS = []');
assert.strictEqual(evalInVM('escalationIntervalId'), null, 'escalationIntervalId should be null before timer start');

evalInVM('startEscalationTimer()');
assert(evalInVM('escalationIntervalId') !== null, 'startEscalationTimer must set escalationIntervalId');

evalInVM('stopEscalationTimer()');
assert.strictEqual(evalInVM('escalationIntervalId'), null, 'stopEscalationTimer must clear escalationIntervalId and reset to null');

// Verify doLogout cleans up active escalation timer
evalInVM('startEscalationTimer()');
assert(evalInVM('escalationIntervalId') !== null, 'Timer must be active before logout');
evalInVM('doLogout()');
assert.strictEqual(evalInVM('escalationIntervalId'), null, 'doLogout must clear escalationIntervalId and reset to null');
console.log('  ✓ PASS: Escalation timer lifecycle properly initialized on login and cleared on logout');

// --- 6. Timezone Enforcement (Asia/Kolkata) ---
console.log('\n--- 6. Timezone Enforcement (Asia/Kolkata) ---');

// UTC 2026-09-11 10:00:00 UTC = 15:30:00 IST (03:30 pm)
evalInVM("testDate = new Date('2026-09-11T10:00:00Z')");
const formattedTime = evalInVM('fmtTime(testDate)').toLowerCase();
assert(formattedTime.includes('03:30') || formattedTime.includes('3:30'), `fmtTime must output 03:30 / 15:30 IST for 10:00 UTC (got ${formattedTime})`);
assert(formattedTime.includes('pm'), `fmtTime must indicate PM for afternoon IST (got ${formattedTime})`);

const formattedDate = evalInVM('fmtDate(testDate)');
assert(formattedDate.includes('11') && formattedDate.includes('2026'), `fmtDate must format correctly in IST (got ${formattedDate})`);
console.log('  ✓ PASS: fmtDate and fmtTime strictly forced to Asia/Kolkata time zone');

// --- 7. Strict RBAC & Permittee Boundary Invariants ---
console.log('\n--- 7. Strict RBAC & Permittee Boundary Invariants ---');

// PTW-007: Blasting & Drilling
const supBlasting = evalInVM("getPermitAvailabilityForRole('blasting', 'site-supervisor')");
assert.strictEqual(supBlasting.available, false, 'Site Supervisor must NEVER be allowed to create PTW-007 Drilling & Blasting permit');
assert.strictEqual(supBlasting.statusText, 'Restricted to Blasting In-charge');

const blastInchargeBlasting = evalInVM("getPermitAvailabilityForRole('blasting', 'blasting-incharge')");
assert.strictEqual(blastInchargeBlasting.available, true, 'Blasting In-charge must be authorized to create PTW-007 Drilling & Blasting permit');

// PTW-008: General Work
const supGeneral = evalInVM("getPermitAvailabilityForRole('general', 'site-supervisor')");
assert.strictEqual(supGeneral.available, true, 'Site Supervisor must be authorized to create PTW-008 General Work permit');

const blastInchargeGeneral = evalInVM("getPermitAvailabilityForRole('general', 'blasting-incharge')");
assert.strictEqual(blastInchargeGeneral.available, false, 'Blasting In-charge must NEVER be allowed to create PTW-008 General Work permit');

const elecGeneral = evalInVM("getPermitAvailabilityForRole('general', 'electrician')");
assert.strictEqual(elecGeneral.available, false, 'Electrician must NEVER be allowed to create PTW-008 General Work permit');

// PTW-009: Lifting Operations
const liftSupLifting = evalInVM("getPermitAvailabilityForRole('lifting', 'lift-supervisor')");
assert.strictEqual(liftSupLifting.available, true, 'Lifting Supervisor must be authorized to create PTW-009 Lifting Operations permit');

const supLifting = evalInVM("getPermitAvailabilityForRole('lifting', 'site-supervisor')");
assert.strictEqual(supLifting.available, false, 'Site Supervisor must NEVER be allowed to create PTW-009 Lifting permit');

const elecLifting = evalInVM("getPermitAvailabilityForRole('lifting', 'electrician')");
assert.strictEqual(elecLifting.available, false, 'Electrician must NEVER be allowed to create PTW-009 Lifting permit');

// INITIATOR_PERMIT_RULES mapping checks
const supervisorAllowed = evalInVM("INITIATOR_PERMIT_RULES['site-supervisor']");
assert(supervisorAllowed.includes('general'), 'Supervisor allowed permits must include general (PTW-008)');
assert(supervisorAllowed.includes('excavation'), 'Supervisor allowed permits must include excavation (PTW-001)');
assert(!supervisorAllowed.includes('blasting'), 'Supervisor allowed permits must strictly exclude blasting (PTW-007)');
assert(!supervisorAllowed.includes('electrical'), 'Supervisor allowed permits must strictly exclude electrical (PTW-006)');
assert(!supervisorAllowed.includes('lifting'), 'Supervisor allowed permits must strictly exclude lifting (PTW-009A)');
assert(!supervisorAllowed.includes('liftplan'), 'Supervisor allowed permits must strictly exclude liftplan (PTW-009B)');

const blastingAllowed = evalInVM("INITIATOR_PERMIT_RULES['blasting-incharge']");
assert.strictEqual(JSON.stringify(blastingAllowed), JSON.stringify(['blasting']), 'Blasting In-charge scope must strictly equal [blasting]');

const liftAllowed = evalInVM("INITIATOR_PERMIT_RULES['lift-supervisor']");
assert.strictEqual(JSON.stringify(liftAllowed), JSON.stringify(['lifting', 'liftplan']), 'Lifting Supervisor scope must strictly equal [lifting, liftplan]');

// Role Type Scopes
const blastingScope = evalInVM("roleTypeScope('blasting-incharge')");
assert.strictEqual(JSON.stringify(blastingScope), JSON.stringify(['blasting']), 'Blasting In-charge roleTypeScope must strictly equal [blasting]');

const liftScope = evalInVM("roleTypeScope('lift-supervisor')");
assert.strictEqual(JSON.stringify(liftScope), JSON.stringify(['lifting', 'liftplan']), 'Lifting Supervisor roleTypeScope must strictly equal [lifting, liftplan]');
console.log('  ✓ PASS: Statutory RBAC boundaries between Site Supervisor, Blasting In-charge, Electrician, and Lifting Supervisor verified');

console.log('\n==================================================');
console.log('ALL SUITE 19 AUDIT REMEDIATION & SECURITY TESTS PASSED (100% SUCCESS)');
console.log('==================================================');
