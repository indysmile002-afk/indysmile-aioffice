/**
 * mock-data.js
 * -----------------------------------------------------------------------
 * เดิมไฟล์นี้เก็บข้อมูลจำลองทั้งหมด ตอนนี้ข้อมูลจริงมาจาก Apps Script Backend
 * ผ่าน js/data-loader.js แล้ว เหลือแค่ 2 อย่างที่ backend ไม่ได้เก็บไว้ (เป็นเรื่อง
 * การแสดงผลล้วนๆ ไม่ใช่ข้อมูลธุรกิจ) เลยยังคงไว้ที่ฝั่ง frontend:
 *   - agentMeta: ไอคอน/สี ของแต่ละ Agent (Sheet AGENTS ไม่มีคอลัมน์ icon/color)
 *   - window.AIOffice: namespace ว่างเปล่า ให้ data-loader.js เข้ามาเติมข้อมูลจริง
 * -----------------------------------------------------------------------
 */
window.AIOffice = window.AIOffice || {};

// key ต้องตรงกับ agent_id ใน Sheet AGENTS (AG000-AG007 ตามที่ Setup.gs seed ไว้)
AIOffice.agentMeta = {
  AG000: { icon: '🧭', color: 'blue' },
  AG001: { icon: '✍️', color: 'purple' },
  AG002: { icon: '📈', color: 'green' },
  AG003: { icon: '📄', color: 'blue' },
  AG004: { icon: '🧩', color: 'purple' },
  AG005: { icon: '🎬', color: 'yellow' },
  AG006: { icon: '✂️', color: 'green' },
  AG007: { icon: '🛡️', color: 'red' },
};

// ค่าตั้งต้นก่อนโหลดข้อมูลจริงเสร็จ (กัน error ถ้าไฟล์ไหนเรียกใช้ก่อน data-loader ทำงาน)
AIOffice.projects = [];
AIOffice.agents = [];
AIOffice.approvalsQueue = [];
AIOffice.activity = [];
AIOffice.stats = { total: 0, waiting: 0, inProgress: 0, done: 0 };
