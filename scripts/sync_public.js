/**
 * ARPL EHS PTW - Canonical Asset Synchronization Engine
 * Guarantees 100% byte parity between root development files and /public deployment files.
 * Prevents split-brain desync before test execution and CI/CD deployment.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Canonical file pairs to synchronize (ONE-WAY: rootSource -> publicDestination)
const FILE_MAPPINGS = [
    { root: 'index.html', public: 'public/index.html' },
    { root: 'ptw_swimlanes.html', public: 'public/ptw_swimlanes.html' },
    { root: 'config.projects.json', public: 'public/config.projects.json' },
    { root: 'firebase-config.js', public: 'public/firebase-config.js' },
    { root: '404.html', public: 'public/404.html' },
    { root: 'auro-realty-logo.png', public: 'public/auro-realty-logo.png' },
    { root: 'auro-realty-gradient.png', public: 'public/auro-realty-gradient.png' },
    { root: 'pptxgen.bundle.js', public: 'public/pptxgen.bundle.js' }
];

function getHash(filePath) {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex');
}

console.log('================================================================');
console.log('CANONICAL ASSET SYNCHRONIZATION: ONE-WAY ROOT -> /public');
console.log('================================================================');

let allMatched = true;

for (const mapping of FILE_MAPPINGS) {
    const rootPath = path.join(ROOT_DIR, mapping.root);
    const pubPath = path.join(ROOT_DIR, mapping.public);

    if (!fs.existsSync(rootPath)) {
        console.warn(`[WARN] Skipping optional asset (not found in root): ${mapping.root}`);
        continue;
    }

    // One-way copy: canonical root file -> public
    fs.copyFileSync(rootPath, pubPath);

    // Compute checksums
    const rootHash = getHash(rootPath);
    const pubHash = getHash(pubPath);
    const rootSize = fs.statSync(rootPath).size;
    const pubSize = fs.statSync(pubPath).size;

    if (rootHash === pubHash && rootSize === pubSize) {
        console.log(`  ✓ PARITY CONFIRMED: ${mapping.root} <==> ${mapping.public} (${rootSize.toLocaleString()} bytes)`);
    } else {
        console.error(`  ❌ HASH MISMATCH: ${mapping.root} (${rootHash.slice(0, 8)}) !== ${mapping.public} (${pubHash.slice(0, 8)})`);
        allMatched = false;
    }
}

if (!allMatched) {
    console.error('\nCRITICAL: Split-brain desync detected! Synchronization failed.');
    process.exit(1);
}

console.log('\nAsset synchronization 100% complete. Root and /public assets are byte-identical.');
console.log('================================================================\n');
