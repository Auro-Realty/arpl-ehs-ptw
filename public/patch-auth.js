// Initialize Firebase using the automatic Hosting helper (zero keys required!)
fetch('/__/firebase/init.json').then(async response => {
  const config = await response.json();
  firebase.initializeApp(config);
  
  // Real-time Authentication Listener
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // Get the user's secure ID token (JWT) with Custom Claims (role, projectId)
      const idTokenResult = await user.getIdTokenResult();
      const claims = idTokenResult.claims;
      
      currentUser = {
        key: claims.role || 'site-supervisor',
        label: roleInfo(claims.role || 'site-supervisor').label,
        name: user.displayName || claims.name || user.email.split('@')[0],
        projectId: claims.projectId || 'PRJ-PEARL'
      };
      
      // Update UI & go to dashboard
      document.getElementById('landingScreen').style.display = 'none';
      document.getElementById('appRoot').style.display = 'flex';
      const rb = document.getElementById('roleBadgeValue');
      if (rb) rb.textContent = currentUser.label;
      goTo('dashboard');
    } else {
      // Show login overlay if not authenticated
      document.getElementById('appRoot').style.display = 'none';
      document.getElementById('landingScreen').style.display = 'flex';
    }
  });
});

// Update standard doLogin to authenticate via Firebase Auth
window.doLogin = function(roleKey) {
  // Let the user enter their real password seeded in Phase 7
  let email = "";
  if (roleKey === "super-admin") email = "ehs.superadmin@aurorealty.com";
  else email = roleKey + "@aurorealty.com";
  
  const password = prompt(`Enter password for ${email}:`, "AuroSuperAdmin2026!");
  if (!password) return;
  
  document.getElementById('loadingText').textContent = 'Authenticating via Firebase...';
  document.getElementById('loadingOverlay').classList.add('show');
  
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('loadingOverlay').classList.remove('show');
      showToast('Successfully authenticated!', 'ok');
    })
    .catch((error) => {
      document.getElementById('loadingOverlay').classList.remove('show');
      showToast('Authentication failed: ' + error.message, 'err');
    });
};

// Update logout
window.doLogout = function() {
  firebase.auth().signOut().then(() => {
    location.reload();
  });
};
