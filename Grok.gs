/**
 * Grok.gs
 * xAI text-generation endpoint (OpenAI-compatible chat completions shape).
 * Script Property required: XAI_API_KEY
 * Optional: XAI_MODEL (default grok-3)
 *
 * NOTE: image/video generation uses separate xAI endpoints with their own
 * request/response shape. This file covers text/creative-writing calls only
 * (e.g. the Prompt Agent asking Grok to punch up a concept). Add
 * `callGrokImage()` / `callGrokVideo()` here once you've picked which
 * xAI media endpoint you're integrating — see step 18 of the blueprint.
 */
function callGrok(systemPrompt, userPrompt) {
  var apiKey = requireProperty('XAI_API_KEY');
  var res = UrlFetchApp.fetch('https://api.x.ai/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: getProperty('XAI_MODEL', 'grok-3'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  var body = safeParseJson(res.getContentText(), {});
  if (res.getResponseCode() >= 300) throw new Error((body.error && body.error.message) || res.getContentText());
  return body.choices[0].message.content;
}
