// Initialize Firebase using the automatic Hosting helper (zero keys required!) or fallback to window.firebaseConfig
async function initFirebase() {
  try {
    let config = null;
    try {
      const response = await fetch('/__/firebase/init.json');
      if (response.ok) {
        config = await response.json();
      }
    } catch (e) {
      console.warn('Firebase Hosting init helper not available, using client config:', e);
    }
    
    if (!config && typeof window !== 'undefined' && window.firebaseConfig) {
      config = window.firebaseConfig;
    }
    
    if (config && typeof firebase !== 'undefined' && (!firebase.apps || firebase.apps.length === 0)) {
      firebase.initializeApp(config);
    }
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
      // Real-time Authentication Listener
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          // Get the user's secure ID token (JWT) with Custom Claims (role, projectId)
          const idTokenResult = await user.getIdTokenResult();
          const claims = idTokenResult.claims || {};
          
          currentUser = {
            key: claims.role || 'site-supervisor',
            label: typeof roleInfo === 'function' ? roleInfo(claims.role || 'site-supervisor').label : (claims.role || 'Site Supervisor'),
            name: user.displayName || claims.name || user.email.split('@')[0],
            projectId: claims.projectId || 'PRJ-PEARL'
          };
          
          // Update UI & go to dashboard
          const ls = document.getElementById('landingScreen');
          if (ls) ls.style.display = 'none';
          const ar = document.getElementById('appRoot');
          if (ar) ar.style.display = 'flex';
          const rb = document.getElementById('roleBadgeValue');
          if (rb) rb.textContent = currentUser.label;
          if (typeof goTo === 'function') goTo('dashboard');
        } else {
          // Show login overlay if not authenticated
          const ar = document.getElementById('appRoot');
          if (ar) ar.style.display = 'none';
          const ls = document.getElementById('landingScreen');
          if (ls) ls.style.display = 'flex';
        }
      });
    }
  } catch (err) {
    console.error('Error initializing Firebase Auth:', err);
  }
}

initFirebase();

// Update standard doLogin to authenticate via Firebase Auth
window.doLogin = function(roleKey) {
  let email = "";
  if (roleKey === "super-admin") email = "ehs.superadmin@aurorealty.com";
  else email = roleKey + "@aurorealty.com";
  
  const password = prompt(`Enter password for ${email}:`, "AuroSuperAdmin2026!");
  if (!password) return;
  
  const lt = document.getElementById('loadingText');
  const lo = document.getElementById('loadingOverlay');
  if (lt) lt.textContent = 'Authenticating via Firebase...';
  if (lo) lo.classList.add('show');
  
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        if (lo) lo.classList.remove('show');
        if (typeof showToast === 'function') showToast('Successfully authenticated!', 'ok');
      })
      .catch((error) => {
        if (lo) lo.classList.remove('show');
        if (typeof showToast === 'function') showToast('Authentication failed: ' + error.message, 'err');
      });
  } else {
    if (lo) lo.classList.remove('show');
    if (typeof showToast === 'function') showToast('Firebase Auth SDK not ready', 'err');
  }
};

// Update logout
window.doLogout = function() {
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    firebase.auth().signOut().then(() => {
      location.reload();
    });
  } else {
    location.reload();
  }
};
