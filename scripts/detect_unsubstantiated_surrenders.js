/**
 * READ-ONLY DETECTOR: UNSUBSTANTIATED SURRENDER AUDIT
 *
 * Scans Firestore collection 'permits' (or a provided JSON dump) for permits in status
 * 'Completed (Surrendered)' that lack mandatory closure or surrender evidence.
 *
 * Usage:
 *   1. Against Live Firestore (in Cloud Shell with Google ADC, or with GOOGLE_APPLICATION_CREDENTIALS):
 *        node scripts/detect_unsubstantiated_surrenders.js
 *   2. Against Local Emulator:
 *        FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/detect_unsubstantiated_surrenders.js
 *   3. Against exported JSON dump:
 *        node scripts/detect_unsubstantiated_surrenders.js path/to/permits.json
 */

const fs = require('fs');
const path = require('path');

const MANDATORY_CLOSURE_FIELDS = [
    { key: 'closure', name: 'Closure Payload Object' },
    { key: 'closure.sig', name: 'Digital Signature' },
    { key: 'closure.photo', name: 'Site Photo Evidence' },
    { key: 'closure.gps', name: 'GPS Coordinates' },
    { key: 'closure.signerName', fallback: 'closure.by', name: 'Signatory Name' },
    { key: 'closure.closedAt', name: 'Closure Timestamp' }
];

function getNestedValue(obj, path) {
    if (!obj) return undefined;
    const parts = path.split('.');
    let curr = obj;
    for (const p of parts) {
        if (curr == null) return undefined;
        curr = curr[p];
    }
    return curr;
}

function checkPermitEvidence(p) {
    const defects = [];

    // 1. General closure payload check
    for (const field of MANDATORY_CLOSURE_FIELDS) {
        const val = getNestedValue(p, field.key);
        const altVal = field.fallback ? getNestedValue(p, field.fallback) : undefined;
        if (!val && !altVal) {
            defects.push(`Missing ${field.name} (${field.key})`);
        } else if (field.key === 'closure.gps') {
            if (val.lat == null || val.lng == null) {
                defects.push('Incomplete GPS: lat/lng coordinates missing');
            }
        }
    }

    // 2. Surrender object check
    if (!p.surrender) {
        defects.push('Missing Surrender Payload Object (surrender)');
    }

    // 3. Process-specific statutory declarations
    const ptype = (p.ptype || '').toLowerCase();
    const cl = p.closure || {};

    if (ptype === 'hotwork' || p.id.startsWith('PTW-002')) {
        if (!cl.fireWatch) defects.push('PTW-002: Missing 1-hr continuous Fire Watch declaration (closure.fireWatch)');
    } else if (ptype === 'guardrail' || p.id.startsWith('PTW-003')) {
        if (!cl.guardrailReFix) defects.push('PTW-003: Missing Guard Rail & Opening Re-fixing declaration (closure.guardrailReFix)');
    } else if (ptype === 'confined' || p.id.startsWith('PTW-004')) {
        if (!cl.confinedClosure) defects.push('PTW-004: Missing Confined Space Evacuation & Atmosphere declaration (closure.confinedClosure)');
    } else if (ptype === 'electrical' || p.id.startsWith('PTW-006')) {
        if (!cl.electricalSurrender && !cl.electricalClosureConfirmed) defects.push('PTW-006: Missing Electrical Lockout Surrender declaration (closure.electricalSurrender)');
    } else if (ptype === 'blasting' || p.id.startsWith('PTW-007')) {
        if ((p.dbOperationType === 'Blasting' || p.drillingBlastingType === 'blasting') && !cl.blastingPostClearance) {
            defects.push('PTW-007: Missing Post-Blast Clearance & Zero-Misfire declaration (closure.blastingPostClearance)');
        }
    } else if (ptype === 'general' || p.id.startsWith('PTW-008')) {
        if (!cl.generalHousekeeping && !cl.generalHousekeepingConfirmed) defects.push('PTW-008: Missing Housekeeping & Area Clearance declaration (closure.generalHousekeeping)');
    } else if (ptype === 'lifting' || p.id.startsWith('PTW-009')) {
        if (!cl.liftingDemob && !cl.liftingDemobilizationConfirmed) defects.push('PTW-009: Missing Lifting Demobilization & Rigging declaration (closure.liftingDemob)');
    } else if (ptype === 'nightshift' || p.id.startsWith('PTW-010')) {
        if (!cl.nightClosure && !cl.nightClosureConfirmed) defects.push('PTW-010: Missing Night Shift Worker Evacuation & Lighting De-energization declaration (closure.nightClosure)');
    }

    return defects;
}

async function run() {
    console.log('================================================================');
    console.log('AUDIT DETECTOR: UNSUBSTANTIATED SURRENDER EVIDENCE');
    console.log('================================================================');

    const jsonArg = process.argv[2];
    let permits = [];

    if (jsonArg && fs.existsSync(jsonArg)) {
        console.log(`[Source] Reading local JSON file: ${jsonArg}`);
        const raw = fs.readFileSync(jsonArg, 'utf8');
        const parsed = JSON.parse(raw);
        permits = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } else {
        console.log('[Source] Connecting to Firestore...');
        try {
            const admin = require('firebase-admin');
            if (!admin.apps.length) admin.initializeApp();
            const db = admin.firestore();
            const snap = await db.collection('permits')
                .where('status', '==', 'Completed (Surrendered)')
                .get();
            snap.forEach(doc => permits.push(Object.assign({ id: doc.id }, doc.data())));
        } catch (e) {
            console.error('\n[Error] Unable to initialize Firestore Admin SDK:');
            console.error(e.message);
            console.log('\nAlternative: Pass an exported JSON file:');
            console.log('  node scripts/detect_unsubstantiated_surrenders.js permits.json\n');
            process.exit(1);
        }
    }

    const surrendered = permits.filter(p => p && p.status === 'Completed (Surrendered)');
    console.log(`Found ${surrendered.length} permits in status 'Completed (Surrendered)'.`);

    let defectiveCount = 0;
    const report = [];

    for (const p of surrendered) {
        const defects = checkPermitEvidence(p);
        if (defects.length > 0) {
            defectiveCount++;
            report.push({
                id: p.id,
                project: p.projectId || p.project || 'Unknown',
                ptype: p.ptype || p.permitType || 'Unknown',
                defects
            });
        }
    }

    console.log('\n----------------------------------------------------------------');
    console.log(`AUDIT RESULTS: ${defectiveCount} / ${surrendered.length} PERMITS LACK CLOSURE EVIDENCE`);
    console.log('----------------------------------------------------------------');

    if (report.length === 0) {
        console.log('✓ All Completed (Surrendered) permits contain full closure & surrender evidence.');
    } else {
        report.forEach((r, idx) => {
            console.log(`\n[${idx + 1}] Permit ID: ${r.id} | Project: ${r.project} | Process: ${r.ptype}`);
            r.defects.forEach(d => console.log(`    ✗ ${d}`));
        });
    }

    console.log('\n================================================================');
}

run().catch(console.error);
