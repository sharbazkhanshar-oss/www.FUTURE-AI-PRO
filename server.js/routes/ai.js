const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { loadDB, saveDB } = require("../db");

const router = express.Router();

async function callOpenAI(messages, model = "gpt-4o-mini") {
  const { default: fetch } = await import("node-fetch");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages, max_tokens: 1000 })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

function checkCredits(req, res, next) {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: "User not found." });
  if (user.plan === "free" && user.credits <= 0)
    return res.status(403).json({ error: "No credits left. Please upgrade your plan.", upgrade: true });
  req.dbUser = user;
  req.db = db;
  next();
}

function deductCredit(db, user) {
  if (user.plan === "free") {
    user.credits = Math.max(0, user.credits - 1);
    const idx = db.users.findIndex(u => u.id === user.id);
    db.users[idx] = user;
    saveDB(db);
  }
}

// CHAT
router.post("/chat", requireAuth, checkCredits, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "Message required." });
  try {
    const messages = [
      { role: "system", content: "You are Future AI Pro, a helpful, smart, and friendly AI assistant. Be concise but thorough." },
      ...history.slice(-10),
      { role: "user", content: message }
    ];
    const reply = await callOpenAI(messages);
    deductCredit(req.db, req.dbUser);
    res.json({ reply, credits: req.dbUser.credits });
  } catch (e) {
    res.status(500).json({ error: e.message || "AI error." });
  }
});

// WRITER
router.post("/write", requireAuth, checkCredits, async (req, res) => {
  const { type, topic, tone = "professional", length = "medium" } = req.body;
  if (!type || !topic) return res.status(400).json({ error: "Type and topic required." });
  const lengthMap = { short: "150 words", medium: "300 words", long: "600 words" };
  try {
    const prompt = `Write a ${type} about "${topic}" in a ${tone} tone. Length: approximately ${lengthMap[length] || "300 words"}. Format it well with proper structure.`;
    const reply = await callOpenAI([{ role: "user", content: prompt }]);
    deductCredit(req.db, req.dbUser);
    res.json({ reply, credits: req.dbUser.credits });
  } catch (e) {
    res.status(500).json({ error: e.message || "AI error." });
  }
});

// ANALYSIS
router.post("/analyze", requireAuth, checkCredits, async (req, res) => {
  const { text, analysisType = "general" } = req.body;
  if (!text) return res.status(400).json({ error: "Text required." });
  const typePrompts = {
    general: "Analyze the following text and provide key insights, main points, and a summary:",
    sentiment: "Perform a detailed sentiment analysis on the following text. Identify emotions, tone, and overall sentiment:",
    data: "Analyze the following data and provide insights, patterns, trends, and recommendations:",
    seo: "Perform an SEO analysis on the following content. Identify keywords, readability, and improvement suggestions:"
  };
  try {
    const prompt = `${typePrompts[analysisType] || typePrompts.general}\n\n${text}`;
    const reply = await callOpenAI([{ role: "user", content: prompt }]);
    deductCredit(req.db, req.dbUser);
    res.json({ reply, credits: req.dbUser.credits });
  } catch (e) {
    res.status(500).json({ error: e.message || "AI error." });
  }
});

// LEARNING
router.post("/learn", requireAuth, checkCredits, async (req, res) => {
  const { topic, level = "beginner", format = "explanation" } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic required." });
  const formatPrompts = {
    explanation: `Explain "${topic}" for a ${level} in a clear, engaging way with examples.`,
    quiz: `Create a 5-question quiz about "${topic}" for a ${level}. Include answers at the end.`,
    roadmap: `Create a detailed learning roadmap for "${topic}" for a ${level}. Include resources and milestones.`,
    summary: `Summarize the key concepts of "${topic}" for a ${level} in bullet points.`
  };
  try {
    const reply = await callOpenAI([{ role: "user", content: formatPrompts[format] || formatPrompts.explanation }]);
    deductCredit(req.db, req.dbUser);
    res.json({ reply, credits: req.dbUser.credits });
  } catch (e) {
    res.status(500).json({ error: e.message || "AI error." });
  }
});

// IMAGE GENERATION
router.post("/image", requireAuth, checkCredits, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required." });
  try {
    const { default: fetch } = await import("node-fetch");
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    deductCredit(req.db, req.dbUser);
    res.json({ imageUrl: data.data[0].url, credits: req.dbUser.credits });
  } catch (e) {
    res.status(500).json({ error: e.message || "Image generation error." });
  }
});

module.exports = router;
