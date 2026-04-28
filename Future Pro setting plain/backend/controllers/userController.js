// ============================================================
// FUTURE AI PRO — userController.js
// Accuracy improvements:
// - Input validation on all endpoints
// - History capped per user correctly
// - No sensitive data leakage
// ============================================================

const UserModel          = require("../../database/models/userModel");
const { loadDB, saveDB } = require("../config/db");

const VALID_FEATURES = ["chat", "writer", "analysis", "learning", "image-gen", "social-content", "robot", "seo", "counseling"];

const UserController = {

  // ===== GET PROFILE =====
  getProfile(req, res) {
    const user = UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(UserModel.toPublic(user));
  },

  // ===== UPDATE PROFILE =====
  updateProfile(req, res) {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "A valid name is required." });
    }
    const cleanName = name.trim().replace(/[<>]/g, "").substring(0, 50);
    if (cleanName.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }

    const updated = UserModel.update(req.user.id, { name: cleanName });
    if (!updated) return res.status(404).json({ error: "User not found." });
    return res.json({ success: true, name: updated.name });
  },

  // ===== GET HISTORY =====
  getHistory(req, res) {
    const db      = loadDB();
    const limit   = Math.min(parseInt(req.query.limit) || 50, 100);
    const feature = req.query.feature;

    let history = (db.messages || []).filter(m => m.userId === req.user.id);

    // Filter by feature if specified
    if (feature && VALID_FEATURES.includes(feature)) {
      history = history.filter(m => m.feature === feature);
    }

    return res.json({ history: history.slice(-limit) });
  },

  // ===== SAVE MESSAGE =====
  saveHistory(req, res) {
    const { role, content, feature } = req.body;

    if (!role || !["user", "assistant"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'assistant'." });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Content is required." });
    }

    const safeFeature = VALID_FEATURES.includes(feature) ? feature : "chat";
    const safeContent = content.trim().substring(0, 5000);

    const db = loadDB();
    if (!db.messages) db.messages = [];

    db.messages.push({
      userId:    req.user.id,
      role,
      content:   safeContent,
      feature:   safeFeature,
      timestamp: new Date().toISOString()
    });

    // Keep last 500 messages per user (trim efficiently)
    const userMsgs  = db.messages.filter(m => m.userId === req.user.id);
    const otherMsgs = db.messages.filter(m => m.userId !== req.user.id);
    db.messages = [...otherMsgs, ...userMsgs.slice(-500)];

    saveDB(db);
    return res.json({ success: true });
  },

  // ===== CLEAR HISTORY =====
  clearHistory(req, res) {
    const db = loadDB();
    const before = (db.messages || []).length;
    db.messages = (db.messages || []).filter(m => m.userId !== req.user.id);
    saveDB(db);
    return res.json({ success: true, deleted: before - db.messages.length });
  },

  // ===== GET BIAS PREFERENCES =====
  getBiasPrefs(req, res) {
    const db   = loadDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ biasPrefs: user.biasPrefs || {} });
  },

  // ===== SAVE BIAS PREFERENCES =====
  saveBiasPrefs(req, res) {
    const allowed = ["neutrality","perspective","factCheck","diverseExamples","avoidStereotypes","culturalSensitivity","disabledBiasTypes"];
    const prefs   = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) prefs[k] = req.body[k]; });
    const updated = UserModel.update(req.user.id, { biasPrefs: prefs });
    if (!updated) return res.status(404).json({ error: "User not found." });
    return res.json({ success: true, biasPrefs: prefs });
  }
};

module.exports = UserController;
