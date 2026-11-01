/**
 * نبرمج لنبتكر — أكاديمية الفلاح (فرع الجيمي)
 * يحفظ المشاركين في جدول Google Sheets ويغذّي عدّاد القطع المضيئة في الموقع.
 *
 * الطريقة (لا تحتاج فتح Google Sheets):
 * 1) افتح  script.google.com  ← New project (مشروع جديد)
 * 2) احذف الكود الموجود والصق هذا الملف كاملًا ← Save (Ctrl+S)
 * 3) من القائمة أعلى المحرر اختر الدالة  setup  ← Run
 *    وافق على الصلاحيات (Review permissions ← حسابك ← Advanced ← Go to project ← Allow)
 *    سيُنشأ جدول باسم «نبرمج لنبتكر – المشاركون» في Google Drive، ويظهر رابطه في Execution log
 * 4) Deploy ← New deployment ← ⚙️ ← Web app
 *      Execute as: Me      Who has access: Anyone
 *    ← Deploy ← انسخ رابط Web app (ينتهي بـ /exec)
 * 5) في index.html استبدل  PASTE_YOUR_WEB_APP_URL_HERE  بالرابط
 */

const SHEET_NAME = "Participants";
const HEADERS = ["Timestamp", "Certificate ID", "Name", "School", "Emirate", "Role", "Level",
  "Score", "Points", "Before", "After", "Understand", "Confidence", "Comment"];
const ROLES = ["طالب / طالبة", "معلم / معلمة", "ولي أمر", "إدارة"];

function spreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create("نبرمج لنبتكر – المشاركون");
  props.setProperty("SHEET_ID", ss.getId());
  return ss;
}

function sheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sh.setRightToLeft(true);
    const first = ss.getSheetByName("Sheet1");
    if (first && ss.getSheets().length > 1) ss.deleteSheet(first);
  }
  return sh;
}

/** شغّل هذه الدالة مرة واحدة فقط لإنشاء الجدول */
function setup() {
  const sh = sheet_();
  Logger.log("تم إنشاء الجدول: " + sh.getParent().getUrl());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    sheet_().appendRow([new Date(), d.id, d.name, d.school, d.emirate, d.role, d.level,
      d.score, d.points, d.before, d.after, d.understand, d.confidence, d.comment]);
    return ContentService.createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const sh = sheet_();
  const n = Math.max(sh.getLastRow() - 1, 0);
  const roles = [0, 0, 0, 0];
  if (n > 0) {
    sh.getRange(2, 6, n, 1).getValues().forEach(r => {
      const i = ROLES.indexOf(String(r[0]));
      if (i >= 0) roles[i]++;
    });
  }
  return ContentService.createTextOutput(JSON.stringify({count: n, roles: roles}))
    .setMimeType(ContentService.MimeType.JSON);
}
