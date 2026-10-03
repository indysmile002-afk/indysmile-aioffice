/**
 * Main.gs
 * Web App entry point.
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Only myself (while testing) — widen later if needed
 *
 * Every request is one JSON "action", e.g.:
 *   GET  ?action=listProjects
 *   POST { "action": "createProject", "name": "...", "type": "Video Content" }
 *
 * CORS note: Apps Script Web Apps don't support custom CORS preflight
 * handling. If the static frontend (index.html, opened from a different
 * origin) calls this with fetch(), send POST requests with
 * `Content-Type: text/plain;charset=utf-8` (NOT application/json) so the
 * browser skips the preflight request — doPost() below still parses the
 * JSON body correctly either way.
 */

var ROUTES = {
  // Projects
  listProjects: function () { return listProjects(); },
  getProject: function (p) { return getProject(p.projectId); },
  createProject: function (p) {
    var project = createProject(p);
    createWorkflowSteps(project.project_id, project.type);
    var first = getWorkflowSteps(project.project_id)[0];
    runStep(project.project_id, first.step_id);
    return getProject(project.project_id);
  },

  // Workflow / approvals
  getWorkflowSteps: function (p) { return getWorkflowSteps(p.projectId); },
  approveStep: function (p) { return approveStep(p.stepId, p.feedback, p.approvedBy); },
  rejectStep: function (p) { return rejectStep(p.stepId, p.feedback, p.rollbackScope || 'self', p.rejectedBy); },

  // Agents / logs
  listAgents: function () { return getAllRows('AGENTS'); },
  listLogs: function (p) { return queryRows('AI_LOGS', p.projectId ? { project_id: p.projectId } : null); },

  // Files
  listProjectFiles: function (p) {
    var project = getById('PROJECTS', 'project_id', p.projectId);
    return listProjectFiles(p.projectId, project.project_name);
  },
};

function doGet(e) {
  return handleRequest_((e && e.parameter) || {});
}

function doPost(e) {
  var body = {};
  if (e && e.postData && e.postData.contents) {
    body = safeParseJson(e.postData.contents, {});
  }
  var params = Object.assign({}, (e && e.parameter) || {}, body);
  return handleRequest_(params);
}

function handleRequest_(params) {
  try {
    // assertAuthorized(); // uncomment once ALLOWLIST_EMAILS is set in Script Properties
    var action = params.action;
    var handler = ROUTES[action];
    if (!handler) return errorResponse('Unknown action: ' + action, 'UNKNOWN_ACTION');
    return okResponse(handler(params));
  } catch (err) {
    return errorResponse(err.message, 'SERVER_ERROR');
  }
}
