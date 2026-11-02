/**
 * ARPL EHS Permit to Work - Firebase Web Configuration
 * Connected to GitHub Secrets (FIREBASE_API_KEY).
 *
 * During CI/CD deployment, GitHub Actions replaces `__FIREBASE_API_KEY__` with the secret
 * value stored in GitHub Repository Secrets.
 */
(function (window) {
    'use strict';

    window.__FIREBASE_CONFIG__ = {
        apiKey: "__FIREBASE_API_KEY__",
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
            console.warn('[Firebase Config] Firebase API key not yet injected from GitHub Secrets.');
            return '';
        }
        return window.__FIREBASE_CONFIG__.apiKey;
    };

    /**
     * Checks if Firebase is configured with a valid secret key
     */
    window.isFirebaseConfigured = function () {
        return Boolean(window.getFirebaseApiKey());
    };
})(window);
