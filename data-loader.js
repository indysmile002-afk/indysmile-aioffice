/**
 * data-loader.js
 * Talks to AIOfficeAPI (js/config.js) and reshapes the responses into the
 * same AIOffice.* structures the UI already renders — so layout.js,
 * dashboard.js and workflow.js barely had to change.
 */
(function () {
  var STEP_STATUS_MAP = {
    DONE: 'done',
    WAITING_APPROVAL: 'active',
    RUNNING: 'progress',
    READY: 'progress',
    REVISING: 'progress',
    LOCKED: 'locked',
    FAILED: 'rejected',
  };

  var PLACEHOLDER_THUMB = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop';
  // ยังไม่มีระบบสร้าง cover image จริงต่อโปรเจกต์ (Phase 2) — ใช้รูป placeholder เดียวกันไปก่อน

  function fmtDateTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  function projectStatusFromSteps(steps) {
    if (!steps.length) return 'in_progress';
    if (steps.some(function (s) { return s.status === 'WAITING_APPROVAL'; })) return 'waiting_approval';
    if (steps.some(function (s) { return s.status === 'FAILED'; })) return 'rejected';
    if (steps.every(function (s) { return s.status === 'DONE'; })) return 'done';
    return 'in_progress';
  }

  function mapStep(step, agentsById) {
    var agent = agentsById[step.agent_id];
    var meta = AIOffice.agentMeta[step.agent_id] || { icon: '🤖' };
    return {
      key: step.step_id,
      name: step.step_name,
      agent: agent ? agent.agent_name : step.agent_id,
      icon: meta.icon,
      status: STEP_STATUS_MAP[step.status] || 'locked',
      raw: step,
    };
  }

  async function loadAgents() {
    var rows = await AIOfficeAPI.call('listAgents');
    var byId = {};
    rows.forEach(function (a) { byId[a.agent_id] = a; });
    return { list: rows, byId: byId };
  }

  async function loadProjectsDetailed(agentsById) {
    var rows = await AIOfficeAPI.call('listProjects');
    var detailed = await Promise.all(rows.map(function (p) {
      return AIOfficeAPI.call('getProject', { projectId: p.project_id });
    }));
    return detailed.map(function (p) {
      var rawSteps = (p.steps || []).slice().sort(function (a, b) { return a.step_order - b.step_order; });
      var steps = rawSteps.map(function (s) { return mapStep(s, agentsById); });
      var activeIdx = steps.findIndex(function (s) { return s.status === 'active' || s.status === 'progress'; });
      return {
        id: p.project_id,
        name: p.project_name,
        type: p.type,
        status: projectStatusFromSteps(rawSteps),
        thumb: PLACEHOLDER_THUMB,
        createdAt: fmtDateTime(p.created_at),
        updatedAt: fmtDateTime(p.updated_at),
        owner: 'Boss',
        currentStepIndex: activeIdx === -1 ? Math.max(0, steps.length - 1) : activeIdx,
        steps: steps,
      };
    });
  }

  function buildApprovalsQueue(projects) {
    var queue = [];
    projects.forEach(function (p) {
      var waiting = p.steps.find(function (s) { return s.status === 'active'; });
      if (waiting) queue.push({ projectId: p.id, title: p.name, step: waiting.name, agent: waiting.agent, thumb: p.thumb });
    });
    return queue;
  }

  async function buildActivity(agentsById, projectsById) {
    var logs = await AIOfficeAPI.call('listLogs', {});
    return logs
      .slice()
      .sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); })
      .slice(0, 8)
      .map(function (l) {
        var agent = agentsById[l.agent_id];
        var meta = AIOffice.agentMeta[l.agent_id] || { icon: '🤖' };
        var project = projectsById[l.project_id];
        return {
          icon: meta.icon,
          title: (agent ? agent.agent_name : l.agent_id) + (l.action === 'revise_step' ? ' แก้ไขงาน' : ' ส่งมอบงาน'),
          sub: 'โปรเจกต์: ' + (project ? project.name : l.project_id),
          time: fmtTime(l.timestamp),
        };
      });
  }

  function computeStats(projects) {
    return {
      total: projects.length,
      waiting: projects.filter(function (p) { return p.status === 'waiting_approval'; }).length,
      inProgress: projects.filter(function (p) { return p.status === 'in_progress'; }).length,
      done: projects.filter(function (p) { return p.status === 'done'; }).length,
    };
  }

  window.AIOfficeData = {
    /** Loads everything Dashboard needs straight into window.AIOffice.* */
    async loadDashboard() {
      var agents = await loadAgents();
      var projects = await loadProjectsDetailed(agents.byId);
      var projectsById = {};
      projects.forEach(function (p) { projectsById[p.id] = p; });

      AIOffice.agents = agents.list;
      AIOffice.projects = projects;
      AIOffice.approvalsQueue = buildApprovalsQueue(projects);
      AIOffice.activity = await buildActivity(agents.byId, projectsById);
      AIOffice.stats = computeStats(projects);
      return AIOffice;
    },

    /** Loads one project's full detail (steps + task outputs + files + history) for workflow.html */
    async loadProject(projectId) {
      var agents = await loadAgents();
      var p = await AIOfficeAPI.call('getProject', { projectId: projectId });
      var rawSteps = (p.steps || []).slice().sort(function (a, b) { return a.step_order - b.step_order; });
      var steps = rawSteps.map(function (s) { return mapStep(s, agents.byId); });

      var tasks = await AIOfficeAPI.call('listTasks', { projectId: projectId }).catch(function () { return []; });
      var tasksByStep = {};
      tasks.forEach(function (t) {
        (tasksByStep[t.step_id] = tasksByStep[t.step_id] || []).push(t);
      });
      Object.keys(tasksByStep).forEach(function (k) {
        tasksByStep[k].sort(function (a, b) { return new Date(a.created_at) - new Date(b.created_at); });
      });

      var logs = await AIOfficeAPI.call('listLogs', { projectId: projectId }).catch(function () { return []; });
      var history = logs
        .slice()
        .sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); })
        .map(function (l) {
          var agent = agents.byId[l.agent_id];
          var name = agent ? agent.agent_name : l.agent_id;
          return {
            title: name + (l.action === 'revise_step' ? ' แก้ไขงาน (revision)' : ' ทำงานขั้นตอนนี้'),
            agent: name,
            sub: l.model ? 'ผ่าน ' + l.model : l.action,
            time: fmtTime(l.timestamp),
            kind: l.action === 'revise_step' ? 'active' : 'done',
          };
        });

      var files = await AIOfficeAPI.call('listProjectFiles', { projectId: projectId }).catch(function () { return []; });

      return {
        id: p.project_id,
        name: p.project_name,
        type: p.type,
        status: projectStatusFromSteps(rawSteps),
        thumb: PLACEHOLDER_THUMB,
        createdAt: fmtDateTime(p.created_at),
        updatedAt: fmtDateTime(p.updated_at),
        owner: 'Boss',
        steps: steps,
        tasksByStep: tasksByStep,
        history: history,
        files: files,
      };
    },
  };
})();
