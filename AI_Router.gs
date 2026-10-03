/**
 * AI_Router.gs
 * Agents never call an AI provider directly — every call goes through here.
 * That means switching a Role's model (e.g. Content Agent: Claude -> ChatGPT)
 * is a one-cell edit in the AGENTS sheet, zero code changes.
 */

var PROVIDERS = {
  chatgpt: callOpenAI,
  claude: callClaude,
  gemini: callGemini,
  grok: callGrok,
};

/**
 * @param agent        a row from AGENTS (agent_id, primary_model, secondary_model, system_prompt, ...)
 * @param instruction  short task instruction
 * @param contextText  full prompt body (prior outputs, feedback, schema hint, etc.)
 * @return {ok, text, model, durationMs}
 */
function callAgent(agent, instruction, contextText) {
  var systemPrompt = agent.system_prompt ||
    ('You are ' + agent.agent_name + ', role: ' + agent.role + '. Always answer with structured JSON.');
  var userPrompt = instruction + '\n\n' + contextText;

  var order = [agent.primary_model, agent.secondary_model].filter(Boolean);
  var lastError = null;

  for (var i = 0; i < order.length; i++) {
    var model = String(order[i]).toLowerCase();
    var fn = PROVIDERS[model];
    if (!fn) { lastError = 'Unknown provider: ' + model; continue; }
    var started = Date.now();
    try {
      var text = fn(systemPrompt, userPrompt);
      return { ok: true, text: text, model: model, durationMs: Date.now() - started };
    } catch (e) {
      lastError = model + ': ' + e.message;
      // fall through and try the secondary model
    }
  }

  return { ok: false, text: 'AI_ROUTER_ERROR: ' + lastError, model: order[0] || 'none', durationMs: 0 };
}
