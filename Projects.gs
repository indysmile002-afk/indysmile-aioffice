/**
 * Projects.gs
 */

function createProject(input) {
  var id = generateId('PRJ');
  var now = nowIso();
  var project = {
    project_id: id,
    project_name: input.name,
    description: input.description || '',
    type: input.type || 'General',
    status: 'ANALYZING',
    current_step: 0,
    progress: 0,
    created_at: now,
    updated_at: now,
  };
  appendRow('PROJECTS', project);
  getOrCreateProjectFolder(id, project.project_name); // pre-create its Drive folder
  return project;
}

function listProjects() {
  return getAllRows('PROJECTS').sort(function (a, b) {
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
}

function getProject(projectId) {
  var project = getById('PROJECTS', 'project_id', projectId);
  if (!project) throw new Error('Project not found: ' + projectId);
  project.steps = getWorkflowSteps(projectId);
  return project;
}

function touchProject_(projectId, updates) {
  updates.updated_at = nowIso();
  return updateById('PROJECTS', 'project_id', projectId, updates);
}
