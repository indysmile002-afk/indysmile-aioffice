# AI OFFICE — Frontend Prototype (Version 0)

หน้าเว็บชุดนี้คือ **UI Prototype แบบ static** (HTML + CSS + JS ธรรมดา ไม่มี framework/ไม่มี build step)
สร้างจาก Mockup ที่คุณให้มา 2 หน้า (Dashboard และ Workflow Detail) พร้อมต่อยอดหน้าอื่น ๆ ตามแผน Blueprint v1
เพื่อให้คุณเปิดดู ทดลองคลิก และปรับ UI ใน VS Code ได้ทันที **ก่อน** ต่อ Backend จริง (Google Apps Script)

ทุกจุดที่ควรเป็นข้อมูลจริงถูกทำเป็น **mock data** ไว้ที่ `js/mock-data.js` อย่างชัดเจน — ไม่มีอะไรถูกยิงไป Google
Sheets/Drive จริง ปุ่ม "อนุมัติ/ปฏิเสธ/มอบหมายงาน" ตอนนี้แค่ขึ้น `alert()` เพื่อจำลองพฤติกรรม

## วิธีเปิดดู

1. เปิดโฟลเดอร์นี้ใน VS Code
2. ติดตั้ง extension **Live Server** (ตัวเดียวที่แนะนำ เพราะโปรเจกต์นี้ไม่มี build step)
3. คลิกขวาที่ `index.html` → **Open with Live Server**
4. ไล่ดูเมนูซ้ายได้ทุกหน้า (Dashboard / Workflows / AI Employees / Projects เป็นของจริง ส่วนที่เหลือเป็น
   placeholder ตามแผน Phase ถัดไป)

> ไฟล์เปิดตรง ๆ แบบ double-click (`file://`) ก็ใช้ได้เช่นกัน เพราะ layout ถูก inject ด้วย JS ไม่ใช้ `fetch()`
> กับไฟล์ partial — แต่แนะนำ Live Server เพื่อให้พฤติกรรมเหมือนตอน deploy จริงมากที่สุด

## โครงสร้างไฟล์

```
ai-office/
├── index.html          Dashboard          (ตรงกับ Mockup ภาพที่ 2)
├── workflow.html        Workflow Detail    (ตรงกับ Mockup ภาพที่ 1) — ใช้ ?id=PRJ001 เลือกโปรเจกต์
├── employees.html       AI Employees       รายชื่อ Agent + Model หลัก/สำรอง (จาก Sheet: AGENTS)
├── projects.html         รายการโปรเจกต์ทั้งหมด
├── tasks.html            placeholder — Phase 3
├── knowledge.html        placeholder — Phase 5
├── calendar.html         placeholder
├── reports.html          placeholder — Phase 7
├── settings.html         placeholder — Phase 8 (API Keys ฯลฯ)
├── css/style.css         Design tokens + ทุก component style
├── js/
│   ├── mock-data.js      ← ข้อมูลจำลอง (โครงตรงกับ Sheet: PROJECTS/TASKS/AGENTS/APPROVALS/AI_LOGS)
│   ├── layout.js          Sidebar/Header ที่ใช้ร่วมกันทุกหน้า + helper (badge, mini-chain, empty state)
│   ├── dashboard.js        Logic เฉพาะหน้า Dashboard
│   └── workflow.js         Logic เฉพาะหน้า Workflow (chain, approve/reject/revise, rollback)
└── README.md             ไฟล์นี้
```

## แนวคิดออกแบบ

- **Step Chain** (แถบขั้นตอนแบบวงกลม+เส้นเชื่อม) คือองค์ประกอบหลักของทั้งระบบ ใช้ทั้งแบบเต็ม (หน้า Workflow)
  และแบบย่อ (แถวโปรเจกต์ใน Dashboard/Projects) สีของแต่ละ node สื่อสถานะตาม Rule ที่คุณกำหนด:
  🟢 เสร็จสิ้น · 🟡 รอการอนุมัติ · 🔵 กำลังทำงาน · ⚪ ล็อกรอขั้นตอนก่อนหน้า · 🔴 ถูกปฏิเสธ
- ฟอนต์ **Prompt** (ไทย+อังกฤษ) เป็นตัวหลักทั้งระบบ และ **JetBrains Mono** สำหรับ ID/เวลา/โค้ด
  (เช่น `AG001`, `14:35 น.`) เพื่อให้ดูเป็นเครื่องมือของทีมที่ทำงานกับข้อมูลจริง
- โทนสีอิงจาก Mockup เดิม (พื้นดำ + violet accent) แต่ปรับให้เป็นระบบ token ที่แก้ได้จุดเดียวใน
  `css/style.css` (ส่วน `:root`)

## สถานะ: ต่อกับ Backend จริงแล้ว ✅

ไฟล์ชุดนี้ **ไม่ใช้ mock data แล้ว** — ดึงข้อมูลจริงจาก Apps Script Web App ของคุณผ่าน `js/config.js` +
`js/data-loader.js` สิ่งที่ต้องทำก่อนใช้งาน มีจุดเดียว:

1. เปิด `js/config.js`
2. แก้บรรทัด `window.AI_OFFICE_API_URL = '...'` ให้เป็น Web App URL จริงของคุณ (ลงท้ายด้วย `/exec`)
3. บันทึกไฟล์ แล้วเปิด `index.html` ผ่าน Live Server ใหม่อีกครั้ง

ถ้ายังไม่ตั้งค่า (หรือ URL ยังเป็นค่า `XXXX...` เดิม) ทุกหน้าจะขึ้นข้อความ "เชื่อมต่อ Backend ไม่สำเร็จ"
พร้อม checklist สั้นๆ ให้ไล่แก้เอง

### ⚠️ ต้องอัปเดต Backend อีกนิดหนึ่ง (เพิ่ม 1 บรรทัด แล้ว Deploy เวอร์ชันใหม่)

หน้า Workflow ตอนนี้ต้องดึง "ผลลัพธ์จริงที่ AI สร้าง" มาโชว์ (ไม่ใช่แค่สถานะ) ซึ่งต้องมี action ใหม่ชื่อ
`listTasks` ที่ตัว Backend เดิมยังไม่มี — เปิดไฟล์ `Code.gs`/`Main.gs` ที่วางไว้ใน Apps Script แล้วหาบรรทัด
`listAgents: function () { ... }` เพิ่มบรรทัดนี้ต่อจากมัน:

```js
listTasks: function (p) { return queryRows('TASKS', p.projectId ? { project_id: p.projectId } : null); },
```

(หรือก๊อบไฟล์ `Code.gs` ชุดล่าสุดที่แนบมาในไฟล์นี้ทับของเดิมไปเลยก็ได้ มีบรรทัดนี้อยู่แล้ว)

จากนั้นไปที่ **Deploy → Manage deployments → ไอคอนดินสอ (Edit) ที่ deployment เดิม → Version: New version
→ Deploy** — วิธีนี้จะ**ไม่เปลี่ยน URL เดิม** (ยังใช้ URL เดียวกับที่ตั้งไว้ใน `config.js`) แค่ทำให้โค้ดใหม่มีผล

### สิ่งที่ต่อจริงแล้ว vs สิ่งที่ยังเป็น placeholder

| ฟีเจอร์ | สถานะ |
|---|---|
| รายการโปรเจกต์ / สถานะ / progress | ✅ ข้อมูลจริงจาก Sheet PROJECTS + WORKFLOW_STEPS |
| Step chain (สี/สถานะแต่ละขั้น) | ✅ คำนวณจาก WORKFLOW_STEPS จริง |
| ผลลัพธ์ที่ AI สร้าง (ในหน้า Workflow) | ✅ ดึงจาก TASKS.output จริง (parse JSON ถ้า parse ได้ ไม่ได้ก็โชว์ดิบ) |
| ไฟล์แนบ | ✅ ดึงจาก Google Drive จริง (โฟลเดอร์ของโปรเจกต์นั้น) |
| อนุมัติ/ปฏิเสธ | ✅ ยิงจริงไป `approveStep`/`rejectStep` แล้ว AI ทำงานขั้นถัดไปทันที |
| AI Employees / รายชื่อ Agent | ✅ ดึงจาก Sheet AGENTS จริง |
| กิจกรรมล่าสุด (Dashboard) | ✅ ดึงจาก AI_LOGS จริง (เรียงเวลาล่าสุด) |
| รูปภาพ cover ของโปรเจกต์ | ⚠️ ยังเป็นรูป placeholder เดียวกันทุกโปรเจกต์ — ยังไม่มีระบบสร้าง cover จริง |
| Tasks / Knowledge Base / Calendar / Reports / Settings | ⚠️ ยังเป็นหน้า placeholder ตามแผน Phase ถัดไป |

### ข้อจำกัดที่ควรรู้ตอนทดสอบ

- **หน้าเว็บช้าตอนกดอนุมัติ**: `approveStep`/`rejectStep` ฝั่ง Apps Script เรียก AI API แบบ synchronous
  (รอผลจริงก่อนตอบกลับ) ดังนั้นปุ่มจะค้างที่ "กำลังดำเนินการ..." ไม่กี่วินาทีถึงเกือบนาที ขึ้นกับ AI provider —
  เป็นเรื่องปกติ ไม่ใช่ error
- **Dashboard โหลดช้าถ้ามีหลายสิบโปรเจกต์**: ตอนนี้ต้องเรียก `getProject` ทีละโปรเจกต์เพื่อรู้ steps (ไม่มี
  bulk endpoint) โอเคสำหรับ MVP แต่ถ้าโปรเจกต์เยอะมากค่อยพิจารณาเพิ่ม endpoint แบบ batch ทีหลัง
- **CORS**: ถ้าเจอ error พูดถึง CORS ในคอนโซลเบราว์เซอร์ (F12) ให้เช็คว่า `config.js` ยังส่ง Header
  เป็น `text/plain;charset=utf-8` ไม่ใช่ `application/json` (แก้แล้วในไฟล์นี้ ไม่ต้องทำอะไรเพิ่ม เว้นแต่ไปแก้เอง)



---

## 🤖 Agent Mode (เพิ่มใหม่): ให้ Agent ตัดสินใจและเรียกใช้เครื่องมือเอง

ก่อนหน้านี้ Agent แค่ "รับโจทย์ → ตอบ" ตอนนี้ Agent **เลือกเองได้ว่าจะใช้เครื่องมือไหนก่อนส่งงาน** เช่น
อ่านผลงานขั้นก่อนหน้าจาก Sheet, เปิดไฟล์ใน Drive, ค้นเว็บ แล้วค่อยตอบ — จากนั้นงานยังเข้าคิว **รออนุมัติจาก Boss เหมือนเดิมทุกขั้น**

### เครื่องมือที่มี

| Tool | ทำอะไร | ข้อจำกัดด้านความปลอดภัย |
|---|---|---|
| `read_sheet` | อ่านแถวล่าสุดจาก Sheet | อ่านได้เฉพาะ PROJECTS, TASKS, WORKFLOW_STEPS, APPROVALS, FILES, AI_LOGS, AGENT_MEMORY (ไม่ให้อ่าน USERS/AGENTS) |
| `append_row` | จดบันทึกลง Sheet | เขียนได้เฉพาะ `AGENT_MEMORY`; ระบบเป็นคนใส่ project_id/agent_id/เวลาเอง |
| `list_files` / `read_file` | ดู/อ่านไฟล์ใน Drive (txt, md, csv, json, Google Doc, Google Sheet) | อ่านได้เฉพาะโฟลเดอร์ของโปรเจกต์นั้น + `03_KNOWLEDGE` |
| `save_file` | บันทึกไฟล์ข้อความลงโฟลเดอร์โปรเจกต์ | ลงทะเบียนใน Sheet FILES ให้อัตโนมัติ |
| `web_search` | ค้นเว็บ (Tavily) | เปิดใช้เมื่อตั้ง `TAVILY_API_KEY` เท่านั้น |
| `fetch_url` | อ่านหน้าเว็บสาธารณะ | http/https เท่านั้น บล็อก localhost/IP ภายใน |

**Agent ไม่มีเครื่องมือที่แตะ WORKFLOW_STEPS / APPROVALS** — การอนุมัติ ปฏิเสธ ข้ามขั้น เป็นของ Boss คนเดียว
เครื่องมือทุกครั้งที่เรียกจะถูกบันทึกใน `AI_LOGS` (action = `tool:ชื่อเครื่องมือ`) และขึ้นในหน้า Dashboard/Workflow

### วิธีเปิดใช้ (ทำครั้งเดียว)

1. วางไฟล์ชุดใหม่ใน Apps Script (ไฟล์ใหม่คือ `Agent.gs`; ถ้าใช้ `Code.gs.txt` ให้วางทับ `Code.gs` ทั้งไฟล์ — **อย่าใช้ทั้งสองแบบพร้อมกัน** จะเกิดฟังก์ชันซ้ำ)
2. เลือก `runSetup` แล้วกด ▶ Run อีกครั้ง — จะเพิ่มคอลัมน์ `tools` ใน tab AGENTS, สร้าง tab `AGENT_MEMORY`
   และใส่เครื่องมือเริ่มต้นให้แต่ละ Agent (ข้อมูลเดิมไม่ถูกลบ) **ครั้งนี้ Google จะขอสิทธิ์เพิ่ม (Google Docs) ให้กดอนุญาต**
3. (ไม่บังคับ) ถ้าอยากให้ค้นเว็บได้ ใส่ Script Property `TAVILY_API_KEY`
4. Deploy → Manage deployments → Edit → New version → Deploy (URL เดิม)

### ปรับแต่ง

- **เปลี่ยนเครื่องมือของ Agent แต่ละตัว**: แก้ในคอลัมน์ `tools` ของ tab AGENTS (คั่นด้วย comma เช่น `read_sheet,web_search`) หรือพิมพ์ `none` เพื่อปิดเครื่องมือของ Agent ตัวนั้น
- **ปิดทั้งระบบทันที**: ตั้ง Script Property `AGENT_MODE` = `off`
- **ค่าจำกัด** (ใน `Agent.gs`): `AGENT_MAX_TOOL_CALLS` (5 ครั้ง/งาน), `AGENT_TIME_BUDGET_MS` (หยุดใช้เครื่องมือเมื่อใกล้ครบ 6 นาทีของ Apps Script)
- QA Agent (AG007) ถูกตั้งเป็น **อ่านอย่างเดียว** โดยตั้งใจ

### ข้อควรรู้

- งานจะใช้เวลานานขึ้นเมื่อ Agent เรียกเครื่องมือหลายรอบ (ปุ่มอนุมัติจะค้างนานขึ้น)
- เนื้อหาจากเว็บ/ไฟล์ถูกส่งให้โมเดลโดยระบุว่าเป็น "ข้อมูล ไม่ใช่คำสั่ง" และเครื่องมืออันตรายถูกตัดออกแล้ว แต่ไม่มีระบบใดกัน prompt injection ได้ 100% จึงยังต้องให้ Boss ตรวจก่อนอนุมัติ
- Agent ใช้ JSON protocol กลางแทน tool-calling เฉพาะค่าย เพื่อให้ระบบสลับโมเดลหลัก/สำรองใน AGENTS ได้เหมือนเดิม
