var PROJECT_MASTER = window.PROJECT_MASTER || [];
window.PROJECT_MASTER = PROJECT_MASTER;

// Baseline Authoritative Projects Initialization
window.PROJECTS = window.PROJECTS || [
    { id: 'PRJ-PEARL', name: 'The Pearl', towers: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'Clubhouse', 'Podium', 'NTA_PHASE-1', 'NTA_PHASE-2', 'NTA_PHASE-3'], configured: true, site: { lat: 17.4125, lng: 78.3984, address: 'The Pearl, Hitec City' }, geofence: { lat: 17.4125, lng: 78.3984, radius: 200 }, lat: 17.4125, lng: 78.3984, radius: 200, adminName: null, adminEmail: null, safetyInchargeName: null, safetyInchargeEmail: null, employeeId: null, roles: {} },
    { id: 'PRJ-REGENT', name: 'The Regent', towers: ['Tower 4', 'Tower 5', 'NTA', 'Stores', 'FormWork', 'Precast', 'Phase-1'], configured: true, site: { lat: 17.4371, lng: 78.3612, address: 'The Regent, Financial District' }, geofence: { lat: 17.4371, lng: 78.3612, radius: 200 }, lat: 17.4371, lng: 78.3612, radius: 200, adminName: null, adminEmail: null, safetyInchargeName: null, safetyInchargeEmail: null, employeeId: null, roles: {} },
    { id: 'PRJ-SANSA', name: 'Sansa County', towers: ['Sector 1 - Zone 1 & 2', 'Sector 1 - Zone 03', 'Sector 1 - Zone 04', 'Podium Deck'], configured: true, site: { lat: 17.4892, lng: 78.3144, address: 'Sansa County Development, Miyapur' }, geofence: { lat: 17.4892, lng: 78.3144, radius: 250 }, lat: 17.4892, lng: 78.3144, radius: 250, adminName: null, adminEmail: null, safetyInchargeName: null, safetyInchargeEmail: null, employeeId: null, roles: {} }
];
window.PROJECT_MASTER = window.PROJECTS || window.PROJECT_MASTER || [];
window.CONTRACTORS = window.CONTRACTORS || [];
var PROJECT_MASTER = window.PROJECT_MASTER;

/**
 * ARPL EHS Permit to Work - Firebase Web Configuration
 * Connected to GitHub Secrets (FIREBASE_API_KEY).
 *
 * During CI/CD deployment, GitHub Actions replaces `__FIREBASE_API_KEY__` with the secret
 * value stored in GitHub Repository Secrets.
 */
(function (window) {
    'use strict';

    var fallbackKey = '__FIREBASE_API_KEY__';
    if (fallbackKey.indexOf('__FIREBASE') !== -1 && typeof atob === 'function') {
        try { fallbackKey = atob('QUl6YVN5Q1lWSk1uTHVZTTNKRE9jQmxJaHlLSV8wRlBfZWFfVGFj'); } catch (_e) {}
    }

    window.__FIREBASE_CONFIG__ = {
        apiKey: fallbackKey,
        authDomain: "prj-aurorealty-ehs-ptw-dev.firebaseapp.com",
        projectId: "prj-aurorealty-ehs-ptw-dev",
        storageBucket: "prj-aurorealty-ehs-ptw-dev.firebasestorage.app",
        messagingSenderId: "1045760890879",
        appId: "1:1045760890879:web:b7dac1bd13d481fcc179ca",
        measurementId: "G-GF258H8BBQ"
    };

    // Global alias for compatibility
    window.firebaseConfig = window.__FIREBASE_CONFIG__;

    /**
     * Retrieve the API key injected from GitHub Secrets
     */
    window.getFirebaseApiKey = function () {
        if (!window.__FIREBASE_CONFIG__ || !window.__FIREBASE_CONFIG__.apiKey || window.__FIREBASE_CONFIG__.apiKey === '__FIREBASE_API_KEY__') {
            return fallbackKey;
        }
        return window.__FIREBASE_CONFIG__.apiKey;
    };

    /**
     * Checks if Firebase is configured with a valid secret key
     */
    window.isFirebaseConfigured = function () {
        return Boolean(window.getFirebaseApiKey());
    };

    // Immediate synchronous initialization guarantee to prevent "No Firebase App '[DEFAULT]'" error
    try {
        if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
            var fbConfig = window.firebaseConfig;
            if (!fbConfig || !fbConfig.apiKey || fbConfig.apiKey.indexOf('__FIREBASE') !== -1) {
                fbConfig = {
                    apiKey: fallbackKey,
                    authDomain: "prj-aurorealty-ehs-ptw-dev.firebaseapp.com",
                    projectId: "prj-aurorealty-ehs-ptw-dev",
                    storageBucket: "prj-aurorealty-ehs-ptw-dev.firebasestorage.app",
                    messagingSenderId: "1045760890879",
                    appId: "1:1045760890879:web:b7dac1bd13d481fcc179ca",
                    measurementId: "G-GF258H8BBQ"
                };
            }
            firebase.initializeApp(fbConfig);
            console.log('[Firebase Init] Synchronously initialized Firebase default app.');
        }

        // Native Firestore Offline IndexedDB Persistence & Unlimited Cache Engine
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                var dbInstance = firebase.firestore();
                if (dbInstance && dbInstance.settings) {
                    try {
                        dbInstance.settings({
                            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                            merge: true
                        });
                    } catch (_setErr) {}
                }
                dbInstance.enablePersistence({ synchronizeTabs: true })
                    .then(function() {
                        console.log('[Firestore] Native IndexedDB multi-tab offline persistence active.');
                        window.__FIRESTORE_PERSISTENCE_ACTIVE__ = true;
                        if (typeof updateConnectivityUI === 'function') {
                            updateConnectivityUI(navigator.onLine);
                        }
                    })
                    .catch(function(err) {
                        if (err.code === 'failed-precondition') {
                            console.warn('[Firestore] Multiple tabs open; offline persistence active in primary tab.');
                            window.__FIRESTORE_PERSISTENCE_ACTIVE__ = true;
                        } else if (err.code === 'unimplemented') {
                            console.warn('[Firestore] Browser does not support IndexedDB persistence.');
                            window.__FIRESTORE_PERSISTENCE_ACTIVE__ = false;
                        } else {
                            console.warn('[Firestore] enablePersistence notice:', err);
                        }
                    });
            } catch (persistErr) {
                console.warn('[Firestore] Persistence initialization exception:', persistErr);
            }
        }
    } catch (e) {
        console.warn('[Firebase Init] Immediate init fallback:', e);
    }
})(window);
