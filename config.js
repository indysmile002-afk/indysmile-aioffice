/**
 * config.js
 * -----------------------------------------------------------------------
 * แก้ตรงนี้ที่เดียวเท่านั้น: วาง Web App URL ที่ได้ตอน Deploy (ลงท้ายด้วย /exec)
 * -----------------------------------------------------------------------
 */
window.AI_OFFICE_API_URL = 'https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec'; // <-- แก้บรรทัดนี้

window.AIOfficeAPI = (function () {
  function isConfigured() {
    return !!window.AI_OFFICE_API_URL && window.AI_OFFICE_API_URL.indexOf('XXXX') === -1;
  }

  async function call(action, params) {
    if (!isConfigured()) {
      throw new Error('ยังไม่ได้ตั้งค่า AI_OFFICE_API_URL ใน js/config.js — วาง Web App URL ของคุณก่อน');
    }
    var res = await fetch(window.AI_OFFICE_API_URL, {
      method: 'POST',
      // text/plain (ไม่ใช่ application/json) เพื่อเลี่ยง CORS preflight ที่ Apps Script Web App รับมือไม่ได้
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action }, params || {})),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' จาก Apps Script');
    var json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Backend ตอบกลับ error ไม่ทราบสาเหตุ');
    return json.data;
  }

  return { call: call, isConfigured: isConfigured };
})();
