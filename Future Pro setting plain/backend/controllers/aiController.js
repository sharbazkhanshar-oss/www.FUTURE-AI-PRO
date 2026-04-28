// ============================================================
// FUTURE AI PRO — aiController.js
// Accuracy improvements:
// - Input sanitization & length limits
// - Credit deducted AFTER successful AI response
// - Validated model selection
// - Proper history filtering (no system messages from client)
// - Consistent error handling
// - Token limits tuned per endpoint
// - Bias control integrated
// ============================================================

const UserModel = require("../../database/models/userModel");
const { buildBiasControlPrompt, detectBiasInPrompt, analyzeResponseForBias } = require("../middleware/biasControl");

// ===== ALLOWED MODELS =====
const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"];
const DEFAULT_MODEL  = "gpt-4o-mini";

// ===== INPUT LIMITS =====
const LIMITS = {
  message:  8000,   // chat message
  content:  12000,  // analysis content
  topic:    500,    // writer/learner topic
  prompt:   1000,   // image prompt
  history:  10,     // max history messages
};

// ===== SANITIZE =====
function sanitize(str, maxLen) {
  if (typeof str !== "string") return "";
  return str.trim().substring(0, maxLen);
}

// ===== VALIDATE HISTORY =====
// Only allow user/assistant roles — strip any injected system messages
function validateHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => m && typeof m === "object" && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .map(m => ({ role: m.role, content: sanitize(m.content, 2000) }))
    .slice(-LIMITS.history);
}

// ===== OPENAI CALL =====
async function callOpenAI(messages, model = DEFAULT_MODEL, maxTokens = 1200) {
  // Validate model
  const safeModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;

  const { default: fetch } = await import("node-fetch");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: safeModel,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.choices?.[0]?.message?.content) throw new Error("Empty response from AI.");
  return data.choices[0].message.content;
}

// ===== CHECK CREDITS (does NOT deduct yet) =====
function checkCredits(req, res) {
  const user = UserModel.findById(req.user.id);
  if (!user) { res.status(401).json({ error: "User not found." }); return null; }
  if (user.plan === "free" && user.credits <= 0) {
    res.status(403).json({ error: "No credits left. Upgrade your plan.", upgrade: true });
    return null;
  }
  return user;
}

// ===== DEDUCT CREDIT (called AFTER success) =====
function deductCredit(userId, plan) {
  if (plan === "free") {
    return UserModel.deductCredit(userId);
  }
  return UserModel.findById(userId);
}

// ===== SYSTEM PROMPT =====
const BASE_SYSTEM_PROMPT = `You are Future AI Pro — a highly accurate, helpful, and professional AI assistant.
Rules:
- Always provide factually accurate information
- If unsure, say so clearly rather than guessing
- Be concise but thorough
- Format responses clearly with markdown when helpful
- Never make up facts, statistics, or citations`;

function buildSystemPrompt(biasPrefs) {
  const biasPrompt = buildBiasControlPrompt(biasPrefs || {});
  return `${BASE_SYSTEM_PROMPT}\n\n${biasPrompt}`;
}

// ============================================================
const AIController = {

  // ===== CHAT =====
  async chat(req, res) {
    const message   = sanitize(req.body.message, LIMITS.message);
    const history   = validateHistory(req.body.history);
    const model     = req.body.model || DEFAULT_MODEL;
    const biasPrefs = req.body.biasPrefs || {};

    if (!message) return res.status(400).json({ error: "Message is required." });

    const user = checkCredits(req, res);
    if (!user) return;

    // Detect bias in user prompt
    const detectedBias = detectBiasInPrompt(message);

    try {
      const messages = [
        { role: "system", content: buildSystemPrompt(biasPrefs) },
        ...history,
        { role: "user", content: message }
      ];

      const reply = await callOpenAI(messages, model, 1500);

      // Analyze response for bias
      const biasIssues = analyzeResponseForBias(reply);

      const updated = deductCredit(user.id, user.plan);
      res.json({
        reply,
        credits: updated?.credits ?? user.credits,
        bias: {
          promptBias: detectedBias,
          responseBias: biasIssues,
          controlled: true,
        }
      });
    } catch (e) {
      console.error("[AI Chat Error]", e.message);
      res.status(500).json({ error: e.message || "AI service error. Please try again." });
    }
  },

  // ===== WRITER =====
  async write(req, res) {
    const type   = sanitize(req.body.type, 50);
    const topic  = sanitize(req.body.topic, LIMITS.topic);
    const tone   = sanitize(req.body.tone || "professional", 30);
    const length = req.body.length || "medium";

    if (!type || !topic) return res.status(400).json({ error: "Content type and topic are required." });

    const validLengths = { short: "150 words", medium: "300 words", long: "600 words" };
    const wordTarget = validLengths[length] || "300 words";

    const user = checkCredits(req, res);
    if (!user) return;

    try {
      const prompt = `Write a ${type} about "${topic}" in a ${tone} tone.
Target length: approximately ${wordTarget}.
Requirements:
- Engaging opening that hooks the reader
- Well-structured with clear sections
- Accurate, factual content
- Strong conclusion with a call to action
- Natural, flowing language`;

      const reply = await callOpenAI([
        { role: "system", content: "You are an expert content writer. Write accurate, engaging, well-structured content." },
        { role: "user", content: prompt }
      ], DEFAULT_MODEL, 1800);

      const updated = deductCredit(user.id, user.plan);
      res.json({ reply, credits: updated?.credits ?? user.credits });
    } catch (e) {
      console.error("[AI Write Error]", e.message);
      res.status(500).json({ error: e.message || "AI service error." });
    }
  },

  // ===== ANALYSIS =====
  async analyze(req, res) {
    const text         = sanitize(req.body.text, LIMITS.content);
    const analysisType = sanitize(req.body.analysisType || "general", 20);

    if (!text) return res.status(400).json({ error: "Text to analyze is required." });
    if (text.length < 10) return res.status(400).json({ error: "Text is too short to analyze." });

    const user = checkCredits(req, res);
    if (!user) return;

    const systemPrompts = {
      general:   "You are an expert analyst. Provide accurate, insightful analysis with clear structure.",
      sentiment: "You are an expert in sentiment analysis and NLP. Provide precise emotional and tonal analysis.",
      data:      "You are a data analyst. Identify patterns, trends, and provide actionable insights.",
      seo:       "You are an SEO expert. Evaluate content for search engine optimization with specific, actionable recommendations."
    };

    const userPrompts = {
      general:   `Analyze this text thoroughly. Provide: 1) Key insights 2) Main points 3) Summary 4) Recommendations:\n\n${text}`,
      sentiment: `Perform detailed sentiment analysis. Identify: 1) Overall sentiment (positive/negative/neutral with %) 2) Emotions detected 3) Tone 4) Key phrases driving sentiment:\n\n${text}`,
      data:      `Analyze this data. Identify: 1) Patterns and trends 2) Anomalies 3) Key statistics 4) Actionable insights:\n\n${text}`,
      seo:       `Perform SEO analysis. Evaluate: 1) Keyword usage and density 2) Readability score 3) Content structure 4) Specific improvements needed:\n\n${text}`
    };

    const safeType = Object.keys(userPrompts).includes(analysisType) ? analysisType : "general";

    try {
      const reply = await callOpenAI([
        { role: "system", content: systemPrompts[safeType] },
        { role: "user", content: userPrompts[safeType] }
      ], DEFAULT_MODEL, 1500);

      const updated = deductCredit(user.id, user.plan);
      res.json({ reply, credits: updated?.credits ?? user.credits });
    } catch (e) {
      console.error("[AI Analyze Error]", e.message);
      res.status(500).json({ error: e.message || "AI service error." });
    }
  },

  // ===== LEARNING =====
  async learn(req, res) {
    const topic  = sanitize(req.body.topic, LIMITS.topic);
    const level  = sanitize(req.body.level || "beginner", 20);
    const format = sanitize(req.body.format || "explanation", 20);

    if (!topic) return res.status(400).json({ error: "Topic is required." });

    const validLevels  = ["beginner", "intermediate", "advanced"];
    const validFormats = ["explanation", "quiz", "roadmap", "summary"];
    const safeLevel    = validLevels.includes(level) ? level : "beginner";
    const safeFormat   = validFormats.includes(format) ? format : "explanation";

    const user = checkCredits(req, res);
    if (!user) return;

    const formatPrompts = {
      explanation: `Explain "${topic}" for a ${safeLevel}. Include:
- Clear definition
- Real-world examples and analogies
- Key concepts broken down simply
- Common misconceptions to avoid
- Next steps for learning more`,
      quiz: `Create a 5-question multiple-choice quiz about "${topic}" for a ${safeLevel}.
Format each question as:
Q[N]: [question]
A) [option] B) [option] C) [option] D) [option]
Answer: [letter] — [brief explanation]`,
      roadmap: `Create a detailed learning roadmap for "${topic}" for a ${safeLevel}.
Include: milestones, estimated time per stage, free resources, and skills gained at each stage.`,
      summary: `Summarize the most important concepts of "${topic}" for a ${safeLevel}.
Use clear bullet points with brief explanations. Include key terms and their definitions.`
    };

    try {
      const reply = await callOpenAI([
        { role: "system", content: `You are an expert educator specializing in ${topic}. Provide accurate, clear, and engaging educational content.` },
        { role: "user", content: formatPrompts[safeFormat] }
      ], DEFAULT_MODEL, 1800);

      const updated = deductCredit(user.id, user.plan);
      res.json({ reply, credits: updated?.credits ?? user.credits });
    } catch (e) {
      console.error("[AI Learn Error]", e.message);
      res.status(500).json({ error: e.message || "AI service error." });
    }
  },

  // ===== IMAGE GENERATION =====
  async generateImage(req, res) {
    const prompt = sanitize(req.body.prompt, LIMITS.prompt);
    if (!prompt) return res.status(400).json({ error: "Image prompt is required." });
    if (prompt.length < 5) return res.status(400).json({ error: "Prompt is too short. Describe your image in more detail." });

    const user = checkCredits(req, res);
    if (!user) return;

    try {
      const { default: fetch } = await import("node-fetch");
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "vivid"
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Image API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      if (!data.data?.[0]?.url) throw new Error("No image returned from API.");

      const updated = deductCredit(user.id, user.plan);
      res.json({ imageUrl: data.data[0].url, credits: updated?.credits ?? user.credits });
    } catch (e) {
      console.error("[AI Image Error]", e.message);
      res.status(500).json({ error: e.message || "Image generation failed." });
    }
  }
};

module.exports = AIController;
