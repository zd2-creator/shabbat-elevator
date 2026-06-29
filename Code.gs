/**
 * מעלית שבת — סקר קומות · שרת מאובטח (Google Apps Script)
 * ====================================================================
 * אוסף רק: קומה, דירה, שם. ❌ בלי ת"ז. ❌ בלי חתימה.
 * גיליון חדש ונפרד. כותרות שורה 1:  ts | floor | apt | name
 *
 *  1) action=progress (ציבורי) → ספירה לכל קומה + רשימת דירות שנרשמו.
 *                                 בלי שמות / מידע אישי.
 *  2) action=submit   (ציבורי) → רישום דירה אחת + מניעת כפילות בשרת.
 *  3) action=getAll   (אדמין)  → כל הרשומות, רק עם סיסמה נכונה
 *                                 (ב-Script Properties, לא בקוד).
 *
 *  ⚙️ לפני פרסום: Project Settings → Script Properties →
 *     הוסף מאפיין  ADMIN_PASSWORD  עם סיסמה חזקה.
 * ====================================================================
 */

function getAdminPassword_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || '';
}
function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function readSheet_(sh) {
  var values = sh.getDataRange().getValues();
  if (!values.length) return { headers: [], rows: [] };
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) if (headers[c]) obj[headers[c]] = values[i][c];
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

// ציבורי: ספירה לכל קומה + דירות שנרשמו (בלי מידע אישי).
function getProgress_() {
  var rows = readSheet_(sheet_()).rows;
  var floorCounts = {};
  var registeredApts = [];
  rows.forEach(function (r) {
    var f = parseInt(r.floor, 10);
    if (!isNaN(f)) floorCounts[f] = (floorCounts[f] || 0) + 1;
    var a = parseInt(r.apt, 10);
    if (!isNaN(a) && registeredApts.indexOf(a) === -1) registeredApts.push(a);
  });
  return { status: 'ok', floorCounts: floorCounts, registeredApts: registeredApts, count: registeredApts.length };
}

function aptExists_(apt) {
  var rows = readSheet_(sheet_()).rows;
  for (var i = 0; i < rows.length; i++) if (parseInt(rows[i].apt, 10) === apt) return true;
  return false;
}

// ציבורי: רישום. ולידציה + מניעת כפילות + חיתוך אורך.
function handleSubmit_(d) {
  var apt = parseInt(d.apt, 10);
  var floor = parseInt(d.floor, 10);
  if (isNaN(apt) || apt < 1 || apt > 300)   return { status: 'error', message: 'מספר דירה לא תקין' };
  if (isNaN(floor) || floor < 0 || floor > 60) return { status: 'error', message: 'קומה לא תקינה' };
  if (!d.name) return { status: 'error', message: 'חסר שם' };

  var sh = sheet_();
  if (aptExists_(apt)) return { status: 'error', message: 'דירה ' + apt + ' כבר נרשמה' };

  var record = {
    ts: new Date().toLocaleString('he-IL'),
    floor: floor,
    apt: apt,
    name: String(d.name).slice(0, 80)
  };
  var headers = readSheet_(sh).headers;
  var row;
  if (headers.length) {
    row = headers.map(function (h) { return record.hasOwnProperty(h) ? record[h] : ''; });
  } else {
    var dh = ['ts', 'floor', 'apt', 'name'];
    sh.appendRow(dh);
    row = dh.map(function (h) { return record[h]; });
  }
  sh.appendRow(row);
  return { status: 'ok' };
}

function handleGetAll_(d) {
  if (!d.pw || d.pw !== getAdminPassword_()) return { status: 'unauthorized' };
  return { status: 'ok', entries: readSheet_(sheet_()).rows };
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if ((p.action || 'progress') === 'progress') return jsonOut_(getProgress_());
  return jsonOut_({ status: 'error', message: 'unknown action' });
}
function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); }
  catch (err) { return jsonOut_({ status: 'error', message: 'bad request' }); }
  var action = d.action || 'submit';
  if (action === 'submit')   return jsonOut_(handleSubmit_(d));
  if (action === 'getAll')   return jsonOut_(handleGetAll_(d));
  if (action === 'progress') return jsonOut_(getProgress_());
  return jsonOut_({ status: 'error', message: 'unknown action' });
}
