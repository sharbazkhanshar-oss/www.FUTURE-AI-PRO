// ============================================================
// FUTURE AI PRO — biasControl.js
// AI Bias Detection & Control Middleware
// Ensures fair, balanced, neutral AI responses
// ============================================================

// ===== BIAS CATEGORIES =====
const BIAS_TYPES = {
  political:    { label: "Political",    description: "Left/right political leaning" },
  gender:       { label: "Gender",       description: "Gender stereotypes or assumptions" },
  racial:       { label: "Racial",       description: "Racial or ethnic bias" },
  religious:    { label: "Religious",    description: "Religious favoritism or prejudice" },
  age:          { label: "Age",          description: "Ageism — young or old bias" },
  cultural:     { label: "Cultural",     description: "Western/Eastern cultural bias" },
  socioeconomic:{ label: "Socioeconomic","description": "Class or wealth bias" },
  confirmation: { label: "Confirmation", description: "Confirming existing beliefs only" },
};

// ===== BIAS DETECTION PATTERNS =====
// These are red-flag phrases that suggest potential bias in prompts
const BIAS_PATTERNS = {
  political: [
    /\b(liberals?|conservatives?|democrats?|republicans?|leftists?|right.wing|left.wing)\b/i,
    /\b(socialism|capitalism|communism|fascism)\s+(is|are)\s+(bad|good|evil|great)/i,
  ],
  gender: [
    /\b(women|men|girls?|boys?)\s+(can't|cannot|shouldn't|are\s+not\s+good\s+at)/i,
    /\b(typical|all)\s+(women|men|females?|males?)\b/i,
  ],
  racial: [
    /\b(all|most|typical)\s+(black|white|asian|hispanic|latino|arab)\s+(people|men|women)\b/i,
  ],
  religious: [
    /\b(christianity|islam|judaism|hinduism|buddhism)\s+(is|are)\s+(the\s+)?(only|best|worst|true|false)/i,
  ],
  age: [
    /\b(old\s+people|elderly|boomers?|millennials?|gen\s*z)\s+(are|can't|don't|won't)/i,
  ],
};

// ===== DETECT BIAS IN PROMPT =====
function detectBiasInPrompt(text) {
  const detected = [];
  for (const [type, patterns] of Object.entries(BIAS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        detected.push({ type, label: BIAS_TYPES[type].label });
        break;
      }
    }
  }
  return detected;
}

// ===== BUILD BIAS CONTROL SYSTEM PROMPT =====
function buildBiasControlPrompt(userPrefs = {}) {
  const {
    neutrality     = "high",      // high | medium | low
    perspective    = "balanced",  // balanced | multiple | single
    factCheck      = true,
    diverseExamples = true,
    avoidStereotypes = true,
    culturalSensitivity = true,
    disabledBiasTypes = [],       // array of bias types to specifically avoid
  } = userPrefs;

  const rules = [
    "You are a fair, unbiased, and balanced AI assistant.",
    "",
    "BIAS CONTROL RULES — follow these strictly:",
  ];

  // Neutrality level
  if (neutrality === "high") {
    rules.push("- Present ALL sides of controversial topics equally without favoring any position");
    rules.push("- Use neutral language — avoid emotionally charged words");
    rules.push("- When asked for opinions on divisive topics, present multiple perspectives");
  } else if (neutrality === "medium") {
    rules.push("- Strive for balance on controversial topics");
    rules.push("- Acknowledge different viewpoints exist");
  }

  // Perspective
  if (perspective === "balanced") {
    rules.push("- For any claim, acknowledge counterarguments or alternative views");
    rules.push("- Use phrases like 'some argue', 'others believe', 'research suggests'");
  } else if (perspective === "multiple") {
    rules.push("- Explicitly present at least 2-3 different perspectives on any topic");
    rules.push("- Label each perspective clearly (e.g., 'From a scientific view:', 'From a cultural view:')");
  }

  // Fact checking
  if (factCheck) {
    rules.push("- Only state facts you are confident about; say 'I'm not certain' when unsure");
    rules.push("- Distinguish between facts, opinions, and interpretations");
    rules.push("- Do not fabricate statistics, studies, or citations");
  }

  // Diverse examples
  if (diverseExamples) {
    rules.push("- Use examples from diverse cultures, genders, ages, and backgrounds");
    rules.push("- Avoid defaulting to Western/American examples exclusively");
  }

  // Stereotypes
  if (avoidStereotypes) {
    rules.push("- Never make generalizations about groups of people");
    rules.push("- Avoid gender, racial, age, or cultural stereotypes");
    rules.push("- Treat all groups with equal respect and dignity");
  }

  // Cultural sensitivity
  if (culturalSensitivity) {
    rules.push("- Be sensitive to cultural differences and avoid ethnocentrism");
    rules.push("- Recognize that practices and values vary across cultures");
  }

  // Specific bias types to avoid
  if (disabledBiasTypes.length > 0) {
    disabledBiasTypes.forEach(type => {
      const info = BIAS_TYPES[type];
      if (info) rules.push(`- Specifically avoid ${info.label} bias: ${info.description}`);
    });
  }

  rules.push("");
  rules.push("If asked about a topic where bias is possible, proactively note that you are presenting a balanced view.");

  return rules.join("\n");
}

// ===== ANALYZE RESPONSE FOR BIAS =====
function analyzeResponseForBias(text) {
  const issues = [];

  // Check for one-sided language
  const onesidedPhrases = [
    /\b(obviously|clearly|everyone knows|it's obvious|undeniably|without doubt)\b/i,
    /\b(always|never|all|none|every|no one)\s+(people|humans|men|women|they)\b/i,
  ];
  onesidedPhrases.forEach(p => {
    if (p.test(text)) issues.push({ type: "one-sided", message: "Response may contain absolute language" });
  });

  // Check for missing balance on controversial topics
  const controversialTopics = [
    /\b(abortion|gun control|immigration|climate change|vaccines|religion|politics)\b/i
  ];
  controversialTopics.forEach(p => {
    if (p.test(text) && !/\b(some|others|many|different|various|perspectives?|views?|argue|believe|suggest)\b/i.test(text)) {
      issues.push({ type: "missing-balance", message: "Controversial topic detected — consider adding multiple perspectives" });
    }
  });

  return issues;
}

// ===== MIDDLEWARE =====
function biasControlMiddleware(req, res, next) {
  // Get user bias preferences from header or body
  const biasPrefs = req.body.biasPrefs || {};

  // Detect bias in the user's prompt
  const message = req.body.message || req.body.text || req.body.topic || "";
  const detectedBias = detectBiasInPrompt(message);

  // Attach to request for use in controllers
  req.biasControl = {
    systemPrompt: buildBiasControlPrompt(biasPrefs),
    detectedBias,
    prefs: biasPrefs,
  };

  next();
}

module.exports = {
  biasControlMiddleware,
  buildBiasControlPrompt,
  detectBiasInPrompt,
  analyzeResponseForBias,
  BIAS_TYPES,
};
