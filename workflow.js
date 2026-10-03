(function () {
  AIOfficeLayout.init('workflows');

  var params = new URLSearchParams(location.search);
  var projectId = params.get('id');

  var STATUS_ICON_CLASS = { done: 'done', active: 'active', progress: 'progress', locked: 'locked', rejected: 'rejected' };
  var STATUS_LABEL = { done: 'เสร็จสิ้น', active: 'รออนุมัติ', progress: 'กำลังทำ', locked: 'รอขั้นตอนก่อนหน้า', rejected: 'ถูกปฏิเสธ' };
  var STATUS_COLOR = { done: 'var(--green)', active: 'var(--yellow)', progress: 'var(--blue)', locked: 'var(--text-low)', rejected: 'var(--red)' };

  var project = null;
  var selectedIndex = 0;

  function fileIconFor(mimeType) {
    if (!mimeType) return ['📁', 'rgba(255,255,255,.06)'];
    if (mimeType.indexOf('image') === 0) return ['🖼️', 'rgba(79,140,255,.15)'];
    if (mimeType.indexOf('video') === 0) return ['🎞️', 'rgba(245,166,35,.15)'];
    if (mimeType.indexOf('pdf') !== -1) return ['📄', 'rgba(242,85,95,.15)'];
    return ['📁', 'rgba(255,255,255,.06)'];
  }

  function fmtBytes(n) {
    if (!n) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function boot() {
    if (!projectId) {
      document.getElementById('detail-card').innerHTML = AIOfficeLayout.errorState('ไม่พบ project id ใน URL — เปิดหน้านี้ผ่านลิงก์ "ดูโปรเจกต์" จาก Dashboard แทน');
      document.getElementById('wf-header').style.display = 'none';
      document.querySelector('.chain-wrap').style.display = 'none';
      return;
    }
    document.getElementById('detail-card').innerHTML = AIOfficeLayout.loadingState('กำลังโหลดโปรเจกต์...');
    try {
      project = await AIOfficeData.loadProject(projectId);
      selectedIndex = Math.max(0, project.steps.findIndex(function (s) { return s.status === 'active' || s.status === 'progress'; }));
      document.getElementById('topbar-root').innerHTML = AIOfficeLayout.renderTopbar({ crumbs: ['Workflows', project.name] });
      renderHeader();
      renderChain();
      renderDetail();
      renderSide();
    } catch (err) {
      document.getElementById('detail-card').innerHTML = AIOfficeLayout.errorState(err.message || String(err));
    }
  }

  function renderHeader() {
    var doneCount = project.steps.filter(function (s) { return s.status === 'done'; }).length;
    var pct = project.steps.length ? Math.round((doneCount / project.steps.length) * 100) : 0;
    document.getElementById('wf-header').innerHTML =
      '<img class="wf-thumb" src="' + project.thumb + '" alt="">' +
      '<div><div class="wf-title">' + project.name + '</div>' +
      '<div class="wf-meta-row">' +
      '<span>ประเภท: <b>' + project.type + '</b></span>' +
      '<span>ผู้สร้าง: <b>' + project.owner + '</b></span>' +
      '<span>สร้างเมื่อ: <b>' + project.createdAt + '</b></span>' +
      '</div></div>' +
      '<div class="wf-progress-block">' + AIOfficeLayout.statusBadge(project.status) +
      '<div class="wf-progress-label" style="margin-top:10px;"><span>ความคืบหน้า</span><span>' + pct + '%</span></div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="font-size:11.5px; color:var(--text-low); margin-top:6px;">ขั้นตอนที่ ' + Math.min(selectedIndex + 1, project.steps.length) + ' จาก ' + project.steps.length + '</div>' +
      '</div>';
  }

  function renderChain() {
    document.getElementById('chain-row').innerHTML = project.steps.map(function (s, i) {
      var connector = i < project.steps.length - 1 ? '<div class="chain-connector ' + (s.status === 'done' ? 'done' : '') + '"></div>' : '';
      return '<div class="chain-node ' + (i === selectedIndex ? 'selected' : '') + '" data-i="' + i + '">' +
        '<div class="chain-num mono">' + String(i + 1).padStart(2, '0') + '</div>' +
        '<div class="chain-icon ' + STATUS_ICON_CLASS[s.status] + '">' + s.icon + '</div>' +
        '<div class="chain-step-name">' + s.name + '</div>' +
        '<div class="chain-agent">' + s.agent + '</div>' +
        '<div class="chain-status" style="color:' + STATUS_COLOR[s.status] + '">' + STATUS_LABEL[s.status] + '</div>' +
        '</div>' + connector;
    }).join('');

    document.querySelectorAll('.chain-node').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedIndex = +el.dataset.i;
        renderChain();
        renderDetail();
        renderSide();
      });
    });
  }

  function latestTaskFor(stepKey) {
    var list = (project.tasksByStep && project.tasksByStep[stepKey]) || [];
    var done = list.filter(function (t) { return t.status === 'DONE'; });
    return done.length ? done[done.length - 1] : list[list.length - 1];
  }

  function renderOutputFields(parsed) {
    return Object.keys(parsed).map(function (key) {
      var value = parsed[key];
      var display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      return '<div class="field-block"><div class="field-label">' + key + '</div>' +
        '<div class="field-value">' + display.replace(/</g, '&lt;') + '</div></div>';
    }).join('');
  }

  function renderDetail() {
    var step = project.steps[selectedIndex];
    var wrap = document.getElementById('detail-card');
    var task = latestTaskFor(step.key);

    if (!task) {
      wrap.innerHTML = '<div class="section-title">รายละเอียดขั้นตอนที่ ' + (selectedIndex + 1) + ': ' + step.name + '</div>' +
        '<div style="margin-top:26px;">' + AIOfficeLayout.emptyState({
          icon: step.status === 'locked' ? '🔒' : '⏳',
          title: step.status === 'locked' ? 'ขั้นตอนนี้ยังไม่เริ่มทำงาน' : 'AI กำลังทำงานอยู่',
          sub: step.status === 'locked'
            ? ('ขั้นตอนนี้จะเริ่มทำงานอัตโนมัติหลังจากขั้นตอนก่อนหน้าได้รับการอนุมัติ (โดย ' + step.agent + ')')
            : (step.agent + ' กำลังประมวลผลงานนี้ — รีเฟรชหน้าอีกครั้งในอีกสักครู่')
        }) + '</div>';
      return;
    }

    var parsed = null;
    try { parsed = JSON.parse(task.output); } catch (e) { parsed = null; }
    var isFailed = task.status === 'FAILED';

    var outputHtml = isFailed
      ? '<div class="ai-note" style="border-color:rgba(242,85,95,.3); background:rgba(242,85,95,.08);">⚠️&nbsp; <span>งานล้มเหลว: ' + String(task.output).replace(/</g, '&lt;') + '</span></div>'
      : (parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? renderOutputFields(parsed)
        : '<div class="field-block"><div class="field-label">ผลลัพธ์ดิบจาก AI (ไม่ใช่ JSON ที่ parse ได้)</div>' +
          '<pre class="field-value" style="white-space:pre-wrap; font-family:var(--font-mono); font-size:12px;">' + String(task.output).replace(/</g, '&lt;') + '</pre></div>');

    var filesHtml = (project.files || []).map(function (f) {
      var iconPair = fileIconFor(f.mimeType);
      return '<div class="file-item"><div class="file-icon" style="background:' + iconPair[1] + '">' + iconPair[0] + '</div>' +
        '<a class="file-name" href="' + f.url + '" target="_blank" rel="noopener" style="color:inherit;">' + f.name + '</a>' +
        '<div class="file-size">' + fmtBytes(f.size) + '</div></div>';
    }).join('') || '<div style="font-size:12px; color:var(--text-low); padding:6px 0;">ยังไม่มีไฟล์ในโฟลเดอร์ Drive ของโปรเจกต์นี้</div>';

    wrap.innerHTML = '<div class="section-head"><div class="section-title">รายละเอียดขั้นตอนที่ ' + (selectedIndex + 1) + ': ' + step.name + '</div>' +
      '<span class="badge badge-gray mono">v' + step.raw.version + '</span></div>' +
      '<div style="margin-top:14px;">' + outputHtml + '</div>' +
      '<div class="field-block" style="margin-top:8px;"><div class="field-label">ไฟล์ในโฟลเดอร์โปรเจกต์ (Google Drive)</div>' +
      '<div class="file-list">' + filesHtml + '</div></div>' +
      '<div class="ai-note">🤖&nbsp; <span>สร้างโดย ' + step.agent + ' เมื่อ ' + task.updated_at + ' — งานนี้ผ่านการเรียกจริงจาก AI_Router.gs</span></div>';
  }

  function renderSide() {
    var step = project.steps[selectedIndex];
    var wrap = document.getElementById('side-panel');

    var decisionHtml = step.status === 'active'
      ? '<div class="decision-card"><div class="decision-head">⏳ รอการอนุมัติจากคุณ</div>' +
        '<div class="current-step-chip"><div class="chain-icon active" style="width:36px;height:36px;font-size:15px;">' + step.icon + '</div>' +
        '<div><div style="font-size:13px; font-weight:600;">' + step.name + '</div>' +
        '<div style="font-size:11px; color:var(--text-low);">โดย ' + step.agent + '</div></div></div>' +
        '<div class="field-label" style="margin-bottom:8px;">ความคิดเห็น / คำแนะนำ</div>' +
        '<textarea class="feedback-box" id="feedback-box" maxlength="1000" placeholder="พิมพ์ความคิดเห็นของคุณ..."></textarea>' +
        '<div class="char-count"><span id="char-count">0</span>/1000</div>' +
        '<div class="field-label" style="margin-top:16px; margin-bottom:2px;">การตัดสินใจ</div>' +
        '<div class="decision-btns"><button class="dbtn approve" id="btn-approve">✅<span>อนุมัติ</span></button>' +
        '<button class="dbtn reject" id="btn-reject">❌<span>ปฏิเสธ</span></button></div>' +
        '<div class="rollback-label">ถ้าปฏิเสธ ให้ล็อกขั้นตอนที่ต่อจากนี้ด้วยไหม (ต้องทำใหม่ทั้งหมด)</div>' +
        '<label class="radio-row"><input type="radio" name="rollback" value="self" checked> แก้แค่ขั้นตอนนี้ (ค่าเริ่มต้น)</label>' +
        '<label class="radio-row"><input type="radio" name="rollback" value="cascade"> ล็อกขั้นตอนถัดไปทั้งหมดด้วย</label></div>'
      : '<div class="card" style="text-align:center; padding:26px 18px;">' +
        '<div style="font-size:26px; margin-bottom:8px;">' + (step.status === 'done' ? '✅' : step.status === 'locked' ? '🔒' : '⚙️') + '</div>' +
        '<div style="font-size:13.5px; font-weight:600; margin-bottom:4px;">' +
        (step.status === 'done' ? 'ขั้นตอนนี้ได้รับการอนุมัติแล้ว' : step.status === 'locked' ? 'ขั้นตอนนี้ยังไม่เริ่มทำงาน' : 'AI กำลังดำเนินการอยู่') +
        '</div><div style="font-size:12px; color:var(--text-mid);">เลือกขั้นตอนที่มีสถานะ "รออนุมัติ" เพื่อตรวจสอบและตัดสินใจ</div></div>';

    wrap.innerHTML = decisionHtml +
      '<div class="card"><div class="section-head"><div class="section-title">ประวัติการดำเนินงาน</div></div>' +
      '<div class="mini-history" id="history-list"></div></div>';

    document.getElementById('history-list').innerHTML = project.history.map(function (h) {
      var iconChar = h.kind === 'done' ? '✅' : '🟡';
      return '<div class="activity-item" style="padding:0; border:none;">' +
        '<div class="activity-icon" style="background:' + (h.kind === 'done' ? 'rgba(47,214,153,.12)' : 'rgba(245,166,35,.12)') + ';">' + iconChar + '</div>' +
        '<div style="flex:1;"><div class="activity-title">' + h.title + '</div>' +
        '<div class="activity-sub">' + h.sub + '</div></div>' +
        '<div class="activity-time">' + h.time + '</div></div>';
    }).join('') || '<div style="font-size:12px; color:var(--text-low);">ยังไม่มีประวัติ</div>';

    var fb = document.getElementById('feedback-box');
    if (fb) fb.addEventListener('input', function () { document.getElementById('char-count').textContent = fb.value.length; });

    var approveBtn = document.getElementById('btn-approve');
    var rejectBtn = document.getElementById('btn-reject');
    if (approveBtn) approveBtn.addEventListener('click', function () { handleDecision('approve', step, approveBtn); });
    if (rejectBtn) rejectBtn.addEventListener('click', function () { handleDecision('reject', step, rejectBtn); });
  }

  async function handleDecision(kind, step, btn) {
    var feedback = (document.getElementById('feedback-box') || {}).value || '';
    if (kind === 'reject' && !feedback.trim()) {
      alert('กรุณาใส่เหตุผลก่อนปฏิเสธ (Rule #2: Reject ต้องระบุเหตุผลเสมอ)');
      return;
    }
    var rollback = (document.querySelector('input[name="rollback"]:checked') || {}).value || 'self';

    var allButtons = document.querySelectorAll('.dbtn');
    allButtons.forEach(function (b) { b.disabled = true; });
    var original = btn.innerHTML;
    btn.innerHTML = '⏳<span>กำลังดำเนินการ...</span>';

    try {
      if (kind === 'approve') {
        await AIOfficeAPI.call('approveStep', { stepId: step.key, feedback: feedback });
      } else {
        await AIOfficeAPI.call('rejectStep', { stepId: step.key, feedback: feedback, rollbackScope: rollback });
      }
      project = await AIOfficeData.loadProject(projectId);
      selectedIndex = Math.min(selectedIndex, project.steps.length - 1);
      renderHeader();
      renderChain();
      renderDetail();
      renderSide();
    } catch (err) {
      alert('ทำรายการไม่สำเร็จ: ' + err.message);
      allButtons.forEach(function (b) { b.disabled = false; });
      btn.innerHTML = original;
    }
  }

  boot();
})();
