/**
 * SheetsService.gs
 * The only file that talks to SpreadsheetApp directly. Every other file
 * (Projects.gs, Tasks.gs, Workflow.gs, Approval.gs...) goes through these
 * generic functions — so if you ever outgrow Sheets and move to a real
 * database, this is the one file to rewrite.
 */

function getDb() {
  var id = requireProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  var sheet = getDb().getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: "' + name + '" — run Setup.gs > runSetup() first.');
  return sheet;
}

function getHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function rowToObject_(headers, row) {
  var obj = {};
  headers.forEach(function (h, i) { obj[h] = row[i]; });
  return obj;
}

/** Returns every data row (below the header) as an array of plain objects. */
function getAllRows(sheetName) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2 || headers.length === 0) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .map(function (row) { return rowToObject_(headers, row); })
    .filter(function (o) { return String(o[headers[0]]) !== ''; });
}

/** Appends one row built from an object; keys not in the header row are ignored. */
function appendRow(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  var row = headers.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; });
  sheet.appendRow(row);
  return obj;
}

/** Locates the row where idColumn === idValue. Returns {rowIndex (1-based), data, headers} or null. */
function findRowById_(sheetName, idColumn, idValue) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  var idIdx = headers.indexOf(idColumn);
  if (idIdx === -1) throw new Error('Column not found: "' + idColumn + '" in ' + sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][idIdx]) === String(idValue)) {
      return { rowIndex: i + 2, data: rowToObject_(headers, values[i]), headers: headers };
    }
  }
  return null;
}

function getById(sheetName, idColumn, idValue) {
  var found = findRowById_(sheetName, idColumn, idValue);
  return found ? found.data : null;
}

/** Merges `updates` onto the matching row and writes it back in place. */
function updateById(sheetName, idColumn, idValue, updates) {
  var sheet = getSheet_(sheetName);
  var found = findRowById_(sheetName, idColumn, idValue);
  if (!found) throw new Error('Row not found: ' + sheetName + '.' + idColumn + ' = ' + idValue);
  var headers = found.headers;
  var merged = Object.assign({}, found.data, updates);
  var row = headers.map(function (h) { return merged.hasOwnProperty(h) ? merged[h] : ''; });
  sheet.getRange(found.rowIndex, 1, 1, headers.length).setValues([row]);
  return merged;
}

/** Simple equality filter across all rows of a sheet — fine at MVP scale (dozens–low thousands of rows). */
function queryRows(sheetName, filters) {
  var rows = getAllRows(sheetName);
  if (!filters) return rows;
  var keys = Object.keys(filters);
  return rows.filter(function (row) {
    return keys.every(function (k) { return String(row[k]) === String(filters[k]); });
  });
}
