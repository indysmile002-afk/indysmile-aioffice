/**
 * layout.js — injects the sidebar/header shell into every page and exposes
 * small helper renderers shared across pages. Kept dependency-free so the
 * whole prototype runs straight off the filesystem (no build step, no
 * server) while you wire up the real Apps Script backend.
 */
(function(){
  const NAV = [
    { key:'dashboard', label:'Dashboard',      href:'index.html',     icon:'grid' },
    { key:'projects',  label:'Projects',       href:'projects.html',  icon:'folder' },
    { key:'tasks',     label:'Tasks',          href:'tasks.html',     icon:'check' },
    { key:'workflows', label:'Workflows',      href:'workflow.html',  icon:'flow' },
    { key:'employees', label:'AI Employees',   href:'employees.html', icon:'users' },
    { key:'knowledge', label:'Knowledge Base', href:'knowledge.html', icon:'book' },
    { key:'calendar',  label:'Calendar',       href:'calendar.html',  icon:'calendar' },
    { key:'reports',   label:'Reports',        href:'reports.html',   icon:'chart' },
    { key:'settings',  label:'Settings',       href:'settings.html',  icon:'gear' },
  ];

  const ICONS = {
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
    flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="6" r="2.3"/><circle cx="19" cy="6" r="2.3"/><circle cx="12" cy="18" r="2.3"/><path d="M7 7.5 10.5 16M17 7.5 13.5 16"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15 14.2c2.9.3 5 2.4 5 5.8"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  };

  function renderSidebar(active){
    const navHtml = NAV.map(item => `
      <a class="nav-item ${item.key===active?'active':''}" href="${item.href}">
        ${ICONS[item.icon]}<span>${item.label}</span>
      </a>`).join('');

    return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">🤖</div>
        <div class="brand-text">
          <div class="brand-title">AI OFFICE</div>
          <div class="brand-sub">Your AI Workforce</div>
        </div>
      </div>

      <nav class="nav">${navHtml}</nav>

      <div class="quick-actions">
        <div class="qa-label">Quick action</div>
        <button class="btn-primary" onclick="location.href='index.html#assign'">
          <span>➕</span> มอบหมายงานใหม่
        </button>
        <button class="btn-ghost" onclick="alert('เชื่อมต่อ Speech-to-Text ในเวอร์ชันถัดไป')">
          <span>🎙️</span> สั่งงานด้วยเสียง
        </button>
      </div>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar">B</div>
          <div>
            <div class="user-name">Boss</div>
            <div class="user-role">Owner</div>
          </div>
        </div>
        <div class="status-line"><span class="dot"></span> ระบบทำงานปกติ</div>
        <div class="employees-online">AI Employees Online: <b>${AIOffice.agents.length} / ${AIOffice.agents.length}</b></div>
      </div>
    </aside>`;
  }

  function fmtDate(d){
    return d.toLocaleDateString('th-TH', { day:'numeric', month:'long', year:'numeric' });
  }

  window.AIOfficeLayout = {
    /**
     * Mounts the sidebar and returns a small header renderer.
     * Call: AIOfficeLayout.init('dashboard')
     */
    init(activeKey){
      const root = document.getElementById('sidebar-root');
      if(root) root.outerHTML = renderSidebar(activeKey);
    },
    renderTopbar({ crumbs, title, sub }){
      const today = new Date();
      const crumbHtml = crumbs
        ? crumbs.map((c,i)=> i===crumbs.length-1
            ? `<span class="current">${c}</span>`
            : `<span>${c}</span><span>›</span>`).join(' ')
        : '';
      return `
      <div class="topbar">
        <div>
          ${crumbHtml ? `<div class="crumbs">${crumbHtml}</div>` : ''}
          <div class="page-title">${title}</div>
          ${sub ? `<div class="page-sub">${sub}</div>` : ''}
        </div>
        <div class="topbar-right">
          <div class="date-chip">📅 ${fmtDate(today)}</div>
        </div>
      </div>`;
    },
    statusBadge(status){
      const map = {
        waiting_approval: ['badge-yellow','รอการอนุมัติ'],
        in_progress:      ['badge-blue','กำลังดำเนินการ'],
        done:             ['badge-green','เสร็จสิ้นแล้ว'],
        rejected:         ['badge-red','ต้องแก้ไข'],
      };
      const [cls,label] = map[status] || ['badge-gray', status];
      return `<span class="badge ${cls}">${label}</span>`;
    },
    miniChain(steps){
      return `<div class="mini-chain">` + steps.map((s,i)=>{
        const nodeCls = s.status==='done' ? 'done' : (s.status==='active'||s.status==='progress') ? 'active' : '';
        const line = i < steps.length-1
          ? `<div class="mini-line ${s.status==='done'?'done':''}"></div>` : '';
        return `<div class="mini-node ${nodeCls}" title="${s.name}"></div>${line}`;
      }).join('') + `</div>`;
    },
    loadingState(msg){
      return `
      <div class="empty-wrap">
        <div class="empty-icon">⏳</div>
        <div class="empty-title">${msg || 'กำลังโหลดข้อมูลจาก AI Office Backend...'}</div>
      </div>`;
    },
    errorState(msg){
      return `
      <div class="empty-wrap" style="border-color:rgba(242,85,95,.35);">
        <div class="empty-icon" style="background:rgba(242,85,95,.12); border-color:rgba(242,85,95,.3);">⚠️</div>
        <div class="empty-title">เชื่อมต่อ Backend ไม่สำเร็จ</div>
        <div class="empty-sub">${msg}</div>
        <div class="plan-list">
          <div class="prow"><span class="pdot"></span>เช็คว่าตั้งค่า AI_OFFICE_API_URL ใน js/config.js ถูกต้องแล้ว</div>
          <div class="prow"><span class="pdot"></span>เช็คว่า Deploy เป็น Web App แล้ว (URL ต้องลงท้ายด้วย /exec)</div>
          <div class="prow"><span class="pdot"></span>ลองเปิด URL นั้น + ?action=listAgents ตรงๆ ในเบราว์เซอร์ดูว่าได้ JSON กลับมาไหม</div>
        </div>
      </div>`;
    },
    emptyState({icon, title, sub, planned}){
      const items = (planned||[]).map(p=>`<div class="prow"><span class="pdot"></span>${p}</div>`).join('');
      return `
      <div class="empty-wrap">
        <div class="empty-icon">${icon}</div>
        <div class="empty-title">${title}</div>
        <div class="empty-sub">${sub}</div>
        ${items ? `<div class="plan-list">${items}</div>` : ''}
      </div>`;
    }
  };
})();
