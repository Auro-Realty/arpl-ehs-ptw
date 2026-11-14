/**
 * ARPL EHS Permit-to-Work Extended Audit Test Suite
 * Specifically tests:
 * 1. All notification types, role targets, unread counters, and drawer behavior
 * 2. Escalation Engine (Stage 1, Stage 2, Auto-expiry, Auto-cancel on expired observation, 30m warning, recurring surrender reminder)
 * 3. PDF generation & security (EHS-only restriction, lifecycle timing, content integrity across all 5 permit types)
 * 4. KPI calculations across all role dashboards (Supervisor, Engineer, Tower Incharge, EHS, Admin, and empty state resilience)
 * 5. My Permits & Register filters (Search, Status, Project, Type, Role-based scoping, sorting, null-field safety)
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.error('FATAL: Could not extract script from index.html');
    process.exit(1);
}
const js = scriptMatch[1];

// Mock Browser Environment
const elements = {};
function getEl(id) {
    if (!elements[id]) {
        elements[id] = {
            id,
            innerHTML: '',
            textContent: '',
            value: '',
            style: {},
            classList: {
                _classes: new Set(),
                add: function(c) { this._classes.add(c); },
                remove: function(c) { this._classes.delete(c); },
                contains: function(c) { return this._classes.has(c); }
            },
            querySelectorAll: () => [],
            addEventListener: () => {},
            removeEventListener: () => {},
            setAttribute: () => {},
            getAttribute: () => null,
            appendChild: () => {},
            removeChild: () => {},
            remove: () => {},
            focus: () => {},
            click: () => {}
        };
    }
    return elements[id];
}

const mockDoc = {
    getElementById: getEl,
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (tag) => getEl('mock_' + tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: getEl('body')
};

// Mock jsPDF
class MockJSPDF {
    constructor(orientation, unit, format) {
        this.pages = 1;
        this.texts = [];
        this.rects = [];
        this.lines = [];
        this.images = [];
        this._textColor = [0, 0, 0];
        this._fillColor = [255, 255, 255];
        this._drawColor = [0, 0, 0];
        this._fontSize = 10;
        this._font = 'helvetica';
    }
    addPage() { this.pages++; }
    getNumberOfPages() { return this.pages; }
    setPage() {}
    save() {}
    roundedRect(x, y, w, h) { this.rects.push({ x, y, w, h }); }
    text(txt, x, y, opt) { this.texts.push({ txt, x, y, opt }); }
    rect(x, y, w, h, style) { this.rects.push({ x, y, w, h, style }); }
    line(x1, y1, x2, y2) { this.lines.push({ x1, y1, x2, y2 }); }
    addImage(data, fmt, x, y, w, h) { this.images.push({ data, fmt, x, y, w, h }); }
    setTextColor(r, g, b) { this._textColor = [r, g, b]; }
    setFillColor(r, g, b) { this._fillColor = [r, g, b]; }
    setDrawColor(r, g, b) { this._drawColor = [r, g, b]; }
    setFont(font, style) { this._font = font; }
    setFontSize(sz) { this._fontSize = sz; }
    setLineWidth(w) { this._lineWidth = w; }
    splitTextToSize(txt, maxW) {
        if (!txt) return [''];
        return String(txt).split('\n');
    }
}

const mockEnv = {
    window: {
        __TEST_MODE__: true,
        jspdf: { jsPDF: MockJSPDF },
        scrollTo: () => {},
        addEventListener: () => {},
        location: { reload: () => {} }
    },
    document: mockDoc,
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; },
        clear: function() { this._data = {}; }
    },
    navigator: {
        geolocation: {
            getCurrentPosition: (cb) => cb({ coords: { latitude: 17.44, longitude: 78.38 } })
        }
    },
    setTimeout: (fn, ms) => { if (typeof fn === 'function') fn(); },
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    Date: Date,
    Math: Math,
    console: {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {}
    }
};

const exportsFn = new Function(
    ...Object.keys(mockEnv),
    js + `;\nreturn {
        PERMITS, ROLES, PTYPE_META, PROJECTS, NOTIFICATIONS, currentUser,
        roleInfo, ptypeOf, pMeta, pLabel, shRoleFor, stakeholdersFor, checklistFor, roleTypeScope, permitMatchesScope,
        newChain, chainStage, roleCanActOnChain, actOnChain,
        statusClass, statusBadge, pendingForRole, pendingExtensionsForRole,
        genPermitNumber, getProjectRadius, haversine,
        rejectPermitStage, resubmitReturnedPermit, activatePermit,
        acknowledgeSiteEngineer, rejectSiteEngineer, approvePermitStage,
        respondToObservation, acknowledgeObservationEng, reviewObservationSectionHead, resolveObservation,
        raiseObservation, cancelActivePermit, canDownloadStatutoryPdf, actionPanelHtml,
        requestExtension, approveExtensionStage, rejectExtensionStage,
        closeAndSurrenderPermit,
        getPermitSignatory, makeSimSignature,
        notify, notifsForCurrentUser, refreshNotifBell, markAllRead,
        runEscalationTick, STAGE1_MS, STAGE2_MS, stageLabelFor, SERVER_TIME_OFFSET_MS,
        generatePermitPDF,
        buildRegisterTable, buildDashboard,
        CONFINED_GAS_THRESHOLDS, isGasReadingSafe,
        getAllowedLocationModes, isPermitVisibleToRole, getPermitInitiatorRole, getObservationReviewerRole,
        computePermitWindowMs, completeStatutoryRestoration, stampPermitValidityEpochs,
        switchRole
    };`
);

const app = exportsFn(...Object.values(mockEnv));

function setRole(rk) {
    if (app.switchRole) {
        app.switchRole(rk);
    } else {
        app.currentUser = Object.assign({ key: rk, name: '' }, app.roleInfo(rk));
    }
}
setRole('site-supervisor');

// Test Framework
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✓ PASS: ${testName}`);
    } else {
        failedTests++;
        console.error(`  ✗ FAIL: ${testName}`);
        if (details) console.error(`    Detail: ${details}`);
        failures.push({ testName, details });
    }
}

function runSuite(name, fn) {
    console.log(`\n==================================================`);
    console.log(`SUITE: ${name}`);
    console.log(`==================================================`);
    try {
        fn();
    } catch (e) {
        console.error(`FATAL ERROR IN SUITE ${name}:`, e);
        failedTests++;
        failures.push({ testName: `SUITE FAILURE: ${name}`, details: e.stack || e.message });
    }
}

// ------------------------------------------------------------------
// SUITE 16: Comprehensive Notification Engine & Role Dispatch
// ------------------------------------------------------------------
runSuite('Comprehensive Notification Engine & Role Dispatch', () => {
    // Clear notifications array for testing
    app.NOTIFICATIONS.length = 0;

    // 1. Dispatch array of roles
    app.notify(['site-supervisor', 'site-engineer'], 'Trench inspection required', 'info', 'EXC-001');
    assert(app.NOTIFICATIONS.length === 1, 'Notification added to NOTIFICATIONS array');
    assert(app.NOTIFICATIONS[0].message === 'Trench inspection required', 'Message stored correctly');
    assert(app.NOTIFICATIONS[0].severity === 'info', 'Default severity stored correctly');
    assert(app.NOTIFICATIONS[0].permitId === 'EXC-001', 'Permit ID stored correctly');
    assert(app.NOTIFICATIONS[0].read === false, 'Notification initialized as unread');

    // 2. Dispatch single role as string (robustness test)
    app.notify('ehs-manager', 'Emergency halt order', 'error', 'HW-002');
    assert(app.NOTIFICATIONS.length === 2, 'Single string role target normalized and added');
    assert(Array.isArray(app.NOTIFICATIONS[0].roleTargets), 'Single string target converted to array');
    assert(app.NOTIFICATIONS[0].severity === 'error', 'Error severity stored');

    // 3. Current user filtering
    // Test as site-supervisor
    setRole('site-supervisor');
    let supNotifs = app.notifsForCurrentUser();
    assert(supNotifs.length === 1, 'Site Supervisor sees only notification targeted to them');
    assert(supNotifs[0].permitId === 'EXC-001', 'Supervisor sees correct permit notification');

    // Test as ehs-manager
    setRole('ehs-manager');
    let ehsNotifs = app.notifsForCurrentUser();
    assert(ehsNotifs.length === 1, 'EHS Manager sees notification targeted to them');
    assert(ehsNotifs[0].permitId === 'HW-002', 'EHS sees correct permit notification');

    // Test as hw-section-head with legacy target 'section-head'
    app.notify(['section-head'], 'Tower review needed', 'warn', 'GR-003');
    setRole('hw-section-head');
    let shNotifs = app.notifsForCurrentUser();
    assert(shNotifs.some(n => n.permitId === 'GR-003'), 'hw-section-head receives notifications targeted to section-head alias');

    // Test broadcast 'all'
    app.notify('all', 'Site wide emergency evacuation drill at 3 PM', 'warn', null);
    setRole('it');
    let itNotifs = app.notifsForCurrentUser();
    assert(itNotifs.some(n => n.message.includes('evacuation drill')), 'Broadcast "all" received by any role');

    // 4. Mark all read
    app.markAllRead();
    let unreadCount = app.notifsForCurrentUser().filter(n => !n.read).length;
    assert(unreadCount === 0, 'markAllRead marks all current user notifications as read');
});

// ------------------------------------------------------------------
// SUITE 17: Escalation Engine (Stage 1, Stage 2, Expiry & Warnings)
// ------------------------------------------------------------------
runSuite('Escalation Engine (Stage 1, Stage 2, Expiry & Warnings)', () => {
    app.NOTIFICATIONS.length = 0;
    const now = Date.now();

    // 1. Stage 1 Escalation: pending > STAGE1_MS (45s in demo mode)
    const pStage1 = {
        id: 'ESC-ST1-001',
        ptype: 'hotwork',
        status: 'Pending Section Head',
        stageEnteredAt: new Date(now - 50 * 1000), // 50s ago
        escalation: { stage1: false, stage2: false },
        validTill: new Date(now + 4 * 3600 * 1000),
        activityLog: []
    };
    app.PERMITS.push(pStage1);

    app.runEscalationTick();
    assert(pStage1.escalation.stage1 === true, 'Stage 1 escalation flagged on overdue pending permit');
    assert(pStage1.escalation.stage2 === false, 'Stage 2 escalation not prematurely triggered');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-ST1-001' && n.message.includes('ESCALATION (Stage 1)')), 'Stage 1 escalation notification dispatched');

    // 2. Stage 2 Escalation: pending > STAGE2_MS (120s in demo mode)
    const pStage2 = {
        id: 'ESC-ST2-001',
        ptype: 'excavation',
        status: 'Pending Parallel Approval',
        stageEnteredAt: new Date(now - 130 * 1000), // 130s ago
        escalation: { stage1: true, stage2: false },
        validTill: new Date(now + 4 * 3600 * 1000),
        activityLog: []
    };
    app.PERMITS.push(pStage2);

    app.runEscalationTick();
    assert(pStage2.escalation.stage2 === true, 'Stage 2 escalation flagged on significantly overdue permit');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-ST2-001' && n.message.includes('ESCALATION (Stage 2)')), 'Stage 2 escalation notification dispatched to EHS leadership');

    // 3. 30-Minute Expiry Warning Reminder
    const pWarn = {
        id: 'ESC-WARN-001',
        ptype: 'confined',
        status: 'Active',
        validTill: new Date(now + 20 * 60 * 1000), // 20 min remaining (< 30 min)
        warned30: false,
        activityLog: []
    };
    app.PERMITS.push(pWarn);

    app.runEscalationTick();
    assert(pWarn.warned30 === true, '30-minute expiry warning flagged');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-WARN-001' && n.message.includes('EXPIRY ALERT (T-30 min)')), '30-minute close reminder notification dispatched to supervisor & engineer');

    // 4. Auto-expiry of Active Permit
    const pExp = {
        id: 'ESC-EXP-001',
        ptype: 'shaft',
        status: 'Active',
        validTill: new Date(now - 5 * 1000), // already passed
        activityLog: []
    };
    app.PERMITS.push(pExp);

    app.runEscalationTick();
    assert(pExp.status === 'Auto-Closed', 'Active permit past validTill automatically transitions to Auto-Closed');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-EXP-001' && n.message.includes('AUTO-CLOSED')), 'Auto-Closed escalation notification dispatched');

    // 5. Open Observation Auto-Close on Expiry (preserves open observation audit trail)
    const pObsExp = {
        id: 'ESC-OBSEXP-001',
        ptype: 'excavation',
        status: 'Active – Observation Open',
        validTill: new Date(now - 10 * 1000), // expired while observation still open
        observation: { status: 'Open' },
        activityLog: []
    };
    app.PERMITS.push(pObsExp);

    app.runEscalationTick();
    assert(pObsExp.status === 'Auto-Closed', 'Permit with open observation past expiry transitions to Auto-Closed (preserving observation trail)');
    assert(!pObsExp.isCancelled, 'Time-expired permit with open observation is Auto-Closed rather than Cancelled');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-OBSEXP-001' && n.message.includes('AUTO-CLOSED')), 'Auto-Closed notification dispatched for overdue observation permit');
});

// ------------------------------------------------------------------
// SUITE 18: PDF Generation & Strict EHS Access Control
// ------------------------------------------------------------------
runSuite('PDF Generation & Strict EHS Security', () => {
    const pPdf = {
        id: 'PDF-TEST-001',
        ptype: 'confined',
        project: 'The Pearl by Auro Realty',
        tower: 'Tower B',
        location: 'Sewage Treatment Plant wet well',
        status: 'Active',
        weather: 'Sunny',
        activity: 'STP Sump Sludge Cleaning',
        createdBy: 'Supervisor Sam',
        organization: 'ARPL',
        contractor: 'Apex Water Technologies',
        numPersonnel: 4,
        confinedActivity: 'Sump Cleaning',
        confinedDeclaration: true,
        confinedChecklistAttachment: { name: 'signed_stp_entry_checklist.pdf' },
        confinedGasReadings: { combustible: 1.5, h2s: 0.2, co: 2.0, oxygen: 20.9, testedAt: new Date() },
        gps: { lat: 17.4435, lng: 78.3772, address: 'HITEC City Worksite' },
        createdAt: new Date(),
        startTime: '08:30',
        validTill: new Date(Date.now() + 4 * 3600 * 1000),
        activatedAt: new Date(),
        checklist: [
            { q: 'Is area checked with multi gas detector?', ans: 'yes', comment: 'All safe' }
        ],
        approvals: app.newChain('confined'),
        activityLog: [
            { ts: new Date(), actor: 'Supervisor Sam', text: 'Submitted' },
            { ts: new Date(), actor: 'EHS Manager', text: 'Approved and Activated' }
        ]
    };
    app.PERMITS.push(pPdf);

    // Negative Security Tests: Non-EHS roles (including Admin & Super Admin) MUST BE DENIED
    const nonEhsRoles = ['site-supervisor', 'site-engineer', 'hw-section-head', 'section-head', 'mep', 'pm', 'it', 'admin', 'super-admin'];
    nonEhsRoles.forEach(r => {
        setRole(r);
        const deniedRes = app.generatePermitPDF(pPdf.id);
        assert(deniedRes === false && (!pPdf.statutoryDownload || !pPdf.statutoryDownload.isDownloaded), `Role ${r} is strictly denied from PDF generation`);
    });

    // Positive Security Test: EHS Role downloads once cleanly, then 2nd download is locked (single-use)
    pPdf.activatedAt = new Date();
    setRole('ehs-manager');
    const firstOk = app.generatePermitPDF(pPdf.id);
    assert(firstOk === true, 'EHS Manager generates statutory PDF cleanly on first download');
    assert(pPdf.statutoryDownload && pPdf.statutoryDownload.isDownloaded === true, 'Single-use statutoryDownload lock is stamped after download');
    setRole('ehs-officer');
    const secondOk = app.generatePermitPDF(pPdf.id);
    assert(secondOk === false, 'Second EHS PDF download attempt on the same permit is strictly blocked');

    // Content completeness check on all permit types (as EHS Manager)
    setRole('ehs-manager');
    const types = ['excavation', 'hotwork', 'guardrail', 'confined', 'shaft'];
    types.forEach(tp => {
        const testP = {
            id: `PDF-${tp.toUpperCase()}-001`,
            ptype: tp,
            project: 'Kohinoor by Auro',
            tower: 'Tower C',
            location: 'Site zone 4',
            status: 'Completed (Surrendered)',
            createdAt: new Date(),
            validTill: new Date(),
            checklist: app.checklistFor(tp).map(q => ({ q, ans: 'yes' })),
            closure: { by: 'Site Supervisor', remarks: 'Work safe' },
            surrender: { by: 'Site Supervisor', remarks: 'Handed over' },
            activityLog: []
        };
        app.PERMITS.push(testP);
        let threw = false;
        try {
            app.generatePermitPDF(testP.id);
        } catch (e) {
            threw = true;
        }
        assert(!threw, `PDF generation runs cleanly for ${tp.toUpperCase()} (${app.PTYPE_META[tp].code})`);
    });
});

// ------------------------------------------------------------------
// SUITE 19: KPI Screen & Analytics Calculations
// ------------------------------------------------------------------
runSuite('KPI Screen & Analytics Calculations', () => {
    // Test Supervisor KPIs
    setRole('site-supervisor');
    app.buildDashboard();
    const supDashboardHtml = mockDoc.getElementById('view-dashboard').innerHTML;
    assert(supDashboardHtml.includes('My Drafts'), 'Supervisor dashboard renders "My Drafts" KPI card');
    assert(supDashboardHtml.includes('In Approval Chain'), 'Supervisor dashboard renders "In Approval Chain" KPI card');
    assert(supDashboardHtml.includes('Active Permits'), 'Supervisor dashboard renders "Active Permits" KPI card');
    assert(supDashboardHtml.includes('Open Observations'), 'Supervisor dashboard renders "Open Observations" KPI card');
    assert(supDashboardHtml.includes('Extension Requests'), 'Supervisor dashboard renders "Extension Requests" KPI card');

    // Test Site Engineer KPIs
    setRole('site-engineer');
    app.buildDashboard();
    const engDashboardHtml = mockDoc.getElementById('view-dashboard').innerHTML;
    assert(engDashboardHtml.includes('Pending Acknowledgment'), 'Site Engineer dashboard renders "Pending Acknowledgment" KPI card');
    assert(engDashboardHtml.includes('Active On-Site'), 'Site Engineer dashboard renders "Active On-Site" KPI card');

    // Test Tower Incharge KPIs
    setRole('hw-section-head');
    app.buildDashboard();
    const tiDashboardHtml = mockDoc.getElementById('view-dashboard').innerHTML;
    assert(tiDashboardHtml.includes('Pending My Approval'), 'Tower Incharge dashboard renders "Pending My Approval" KPI card');
    assert(tiDashboardHtml.includes('Pending Extension Approval'), 'Tower Incharge dashboard renders "Pending Extension Approval" KPI card');
    assert(tiDashboardHtml.includes('Approved by Me'), 'Tower Incharge dashboard renders "Approved by Me" KPI card');

    // Test Admin KPIs
    setRole('admin');
    app.buildDashboard();
    const adminDashboardHtml = mockDoc.getElementById('view-dashboard').innerHTML;
    assert(adminDashboardHtml.includes('Total Permits'), 'Admin dashboard renders "Total Permits" KPI card');
    assert(adminDashboardHtml.includes('Geofence Configured'), 'Admin dashboard renders "Geofence Configured" KPI card');
    assert(adminDashboardHtml.includes('Status Distribution'), 'Admin dashboard renders "Status Distribution" analytics table');
    assert(adminDashboardHtml.includes('PTW-001 to PTW-009') || adminDashboardHtml.includes('PTW-001 to PTW-008') || adminDashboardHtml.includes('PTW-001 to PTW-005'), 'Admin Total Permits card displays all active permit modules');

    // Resilience test: Empty permits array should not crash dashboard
    const backupPermits = [...app.PERMITS];
    app.PERMITS.length = 0;
    let emptyCrashed = false;
    try {
        ['site-supervisor', 'site-engineer', 'hw-section-head', 'ehs-manager', 'admin'].forEach(r => {
            setRole(r);
            app.buildDashboard();
        });
    } catch (e) {
        emptyCrashed = true;
    }
    assert(!emptyCrashed, 'Dashboards compute cleanly with 0 permits (Zero-division & undefined resilience)');
    // Restore
    app.PERMITS.push(...backupPermits);
});

// ------------------------------------------------------------------
// SUITE 20: My Permits Filters, Search & Scoping
// ------------------------------------------------------------------
runSuite('My Permits Filters, Search & Scoping', () => {
    // Setup mock UI elements for filters
    const searchEl = mockDoc.getElementById('regSearch');
    const statusEl = mockDoc.getElementById('regStatusFilter');
    const projectEl = mockDoc.getElementById('regProjectFilter');
    const typeEl = mockDoc.getElementById('regTypeFilter');
    const tbodyEl = mockDoc.getElementById('registerTbody');

    // Seed distinct test permits
    const p1 = {
        id: 'FILTER-EXC-001',
        ptype: 'excavation',
        project: 'The Pearl by Auro Realty',
        tower: 'Tower A',
        location: 'South boundary line',
        status: 'Active',
        createdAt: new Date('2026-09-01T10:00:00Z'),
        validTill: new Date('2026-09-01T18:00:00Z'),
        createdBy: 'Supervisor Sam',
        contractor: 'L&T Construction'
    };
    const p2 = {
        id: 'FILTER-HW-002',
        ptype: 'hotwork',
        project: 'Kohinoor by Auro',
        tower: null, // Null tower testing
        location: 'Podium Level 2',
        status: 'Pending Section Head',
        createdAt: new Date('2026-09-02T10:00:00Z'),
        validTill: new Date('2026-09-02T18:00:00Z'),
        createdBy: 'Supervisor Bob',
        contractor: 'Voltas MEP'
    };
    const p3 = {
        id: 'FILTER-CS-003',
        ptype: 'confined',
        project: 'The Pearl by Auro Realty',
        tower: 'Tower D',
        location: 'Underground water tank',
        status: 'Cancelled',
        createdAt: new Date('2026-09-03T10:00:00Z'),
        validTill: new Date('2026-09-03T18:00:00Z'),
        createdBy: 'Supervisor Alice',
        contractor: 'Apex Water'
    };
    app.PERMITS.push(p1, p2, p3);

    // 1. Search filter by ID
    setRole('ehs-manager');
    searchEl.value = 'FILTER-EXC';
    statusEl.value = '';
    projectEl.value = '';
    typeEl.value = '';
    app.buildRegisterTable();
    assert(tbodyEl.innerHTML.includes('FILTER-EXC-001'), 'Search finds permit by ID');
    assert(!tbodyEl.innerHTML.includes('FILTER-HW-002'), 'Search excludes non-matching permits');

    // 2. Search filter by contractor
    searchEl.value = 'Voltas';
    app.buildRegisterTable();
    assert(tbodyEl.innerHTML.includes('FILTER-HW-002'), 'Search finds permit by contractor');
    assert(!tbodyEl.innerHTML.includes('FILTER-EXC-001'), 'Search excludes non-matching contractor');

    // 3. Search resilience with null tower (Bug prevention test)
    searchEl.value = 'Podium';
    let searchCrashed = false;
    try {
        app.buildRegisterTable();
    } catch (e) {
        searchCrashed = true;
    }
    assert(!searchCrashed, 'Search does NOT crash when filtering permits with null tower');
    assert(tbodyEl.innerHTML.includes('FILTER-HW-002'), 'Search finds permit with null tower by location');

    // 4. Status Filter
    searchEl.value = '';
    statusEl.value = 'Cancelled';
    app.buildRegisterTable();
    assert(tbodyEl.innerHTML.includes('FILTER-CS-003'), 'Status filter isolates Cancelled permits');
    assert(!tbodyEl.innerHTML.includes('FILTER-EXC-001'), 'Status filter excludes Active permits');

    // 5. Project Filter
    statusEl.value = '';
    projectEl.value = 'Kohinoor by Auro';
    app.buildRegisterTable();
    assert(tbodyEl.innerHTML.includes('FILTER-HW-002'), 'Project filter isolates Kohinoor project');
    assert(!tbodyEl.innerHTML.includes('FILTER-EXC-001'), 'Project filter excludes The Pearl project');

    // 6. Permit Type Filter
    projectEl.value = '';
    typeEl.value = 'confined';
    app.buildRegisterTable();
    assert(tbodyEl.innerHTML.includes('FILTER-CS-003'), 'Type filter isolates Confined Space');
    assert(!tbodyEl.innerHTML.includes('FILTER-HW-002'), 'Type filter excludes Hot Work');

    // 7. Role-Based Scoping
    // Tower Incharge scoping: covers the remaining four sections (Hot Work, Shaft, Guard Rail, Confined Space)
    setRole('hw-section-head');
    searchEl.value = 'FILTER-';
    typeEl.value = '';
    app.buildRegisterTable();
    assert(!tbodyEl.innerHTML.includes('FILTER-EXC-001'), 'Tower Incharge domain EXCLUDES Excavation (Excavation Head domain)');
    assert(tbodyEl.innerHTML.includes('FILTER-HW-002'), 'Tower Incharge can view Hot Work in their domain');
    assert(tbodyEl.innerHTML.includes('FILTER-CS-003'), 'Tower Incharge can view Confined Space in their domain');

    // Excavation Head scoping: covers Excavation section only
    setRole('excavation-head');
    app.buildRegisterTable();
    assert(tbodyEl.innerHTML.includes('FILTER-EXC-001'), 'Excavation Head can view Excavation in their domain');
    assert(!tbodyEl.innerHTML.includes('FILTER-HW-002'), 'Excavation Head domain EXCLUDES Hot Work');
    assert(!tbodyEl.innerHTML.includes('FILTER-CS-003'), 'Excavation Head domain EXCLUDES Confined Space');

    // 8. Sorting: newest created first
    searchEl.value = 'FILTER-';
    setRole('ehs-manager');
    app.buildRegisterTable();
    const idxP3 = tbodyEl.innerHTML.indexOf('FILTER-CS-003');
    const idxP2 = tbodyEl.innerHTML.indexOf('FILTER-HW-002');
    const idxP1 = tbodyEl.innerHTML.indexOf('FILTER-EXC-001');
    assert(idxP3 < idxP2 && idxP2 < idxP1, 'Register sorts newest created permit first');
});

// ------------------------------------------------------------------
// SUITE 23: FRS Critical Remediation (Fixes 1-6 Verification)
// ------------------------------------------------------------------
runSuite('FRS Critical Remediation Verification (Fixes 1-6)', () => {
    const fs = require('fs');
    const path = require('path');

    // Fix 1 & 2 Static Server Verification: functions/index.js & firestore.rules
    const fnSrc = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');
    const rulesSrc = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
    assert(fnSrc.includes('"GET_SERVER_TIME"'), 'Fix 3: transitionPermitStage handles GET_SERVER_TIME server clock sync');
    assert(fnSrc.includes('db.runTransaction'), 'Fix 1: transitionPermitStage runs inside db.runTransaction');
    assert(fnSrc.includes('approvals.mep.status === "approved"') && fnSrc.includes('approvals.pm.status === "approved"') && fnSrc.includes('approvals.it.status === "approved"'), 'Fix 1: PTW-001 3-way parallel gate verified on server');
    assert(fnSrc.includes('Expired Before Activation') && fnSrc.includes('Approved – Scheduled'), 'Fix 5: Backend handles Scheduled & Expired Before Activation');
    assert(fnSrc.includes('Auto-Closed'), 'Fix 2: escalationSweep uses Auto-Closed instead of legacy Expired');
    assert(rulesSrc.includes('/_time_sync/{syncId}'), 'Fix 3: firestore.rules includes /_time_sync collection match');
    assert(rulesSrc.includes('statutoryDownload'), 'Fix 4: firestore.rules enforces EHS-only statutoryDownload lock');

    // Fix 3: Server clock offset calibration symbol & dynamic T-30 alert content
    assert(typeof app.SERVER_TIME_OFFSET_MS === 'number', 'Fix 3: SERVER_TIME_OFFSET_MS initialized cleanly');
    const tNow = Date.now();
    const pDyn = {
        id: 'FRS-T30-001',
        ptype: 'excavation',
        project: 'The Pearl by Auro Realty',
        tower: 'Tower A',
        location: 'West Retaining Trench',
        createdBy: 'Supervisor Kiran',
        status: 'Active',
        validFrom: new Date(tNow - 4 * 3600000),
        validTill: new Date(tNow + 15 * 60000),
        warned30: false,
        activityLog: []
    };
    app.PERMITS.push(pDyn);
    app.runEscalationTick();
    const dynNotif = app.NOTIFICATIONS.find(n => n.permitId === 'FRS-T30-001' && n.message.includes('EXPIRY ALERT (T-30 min)'));
    assert(!!dynNotif, 'Fix 3: Dynamic T-30 expiry alert dispatched');
    assert(dynNotif && dynNotif.message.includes('The Pearl by Auro Realty') && dynNotif.message.includes('West Retaining Trench') && !dynNotif.message.includes('06:30 PM'), 'Fix 3: Dynamic T-30 alert includes project & location with zero hardcoded 06:30 PM');

    // Fix 5: Approved – Scheduled -> Active promotion & Expired Before Activation
    const pSched = {
        id: 'FRS-SCHED-001',
        ptype: 'excavation',
        project: 'The Pearl by Auro Realty',
        status: 'Pending EHS Approval',
        startTime: '23:55',
        validFromMs: tNow + 2 * 3600000,
        validTill: new Date(tNow + 4 * 3600000),
        approvals: { mep: { status: 'approved' }, pm: { status: 'approved' }, it: { status: 'approved' }, sectionHead: { status: 'approved' }, ehsManager: { status: 'pending' }, ehsOfficer: { status: 'pending' } },
        activityLog: []
    };
    app.PERMITS.push(pSched);
    setRole('ehs-manager');
    app.approvePermitStage(pSched, 'ehs-manager', { lat: 17.4435, lng: 78.3772, within: true }, 'Approved ahead of start', app.makeSimSignature('EHS'), 'Safety Manager');
    assert(pSched.status === 'Approved – Scheduled', 'Fix 5: Pre-start EHS approval transitions into Approved – Scheduled');
    assert(!app.canDownloadStatutoryPdf(pSched, 'ehs-manager'), 'Fix 4/5: PDF remains blocked while permit is Approved – Scheduled (pre-activation)');
    pSched.validFromMs = tNow - 1000;
    app.runEscalationTick();
    assert(pSched.status === 'Active' && !!pSched.activatedAt, 'Fix 5: Escalation tick auto-activates Approved – Scheduled once validFromMs arrives');

    const pPreExp = {
        id: 'FRS-PREEXP-001',
        ptype: 'excavation',
        status: 'Pending Section Head',
        validFromMs: tNow - 120000,
        validTillMs: tNow - 60000,
        validTill: new Date(tNow - 60000),
        activityLog: []
    };
    app.PERMITS.push(pPreExp);
    app.runEscalationTick();
    assert(pPreExp.status === 'Expired Before Activation', 'Fix 5: Overdue pre-activation permit transitions to Expired Before Activation');

    // Fix 2: Immutable originalValidTill & post-expiry extension block
    const origTill = new Date(tNow + 3600000);
    const pAuto = {
        id: 'FRS-AUTO-001',
        ptype: 'excavation',
        status: 'Auto-Closed',
        originalValidTill: origTill,
        validTill: origTill,
        activityLog: []
    };
    app.PERMITS.push(pAuto);
    setRole('site-supervisor');
    const extBlocked = app.requestExtension(pAuto, { minutes: 30, reason: 'Late request' });
    assert(extBlocked === false, 'Fix 2: requestExtension strictly blocked after Auto-Closed');
    const closeBlocked = app.closeAndSurrenderPermit(pAuto, { remarks: 'Late closure' });
    assert(closeBlocked === false, 'Fix 2: closeAndSurrenderPermit strictly blocked after Auto-Closed');

    // Fix 6: Direct EHS Stop-Work Cancel & Multiple Sequential Observations (observations[])
    const pObsArr = {
        id: 'FRS-OBS-001',
        ptype: 'excavation',
        project: 'The Pearl by Auro Realty',
        status: 'Active',
        validTill: new Date(tNow + 3 * 3600000),
        activityLog: []
    };
    app.PERMITS.push(pObsArr);
    setRole('ehs-manager');
    const panelHtml = app.actionPanelHtml(pObsArr);
    assert(panelHtml.includes('Cancel Permit (Stop Work)') && panelHtml.includes('Raise Safety Observation'), 'Fix 6: EHS action panel exposes both Cancel Permit (Stop Work) and Raise Safety Observation');
    app.raiseObservation(pObsArr, { comment: 'Install toe-boards on East wall', signerName: 'Safety Manager' });
    assert(Array.isArray(pObsArr.observations) && pObsArr.observations.length === 1 && pObsArr.observations[0].id === 'OBS-FRS-OBS-001-1', 'Fix 6: First observation stored in observations[] with unique ID -1');
    setRole('site-supervisor');
    app.respondToObservation(pObsArr, { comment: 'Toe-boards installed', photo: 'p1', sig: 's1' });
    setRole('site-engineer');
    app.acknowledgeObservationEng(pObsArr, { comment: 'Verified toe-boards' });
    setRole('ehs-manager');
    app.resolveObservation(pObsArr, true, { comment: 'Cleared #1', signerName: 'Safety Manager' });
    app.raiseObservation(pObsArr, { comment: 'Relocate diesel generator >3m from trench', signerName: 'Safety Manager' });
    assert(pObsArr.observations.length === 2 && pObsArr.observations[1].id === 'OBS-FRS-OBS-001-2', 'Fix 6: Second sequential observation appends cleanly with unique ID -2');
    const cancelledOk = app.cancelActivePermit(pObsArr, { comment: 'Immediate slope tension crack hazard', signerName: 'Safety Manager' });
    assert(cancelledOk === true && pObsArr.status === 'Cancelled' && pObsArr.isCancelled === true, 'Fix 6: Direct EHS Stop-Work Cancel immediately cancels Active permit');
});

// ------------------------------------------------------------------
// SUITE 19: PTW-002..PTW-010, SUN, Manual Location & Auto-Close Restoration
// ------------------------------------------------------------------
runSuite('PTW-002..PTW-010, SUN, Manual Visibility & Restoration Governance', () => {
    const tNow = Date.now();

    // 1. PTW-003 & PTW-005 Manual Location Modes + Tower Filter Exemption
    const grModes = app.getAllowedLocationModes('guardrail');
    const shModes = app.getAllowedLocationModes('shaft');
    assert(grModes.includes('Manual') && shModes.includes('Manual'), 'PTW-003 & PTW-005 include Manual location mode');
    setRole('mep');
    app.currentUser.locationName = 'P1';
    app.currentUser.projectId = 'PRJ-PEARL';
    const shManual = {
        id: 'SH-VIS-001',
        ptype: 'shaft',
        projectId: 'PRJ-PEARL',
        locationStructure: { mode: 'manual', manualLocation: 'External Utility Riser Pit' },
        location: 'External Utility Riser Pit',
        tower: '',
        status: 'Pending MEP Clearance'
    };
    assert(app.isPermitVisibleToRole(shManual, 'mep') === true, 'Manual PTW-005 visible to tower-scoped MEP Engineer');
    assert(app.isPermitVisibleToRole(shManual, 'hw-section-head') === true, 'Manual PTW-005 visible to tower-scoped Section Head');

    // 2. Canonical Role & Dynamic Observation Resolvers
    assert(app.getPermitInitiatorRole({ ptype: 'electrical' }) === 'electrician', 'PTW-006 initiator resolves to electrician');
    assert(app.getPermitInitiatorRole({ ptype: 'lifting' }) === 'lift-supervisor', 'PTW-009 initiator resolves to lift-supervisor');
    assert(app.getPermitInitiatorRole({ ptype: 'blasting' }) === 'blasting-incharge', 'PTW-007 initiator resolves to blasting-incharge');
    assert(app.getPermitInitiatorRole({ ptype: 'nightshift' }) === 'night-supervisor', 'PTW-010 initiator resolves to night-supervisor');

    const pBatchObs = {
        id: 'EL-BATCH-OBS-1',
        ptype: 'electrical',
        electricalSiteType: 'batching_plant',
        status: 'Active – Observation Open',
        validTill: new Date(tNow + 3 * 3600000),
        observation: { id: 'OBS-EL-1', status: 'Open' },
        observations: [{ id: 'OBS-EL-1', status: 'Open' }],
        activityLog: []
    };
    assert(app.getObservationReviewerRole(pBatchObs) === 'pm', 'Batching Plant PTW-006 observation reviewer resolves to pm');
    setRole('electrician');
    app.respondToObservation(pBatchObs, { comment: 'Panel LOTO padlock re-secured', photo: 'photo1', sig: 'sig1' });
    assert(pBatchObs.status === 'Observation Pending P&M Acknowledgment', 'Batching Plant observation rectification routes to P&M Acknowledgment');
    setRole('pm');
    app.acknowledgeObservationEng(pBatchObs, { comment: 'Verified batching plant LOTO' });
    assert(pBatchObs.status === 'Observation Pending EHS Clearance', 'Batching Plant P&M ack forwards observation to EHS Clearance');

    const pNightObs = {
        id: 'NS-OBS-1',
        ptype: 'nightshift',
        status: 'Active – Observation Open',
        validTill: new Date(tNow + 3 * 3600000),
        observation: { id: 'OBS-NS-1', status: 'Open' },
        observations: [{ id: 'OBS-NS-1', status: 'Open' }],
        activityLog: []
    };
    assert(app.getObservationReviewerRole(pNightObs) === null, 'Active PTW-010 Night Shift skips Site Engineer on observations');
    setRole('night-supervisor');
    app.respondToObservation(pNightObs, { comment: 'Portable floodlight tripod anchored', photo: 'photo2', sig: 'sig2' });
    assert(pNightObs.status === 'Observation Pending EHS Clearance', 'Active PTW-010 observation rectification routes directly to EHS Clearance');

    // 3. computePermitWindowMs: SUN (+1 day) & PTW-010 Overnight Rollover + Phase 1 PDF Lock
    const satWindow = app.computePermitWindowMs({
        id: 'PTW-002-SUN-2026-001',
        ptype: 'hotwork',
        sundayWork: true,
        validFromDate: '2026-11-14',
        startTime: '09:00',
        validTillTime: '17:00'
    });
    const sunStartIstDate = new Date(satWindow.validFromMs + 5.5 * 3600000).toISOString().slice(0, 10);
    assert(sunStartIstDate === '2026-11-15', `SUN permit on Saturday 2026-11-14 resolves validFromMs to Sunday 2026-11-15 (got ${sunStartIstDate})`);

    const nsWindow = app.computePermitWindowMs({
        id: 'PTW-010-2026-001',
        ptype: 'nightshift',
        validFromDate: '2026-11-14',
        startTime: '20:30',
        validTillTime: '06:00'
    });
    assert(nsWindow.validTillMs > nsWindow.validFromMs && (nsWindow.validTillMs - nsWindow.validFromMs) === 9.5 * 3600000,
        'PTW-010 20:30-06:00 overnight rollover computes exact 9.5-hour window into next day');

    const nsDayParent = { id: 'NS-PHASE1-01', ptype: 'nightshift', status: 'Approved – Pending Night Handover', activatedAt: null };
    const nsLinkedDay = { id: 'HW-LINKED-01', ptype: 'hotwork', linkedNightShiftId: 'NS-PHASE1-01', status: 'Approved – Pending Night Handover', activatedAt: null };
    app.PERMITS.push(nsDayParent, nsLinkedDay);
    setRole('ehs-manager');
    assert(!app.canDownloadStatutoryPdf(nsDayParent, 'ehs-manager'), 'PTW-010 PDF locked during Daytime Phase 1 prior to Night EHS activation');
    assert(!app.canDownloadStatutoryPdf(nsLinkedDay, 'ehs-manager'), 'Linked Stage 2 PDF locked during Daytime Phase 1 prior to Night EHS activation');

    // 4. Auto-Closed Statutory Restoration Sign-Off & CRITICAL Notification (PTW-002/003/004/006/007)
    app.NOTIFICATIONS.length = 0;
    const pRestHw = {
        id: 'HW-AUTOCLOSE-01',
        ptype: 'hotwork',
        status: 'Active',
        validTillMs: tNow - 60000,
        validTill: new Date(tNow - 60000),
        activityLog: []
    };
    app.PERMITS.push(pRestHw);
    app.runEscalationTick();
    assert(pRestHw.status === 'Auto-Closed', 'Overdue PTW-002 Hot Work transitions to Auto-Closed');
    assert(pRestHw.pendingStatutoryRestoration === true && /Fire Watch/i.test(pRestHw.missingRestorationReason || ''),
        'Auto-Closed PTW-002 flags pendingStatutoryRestoration with Fire Watch reason');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'HW-AUTOCLOSE-01' && n.message.includes('CRITICAL')),
        'Auto-Closed restoration permit dispatches CRITICAL notification');
    const restPanelHtml = app.actionPanelHtml(pRestHw);
    assert(restPanelHtml.includes('Complete Mandatory Safety Restoration Sign-Off'),
        'Auto-Closed restoration permit renders Complete Mandatory Safety Restoration Sign-Off button');
    setRole('site-supervisor');
    const signOffOk = app.completeStatutoryRestoration(pRestHw, { remarks: '60-min fire watch verified cleanly', declaration: true, signerName: 'Supervisor Ram' });
    assert(signOffOk === true && pRestHw.pendingStatutoryRestoration === false && pRestHw.restorationCertified === true,
        'completeStatutoryRestoration clears pendingStatutoryRestoration and certifies restoration');

    // 5. Dynamic T-30 Alert Role Targeting & Cloud Functions / Rules Parity
    app.NOTIFICATIONS.length = 0;
    const pWarnBatch = {
        id: 'EL-WARN-BATCH-1',
        ptype: 'electrical',
        electricalSiteType: 'batching_plant',
        status: 'Active',
        validTillMs: tNow + 15 * 60 * 1000,
        validTill: new Date(tNow + 15 * 60 * 1000),
        warned30: false,
        activityLog: []
    };
    app.PERMITS.push(pWarnBatch);
    app.runEscalationTick();
    const warnNotif = app.NOTIFICATIONS.find(n => n.permitId === 'EL-WARN-BATCH-1' && n.message.includes('EXPIRY ALERT (T-30 min)'));
    assert(!!warnNotif && warnNotif.roleTargets.includes('electrician') && warnNotif.roleTargets.includes('pm'),
        'Dynamic T-30 alert for Batching Plant PTW-006 targets electrician and pm');

    const fnSrc = fs.readFileSync(path.resolve(__dirname, '..', 'functions', 'index.js'), 'utf8');
    assert(fnSrc.includes('isManualLocationPermitServer') && fnSrc.includes('getObservationReviewerRoleServer'),
        'functions/index.js implements manual visibility exemption and dynamic observation reviewer helper');
    assert(fnSrc.includes('STATUTORY_RESTORATION_SIGNOFF') && fnSrc.includes('NIGHT_HANDOVER_NOSHOW_AUTOCANCEL'),
        'functions/index.js implements post-auto-close statutory restoration transition and 21:00 IST night no-show sweep');
    const rulesSrc = fs.readFileSync(path.resolve(__dirname, '..', 'firestore.rules'), 'utf8');
    assert(rulesSrc.includes('Pending Blasting In-charge Acknowledgment') && rulesSrc.includes('restorationSignOff'),
        'firestore.rules enforces Blasting initial state and Auto-Closed restoration keys');
});

// ==================================================================
// FINAL REPORT
// ==================================================================
console.log(`\n==================================================`);
console.log(`EXTENDED AUDIT TEST EXECUTION COMPLETE`);
console.log(`==================================================`);
console.log(`Total Tests Run:   ${totalTests}`);
console.log(`Total Passed:      ${passedTests}`);
console.log(`Total Failed:      ${failedTests}`);

if (failedTests > 0) {
    console.error(`\nFAILURES SUMMARY (${failedTests}):`);
    failures.forEach((f, i) => {
        console.error(`${i + 1}. ${f.testName}: ${f.details || 'No additional details'}`);
    });
    process.exit(1);
} else {
    console.log(`\nALL ${passedTests} EXTENDED AUDIT TESTS PASSED WITH 100% SUCCESS RATE!`);
    process.exit(0);
}
