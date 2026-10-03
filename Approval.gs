/**
 * Approval.gs
 * Implements Rule #1 (AI never skips the approval gate), #2 (reject ->
 * reason -> AI revises -> re-submit), #3 (upstream change cascades to
 * dependent steps), #4 (log everything).
 */

/** Runs the AI for a step and marks it WAITING_APPROVAL (or DONE if requires_approval is FALSE). */
function runStep(projectId, stepId) {
  var project = getById('PROJECTS', 'project_id', projectId);
  var step = getStep(stepId);
  var agent = getById('AGENTS', 'agent_id', step.agent_id);
  if (!agent) throw new Error('Agent not found: ' + step.agent_id);

  setStepStatus(stepId, 'RUNNING');

  var priorSteps = getWorkflowSteps(projectId).filter(function (s) { return s.step_order < step.step_order; });
  var context = buildStepContext_(project, step, priorSteps);

  var task = createTask(projectId, stepId, agent.agent_id, step.step_name, context.instruction, context.contextText);
  var result = callAgent(agent, context.instruction, context.contextText);
  completeTask(task.task_id, result.text, result.ok ? 'DONE' : 'FAILED');
  logAi_(projectId, task.task_id, agent.agent_id, result.model, 'run_step', context.contextText, result.text, result.durationMs);

  if (!result.ok) {
    setStepStatus(stepId, 'FAILED');
    return { step: getStep(stepId), task: task, result: result };
  }

  var needsApproval = String(step.requires_approval).toUpperCase() === 'TRUE';
  setStepStatus(stepId, needsApproval ? 'WAITING_APPROVAL' : 'DONE');
  if (!needsApproval) advanceWorkflow_(projectId, step);

  return { step: getStep(stepId), task: task, result: result };
}

function buildStepContext_(project, step, priorSteps) {
  var priorOutputs = priorSteps.map(function (s) {
    var tasks = queryRows('TASKS', { step_id: s.step_id }).filter(function (t) { return t.status === 'DONE'; });
    var latest = tasks[tasks.length - 1];
    return latest ? { step: s.step_name, output: latest.output } : null;
  }).filter(Boolean);

  var instruction = 'ทำขั้นตอน "' + step.step_name + '" สำหรับโปรเจกต์ "' + project.project_name + '" (ประเภท: ' + project.type + ')';
  var contextText = 'PROJECT: ' + project.project_name +
    '\nDESCRIPTION: ' + (project.description || '-') +
    '\n\nPRIOR STEP OUTPUTS:\n' + (priorOutputs.length
      ? priorOutputs.map(function (p) { return '- ' + p.step + ': ' + p.output; }).join('\n')
      : '(none — this is an early step)') +
    '\n\nRespond ONLY with JSON matching a reasonable structured schema for this step type. No prose outside the JSON.';

  return { instruction: instruction, contextText: contextText };
}

/** Boss approves the step currently WAITING_APPROVAL. */
function approveStep(stepId, feedback, approvedBy) {
  var step = getStep(stepId);
  setStepStatus(stepId, 'DONE');
  logApproval_(step.project_id, stepId, step.version, 'APPROVED', feedback || '', approvedBy);
  advanceWorkflow_(step.project_id, step);
  return getStep(stepId);
}

/** Unlocks + runs the next step in order; marks the project DONE once the last step is approved. */
function advanceWorkflow_(projectId, completedStep) {
  var steps = getWorkflowSteps(projectId);
  var next = steps.filter(function (s) { return s.step_order === completedStep.step_order + 1; })[0];
  var doneCount = steps.filter(function (s) { return s.status === 'DONE'; }).length;
  touchProject_(projectId, { current_step: completedStep.step_order, progress: Math.round((doneCount / steps.length) * 100) });

  if (!next) {
    touchProject_(projectId, { status: 'DONE', progress: 100 });
    return;
  }
  setStepStatus(next.step_id, 'READY');
  runStep(projectId, next.step_id);
}

/**
 * Boss rejects a step with a reason. Per Rule #2/#3: bump the step's
 * version, re-run it with the feedback folded in, and — if rollbackScope is
 * "cascade" — lock every dependent step so they get regenerated once this
 * step is re-approved and the workflow reaches them again.
 * rollbackScope: 'self' (default) | 'cascade'
 */
function rejectStep(stepId, feedback, rollbackScope, rejectedBy) {
  var step = getStep(stepId);
  logApproval_(step.project_id, stepId, step.version, 'REJECTED', feedback, rejectedBy);

  if (rollbackScope === 'cascade') {
    getDependentSteps(step.project_id, stepId).forEach(function (s) {
      setStepStatus(s.step_id, 'LOCKED');
    });
  }

  setStepStatus(stepId, 'REVISING', { version: Number(step.version) + 1 });

  var project = getById('PROJECTS', 'project_id', step.project_id);
  var agent = getById('AGENTS', 'agent_id', step.agent_id);
  var priorSteps = getWorkflowSteps(step.project_id).filter(function (s) { return s.step_order < step.step_order; });
  var context = buildStepContext_(project, step, priorSteps);

  var priorTasks = queryRows('TASKS', { step_id: stepId }).filter(function (t) { return t.status === 'DONE'; });
  var previousOutput = priorTasks.length ? priorTasks[priorTasks.length - 1].output : '(no previous output)';

  var revisePrompt = context.contextText +
    '\n\nPREVIOUS OUTPUT (rejected by Boss):\n' + previousOutput +
    '\n\nBOSS FEEDBACK (reason for rejection):\n' + feedback +
    '\n\nProduce a revised version (v' + (Number(step.version) + 1) + ') that directly addresses the feedback above.';

  var task = createTask(step.project_id, stepId, agent.agent_id, step.step_name + ' (revision)', context.instruction, revisePrompt);
  var result = callAgent(agent, context.instruction, revisePrompt);
  completeTask(task.task_id, result.text, result.ok ? 'DONE' : 'FAILED');
  logAi_(step.project_id, task.task_id, agent.agent_id, result.model, 'revise_step', revisePrompt, result.text, result.durationMs);

  setStepStatus(stepId, result.ok ? 'WAITING_APPROVAL' : 'FAILED');
  return getStep(stepId);
}

function logApproval_(projectId, stepId, version, status, feedback, approvedBy) {
  appendRow('APPROVALS', {
    approval_id: generateId('APR'),
    project_id: projectId,
    step_id: stepId,
    version: version,
    status: status,
    feedback: feedback || '',
    approved_by: approvedBy || getCurrentUserEmail(),
    created_at: nowIso(),
  });
}

function logAi_(projectId, taskId, agentId, model, action, input, output, durationMs) {
  appendRow('AI_LOGS', {
    log_id: generateId('LOG'),
    project_id: projectId,
    task_id: taskId,
    agent_id: agentId,
    model: model,
    action: action,
    input: String(input).slice(0, 5000),
    output: String(output).slice(0, 5000),
    timestamp: nowIso(),
    duration: durationMs || 0,
  });
}
