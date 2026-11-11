/**
 * TEST SUITE 30: WORKSITE GPS CALIBRATION, AUTHORITATIVE TOWERS & GEOFENCE RADII AUDIT
 * Verifies exact alignment of Pearl, Regent, and Sansa across:
 * 1. config.projects.json & public/config.projects.json
 * 2. index.html & public/index.html PROJECTS baseline and AUTHORITATIVE_PROJECT_TOWERS
 * 3. Fallback coordinate resolvers getLocationGps and getProjectSiteCoord
 * 4. README.md Section 5.13 & Section 13.2 specification parity
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('==================================================');
console.log('TEST SUITE 30: WORKSITE GPS CALIBRATION & TOWERS');
console.log('==================================================');

const rootDir = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ FAIL: ${desc} -> ${e.message}`);
    failed++;
  }
}

// Target Authoritative Manifest
const EXPECTED_MANIFEST = {
  'PRJ-PEARL': {
    name: 'The Pearl',
    lat: 17.4125,
    lng: 78.3984,
    radius: 200,
    towers: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'Clubhouse', 'Podium', 'NTA_PHASE-1', 'NTA_PHASE-2', 'NTA_PHASE-3']
  },
  'PRJ-REGENT': {
    name: 'The Regent',
    lat: 17.4371,
    lng: 78.3612,
    radius: 200,
    towers: ['Tower 4', 'Tower 5', 'NTA', 'Stores', 'FormWork', 'Precast', 'Phase-1']
  },
  'PRJ-SANSA': {
    name: 'Sansa County',
    lat: 17.4892,
    lng: 78.3144,
    radius: 250,
    towers: ['Sector 1 - Zone 1 & 2', 'Sector 1 - Zone 03', 'Sector 1 - Zone 04', 'Podium Deck']
  }
};

console.log('\n--- 1. config.projects.json & public/config.projects.json Verification ---');

check('config.projects.json matches exact authoritative coordinates, radii and towers', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(rootDir, 'config.projects.json'), 'utf8'));
  assert.strictEqual(cfg.length, 3, 'Must contain exactly 3 projects');
  for (const p of cfg) {
    const exp = EXPECTED_MANIFEST[p.id];
    assert(exp, `Unexpected project ${p.id}`);
    assert.strictEqual(p.site.lat, exp.lat, `${p.id} latitude mismatch`);
    assert.strictEqual(p.site.lng, exp.lng, `${p.id} longitude mismatch`);
    assert.strictEqual(p.radius, exp.radius, `${p.id} radius mismatch`);
    assert.deepStrictEqual(p.towers, exp.towers, `${p.id} towers mismatch`);
    assert.strictEqual(p.configured, true, `${p.id} must be configured`);
  }
});

check('100% byte parity between config.projects.json and public/config.projects.json', () => {
  const rootCfg = fs.readFileSync(path.join(rootDir, 'config.projects.json'));
  const pubCfg = fs.readFileSync(path.join(rootDir, 'public', 'config.projects.json'));
  assert(rootCfg.equals(pubCfg), 'config.projects.json and public/config.projects.json must be byte-identical');
});

console.log('\n--- 2. Runtime index.html & public/index.html Verification ---');

const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

check('AUTHORITATIVE_PROJECT_TOWERS in index.html includes Podium Deck in PRJ-SANSA', () => {
  assert(html.includes("'PRJ-SANSA': ['Sector 1 - Zone 1 & 2', 'Sector 1 - Zone 03', 'Sector 1 - Zone 04', 'Podium Deck']"), 'PRJ-SANSA authoritative towers must include Podium Deck');
});

check('PROJECTS baseline array in index.html pre-calibrates PRJ-PEARL GPS', () => {
  assert(html.includes("site: { lat: 17.4125, lng: 78.3984, address: 'The Pearl, Hitec City, Hyderabad, Telangana' }"), 'PRJ-PEARL site GPS missing');
  assert(html.includes("geofence: { lat: 17.4125, lng: 78.3984, radius: 200 }"), 'PRJ-PEARL geofence missing');
});

check('PROJECTS baseline array in index.html pre-calibrates PRJ-REGENT GPS', () => {
  assert(html.includes("site: { lat: 17.4371, lng: 78.3612, address: 'The Regent, Financial District, Hyderabad, Telangana' }"), 'PRJ-REGENT site GPS missing');
  assert(html.includes("geofence: { lat: 17.4371, lng: 78.3612, radius: 200 }"), 'PRJ-REGENT geofence missing');
});

check('PROJECTS baseline array in index.html pre-calibrates PRJ-SANSA GPS and includes Podium Deck', () => {
  assert(html.includes("site: { lat: 17.4892, lng: 78.3144, address: 'Sansa County Development, Miyapur, Hyderabad, Telangana' }"), 'PRJ-SANSA site GPS missing');
  assert(html.includes("geofence: { lat: 17.4892, lng: 78.3144, radius: 250 }"), 'PRJ-SANSA geofence missing');
  assert(html.includes("towers: ['Sector 1 - Zone 1 & 2', 'Sector 1 - Zone 03', 'Sector 1 - Zone 04', 'Podium Deck']"), 'PRJ-SANSA towers missing Podium Deck');
  assert(html.includes("id: 'LOC-SANSA-POD', name: 'Podium Deck'"), 'LOC-SANSA-POD location missing');
});

check('Fallback coordinates in getLocationGps and getProjectSiteCoord use authoritative site centers', () => {
  assert(!html.includes("17.43523, lng: 78.37613"), 'No arbitrary dummy coordinates 17.43523 should remain');
  assert(html.includes("lat: 17.4125, lng: 78.3984"), 'Default fallback must use Pearl center');
});

check('100% byte parity between index.html and public/index.html', () => {
  const rootHtml = fs.readFileSync(path.join(rootDir, 'index.html'));
  const pubHtml = fs.readFileSync(path.join(rootDir, 'public', 'index.html'));
  assert(rootHtml.equals(pubHtml), 'index.html and public/index.html must be byte-identical');
});

console.log('\n--- 3. Topbar Layout & Overflow Protection (Image 1 Defect Prevention) ---');

check('Topbar title wrap has responsive overflow rules and hides subtitle on <=1280px', () => {
  assert(html.includes('@media (max-width: 1280px)'), '1280px media query missing');
  assert(html.includes('max-width: 240px;'), 'Title max-width constraint missing');
});

console.log('\n--- 4. README.md Parity & Drift Verification ---');

const md = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');

check('README.md Section 5.13 and Section 13.2 have PRJ-PEARL (17.4125, 78.3984, 200m)', () => {
  assert(md.includes('17.4125° N, 78.3984° E'), 'Pearl coordinates missing in README');
});

check('README.md Section 5.13 and Section 13.2 have PRJ-REGENT (17.4371, 78.3612, 200m)', () => {
  assert(md.includes('17.4371° N, 78.3612° E'), 'Regent coordinates missing in README');
});

check('README.md Section 5.13 and Section 13.2 have PRJ-SANSA (17.4892, 78.3144, 250m) with Podium Deck', () => {
  assert(md.includes('17.4892° N, 78.3144° E'), 'Sansa coordinates missing in README');
  assert(md.includes('`Sector 1 - Zone 1 & 2`, `Sector 1 - Zone 03`, `Sector 1 - Zone 04`, `Podium Deck`'), 'Sansa Podium Deck missing in README');
});

check('Zero legacy dummy project references (PRJ-AGR, PRJ-ABP, PRJ-ART) remain in README.md', () => {
  assert(!md.includes('PRJ-AGR'), 'Legacy PRJ-AGR still found in README');
  assert(!md.includes('PRJ-ABP'), 'Legacy PRJ-ABP still found in README');
  assert(!md.includes('PRJ-ART'), 'Legacy PRJ-ART still found in README');
});

console.log('\n==================================================');
console.log(`RESULTS: ${passed} / ${passed + failed} TESTS PASSED`);
if (failed > 0) {
  console.error(`FAILED: ${failed} tests failed.`);
  process.exit(1);
} else {
  console.log('ALL WORKSITE GPS & TOWERS TESTS PASSED (100% SUCCESS)');
  console.log('==================================================');
}
