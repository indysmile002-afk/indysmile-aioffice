/**
 * Claude.gs
 * Anthropic Messages API.
 * Script Property required: ANTHROPIC_API_KEY
 * Optional: ANTHROPIC_MODEL (default claude-sonnet-4-6)
 */
function callClaude(systemPrompt, userPrompt) {
  var apiKey = requireProperty('ANTHROPIC_API_KEY');
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: getProperty('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  var body = safeParseJson(res.getContentText(), {});
  if (res.getResponseCode() >= 300) throw new Error((body.error && body.error.message) || res.getContentText());
  return (body.content || []).map(function (b) { return b.text || ''; }).join('\n');
}
