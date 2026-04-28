// ============================================================
// FUTURE AI PRO — styleAdapter.js
// Infers and applies communication style preferences
// ============================================================

const OVERRIDE_PATTERNS = [
  { pattern: /keep it short|be brief|concise|tldr/i,       field: "verbosity",  value: "concise"  },
  { pattern: /more detail|explain more|in depth|elaborate/i,field: "verbosity",  value: "detailed" },
  { pattern: /bullet points?|use a list|numbered list/i,    field: "format",     value: "lists"    },
  { pattern: /prose|paragraph|no bullets|no list/i,         field: "format",     value: "prose"    },
  { pattern: /be more formal|formal tone|professional/i,    field: "formality",  value: "formal"   },
  { pattern: /casual|informal|relaxed|friendly/i,           field: "formality",  value: "casual"   },
];

function detectStyleOverride(message) {
  if (typeof message !== "string") return null;
  const result = {};
  for (const { pattern, field, value } of OVERRIDE_PATTERNS) {
    if (pattern.test(message)) result[field] = value;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function inferStyle(history, profile = {}) {
  const messages = Array.isArray(history) ? history.filter(m => m.role === "user") : [];

  // Default
  const result = { formality: "casual", verbosity: "concise", format: "prose", confidence: 0.3 };

  if (messages.length < 3) return result;

  // Formality: count contractions/slang vs full sentences
  let informalCount = 0, formalCount = 0;
  const informalRe = /\b(don't|can't|won't|i'm|it's|that's|gonna|wanna|kinda|yeah|nope)\b/i;
  const formalRe   = /\b(therefore|however|furthermore|consequently|regarding|please|kindly)\b/i;

  // Verbosity: average word count
  let totalWords = 0;

  // Format: bullet/list usage
  let listCount = 0;

  for (const m of messages) {
    const text = m.content || "";
    if (informalRe.test(text)) informalCount++;
    if (formalRe.test(text))   formalCount++;
    totalWords += text.trim().split(/\s+/).length;
    if (/^[-*\d]\s/m.test(text)) listCount++;
  }

  const avgWords = totalWords / messages.length;

  result.formality  = formalCount > informalCount ? "formal" : "casual";
  result.verbosity  = avgWords > 50 ? "detailed" : "concise";
  result.format     = listCount >= Math.ceil(messages.length / 2) ? "lists" : "prose";
  result.confidence = 0.7;

  return result;
}

module.exports = { inferStyle, detectStyleOverride };
