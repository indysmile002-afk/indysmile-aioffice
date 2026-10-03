(function () {
  AIOfficeLayout.init('dashboard');
  document.getElementById('topbar-root').innerHTML = AIOfficeLayout.renderTopbar({
    title: 'Dashboard',
    sub: 'ภาพรวมงานทั้งหมดของ AI Office วันนี้'
  });

  var mainRegions = ['stat-grid', 'project-list', 'approvals-list', 'activity-list'];

  function showLoading() {
    document.getElementById('stat-grid').innerHTML = '';
    document.getElementById('project-list').innerHTML = AIOfficeLayout.loadingState('กำลังดึงข้อมูลโปรเจกต์...');
    document.getElementById('approvals-list').innerHTML = '';
    document.getElementById('activity-list').innerHTML = '';
  }

  function showError(err) {
    document.getElementById('project-list').innerHTML = AIOfficeLayout.errorState(err.message || String(err));
    document.getElementById('approvals-list').innerHTML = '';
    document.getElementById('activity-list').innerHTML = '';
  }

  // ---- Tabs -------------------------------------------------------------
  var tabs = ['ทั้งหมด', 'รออนุมัติ', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
  var tabFilters = [null, 'waiting_approval', 'in_progress', 'done'];
  var activeTab = 0;

  function renderTabs() {
    document.getElementById('tab-row').innerHTML = tabs.map(function (t, i) {
      return '<div class="tab ' + (i === activeTab ? 'active' : '') + '" data-i="' + i + '">' + t + '</div>';
    }).join('');
    document.querySelectorAll('.tab').forEach(function (el) {
      el.addEventListener('click', function () {
        activeTab = +el.dataset.i;
        renderTabs();
        renderProjects();
      });
    });
  }

  function renderProjects() {
    var filter = tabFilters[activeTab];
    var list = AIOffice.projects.filter(function (p) { return !filter || p.status === filter; });
    document.getElementById('project-list').innerHTML = list.map(function (p) {
      return '\
      <div class="project-row">\
        <img class="project-thumb" src="' + p.thumb + '" alt="">\
        <div class="project-info">\
          <div class="project-title-row">\
            <div class="project-title">' + p.name + '</div>\
            ' + AIOfficeLayout.statusBadge(p.status) + '\
          </div>\
          <div class="project-meta">อัปเดตล่าสุด ' + p.updatedAt + ' &nbsp;·&nbsp; ขั้นตอนปัจจุบัน: ' + (p.currentStepIndex + 1) + '. ' + (p.steps[p.currentStepIndex] ? p.steps[p.currentStepIndex].name : '-') + '</div>\
          ' + AIOfficeLayout.miniChain(p.steps) + '\
        </div>\
        <a class="project-open ' + (filter === 'waiting_approval' ? 'primary' : '') + '" href="workflow.html?id=' + p.id + '">ดูโปรเจกต์</a>\
      </div>';
    }).join('') || '<div style="padding:30px; text-align:center; color:var(--text-low); font-size:13px;">ไม่มีโปรเจกต์ในหมวดนี้</div>';
  }

  function renderStats() {
    var s = AIOffice.stats;
    var statDefs = [
      { icon: '📋', bg: 'rgba(124,111,242,.14)', num: s.total, label: 'โปรเจกต์ทั้งหมด' },
      { icon: '⏳', bg: 'rgba(245,166,35,.14)', num: s.waiting, label: 'รอการอนุมัติ' },
      { icon: '🚀', bg: 'rgba(79,140,255,.14)', num: s.inProgress, label: 'กำลังดำเนินการ' },
      { icon: '✅', bg: 'rgba(47,214,153,.14)', num: s.done, label: 'เสร็จสิ้นแล้ว' },
    ];
    document.getElementById('stat-grid').innerHTML = statDefs.map(function (d) {
      return '\
      <div class="stat-card">\
        <div class="stat-icon" style="background:' + d.bg + '">' + d.icon + '</div>\
        <div>\
          <div class="stat-num">' + d.num + '</div>\
          <div class="stat-label">' + d.label + '</div>\
        </div>\
      </div>';
    }).join('');
  }

  function renderApprovals() {
    document.getElementById('approvals-list').innerHTML = AIOffice.approvalsQueue.map(function (a) {
      return '\
      <div class="approval-item">\
        <img class="approval-thumb" src="' + a.thumb + '" alt="">\
        <div style="flex:1">\
          <div class="approval-title">' + a.title + '</div>\
          <div class="approval-step">' + a.step + ' · โดย ' + a.agent + '</div>\
          <div class="approval-actions">\
            <a class="btn-mini reject" href="workflow.html?id=' + a.projectId + '">ปฏิเสธ</a>\
            <a class="btn-mini approve" href="workflow.html?id=' + a.projectId + '">อนุมัติ</a>\
          </div>\
        </div>\
      </div>';
    }).join('') || '<div style="padding:10px 0; color:var(--text-low); font-size:12.5px;">ไม่มีงานรออนุมัติตอนนี้</div>';
  }

  function renderActivity() {
    document.getElementById('activity-list').innerHTML = AIOffice.activity.map(function (a) {
      return '\
      <div class="activity-item">\
        <div class="activity-icon">' + a.icon + '</div>\
        <div style="flex:1">\
          <div class="activity-title">' + a.title + '</div>\
          <div class="activity-sub">' + a.sub + '</div>\
        </div>\
        <div class="activity-time">' + a.time + '</div>\
      </div>';
    }).join('') || '<div style="padding:10px 0; color:var(--text-low); font-size:12.5px;">ยังไม่มีกิจกรรม</div>';
  }

  // ---- Assign form --------------------------------------------------
  document.getElementById('assign-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var val = document.getElementById('assign-input').value.trim();
    if (!val) return;
    var type = document.getElementById('assign-type').value;
    var btn = e.target.querySelector('button');
    var originalLabel = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ AI Manager กำลังวิเคราะห์งาน...';
    try {
      await AIOfficeAPI.call('createProject', { name: val, type: type });
      document.getElementById('assign-input').value = '';
      await refresh();
    } catch (err) {
      alert('สร้างงานไม่สำเร็จ: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }
  });

  async function refresh() {
    showLoading();
    try {
      await AIOfficeData.loadDashboard();
      renderStats();
      renderTabs();
      renderProjects();
      renderApprovals();
      renderActivity();
    } catch (err) {
      showError(err);
    }
  }

  refresh();
})();
