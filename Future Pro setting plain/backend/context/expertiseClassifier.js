// ============================================================
// FUTURE AI PRO — expertiseClassifier.js
// Estimates user expertise level from message signals
// ============================================================

const VALID_LEVELS = ["beginner", "intermediate", "advanced"];

const DECLARED_BEGINNER = /\b(i'?m a beginner|i'?m new to|just started|i don'?t know much|complete newbie|total beginner)\b/i;
const DECLARED_ADVANCED = /\b(i'?m a senior|i'?m an expert|i'?m a professional|years of experience|i work as a|i'?m a developer|i'?m an engineer)\b/i;
const DECLARED_INTERMEDIATE = /\b(i have some experience|i know the basics|i'?m intermediate|somewhat familiar)\b/i;

const ADVANCED_SIGNALS = [/\bapi\b/i,/\barchitecture\b/i,/\boptimiz/i,/\brefactor/i,/\bscalability\b/i,/\bmicroservice/i,/\bpolymorphism\b/i,/\brecursion\b/i,/\bcomplexity\b/i,/\bparadigm\b/i];
const BEGINNER_SIGNALS  = [/i'?m new/i,/i don'?t know/i,/\bbasic\b/i,/\bsimple\b/i,/\bhelp me understand\b/i,/what does .+ mean/i];

function estimate(message, profile = {}) {
  if (typeof message !== "string") return { level: "beginner", confidence: 0.5, source: "inferred" };

  // Declared overrides
  if (DECLARED_BEGINNER.test(message)) return { level: "beginner",      confidence: 1.0, source: "declared" };
  if (DECLARED_ADVANCED.test(message)) return { level: "advanced",      confidence: 1.0, source: "declared" };
  if (DECLARED_INTERMEDIATE.test(message)) return { level: "intermediate", confidence: 1.0, source: "declared" };

  // Use cached if not re-estimation turn
  const turnCount = profile?.session?.turnCount || 0;
  if (turnCount > 0 && turnCount % 3 !== 0 && profile?.expertise?.level) {
    return { level: profile.expertise.level, confidence: profile.expertise.confidence, source: "cached" };
  }

  // Infer from signals
  let advancedHits = 0, beginnerHits = 0;
  for (const p of ADVANCED_SIGNALS) { if (p.test(message)) advancedHits++; }
  for (const p of BEGINNER_SIGNALS)  { if (p.test(message)) beginnerHits++; }

  const words = message.trim().split(/\s+/).length;
  const avgWordLen = message.replace(/\s+/g, "").length / Math.max(words, 1);

  if (advancedHits >= 2 || avgWordLen > 7) return { level: "advanced",      confidence: 0.7, source: "inferred" };
  if (beginnerHits >= 1 || words < 8)      return { level: "beginner",      confidence: 0.6, source: "inferred" };
  return                                          { level: "intermediate",   confidence: 0.5, source: "inferred" };
}

module.exports = { estimate, VALID_LEVELS };
