window.PROJECTS = window.PROJECTS || [];
window.PROJECT_MASTER = window.PROJECTS || window.PROJECT_MASTER || [];
var PROJECT_MASTER = window.PROJECT_MASTER;
// ARPL EHS Enterprise Authentication & Session Protection Bridge
(function () {
  window.doLogin = function () {
    console.warn('RBAC: Direct role login is permanently disabled. Please authenticate via Unified Login.');
    return false;
  };

  window.switchRole = function () {
    console.warn('RBAC: Role switching is permanently disabled.');
    return false;
  };
})();
