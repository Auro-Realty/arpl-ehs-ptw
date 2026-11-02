const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

console.log('==================================================');
console.log('SUITE 4: APPLICATION-WIDE NAVIGATION CONSISTENCY & DETERMINISTIC FLOWS');
console.log('==================================================');

// --- Static Code Analysis Tests ---
console.log('\n--- 1. Static Verification of Navigation Hooks & Styles ---');

// CSS additions
assert(src.includes('.step-node.clickable {'), "CSS must include .step-node.clickable");
assert(src.includes('@keyframes pulseAttention {'), "CSS must include @keyframes pulseAttention");
assert(src.includes('.pulse-attention {'), "CSS must include .pulse-attention class");
assert(src.includes('body.modal-open {'), "CSS must include body.modal-open rule");
console.log('  ✓ PASS: CSS navigation tokens, pulse-attention, and modal-open rules verified');

// Modal openModal & closeModal unification
assert(src.includes('function openModal(id) {'), "Must define openModal function");
assert(src.includes('function closeModal(id) {'), "Must define closeModal function");
assert(!src.match(/document\.getElementById\(['"]actionModal['"]\)\.classList\.add\(['"]show['"]\)/),
    "No direct actionModal classList.add('show') allowed; all must use openModal");
console.log('  ✓ PASS: All actionModal invocations routed through openModal()');

// Role safety
assert(src.includes("function roleInfo(key) {") && src.includes("if (!key) return { key: '', label: 'Authorized Signatory'"),
    "roleInfo must safely handle undefined/null keys without throwing");
console.log('  ✓ PASS: roleInfo null/undefined safety verified');

// Stepper & Error Scroll Functions
assert(src.includes('function goToWizStep(targetStep) {'), "Must define goToWizStep");
assert(src.includes('function scrollToStepError(step) {'), "Must define scrollToStepError");
assert(src.includes("window.scrollTo({ top: 0, behavior: 'instant' });"),
    "Step switches must reset scroll to top with instant behavior");
console.log('  ✓ PASS: Stepper engine and instant top-scroll hooks present');

// Signature anchoring
assert(src.includes('function continueWizToSignature() {'), "Must define continueWizToSignature");
assert(src.includes('function editWizSigner() {'), "Must define editWizSigner");
assert(src.includes('function continueModalToSignature() {'), "Must define continueModalToSignature");
assert(src.includes('function editModalSigner() {'), "Must define editModalSigner");
console.log('  ✓ PASS: Step 4 and Action Modal signature anchoring functions present');

// --- Runtime Evaluation Tests ---
console.log('\n--- 2. Runtime Evaluation & State Transition Tests ---');

const scriptMatch = src.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, "Must extract script block from index.html");

// Setup rich DOM mock environment
let scrollOperations = [];
let scrolledIntoViewElements = [];
let focusedElements = [];
let historyPushes = [];

class MockElement {
    constructor(id = '', tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.value = '';
        this.checked = false;
        this.style = {};
        this.classes = new Set();
        this.dataset = {};
        this.children = [];
        this.scrollTop = 0;
        this.eventListeners = {};
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
    scrollIntoView(options) {
        scrolledIntoViewElements.push({ id: this.id, options });
    }
    focus() {
        focusedElements.push(this.id);
    }
    querySelector(sel) {
        if (sel === '.modal-body') {
            if (!this._mb) this._mb = new MockElement('', 'div');
            return this._mb;
        }
        return new MockElement('', 'div');
    }
    querySelectorAll() {
        return [];
    }
    appendChild(child) {
        if (child) child.parentNode = this;
        this.children.push(child);
        return child;
    }
    removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
        if (child) child.parentNode = null;
        return child;
    }
    remove() {
        if (this.parentNode && this.parentNode.removeChild) {
            this.parentNode.removeChild(this);
        }
    }
    addEventListener(event, fn) {
        this.eventListeners[event] = this.eventListeners[event] || [];
        this.eventListeners[event].push(fn);
    }
}

const mockElementsMap = new Map();
function getOrCreateElem(id, tagName = 'div') {
    if (!mockElementsMap.has(id)) {
        mockElementsMap.set(id, new MockElement(id, tagName));
    }
    return mockElementsMap.get(id);
}

const bodyElem = new MockElement('body', 'body');
const actionModal = getOrCreateElem('actionModal');
actionModal.classList.add('modal-overlay');
const gpsModal = getOrCreateElem('gpsModal');
gpsModal.classList.add('modal-overlay');
const photoModal = getOrCreateElem('photoModal');
photoModal.classList.add('modal-overlay');

const mockDoc = {
    body: bodyElem,
    createElement: (tag) => new MockElement('', tag),
    getElementById: (id) => getOrCreateElem(id),
    querySelector: (sel) => {
        if (sel === '.modal-overlay.show') {
            for (let el of mockElementsMap.values()) {
                if (el.classList.contains('modal-overlay') && el.classList.contains('show')) return el;
            }
            return null;
        }
        if (sel.startsWith('#')) {
            return getOrCreateElem(sel.substring(1));
        }
        return getOrCreateElem('elem_' + Math.random().toString(36).substring(2, 6));
    },
    querySelectorAll: (sel) => {
        if (sel === '.modal-overlay.show') {
            let list = [];
            for (let el of mockElementsMap.values()) {
                if (el.classList.contains('modal-overlay') && el.classList.contains('show')) list.push(el);
            }
            return list;
        }
        if (sel === '.modal-overlay') {
            return [gpsModal, photoModal, actionModal];
        }
        if (sel === '.view') {
            return [getOrCreateElem('view-dashboard'), getOrCreateElem('view-create'), getOrCreateElem('view-detail')];
        }
        if (sel === '.checklist-item') {
            return [getOrCreateElem('chk-item-0'), getOrCreateElem('chk-item-1')];
        }
        if (sel === '.nav-link') return [];
        return [];
    },
    addEventListener: () => {}
};

const mockWindow = {
    scrollY: 0,
    scrollTo: (options) => {
        scrollOperations.push(options);
        if (typeof options === 'object' && options.top !== undefined) {
            mockWindow.scrollY = options.top;
        }
    },
    history: {
        pushState: (state, title, url) => {
            historyPushes.push({ state, title, url });
        }
    },
    addEventListener: () => {}
};

const sandbox = {
    window: mockWindow,
    document: mockDoc,
    console: console,
    setTimeout: (fn) => { if (typeof fn === 'function') fn(); },
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
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

function evalInVM(code) {
    return vm.runInContext(code, sandbox);
}

// --- Test 2.1: roleInfo Fallback Safety ---
const safeFallback = evalInVM("roleInfo(undefined)");
assert(safeFallback && safeFallback.label === 'Authorized Signatory', "roleInfo(undefined) must safely return fallback");
const safeNull = evalInVM("roleInfo(null)");
assert(safeNull && safeNull.label === 'Authorized Signatory', "roleInfo(null) must safely return fallback");
const validRole = evalInVM("roleInfo('site-supervisor')");
assert(validRole && validRole.key === 'site-supervisor', "roleInfo('site-supervisor') must return correct role");
console.log('  ✓ PASS: roleInfo safely handles undefined, null, and valid role keys');

// --- Test 2.2: Modal Engine Lifecycle ---
scrollOperations = [];
evalInVM("openModal('actionModal')");
assert(actionModal.classList.contains('show'), "openModal must add 'show' class");
assert(bodyElem.classList.contains('modal-open'), "openModal must lock background scroll via 'modal-open'");
const actionModalBody = actionModal.querySelector('.modal-body');
assert(actionModalBody.scrollTop === 0, "openModal must reset modal-body.scrollTop to 0");

evalInVM("closeModal('actionModal')");
assert(!actionModal.classList.contains('show'), "closeModal must remove 'show' class");
assert(!bodyElem.classList.contains('modal-open'), "closeModal must remove 'modal-open' when no modals remain");
console.log('  ✓ PASS: openModal & closeModal properly manage scroll lock, scroll reset, and visibility');

// --- Test 2.3: Top-level Navigation & History (goTo & viewDetail) ---
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor' };");
scrollOperations = [];
historyPushes = [];

// Open a modal first
evalInVM("openModal('actionModal')");
assert(actionModal.classList.contains('show'), "Modal is open before goTo");

// Navigate to dashboard
evalInVM("goTo('dashboard')");
assert(!actionModal.classList.contains('show'), "goTo must cleanly dismiss orphaned open modals");
assert(scrollOperations.length > 0 && scrollOperations[scrollOperations.length - 1].top === 0,
    "goTo must reset window scroll to top instantly");
assert(historyPushes.length > 0 && historyPushes[historyPushes.length - 1].state.view === 'dashboard',
    "goTo must record browser history state");
console.log('  ✓ PASS: goTo() cleanly dismisses modals, scrolls instantly to top, and updates history');

// Test viewDetail navigation
scrollOperations = [];
evalInVM("seedPermits(); stampSeedSignatures();");
const testPermitId = evalInVM("PERMITS[0].id");
evalInVM("openModal('actionModal')");
evalInVM("viewDetail('" + testPermitId + "')");
assert(!actionModal.classList.contains('show'), "viewDetail must cleanly dismiss orphaned open modals");
assert(scrollOperations.length > 0 && scrollOperations[scrollOperations.length - 1].top === 0,
    "viewDetail must reset window scroll to top instantly");
assert(historyPushes.length > 0 && historyPushes[historyPushes.length - 1].state.view === 'detail',
    "viewDetail must record browser history state for permit detail");
console.log('  ✓ PASS: viewDetail() dismisses modals, resets scroll to top, and updates history');

// Test doLogout
scrollOperations = [];
evalInVM("openModal('actionModal')");
evalInVM("doLogout()");
assert(!actionModal.classList.contains('show'), "doLogout must dismiss open modals");
assert(scrollOperations.length > 0 && scrollOperations[scrollOperations.length - 1].top === 0,
    "doLogout must reset landing page scroll to top");
console.log('  ✓ PASS: doLogout() dismisses modals and resets scroll to top');

// --- Test 2.4: Wizard Stepper Engine & Deterministic Navigation ---
evalInVM("currentUser = { key: 'site-supervisor', name: 'Supervisor Ram', role: 'Site Supervisor' };");
evalInVM("startNewPermit('excavation');");

assert(evalInVM("wizStep") === 1, "startNewPermit must start on Step 1");

// Test: Validation failure on Step 1 when fields are missing
scrolledIntoViewElements = [];
scrollOperations = [];
evalInVM("wizNext()"); // Attempt next with blank draft
assert(evalInVM("wizStep") === 1, "wizNext must stay on Step 1 if validation fails");
assert(scrolledIntoViewElements.length > 0, "wizNext on error must trigger scrollToStepError");
assert(scrolledIntoViewElements[0].options.behavior === 'smooth',
    "Error auto-scroll must be smooth to guide user attention");
console.log('  ✓ PASS: Step 1 validation failure blocks forward jump and auto-scrolls to first missing field');

// Fill in valid Step 1 data
evalInVM(`
draft.project = 'Auro Grand Residency';
draft.projectNum = 'PRJ-AGR';
draft.organization = 'Internal';
draft.locationStructure = 'Basement/Podium';
draft.locBasementPodium = 'Basement 1';
draft.locArea = 'North Trench Zone';
draft.depth = '1.5';
draft.slope = '45';
draft.equipment = ['Excavator'];
`);

// Click Next -> Should advance to Step 2 and scroll to top instantly
scrollOperations = [];
evalInVM("wizNext()");
assert(evalInVM("wizStep") === 2, "wizNext with valid Step 1 data must advance to Step 2");
assert(scrollOperations.some(op => op.top === 0 && op.behavior === 'instant'),
    "Advancing step must scroll to top instantly without lagging animation");
console.log('  ✓ PASS: Advancing from Step 1 to Step 2 transitions smoothly and resets scroll to top (0, 0)');

// Test Backward Step from Step 2 -> Step 1
scrollOperations = [];
evalInVM("wizPrev()");
assert(evalInVM("wizStep") === 1, "wizPrev must navigate backward to Step 1");
assert(scrollOperations.some(op => op.top === 0 && op.behavior === 'instant'),
    "wizPrev must reset scroll to top instantly");
console.log('  ✓ PASS: Backward navigation (wizPrev) returns to Step 1 cleanly and resets scroll to top');

// Return to Step 2
evalInVM("wizNext()");
assert(evalInVM("wizStep") === 2, "Returned to Step 2");

// --- Test 2.5: Gated Forward Jumps via goToWizStep() ---
scrolledIntoViewElements = [];
evalInVM("goToWizStep(4)");
assert(evalInVM("wizStep") === 2, "goToWizStep(4) must be blocked because Step 2 checklist is incomplete");
assert(scrolledIntoViewElements.length > 0, "Blocked forward jump must invoke scrollToStepError for Step 2");
console.log('  ✓ PASS: goToWizStep(4) forward jump is gated and auto-scrolls to first incomplete checklist item');

// Test backward jump via goToWizStep: When on Step 2, jumping to Step 1 must always be permitted
scrollOperations = [];
evalInVM("goToWizStep(1)");
assert(evalInVM("wizStep") === 1, "goToWizStep(1) backward navigation must always be immediately permitted");
assert(scrollOperations.some(op => op.top === 0 && op.behavior === 'instant'),
    "goToWizStep backward navigation resets scroll to top instantly");
console.log('  ✓ PASS: goToWizStep(1) backward navigation works instantaneously without validation');

// Return to Step 2
evalInVM("goToWizStep(2)");
assert(evalInVM("wizStep") === 2, "Back on Step 2");

// --- Test 2.6: In-Step Checklist Scroll Preservation ---
// Mock scroll position at 450px down the checklist
mockWindow.scrollY = 450;
scrollOperations = [];
evalInVM("setChecklistAns(0, 'yes')");
assert(scrollOperations.some(op => op.top === 450 && op.behavior === 'instant'),
    "setChecklistAns must restore active scroll position (scrollY = 450)");
assert(evalInVM("wizStep") === 2, "setChecklistAns must remain on Step 2 without jumping to other items");
console.log('  ✓ PASS: setChecklistAns() preserves active viewport scroll position without jumping');

// Complete all checklist items and attachments on Step 2
evalInVM(`
draft.checklist.forEach(c => { c.ans = 'yes'; c.comment = null; });
draft.sitePhoto = 'data:image/jpeg;base64,mockphoto';
draft.drawing = { name: 'excavation_drawing.png', dataUrl: 'data:image/png;base64,mockdrawing' };
`);

// Advance to Step 3
scrollOperations = [];
evalInVM("wizNext()");
assert(evalInVM("wizStep") === 3, "wizNext must advance to Step 3 after completing checklist");
assert(scrollOperations.some(op => op.top === 0 && op.behavior === 'instant'),
    "Advancing to Step 3 resets scroll to top");
console.log('  ✓ PASS: Advancing to Step 3 transitions cleanly and resets scroll to top');

// Step 3 missing times check
scrolledIntoViewElements = [];
evalInVM("wizNext()");
assert(evalInVM("wizStep") === 3, "Step 3 validation failure must stay on Step 3");
console.log('  ✓ PASS: Step 3 validation failure blocks advancement when times are missing');

// Complete Step 3 requirements (set planned times within valid office hours)
evalInVM(`
nowTime = () => new Date(2026, 8, 9, 11, 0, 0);
draft.startTime = '11:30';
draft.validTillTime = '16:00';
`);

// Advance to Step 4
scrollOperations = [];
evalInVM("wizNext()");
assert(evalInVM("wizStep") === 4, "wizNext advances to Step 4");
assert(scrollOperations.some(op => op.top === 0 && op.behavior === 'instant'),
    "Advancing to Step 4 resets scroll to top");
console.log('  ✓ PASS: Advancing to Step 4 transitions cleanly and resets scroll to top');

// --- Test 2.7: Step 4 Signature Pad Viewport Anchoring ---
scrolledIntoViewElements = [];
focusedElements = [];

// Try continueWizToSignature without name/consent -> focuses signer name input
evalInVM("continueWizToSignature()");
assert(focusedElements.includes('seSignerName'),
    "continueWizToSignature with missing name focuses signer name input");

// Provide valid name and consent
getOrCreateElem('seSignerName').value = 'Manoj Kumar';
getOrCreateElem('seDpdpConsentChk').checked = true;
scrolledIntoViewElements = [];

evalInVM("continueWizToSignature()");
assert(scrolledIntoViewElements.some(e => e.id === 'seSigPad-wrap' || e.id === 'wizSigSection'),
    "continueWizToSignature smoothly centers viewport on signature canvas");
console.log('  ✓ PASS: continueWizToSignature() smoothly centers signature pad in viewport');

// Test editWizSigner (Change Signatory / Re-sign)
scrolledIntoViewElements = [];
focusedElements = [];
evalInVM("editWizSigner()");
assert(scrolledIntoViewElements.some(e => e.id === 'seSignerName'),
    "editWizSigner smoothly centers signer name input");
assert(focusedElements.includes('seSignerName'), "editWizSigner focuses signer name input");
console.log('  ✓ PASS: editWizSigner() smoothly centers and focuses signer name input');

// --- Test 2.8: Action Modal Signature Pad Anchoring ---
evalInVM(`
actionModalCtx = {
    p: draft,
    rk: 'site-engineer',
    decision: 'approved',
    signerName: '',
    consent: false
};
`);
scrolledIntoViewElements = [];
focusedElements = [];

// Try continueModalToSignature with missing name -> focuses modal signer name input
evalInVM("continueModalToSignature()");
assert(focusedElements.includes('modalSignerName'),
    "continueModalToSignature with missing name focuses modal signer name input");

// Now fill name and consent
getOrCreateElem('modalSignerName').value = 'Site Engineer Vikram';
getOrCreateElem('modalDpdpConsentChk').checked = true;
evalInVM(`
actionModalCtx.signerName = 'Site Engineer Vikram';
actionModalCtx.consent = true;
`);
scrolledIntoViewElements = [];

evalInVM("continueModalToSignature()");
assert(scrolledIntoViewElements.some(e => e.id === 'modalSigBox'),
    "continueModalToSignature smoothly scrolls modalSigBox into viewport");
console.log('  ✓ PASS: continueModalToSignature() smoothly centers modal signature box in viewport');

// Test editModalSigner
scrolledIntoViewElements = [];
focusedElements = [];
evalInVM("editModalSigner()");
assert(scrolledIntoViewElements.some(e => e.id === 'modalSignerName'),
    "editModalSigner smoothly scrolls modal signer name input into view");
assert(focusedElements.includes('modalSignerName'), "editModalSigner focuses modal signer name input");
console.log('  ✓ PASS: editModalSigner() smoothly centers and focuses modal signer name input');

// --- Test 2.9: Interactive Stepper Clickability ---
evalInVM("wizStep = 3; renderStepIndicator();");
const indicatorHtml = getOrCreateElem('stepIndicator').innerHTML;
assert(indicatorHtml.includes('step-node done clickable'), "Steps 1 and 2 must have clickable class when on Step 3");
assert(indicatorHtml.includes('onclick="goToWizStep(1)"'), "Step 1 node must have onclick goToWizStep(1)");
assert(indicatorHtml.includes('onclick="goToWizStep(2)"'), "Step 2 node must have onclick goToWizStep(2)");
console.log('  ✓ PASS: renderStepIndicator() generates interactive, accessible step nodes');

console.log('\n==================================================');
console.log('ALL APPLICATION-WIDE NAVIGATION TESTS PASSED CLEANLY (100% PASS RATE)');
console.log('==================================================');
