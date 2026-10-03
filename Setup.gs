/**
 * Setup.gs
 * -----------------------------------------------------------------------
 * Run this ONCE, manually, from the Apps Script editor:
 *   1. Select `runSetup` in the function dropdown (top toolbar)
 *   2. Click ▶ Run (you'll be asked to authorize Sheets/Drive scopes — allow it)
 *   3. Check View > Logs (or Execution log) for the Spreadsheet/Drive links
 *
 * It will:
 *   - Create "AI_OFFICE_DATABASE" with every tab + header row from the
 *     blueprint (USERS, AGENTS, PROJECTS, TASKS, WORKFLOW_STEPS, APPROVALS,
 *     FILES, AI_LOGS), and seed AGENTS with the 8 default AI employees.
 *   - Create the "AI OFFICE" Drive folder with its 8 subfolders
 *     (01_SYSTEM ... 08_REPORTS).
 *   - Save every generated ID into Script Properties so the rest of the
 *     backend can find them (SPREADSHEET_ID, DRIVE_ROOT_FOLDER_ID, FOLDER_*).
 *
 * Safe to re-run — it reuses anything that already exists instead of
 * duplicating it.
 * -----------------------------------------------------------------------
 */

var SHEET_SCHEMA = {
  USERS: ['user_id', 'email', 'name', 'role', 'status', 'created_at'],
  AGENTS: ['agent_id', 'agent_name', 'role', 'description', 'primary_model', 'secondary_model', 'status', 'system_prompt'],
  PROJECTS: ['project_id', 'project_name', 'description', 'type', 'status', 'current_step', 'progress', 'created_at', 'updated_at'],
  TASKS: ['task_id', 'project_id', 'step_id', 'agent_id', 'task_type', 'instruction', 'status', 'input', 'output', 'version', 'created_at', 'updated_at'],
  WORKFLOW_STEPS: ['step_id', 'project_id', 'step_order', 'step_name', 'agent_id', 'status', 'requires_approval', 'depends_on', 'version'],
  APPROVALS: ['approval_id', 'project_id', 'step_id', 'version', 'status', 'feedback', 'approved_by', 'created_at'],
  FILES: ['file_id', 'project_id', 'step_id', 'file_name', 'file_type', 'drive_file_id', 'version', 'status', 'created_at'],
  AI_LOGS: ['log_id', 'project_id', 'task_id', 'agent_id', 'model', 'action', 'input', 'output', 'timestamp', 'duration'],
};

var DRIVE_SUBFOLDERS = ['01_SYSTEM', '02_PROJECTS', '03_KNOWLEDGE', '04_AI_OUTPUTS', '05_APPROVED', '06_REJECTED', '07_ASSETS', '08_REPORTS'];

// agent_id, agent_name, role, description, primary_model, secondary_model, status, system_prompt
// primary/secondary_model values must match the keys in AI_Router.gs's PROVIDERS map: chatgpt | claude | gemini | grok
var DEFAULT_AGENTS = [
  ['AG000', 'AI Manager', 'Orchestrator', 'วิเคราะห์งานที่ Boss สั่ง แล้วเลือก Workflow ที่เหมาะสม', 'chatgpt', 'claude', 'ACTIVE',
    'คุณคือ AI Manager ของ AI OFFICE หน้าที่ของคุณคือวิเคราะห์คำสั่งงานของ Boss แล้วตอบกลับเป็น JSON ที่ระบุประเภทงานและขั้นตอนที่ต้องทำ ห้ามลงมือทำงานเอง ห้ามข้าม Approval Gate ใดๆ'],
  ['AG001', 'Content Agent', 'Content', 'คิดคอนเซ็ปต์และเขียนสคริปต์', 'claude', 'chatgpt', 'ACTIVE',
    'คุณคือ Content Strategist ทำตามข้อมูลที่ได้รับเท่านั้น ห้ามแต่งข้อมูลที่ไม่มีหลักฐาน หากข้อมูลไม่พอให้ระบุว่าต้องการข้อมูลเพิ่มแทนการเดา ตอบกลับเป็น JSON ตาม schema ของขั้นตอนนั้นๆ เท่านั้น'],
  ['AG002', 'Marketing Agent', 'Marketing', 'วางกลยุทธ์การตลาดและแผนโปรโมท', 'chatgpt', 'gemini', 'ACTIVE',
    'คุณคือ Marketing Strategist วิเคราะห์และวางกลยุทธ์การตลาดจากข้อมูลที่ได้รับ ตอบกลับเป็น JSON ตาม schema ที่กำหนด'],
  ['AG003', 'Document Agent', 'Document', 'จัดทำรายงานและเอกสาร', 'gemini', 'claude', 'ACTIVE',
    'คุณคือ Document Specialist สรุปและจัดทำรายงานจากข้อมูลที่ได้รับอย่างถูกต้องและกระชับ ตอบกลับเป็น JSON ตาม schema ที่กำหนด'],
  ['AG004', 'Prompt Agent', 'Production', 'แปลงสคริปต์เป็น Prompt สำหรับสร้างสื่อ', 'claude', 'grok', 'ACTIVE',
    'คุณคือ Prompt Engineer แปลงสคริปต์/คอนเซ็ปต์ให้เป็น Prompt ที่ใช้สร้างภาพ/วิดีโอได้จริง ตอบกลับเป็น JSON ตาม schema ที่กำหนด'],
  ['AG005', 'Image/Video Agent', 'Production', 'สร้างภาพและวิดีโอ', 'grok', 'gemini', 'ACTIVE',
    'คุณคือ Creative Producer สร้างคำอธิบายภาพ/วิดีโอที่ละเอียดและใช้งานได้จริงจาก Prompt ที่ได้รับ ตอบกลับเป็น JSON ตาม schema ที่กำหนด'],
  ['AG006', 'Editor Agent', 'Production', 'ทำ Editing Plan สำหรับ CapCut', 'claude', 'chatgpt', 'ACTIVE',
    'คุณคือ Video Editor วางแผนการตัดต่อเป็นช่วงเวลา (timestamp) ที่ชัดเจนจาก Asset/Script ที่ได้รับ ตอบกลับเป็น JSON ตาม schema ที่กำหนด'],
  ['AG007', 'QA Agent', 'QA', 'ตรวจสอบคุณภาพก่อนส่ง Boss', 'chatgpt', 'claude', 'ACTIVE',
    'คุณคือ QA Reviewer ตรวจสอบว่า Output ตรงโจทย์ ครบถ้วน ไม่มีข้อมูลที่ AI แต่งขึ้นเอง และ Format ถูกต้อง ตอบกลับเป็น JSON: {"pass": true/false, "issues": [...]}'],
];

function runSetup() {
  var props = PropertiesService.getScriptProperties();
  var ss = setupSpreadsheet_(props);
  var root = setupDriveFolders_(props);
  Logger.log('DONE.');
  Logger.log('Spreadsheet: ' + ss.getUrl());
  Logger.log('Drive root:  ' + root.getUrl());
  Logger.log('Next steps: add your AI provider API keys as Script Properties ' +
    '(OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, XAI_API_KEY), then deploy as a Web App. See README.md.');
}

function setupSpreadsheet_(props) {
  var existingId = props.getProperty('SPREADSHEET_ID');
  var ss = null;
  if (existingId) {
    try { ss = SpreadsheetApp.openById(existingId); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('AI_OFFICE_DATABASE');
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }

  Object.keys(SHEET_SCHEMA).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    var headers = SHEET_SCHEMA[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold').setBackground('#14141f').setFontColor('#ffffff');
  });

  // Remove the default empty "Sheet1" once real tabs exist.
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  // Seed AGENTS exactly once.
  var agentsSheet = ss.getSheetByName('AGENTS');
  if (agentsSheet.getLastRow() < 2) {
    agentsSheet.getRange(2, 1, DEFAULT_AGENTS.length, DEFAULT_AGENTS[0].length).setValues(DEFAULT_AGENTS);
  }

  return ss;
}

function setupDriveFolders_(props) {
  var rootId = props.getProperty('DRIVE_ROOT_FOLDER_ID');
  var root = null;
  if (rootId) {
    try { root = DriveApp.getFolderById(rootId); } catch (e) { root = null; }
  }
  if (!root) {
    root = DriveApp.createFolder('AI OFFICE');
    props.setProperty('DRIVE_ROOT_FOLDER_ID', root.getId());
  }

  DRIVE_SUBFOLDERS.forEach(function (name) {
    var propKey = 'FOLDER_' + name;
    var existingId = props.getProperty(propKey);
    var folder = null;
    if (existingId) {
      try { folder = DriveApp.getFolderById(existingId); } catch (e) { folder = null; }
    }
    if (!folder) {
      var found = root.getFoldersByName(name);
      folder = found.hasNext() ? found.next() : root.createFolder(name);
      props.setProperty(propKey, folder.getId());
    }
  });

  return root;
}
