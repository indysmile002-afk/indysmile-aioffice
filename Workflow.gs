/**
 * Workflow.gs
 * Workflow templates (per project type) + the dependency graph from the
 * blueprint: when a step changes, everything that depends_on it must be
 * considered for regeneration (Rule #3).
 */

var WORKFLOW_TEMPLATES = {
  'Video Content': [
    { name: 'วิเคราะห์โจทย์', agent: 'AG000', requiresApproval: false },
    { name: 'คิดคอนเซ็ปต์', agent: 'AG001', requiresApproval: true },
    { name: 'เขียนสคริปต์', agent: 'AG001', requiresApproval: true },
    { name: 'เขียน Prompt', agent: 'AG004', requiresApproval: true },
    { name: 'สร้างวิดีโอ', agent: 'AG005', requiresApproval: true },
    { name: 'ตัดต่อวิดีโอ', agent: 'AG006', requiresApproval: true },
    { name: 'ตรวจสอบ QA', agent: 'AG007', requiresApproval: true },
  ],
  Document: [
    { name: 'เก็บข้อมูล', agent: 'AG003', requiresApproval: false },
    { name: 'วิเคราะห์', agent: 'AG003', requiresApproval: false },
    { name: 'สร้างรายงาน', agent: 'AG003', requiresApproval: true },
    { name: 'ตรวจสอบ', agent: 'AG007', requiresApproval: true },
  ],
  General: [
    { name: 'วิเคราะห์โจทย์', agent: 'AG000', requiresApproval: false },
    { name: 'ดำเนินการ', agent: 'AG001', requiresApproval: true },
    { name: 'ตรวจสอบ QA', agent: 'AG007', requiresApproval: true },
  ],
};

/** Creates every WORKFLOW_STEPS row for a project. Step 1 is READY, the rest LOCKED. */
function createWorkflowSteps(projectId, type) {
  var template = WORKFLOW_TEMPLATES[type] || WORKFLOW_TEMPLATES.General;
  var steps = [];
  template.forEach(function (def, i) {
    var step = {
      step_id: generateId('STP'),
      project_id: projectId,
      step_order: i + 1,
      step_name: def.name,
      agent_id: def.agent,
      status: i === 0 ? 'READY' : 'LOCKED',
      requires_approval: def.requiresApproval ? 'TRUE' : 'FALSE',
      depends_on: i === 0 ? '' : steps[i - 1].step_id,
      version: 1,
    };
    appendRow('WORKFLOW_STEPS', step);
    steps.push(step);
  });
  return steps;
}

function getWorkflowSteps(projectId) {
  return queryRows('WORKFLOW_STEPS', { project_id: projectId })
    .sort(function (a, b) { return a.step_order - b.step_order; });
}

function getStep(stepId) {
  var step = getById('WORKFLOW_STEPS', 'step_id', stepId);
  if (!step) throw new Error('Step not found: ' + stepId);
  return step;
}

/** Every step (direct + transitive) that depends_on the given step. */
function getDependentSteps(projectId, stepId) {
  var steps = getWorkflowSteps(projectId);
  var dependents = [];
  var frontier = [stepId];
  while (frontier.length) {
    var current = frontier.pop();
    steps.forEach(function (s) {
      if (s.depends_on === current) {
        dependents.push(s);
        frontier.push(s.step_id);
      }
    });
  }
  return dependents;
}

function setStepStatus(stepId, status, extra) {
  var updates = Object.assign({ status: status }, extra || {});
  return updateById('WORKFLOW_STEPS', 'step_id', stepId, updates);
}
