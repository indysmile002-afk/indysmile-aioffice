/**
 * Gemini.gs
 * Google Generative Language API (generateContent).
 * Script Property required: GEMINI_API_KEY
 * Optional: GEMINI_MODEL (default gemini-2.0-flash)
 */
function callGemini(systemPrompt, userPrompt) {
  var apiKey = requireProperty('GEMINI_API_KEY');
  var model = getProperty('GEMINI_MODEL', 'gemini-2.0-flash');
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    }),
  });
  var body = safeParseJson(res.getContentText(), {});
  if (res.getResponseCode() >= 300) throw new Error((body.error && body.error.message) || res.getContentText());
  return body.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('\n');
}
