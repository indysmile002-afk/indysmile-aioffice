/**
 * Utils.gs
 * Shared helpers used by every other file: ID generation, JSON responses,
 * timestamps, and safe access to Script Properties (where API keys and
 * generated Sheet/Drive IDs live).
 */

function nowIso() {
  return new Date().toISOString();
}

/** Time-sortable, human-scannable ID, e.g. PRJ_M1A2B3C4XY */
function generateId(prefix) {
  var stamp = Date.now().toString(36).toUpperCase();
  var rand = Math.floor(Math.random() * 46656).toString(36).toUpperCase(); // up to 3 chars
  return prefix + '_' + stamp + rand;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function okResponse(data) {
  return jsonResponse({ ok: true, data: data });
}

function errorResponse(message, code) {
  return jsonResponse({ ok: false, error: String(message), code: code || 'ERROR' });
}

function safeParseJson(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback !== undefined ? fallback : null;
  }
}

/** Reads a required Script Property; throws a clear, actionable error if missing. */
function requireProperty(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Missing Script Property "' + key + '" — set it under Project Settings > Script Properties.');
  }
  return value;
}

function getProperty(key, fallback) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  return value === null ? fallback : value;
}
