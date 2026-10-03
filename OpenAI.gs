/**
 * OpenAI.gs
 * Chat Completions endpoint (broadly compatible, simple JSON in/out).
 * Script Property required: OPENAI_API_KEY
 * Optional: OPENAI_MODEL (default gpt-4o-mini)
 */
function callOpenAI(systemPrompt, userPrompt) {
  var apiKey = requireProperty('OPENAI_API_KEY');
  var res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: getProperty('OPENAI_MODEL', 'gpt-4o-mini'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });
  var body = safeParseJson(res.getContentText(), {});
  if (res.getResponseCode() >= 300) throw new Error((body.error && body.error.message) || res.getContentText());
  return body.choices[0].message.content;
}
