const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { loadDB, saveDB } = require("../db");

const router = express.Router();

// GET profile
router.get("/profile", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan, credits: user.credits, createdAt: user.createdAt });
});

// UPDATE profile
router.put("/profile", requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required." });
  const db = loadDB();
  const idx = db.users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "User not found." });
  db.users[idx].name = name;
  saveDB(db);
  res.json({ success: true, name });
});

// GET chat history
router.get("/history", requireAuth, (req, res) => {
  const db = loadDB();
  const history = (db.messages || []).filter(m => m.userId === req.user.id).slice(-50);
  res.json({ history });
});

// SAVE message to history
router.post("/history", requireAuth, (req, res) => {
  const { role, content, feature } = req.body;
  if (!role || !content) return res.status(400).json({ error: "Role and content required." });
  const db = loadDB();
  if (!db.messages) db.messages = [];
  db.messages.push({ userId: req.user.id, role, content, feature: feature || "chat", timestamp: new Date().toISOString() });
  // Keep only last 200 messages per user
  db.messages = db.messages.filter(m => m.userId !== req.user.id).concat(
    db.messages.filter(m => m.userId === req.user.id).slice(-200)
  );
  saveDB(db);
  res.json({ success: true });
});

module.exports = router;
