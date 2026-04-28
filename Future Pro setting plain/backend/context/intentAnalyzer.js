// ============================================================
// FUTURE AI PRO — intentAnalyzer.js
// Infers user intent from message content
// ============================================================

const VALID_INTENTS = ["information-seeking","task-execution","emotional-support","creative-exploration","learning","troubleshooting"];

const SIGNALS = {
  "information-seeking":  [/what is/i,/tell me/i,/\bexplain\b/i,/define/i,/who is/i,/when did/i,/where is/i],
  "task-execution":       [/\bwrite\b/i,/\bcreate\b/i,/\bgenerate\b/i,/\bmake\b/i,/\bbuild\b/i,/\bdo\b/i,/\bdraft\b/i],
  "emotional-support":    [/i feel/i,/i'?m sad/i,/help me cope/i,/i need support/i,/i'?m struggling/i,/i'?m upset/i],
  "creative-exploration": [/imagine/i,/what if/i,/\bstory\b/i,/\bpoem\b/i,/creative/i,/invent/i,/brainstorm/i],
  "learning":             [/teach me/i,/how do i learn/i,/roadmap/i,/\bcourse\b/i,/\bunderstand\b/i,/how to/i],
  "troubleshooting":      [/\berror\b/i,/\bbug\b/i,/not working/i,/\bfix\b/i,/\bdebug\b/i,/\bissue\b/i,/broken/i],
};

function infer(message, history = [], profile = {}) {
  if (typeof message !== "string" || message.trim() === "") {
    return { error: "EMPTY_MESSAGE" };
  }

  const scores = {};
  for (const [intent, patterns] of Object.entries(SIGNALS)) {
    let hits = 0;
    for (const p of patterns) { if (p.test(message)) hits++; }
    scores[intent] = hits / patterns.length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const confidence = best ? Math.min(1, best[1] * 4) : 0;

  // Low confidence — check history
  if (confidence < 0.5 && Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-2).map(m => m.content || "").join(" ");
    for (const [intent, patterns] of Object.entries(SIGNALS)) {
      for (const p of patterns) {
        if (p.test(recent)) {
          return { intent, confidence: 0.4, resolvedFromHistory: true };
        }
      }
    }
  }

  return {
    intent: best && confidence > 0 ? best[0] : "information-seeking",
    confidence,
    resolvedFromHistory: false
  };
}

module.exports = { infer, VALID_INTENTS };
