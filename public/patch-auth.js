var PROJECT_MASTER = window.PROJECT_MASTER || [];
window.PROJECT_MASTER = PROJECT_MASTER;
// ARPL EHS Enterprise Authentication & Session Protection Bridge
(function () {
  // Ensure legacy demo persona switching & in-memory logins are strictly blocked
  window.doLogin = function (roleKey) {
    console.warn('Blocked: Direct role login is disabled. Please authenticate via Unified Login.');
    return false;
  };

  window.switchRole = function (roleKey) {
    console.warn('Blocked: Role switching is disabled in production enterprise environment.');
    if (typeof showToast === 'function') {
      showToast('Unauthorized: Persona switching is disabled. You must log out to switch accounts.', 'warn');
    }
    return false;
  };
})();
