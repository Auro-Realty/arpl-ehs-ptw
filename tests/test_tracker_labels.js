const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

// 1. Check static source code updates
assert(src.includes("const shLabel = (pMeta(p) && pMeta(p).shLabel) || (isExc ? 'Excavation Head' : 'Tower Incharge');"),
    "trackerHtml must use dynamic Section Head label");

assert(src.includes("const shLabel = (p && pMeta(p) && pMeta(p).shLabel) || (isExc ? 'Excavation Head' : 'Tower Incharge');"),
    "extTrackerHtml must use dynamic Section Head label");

assert(src.includes("const shLabelModal = (pMeta(p) && pMeta(p).shLabel) || (isExc ? 'Excavation Head' : 'Tower Incharge');"),
    "openApprovalGPS must compute shLabelModal");

assert(src.includes("statusBadge(p.status, p)"),
    "statusBadge must be called with permit object context in detail view and register");

// 2. Runtime Evaluation & Functional Validation
const scriptMatch = src.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, "Must extract script block from index.html");

const mockDoc = {
    getElementById: () => ({ innerHTML: '', value: '', style: {}, classList: { add: () => {}, remove: () => {} } }),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    body: { classList: { add: () => {}, remove: () => {} } }
};

const sandbox = {
    window: {},
    document: mockDoc,
    console: console,
    setTimeout: () => {},
    setInterval: () => {},
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

const app = sandbox;

// Test statusBadge with Excavation permit
const excPermit = { id: 'TEST-EXC-001', ptype: 'excavation', status: 'Pending Section Head' };
const hwPermit = { id: 'TEST-HW-002', ptype: 'hotwork', status: 'Pending Section Head' };

const badgeExc = app.statusBadge(excPermit.status, excPermit);
assert(badgeExc.includes('Pending Excavation Head'),
    `statusBadge with Excavation permit must render "Pending Excavation Head", got: ${badgeExc}`);
assert(badgeExc.includes('st-sectionhead'),
    `statusBadge with Excavation permit must have class "st-sectionhead", got: ${badgeExc}`);

const badgeHw = app.statusBadge(hwPermit.status, hwPermit);
assert(badgeHw.includes('Pending Tower Incharge'),
    `statusBadge with Hot Work permit must render "Pending Tower Incharge", got: ${badgeHw}`);

// Test backward compatibility (no second arg)
const badgeLegacy = app.statusBadge('Pending Section Head');
assert(badgeLegacy.includes('Pending Tower Incharge'),
    `statusBadge('Pending Section Head') without context must default to "Pending Tower Incharge", got: ${badgeLegacy}`);

// Test direct Excavation Head status
const badgeDirectExc = app.statusBadge('Pending Excavation Head');
assert(badgeDirectExc.includes('Pending Excavation Head') && badgeDirectExc.includes('st-sectionhead'),
    `statusBadge('Pending Excavation Head') must render correctly with class st-sectionhead`);

// Test Observation Section Head variations
const badgeObsExc = app.statusBadge('Observation Pending Section Head Review', excPermit);
assert(badgeObsExc.includes('Observation Pending Excavation Head Review'),
    `Observation Section Head review for Excavation must render "Observation Pending Excavation Head Review", got: ${badgeObsExc}`);

// Test stageLabelFor in escalation engine
const escExcLabel = app.stageLabelFor('Pending Section Head', excPermit);
assert(escExcLabel === 'Excavation Head approval',
    `stageLabelFor for Excavation must return "Excavation Head approval", got: ${escExcLabel}`);

const escHwLabel = app.stageLabelFor('Pending Section Head', hwPermit);
assert(escHwLabel === 'Tower Incharge approval',
    `stageLabelFor for Hot Work must return "Tower Incharge approval", got: ${escHwLabel}`);

console.log("All Section Head label checks and runtime tests passed successfully!");
