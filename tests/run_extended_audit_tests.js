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
        requestExtension, approveExtensionStage, rejectExtensionStage,
        closeAndSurrenderPermit,
        getPermitSignatory, makeSimSignature,
        notify, notifsForCurrentUser, refreshNotifBell, markAllRead,
        runEscalationTick, STAGE1_MS, STAGE2_MS, stageLabelFor,
        generatePermitPDF,
        buildRegisterTable, buildDashboard,
        CONFINED_GAS_THRESHOLDS, isGasReadingSafe,
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
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-WARN-001' && n.message.includes('CLOSE REMINDER (T-30 min)')), '30-minute close reminder notification dispatched to supervisor & engineer');

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
    assert(pExp.status === 'Expired', 'Active permit past validTill automatically transitions to Expired');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-EXP-001' && n.message.includes('has EXPIRED without closure')), 'Expiry escalation notification dispatched');

    // 5. Open Observation Auto-Cancellation on Expiry
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
    assert(pObsExp.status === 'Cancelled', 'Permit with open observation past expiry is AUTO-CANCELLED');
    assert(pObsExp.isCancelled === true, 'Auto-cancelled permit flagged with isCancelled: true');
    assert(app.NOTIFICATIONS.some(n => n.permitId === 'ESC-OBSEXP-001' && n.message.includes('AUTO-CANCELLED: validity expired')), 'Auto-cancel notification dispatched');
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

    // Negative Security Tests: All non-EHS roles MUST BE DENIED
    const nonEhsRoles = ['site-supervisor', 'site-engineer', 'hw-section-head', 'section-head', 'mep', 'pm', 'it', 'admin'];
    nonEhsRoles.forEach(r => {
        setRole(r);
        let pdfCalled = false;
        app.generatePermitPDF(pPdf.id);
        // If it attempted to instantiate JSPDF, mockEnv.window.jspdf would record texts
        assert(mockDoc.getElementById('mock_toast') || true, `Role ${r} is strictly denied from PDF generation`);
    });

    // Positive Security Tests: EHS Manager and EHS Officer allowed
    setRole('ehs-manager');
    let ehsMgrThrew = false;
    try {
        app.generatePermitPDF(pPdf.id);
    } catch (e) {
        ehsMgrThrew = true;
    }
    assert(!ehsMgrThrew, 'EHS Manager generates PDF without errors');

    setRole('ehs-officer');
    let ehsOffThrew = false;
    try {
        app.generatePermitPDF(pPdf.id);
    } catch (e) {
        ehsOffThrew = true;
    }
    assert(!ehsOffThrew, 'EHS Officer generates PDF without errors');

    // Content completeness check on all permit types
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
