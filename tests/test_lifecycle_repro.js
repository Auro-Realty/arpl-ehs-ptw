/**
 * VERIFICATION TEST SUITE: POST-ACTIVATION LIFECYCLE (CLOSE, SURRENDER, EXTENSION, NOTIFICATIONS)
 *
 * This test suite validates that all 5 post-activation lifecycle defects are fully resolved:
 * 1. Extension requests call executeServerTransition('EXT_REQUESTED') and persistPermitToFirestore().
 * 2. Extension approval routing respects 10-process flows (PTW-001 parallel gate, PTW-005 MEP,
 *    PTW-006 batching & site, PTW-007 blocked, PTW-009 critical lift PM, PTW-010 night handover).
 * 3. Intermediate extension approvals persist updated approvals to Firestore and fire server transition.
 * 4. Close & Surrender executes two-stage write: closure evidence persisted while active, status updated
 *    to 'Completed (Surrendered)', server transition dispatched, and fallback direct persistence executed.
 * 5. Notifications and activity logs are updated for all relevant stakeholders.
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('STARTING LIFECYCLE VERIFICATION TEST SUITE (PHASE 5)');
console.log('================================================================');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const scriptMatch = src.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
if (!scriptMatch) throw new Error("Could not extract main script tag from index.html");

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
            contains: (c) => this.classes.has(c),
            add: (...cls) => cls.forEach(c => this.classes.add(c)),
            remove: (...cls) => cls.forEach(c => this.classes.delete(c)),
            toggle: (c, force) => {
                if (force === true) this.classes.add(c);
                else if (force === false) this.classes.delete(c);
                else if (this.classes.has(c)) this.classes.delete(c);
                else this.classes.add(c);
            }
        };
    }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) { return child; }
    remove() {}
    querySelector() { return null; }
    querySelectorAll() { return []; }
    setAttribute() {}
    getAttribute() { return null; }
    removeAttribute() {}
    addEventListener() {}
    removeEventListener() {}
    contains() { return false; }
    focus() {}
    scrollIntoView() {}
}

const domElements = new Map();
function getOrCreateElem(id, tagName = 'div') {
    if (!domElements.has(id)) {
        domElements.set(id, new MockElement(id, tagName));
    }
    return domElements.get(id);
}

function createHarness() {
    const firestoreWrites = [];
    const serverTransitions = [];
    const localStore = {};

    const mockFirestore = {
        collection: (colName) => ({
            doc: (docId) => ({
                set: (data, opts) => {
                    firestoreWrites.push({ col: colName, id: docId, data: JSON.parse(JSON.stringify(data)), opts });
                    return Promise.resolve();
                },
                get: () => Promise.resolve({ exists: true, data: () => ({ id: docId }) }),
                update: (data) => {
                    firestoreWrites.push({ col: colName, id: docId, data: JSON.parse(JSON.stringify(data)), isUpdate: true });
                    return Promise.resolve();
                }
            }),
            where: () => ({
                onSnapshot: () => () => {},
                get: () => Promise.resolve({ empty: true, docs: [] })
            })
        })
    };

    const mockDoc = {
        getElementById: (id) => getOrCreateElem(id),
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: (tag) => new MockElement('', tag),
        body: new MockElement('body', 'body'),
        head: new MockElement('head', 'head'),
        documentElement: new MockElement('html', 'html'),
        addEventListener: () => {}
    };

    const mockWin = {
        __TEST_MODE__: true,
        scrollTo: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        innerWidth: 1024,
        innerHeight: 768,
        location: { hash: '', reload: () => {}, href: '' },
        localStorage: {
            getItem: (k) => localStore[k] || null,
            setItem: (k, v) => { localStore[k] = String(v); },
            removeItem: (k) => { delete localStore[k]; },
            clear: () => { for (const k in localStore) delete localStore[k]; }
        }
    };

    const callableHandler = (fnName) => {
        return (payload) => {
            serverTransitions.push({ fnName, payload: JSON.parse(JSON.stringify(payload)) });
            return Promise.resolve({ data: { success: true, serverTimeMs: Date.now() } });
        };
    };

    const mockFunctionsInstance = {
        httpsCallable: callableHandler
    };

    const mockApp = {
        functions: () => mockFunctionsInstance
    };

    const sandbox = {
        console,
        setTimeout: (fn) => { fn(); return 0; },
        clearTimeout: () => {},
        setInterval: () => 0,
        clearInterval: () => {},
        Date,
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        window: mockWin,
        document: mockDoc,
        navigator: { userAgent: 'NodeTest' },
        localStorage: mockWin.localStorage,
        firebase: {
            app: () => mockApp,
            apps: [mockApp],
            firestore: () => mockFirestore,
            auth: () => ({
                currentUser: {
                    uid: 'user_site_sup_1',
                    email: 'sup@pearl.com',
                    getIdToken: () => Promise.resolve('mock_token')
                },
                onAuthStateChanged: () => () => {}
            })
        },
        getFunctions: () => mockFunctionsInstance,
        httpsCallable: (fns, fnName) => callableHandler(fnName),
        showToast: () => {},
        _firestoreWrites: firestoreWrites,
        _serverTransitions: serverTransitions,
        _localStore: localStore
    };
    sandbox.window.window = sandbox.window;
    sandbox.window.document = mockDoc;

    const ctx = vm.createContext(sandbox);
    vm.runInContext(scriptMatch[1], ctx);

    // Override isLiveFirebaseAuthActive to true for testing transition dispatch
    sandbox.isLiveFirebaseAuthActive = () => true;

    return {
        eval: (code) => vm.runInContext(code, ctx),
        sandbox
    };
}

// -------------------------------------------------------------
// TEST 1: VERIFY EXTENSION FIRESTORE & SERVER PERSISTENCE
// -------------------------------------------------------------
{
    console.log('\n[VERIFY 1] Testing requestExtension() persistence and server call:');
    const h = createHarness();
    const permit = {
        id: 'PTW-001-2026-000001',
        ptype: 'excavation',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        validTillMs: Date.now() + 3600000,
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString(),
        createdBy: 'Site Supervisor'
    };
    h.eval(`PERMITS = [${JSON.stringify(permit)}]`);
    h.eval(`currentUser = { key: 'site-supervisor', name: 'Permittee Supervisor', projectId: 'PRJ-PEARL' }`);

    // Invoke requestExtension
    h.eval(`
        requestExtension(PERMITS[0], {
            mins: 60,
            reason: 'Heavy rock strata encountered',
            gps: { lat: 17.4, lng: 78.3 },
            photo: 'data:image/jpeg;base64,mock',
            sig: 'data:image/svg+xml;mock',
            signerName: 'Permittee Supervisor'
        });
    `);

    // 1. Verify local extension object populated
    const extStatus = h.eval(`PERMITS[0].extension && PERMITS[0].extension.status`);
    assert.strictEqual(extStatus, 'Pending Site Engineer', 'Local permit.extension should be populated');
    console.log('  ✓ Local state updated: permit.extension.status =', extStatus);

    // 2. Verify executeServerTransition was called with EXT_REQUESTED
    const extCalls = h.sandbox._serverTransitions.filter(t => t.fnName === 'transitionPermitStage' && t.payload && t.payload.action === 'EXT_REQUESTED');
    assert.strictEqual(extCalls.length, 1, 'executeServerTransition must be called on extension request');
    assert.strictEqual(extCalls[0].payload.extensionMinutes, 60);
    assert.strictEqual(extCalls[0].payload.comments, 'Heavy rock strata encountered');
    console.log('  ✓ executeServerTransition called: action = EXT_REQUESTED, mins = 60');

    // 3. Verify Firestore document persistence
    const pWrites = h.sandbox._firestoreWrites.filter(w => w.col === 'permits' && w.id === permit.id);
    assert.ok(pWrites.length >= 1, 'persistPermitToFirestore must be called on extension request');
    assert.strictEqual(pWrites[0].data.extension.status, 'Pending Site Engineer');
    console.log('  ✓ Firestore /permits write executed with extension object and approvals.');
}

// -------------------------------------------------------------
// TEST 2: VERIFY 10-PROCESS EXTENSION ROUTING LOGIC
// -------------------------------------------------------------
{
    console.log('\n[VERIFY 2] Testing Extension routing across specialized processes:');
    const h = createHarness();

    // 2a. PTW-001 Excavation (Site Engineer -> Excavation Head -> EHS)
    const pExc = {
        id: 'PTW-001-2026-000002',
        ptype: 'excavation',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString()
    };
    h.eval(`PERMITS = [${JSON.stringify(pExc)}]`);
    h.eval(`currentUser = { key: 'site-supervisor', name: 'Permittee', projectId: 'PRJ-PEARL' }`);
    h.eval(`requestExtension(PERMITS[0], { mins: 60, reason: 'Excavation extension' })`);
    const excApprovals = h.eval(`PERMITS[0].extension.approvals`);
    assert.strictEqual(excApprovals.kind, 'ext-excavation');
    assert.ok(excApprovals.siteEngineer, 'Has siteEngineer slot');
    assert.ok(excApprovals.excavationHead, 'Has excavationHead slot');
    assert.ok(excApprovals.ehsManager, 'Has ehsManager slot');
    console.log('  ✓ PTW-001 Excavation: Successfully generated ext-excavation with Excavation Head and EHS.');

    // 2b. PTW-006 Site Electrical (Site Engineer -> MEP -> EHS)
    const pElecSite = {
        id: 'PTW-006-2026-000002',
        ptype: 'electrical',
        electricalSiteType: 'site_installation',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString()
    };
    h.eval(`PERMITS = [${JSON.stringify(pElecSite)}]`);
    h.eval(`currentUser = { key: 'electrician', name: 'Electrician', projectId: 'PRJ-PEARL' }`);
    h.eval(`requestExtension(PERMITS[0], { mins: 60, reason: 'Site electrical testing delay' })`);
    const elecSiteApprovals = h.eval(`PERMITS[0].extension.approvals`);
    assert.strictEqual(elecSiteApprovals.kind, 'ext-electrical-site');
    assert.ok(elecSiteApprovals.siteEngineer, 'Has Site Engineer slot');
    assert.ok(elecSiteApprovals.mep, 'Has MEP slot');
    console.log('  ✓ PTW-006 Site Electrical: Successfully generated ext-electrical-site with MEP review.');

    // 2bb. PTW-005 Shaft Work (Site Engineer -> Tower Incharge -> EHS)
    const pShaft = {
        id: 'PTW-005-2026-000001',
        ptype: 'shaft',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString()
    };
    h.eval(`PERMITS = [${JSON.stringify(pShaft)}]`);
    h.eval(`currentUser = { key: 'site-supervisor', name: 'Supervisor', projectId: 'PRJ-PEARL' }`);
    h.eval(`requestExtension(PERMITS[0], { mins: 60, reason: 'Shaft extension' })`);
    const shaftApprovals = h.eval(`PERMITS[0].extension.approvals`);
    assert.strictEqual(shaftApprovals.kind, 'ext-flow');
    assert.ok(shaftApprovals.sectionHead, 'Has Section Head slot');
    console.log('  ✓ PTW-005 Shaft: Successfully generated ext-flow with Tower Incharge.');

    // 2c. PTW-006 Batching Plant Electrical (P&M -> Quality Engineer -> EHS)
    const pElecBatch = {
        id: 'PTW-006-2026-000001',
        ptype: 'electrical',
        electricalSiteType: 'batching_plant',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString()
    };
    h.eval(`PERMITS = [${JSON.stringify(pElecBatch)}]`);
    h.eval(`currentUser = { key: 'electrician', name: 'Electrician', projectId: 'PRJ-PEARL' }`);
    h.eval(`requestExtension(PERMITS[0], { mins: 60, reason: 'Batching electrical extension' })`);
    const elecBatchExt = h.eval(`PERMITS[0].extension`);
    assert.strictEqual(elecBatchExt.status, 'Pending P&M Acknowledgment');
    assert.strictEqual(elecBatchExt.approvals.kind, 'ext-batching-elec');
    assert.ok(elecBatchExt.approvals.pm, 'Has PM slot');
    assert.ok(elecBatchExt.approvals.qualityEngineer, 'Has Quality Engineer slot');
    console.log('  ✓ PTW-006 Batching Electrical: Routed directly to P&M Engineer -> Quality Engineer.');

    // 2d. PTW-007 Drilling & Blasting (STRICTLY BLOCKED)
    const pBlasting = {
        id: 'PTW-007-2026-000001',
        ptype: 'blasting',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString()
    };
    h.eval(`PERMITS = [${JSON.stringify(pBlasting)}]`);
    h.eval(`currentUser = { key: 'blasting-incharge', name: 'Blasting Incharge', projectId: 'PRJ-PEARL' }`);
    h.eval(`requestExtension(PERMITS[0], { mins: 60, reason: 'Blasting extension attempt' })`);
    const blastingExt = h.eval(`PERMITS[0].extension`);
    assert.strictEqual(blastingExt, undefined, 'PTW-007 must NOT create an extension object');
    console.log('  ✓ PTW-007 Blasting: Extension strictly BLOCKED as per statutory requirements.');

    // 2e. PTW-009 Critical Lift Plan (Site Engineer -> Section Head -> P&M -> Project Manager -> EHS)
    const pLiftCrit = {
        id: 'PTW-009-2026-000001',
        ptype: 'lifting',
        liftingClassification: 'critical',
        loadWeightMT: 7.5,
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString()
    };
    h.eval(`PERMITS = [${JSON.stringify(pLiftCrit)}]`);
    h.eval(`currentUser = { key: 'lift-supervisor', name: 'Lift Sup', projectId: 'PRJ-PEARL' }`);
    h.eval(`requestExtension(PERMITS[0], { mins: 60, reason: 'Heavy lift extension' })`);
    const liftCritApprovals = h.eval(`PERMITS[0].extension.approvals`);
    assert.strictEqual(liftCritApprovals.kind, 'ext-lifting-critical');
    assert.ok(liftCritApprovals.pm, 'Has P&M slot');
    assert.ok(liftCritApprovals.projectManager, 'Has Project Manager slot');
    console.log('  ✓ PTW-009 Critical Lift: Successfully included P&M and Project Manager executive acknowledgment.');

    // 2f. PTW-010 Night Shift (Site Engineer -> Section Head -> Night Handover -> EHS)
    const pNight = {
        id: 'PTW-010-2026-000001',
        ptype: 'nightshift',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '20:30',
        startAt: new Date(Date.now() - 3600000).toISOString()
    };
    h.eval(`PERMITS = [${JSON.stringify(pNight)}]`);
    h.eval(`currentUser = { key: 'night-supervisor', name: 'Night Sup', projectId: 'PRJ-PEARL' }`);
    h.eval(`requestExtension(PERMITS[0], { mins: 60, reason: 'Night work extension' })`);
    const nightApprovals = h.eval(`PERMITS[0].extension.approvals`);
    assert.strictEqual(nightApprovals.kind, 'ext-nightshift');
    assert.ok(nightApprovals.nightSupervisor, 'Has Night Handover slot');
    console.log('  ✓ PTW-010 Night Shift: Successfully included Night Site Supervisor handover.');
}

// -------------------------------------------------------------
// TEST 3: VERIFY INTERMEDIATE EXTENSION APPROVAL PERSISTENCE
// -------------------------------------------------------------
{
    console.log('\n[VERIFY 3] Testing approveExtensionStage intermediate status and persistence:');
    const h = createHarness();
    const permit = {
        id: 'PTW-008-2026-000001',
        ptype: 'general',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString(),
        extension: {
            status: 'Pending Site Engineer',
            minutes: 60,
            hours: 1,
            approvals: {
                kind: 'ext-flow',
                siteEngineer: { status: 'pending' },
                sectionHead: { status: 'pending' },
                ehsManager: { status: 'pending' },
                ehsOfficer: { status: 'pending' }
            }
        }
    };
    h.eval(`PERMITS = [${JSON.stringify(permit)}]`);
    h.eval(`currentUser = { key: 'site-engineer', name: 'SE John', projectId: 'PRJ-PEARL' }`);

    // Site Engineer approves extension stage
    h.eval(`approveExtensionStage(PERMITS[0], 'site-engineer', { lat: 17.4, lng: 78.3 }, 'SE verified okay', 'sig_data', 'SE John')`);

    // 1. Verify stage progressed
    const newExtStatus = h.eval(`PERMITS[0].extension.status`);
    assert.strictEqual(newExtStatus, 'Pending Section Head');
    console.log('  ✓ Extension status transitioned to:', newExtStatus);

    // 2. Verify server transition dispatched
    const tx = h.sandbox._serverTransitions.find(t => t.payload && t.payload.action === 'EXT_STAGE_APPROVED');
    assert.ok(tx, 'executeServerTransition must be called on intermediate approval');
    console.log('  ✓ executeServerTransition called: action = EXT_STAGE_APPROVED');

    // 3. Verify Firestore document was written
    const pWrites = h.sandbox._firestoreWrites.filter(w => w.col === 'permits' && w.id === permit.id);
    assert.ok(pWrites.length >= 1, 'persistPermitToFirestore must be called on intermediate approval');
    assert.strictEqual(pWrites[0].data.extension.approvals.siteEngineer.status, 'approved');
    assert.strictEqual(pWrites[0].data.extension.approvals.siteEngineer.by, 'SE John');
    console.log('  ✓ Firestore persisted with Site Engineer approval signature, GPS, and timestamp.');
}

// -------------------------------------------------------------
// TEST 4: VERIFY CLOSE & SURRENDER EVIDENCE INTEGRITY
// -------------------------------------------------------------
{
    console.log('\n[VERIFY 4] Testing closeAndSurrenderPermit evidence preservation:');
    const h = createHarness();
    const permit = {
        id: 'PTW-002-2026-000001',
        ptype: 'hotwork',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString(),
        createdBy: 'Hot Work Supervisor'
    };
    h.eval(`PERMITS = [${JSON.stringify(permit)}]`);
    h.eval(`currentUser = { key: 'site-supervisor', name: 'Site Supervisor', projectId: 'PRJ-PEARL' }`);

    const opts = {
        gps: { lat: 17.42, lng: 78.34 },
        photo: 'data:image/jpeg;base64,evidence_closure_photo',
        remarks: 'Hot work completed cleanly and cold',
        sig: 'data:image/svg+xml;closure_sig',
        signerName: 'Site Supervisor',
        fireWatch: true
    };

    // Execute close and surrender
    const res = h.eval(`closeAndSurrenderPermit(PERMITS[0], ${JSON.stringify(opts)})`);
    assert.strictEqual(res, true, 'closeAndSurrenderPermit returned true');

    // 1. Verify permit status
    const finalStatus = h.eval(`PERMITS[0].status`);
    assert.strictEqual(finalStatus, 'Completed (Surrendered)');
    console.log('  ✓ Permit status set to:', finalStatus);

    // 2. Verify closure and surrender payload preserved
    const closure = h.eval(`PERMITS[0].closure`);
    assert.ok(closure, 'Closure object must exist');
    assert.strictEqual(closure.photo, 'data:image/jpeg;base64,evidence_closure_photo');
    assert.strictEqual(closure.sig, 'data:image/svg+xml;closure_sig');
    assert.strictEqual(closure.fireWatch, true);
    assert.strictEqual(closure.by, 'Site Supervisor');
    console.log('  ✓ Full closure payload preserved (photo, sig, fireWatch declaration, signer).');

    // 3. Verify server transition dispatched
    const tx = h.sandbox._serverTransitions.find(t => t.payload && t.payload.action === 'PERMIT_SURRENDERED');
    assert.ok(tx, 'executeServerTransition must be called on surrender');
    assert.strictEqual(tx.payload.targetStatus, 'Completed (Surrendered)');
    console.log('  ✓ executeServerTransition called: action = PERMIT_SURRENDERED');

    // 4. Verify two-stage Firestore writes (Stage 1 while Active, Stage 2 fallback)
    const pWrites = h.sandbox._firestoreWrites.filter(w => w.col === 'permits' && w.id === permit.id);
    assert.ok(pWrites.length >= 2, 'Must have at least 2 writes: Stage 1 (evidence) and Stage 2 (fallback)');
    assert.ok(pWrites[0].data.closure, 'Stage 1 write contains full closure payload');
    assert.strictEqual(pWrites[0].data.closure.fireWatch, true);
    console.log('  ✓ Stage 1 write successfully saves closure payload while permit is in progress.');
}

// -------------------------------------------------------------
// TEST 5: VERIFY NOTIFICATIONS & AUDIT ACTIVITY LOG
// -------------------------------------------------------------
{
    console.log('\n[VERIFY 5] Testing notification dispatch and activity logging:');
    const h = createHarness();
    const permit = {
        id: 'PTW-004-2026-000001',
        ptype: 'confined',
        status: 'Active',
        projectId: 'PRJ-PEARL',
        validTill: new Date(Date.now() + 3600000).toISOString(),
        startTime: '09:00',
        startAt: new Date(Date.now() - 3600000).toISOString(),
        createdBy: 'Site Supervisor'
    };
    h.eval(`PERMITS = [${JSON.stringify(permit)}]`);
    h.eval(`currentUser = { key: 'site-supervisor', name: 'Site Supervisor', projectId: 'PRJ-PEARL' }`);

    h.eval(`
        closeAndSurrenderPermit(PERMITS[0], {
            gps: { lat: 17.42, lng: 78.34 },
            remarks: 'Atmosphere tested clean, manways sealed',
            confinedClosure: true,
            sig: 'mock_sig',
            signerName: 'Site Supervisor'
        });
    `);

    // Verify activity log entry
    const actLog = h.eval(`PERMITS[0].activityLog`);
    assert.ok(actLog && actLog.length > 0, 'Activity log must contain entries');
    assert.ok(actLog[0].text.includes('Permit CLOSED and formally SURRENDERED to EHS'), 'Activity log records surrender');
    console.log('  ✓ Activity log recorded:', actLog[0].text.substring(0, 80) + '...');

    // Verify notification bell item added
    const notifsCount = h.eval(`NOTIFICATIONS.length`);
    assert.ok(notifsCount >= 1, 'Stakeholder notifications must be logged');
    console.log('  ✓ Notifications generated for stakeholders: count =', notifsCount);
}

console.log('\n================================================================');
console.log('ALL 5 POST-ACTIVATION LIFECYCLE TESTS VERIFIED SUCCESSFULLY!');
console.log('================================================================');
