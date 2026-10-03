/**
 * Auth.gs
 * Lightweight allowlist for a single-user / small-team system.
 *
 * Real access control happens at the Web App deployment level:
 *   Deploy > New deployment > Web app > "Execute as: Me", "Who has access: Only myself"
 * This allowlist is a second layer, useful once you widen access beyond
 * "Only myself" (e.g. to "Anyone within [your Workspace domain]").
 *
 * Set it via Script Properties:
 *   ALLOWLIST_EMAILS = you@example.com,teammate@example.com
 * Leave it unset while developing — an empty allowlist means "allow everyone
 * who can open the deployment", matching a single-owner dev setup.
 */

function isEmailAllowed(email) {
  if (!email) return false;
  var allowlist = getProperty('ALLOWLIST_EMAILS', '');
  var allowed = allowlist.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.indexOf(email.toLowerCase()) !== -1;
}

function getCurrentUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  } catch (e) {
    return '';
  }
}

function assertAuthorized() {
  var email = getCurrentUserEmail();
  if (!isEmailAllowed(email)) {
    throw new Error('Unauthorized: ' + (email || 'unknown user'));
  }
  return email;
}
