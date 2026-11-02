/**
 * Comprehensive Responsive Viewport Verification Suite
 * Tests responsive design rules, media queries, touch ergonomics,
 * overflow safeguards, and elastic component behaviors in index.html.
 */
const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

console.log('==================================================');
console.log('TEST SUITE: Responsive Design & Cross-Device Ergonomics');
console.log('==================================================\n');

let passed = 0;
let total = 0;

function it(desc, fn) {
    total++;
    try {
        fn();
        console.log(`  ✓ PASS: ${desc}`);
        passed++;
    } catch (e) {
        console.error(`  ✗ FAIL: ${desc}\n     -> ${e.message}`);
    }
}

// 1. Viewport Meta Configuration
it('Includes correct responsive viewport configuration with safe area cover and accessibility zoom', () => {
    const vpMatch = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
    assert(vpMatch, 'Viewport meta tag not found');
    const content = vpMatch[1];
    assert(content.includes('width=device-width'), 'Missing width=device-width');
    assert(content.includes('initial-scale=1.0'), 'Missing initial-scale=1.0');
    assert(content.includes('viewport-fit=cover'), 'Missing viewport-fit=cover for notched devices');
    assert(!content.includes('user-scalable=no'), 'Disabling user-scalable harms accessibility');
});

// 2. Global Overflow & Box Sizing
it('Prevents unwanted horizontal scroll with overflow-x: hidden and box-sizing border-box', () => {
    assert(html.includes('overflow-x: hidden'), 'Missing overflow-x: hidden on body/html');
    assert(html.includes('box-sizing: border-box'), 'Missing universal box-sizing: border-box');
});

// 3. Mobile Phones (< 580px)
it('Configures mobile phone tier (< 580px) with bottom-sheet modals and stacked action layouts', () => {
    assert(html.includes('@media (max-width: 580px)'), 'Missing @media (max-width: 580px)');
    assert(html.includes('border-radius: 18px 18px 0 0'), 'Modals should transform to bottom sheets on mobile');
    assert(html.includes('align-items: flex-end'), 'Modal overlay should align to bottom on mobile');
    assert(html.includes('flex-direction: column-reverse'), 'Wizard/modal footers should reverse-stack buttons for thumb reachability');
});

// 4. Ultra-Compact Phones (<= 360px)
it('Configures ultra-compact phones (<= 360px) with compact stepper and padding', () => {
    assert(html.includes('@media (max-width: 360px)'), 'Missing @media (max-width: 360px)');
    assert(html.includes('max-width: 90px'), 'Topbar title truncates on very narrow screens');
});

// 5. Tablets Portrait / Phablets (<= 768px)
it('Configures tablets portrait / phablets (<= 768px) with 16px inputs to stop iOS zoom', () => {
    assert(html.includes('@media (max-width: 768px)'), 'Missing @media (max-width: 768px)');
    assert(html.includes('font-size: 16px !important'), 'Inputs must be >= 16px on mobile to avoid iOS Safari zoom');
    assert(html.includes('min-height: 44px'), 'Interactive elements must satisfy >= 44px tap targets');
});

// 6. Tablets Landscape & Drawers (<= 960px)
it('Configures sidebar off-canvas drawer with smooth transition and backdrop on <= 960px', () => {
    assert(html.includes('@media (max-width: 960px)'), 'Missing @media (max-width: 960px)');
    assert(html.includes('left: -320px'), 'Sidebar is off-canvas when closed on <= 960px');
    assert(html.includes('#mobileNavBtn'), 'Hamburger toggle is enabled on <= 960px');
});

// 7. Laptops & Standard Desktops (<= 1200px)
it('Adapts multi-column cards and detail grids smoothly on <= 1200px', () => {
    assert(html.includes('@media (max-width: 1200px)'), 'Missing @media (max-width: 1200px)');
});

// 8. Large Screens & 4K Ultrawide (>= 1920px)
it('Caps maximum content width on ultra-wide screens (>= 1920px) to prevent excessive stretching', () => {
    assert(html.includes('@media (min-width: 1920px)'), 'Missing @media (min-width: 1920px)');
    assert(html.includes('max-width: 1560px'), 'Content width capped to 1560px on ultra-wide monitors');
});

// 9. Mobile Landscape (max-height: 500px)
it('Optimizes modals for mobile landscape viewports (height <= 500px)', () => {
    assert(html.includes('max-height: 500px') && html.includes('orientation: landscape'), 'Missing mobile landscape query');
    assert(html.includes('max-height: 98vh') || html.includes('max-height: 98dvh'), 'Modals expand vertically in landscape');
});

// 10. Touch Ergonomics (pointer: coarse)
it('Enlarges tap targets to >= 44px on coarse pointer (touch) devices', () => {
    assert(html.includes('@media (pointer: coarse)'), 'Missing @media (pointer: coarse)');
    assert(html.includes('.nav-link') && html.includes('min-height: 44px'), 'Nav links have >= 44px tap height on touch');
});

// 11. Table Container Responsiveness & Sticky Headers
it('Wraps tables in elastic horizontal scrolling containers with sticky headers & first column', () => {
    assert(html.includes('.table-scroll') && html.includes('.table-responsive') && html.includes('.table-wrap'), 'Table container aliases missing');
    assert(html.includes('overscroll-behavior-x: contain'), 'Missing overscroll-behavior-x contain on table scrolls');
    assert(html.includes('position: sticky') && html.includes('left: 0'), 'Missing sticky first column for mobile tables');
});

// 12. Modal Scroll Isolation
it('Isolates modal scrolling with overscroll-behavior: contain', () => {
    const modalBodyMatches = html.match(/\.modal-body\s*\{[^}]*overscroll-behavior:\s*contain/g);
    assert(modalBodyMatches && modalBodyMatches.length >= 2, 'Missing overscroll-behavior: contain on base and mobile modal-body');
});

// 13. High DPI / Retina Signature Pad Elasticity
it('Configures canvas signatures with touch-action: none and getBoundingClientRect scaling', () => {
    assert(html.includes('touch-action: none'), 'Canvas must have touch-action: none to prevent scroll conflict');
    assert(html.includes('getBoundingClientRect()'), 'Signature coordinate calculation must scale relative to bounding rect');
});

// 14. Geofence Radar Scaling
it('Configures geofence radar canvas with aspect-ratio: 1 / 1 and 100% elastic width', () => {
    assert(html.includes('geofence-radar-canvas'), 'geofence-radar-canvas class missing');
    assert(html.includes('aspect-ratio: 1 / 1'), 'Radar canvas aspect-ratio 1:1 missing');
});

// 15. Safe Area Insets
it('Supports device safe area insets for notches, dynamic islands, and home indicators', () => {
    assert(html.includes('safe-area-inset-top'), 'Missing safe-area-inset-top');
    assert(html.includes('safe-area-inset-bottom'), 'Missing safe-area-inset-bottom');
    assert(html.includes('safe-area-inset-left'), 'Missing safe-area-inset-left');
    assert(html.includes('safe-area-inset-right'), 'Missing safe-area-inset-right');
});

console.log(`\n==================================================`);
console.log(`RESPONSIVE TEST RESULTS: ${passed}/${total} passed (${Math.round(passed / total * 100)}%)`);
console.log(`==================================================\n`);

if (passed !== total) process.exit(1);
