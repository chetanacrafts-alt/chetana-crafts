/**
 * Chetana Crafts — Google Sheet sync backend.
 *
 * Paste this into the Apps Script editor of a Google Sheet (Extensions ->
 * Apps Script), then deploy it as a Web App (see README.md in this folder).
 * The deployed URL goes into Settings -> Google Sheet Sync in the app.
 *
 * Contract expected by src/lib/sync.ts:
 *   POST body: { action: "writeAll", payload: <db without purchase photos> }
 *   GET  ?action=read -> returns the full db as JSON
 */

var SCHEMAS = {
  orders: ["id", "billNo", "date", "name", "phone", "channel", "product", "price", "cost", "qty", "status", "stockCode", "payMode", "paidAmount", "dueAmount", "notify"],
  stock: ["id", "code", "name", "cat", "color", "source", "cost", "sell", "qty", "low"],
  expenses: ["id", "date", "name", "amt", "cat"],
  purchases: ["id", "date", "supplier", "city", "items", "total", "extra"],
  online: ["id", "date", "platform", "orderid", "product", "stockCode", "qty", "value", "fee", "shipping", "cost", "payout", "status"],
  returns: ["id", "date", "name", "phone", "stockCode", "product", "qty", "amount", "reason", "refundMode", "origin"],
};

var SHEET_NAMES = {
  orders: "Orders",
  stock: "Stock",
  expenses: "Expenses",
  purchases: "Purchases",
  online: "Online",
  returns: "Returns",
  platforms: "Platforms",
  settings: "Settings",
};

var NUMERIC_FIELDS = ["price", "cost", "qty", "paidAmount", "dueAmount", "amt", "sell", "low", "value", "fee", "shipping", "payout", "amount", "total", "extra"];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === "writeAll") {
      writeAll(body.payload || {});
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ ok: false, error: "Unknown action: " + body.action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "read") {
      return jsonResponse(readAll());
    }
    return jsonResponse({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function writeAll(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SCHEMAS).forEach(function (key) {
    var headers = SCHEMAS[key];
    var rows = payload[key] || [];
    var sheet = getOrCreateSheet(ss, SHEET_NAMES[key]);
    sheet.clear();
    sheet.appendRow(headers);
    if (rows.length > 0) {
      var data = rows.map(function (row) {
        return headers.map(function (h) {
          var v = row[h];
          if (key === "purchases" && h === "items") return JSON.stringify(v || []);
          return v === undefined || v === null ? "" : v;
        });
      });
      sheet.getRange(2, 1, data.length, headers.length).setValues(data);
    }
  });

  var platformsSheet = getOrCreateSheet(ss, SHEET_NAMES.platforms);
  platformsSheet.clear();
  platformsSheet.appendRow(["platform"]);
  var platforms = payload.platforms || [];
  if (platforms.length > 0) {
    platformsSheet
      .getRange(2, 1, platforms.length, 1)
      .setValues(platforms.map(function (p) { return [p]; }));
  }

  var settingsHeaders = ["name", "gstin", "phone", "addr"];
  var settingsSheet = getOrCreateSheet(ss, SHEET_NAMES.settings);
  settingsSheet.clear();
  settingsSheet.appendRow(settingsHeaders);
  var settings = payload.settings || {};
  settingsSheet.appendRow(
    settingsHeaders.map(function (h) { return settings[h] || ""; })
  );
}

function readAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};

  Object.keys(SCHEMAS).forEach(function (key) {
    var sheet = ss.getSheetByName(SHEET_NAMES[key]);
    result[key] = sheet ? sheetToObjects(sheet, key) : [];
  });

  var platformsSheet = ss.getSheetByName(SHEET_NAMES.platforms);
  result.platforms = platformsSheet ? sheetColumnToArray(platformsSheet) : [];

  var settingsSheet = ss.getSheetByName(SHEET_NAMES.settings);
  result.settings = settingsSheet
    ? sheetToSettings(settingsSheet)
    : { name: "", gstin: "", phone: "", addr: "" };

  return result;
}

function sheetToObjects(sheet, key) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values
    .slice(1)
    .filter(function (row) {
      return row.some(function (c) { return c !== ""; });
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) {
        var v = row[i];
        if (key === "purchases" && h === "items") {
          try {
            v = JSON.parse(v || "[]");
          } catch (e) {
            v = [];
          }
        } else if (h === "notify") {
          v = v === true || v === "TRUE" || v === "true";
        } else if (NUMERIC_FIELDS.indexOf(h) !== -1) {
          v = Number(v) || 0;
        }
        obj[h] = v;
      });
      return obj;
    });
}

function sheetColumnToArray(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  return values
    .slice(1)
    .map(function (row) { return row[0]; })
    .filter(function (v) { return v !== ""; });
}

function sheetToSettings(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { name: "", gstin: "", phone: "", addr: "" };
  var headers = values[0];
  var row = values[1];
  var obj = {};
  headers.forEach(function (h, i) { obj[h] = row[i] || ""; });
  return obj;
}
