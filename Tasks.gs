/**
 * Tasks.gs
 * A "task" is one AI_Router call tied to a workflow step — kept separate
 * from WORKFLOW_STEPS so a step can be retried (new task, same step,
 * version+1) without ever losing the audit trail (Rule #4: log everything).
 */

function createTask(projectId, stepId, agentId, taskType, instruction, input) {
  var task = {
    task_id: generateId('TSK'),
    project_id: projectId,
    step_id: stepId,
    agent_id: agentId,
    task_type: taskType,
    instruction: instruction,
    status: 'RUNNING',
    input: typeof input === 'string' ? input : JSON.stringify(input),
    output: '',
    version: 1,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  appendRow('TASKS', task);
  return task;
}

function completeTask(taskId, output, status) {
  return updateById('TASKS', 'task_id', taskId, {
    output: typeof output === 'string' ? output : JSON.stringify(output),
    status: status || 'DONE',
    updated_at: nowIso(),
  });
}

function listTasksForProject(projectId) {
  return queryRows('TASKS', { project_id: projectId });
}
