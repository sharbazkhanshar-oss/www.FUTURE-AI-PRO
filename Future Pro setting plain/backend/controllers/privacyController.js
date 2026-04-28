// ============================================================
// FUTURE AI PRO — privacyController.js
// Full Data Privacy Controller
// ============================================================

const UserModel = require("../../database/models/userModel");
const {
  addAuditLog,
  getUserAuditLog,
  enforceRetention,
  anonymizeUser,
  exportUserData,
} = require("../middleware/privacyControl");
const { loadDB, saveDB } = require("../config/db");

const DEFAULT_PRIVACY = {
  dataRetentionDays:  90,       // keep messages for 90 days
  saveHistory:        true,     // save chat history
  shareDiagnostics:   false,    // share usage data
  marketingEmails:    false,    // marketing emails
  piiMasking:         true,     // mask PII in stored messages
  twoFactorEnabled:   false,    // 2FA (future)
  consents: {
    terms:      true,
    privacy:    true,
    cookies:    true,
    marketing:  false,
    analytics:  false,
  }
};

const PrivacyController = {

  // ===== GET SETTINGS =====
  getSettings(req, res) {
    const user = UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    const settings = { ...DEFAULT_PRIVACY, ...(user.privacy || {}) };
    addAuditLog(req.user.id, "VIEW_PRIVACY_SETTINGS", { ip: req.ip });
    return res.json({ settings });
  },

  // ===== SAVE SETTINGS =====
  saveSettings(req, res) {
    const allowed = ["dataRetentionDays","saveHistory","shareDiagnostics","marketingEmails","piiMasking"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Validate retention days
    if (updates.dataRetentionDays !== undefined) {
      const days = parseInt(updates.dataRetentionDays);
      if (isNaN(days) || days < 1 || days > 365) {
        return res.status(400).json({ error: "Retention days must be between 1 and 365." });
      }
      updates.dataRetentionDays = days;
    }

    const user    = UserModel.findById(req.user.id);
    const current = user?.privacy || {};
    const merged  = { ...DEFAULT_PRIVACY, ...current, ...updates };

    UserModel.update(req.user.id, { privacy: merged });
    addAuditLog(req.user.id, "UPDATE_PRIVACY_SETTINGS", { changes: Object.keys(updates), ip: req.ip });
    return res.json({ success: true, settings: merged });
  },

  // ===== UPDATE CONSENT =====
  updateConsent(req, res) {
    const { consentType, granted } = req.body;
    const validConsents = ["terms","privacy","cookies","marketing","analytics"];
    if (!validConsents.includes(consentType)) {
      return res.status(400).json({ error: "Invalid consent type." });
    }

    const user    = UserModel.findById(req.user.id);
    const privacy = { ...DEFAULT_PRIVACY, ...(user?.privacy || {}) };
    privacy.consents = { ...(privacy.consents || {}), [consentType]: !!granted };

    UserModel.update(req.user.id, { privacy });
    addAuditLog(req.user.id, "UPDATE_CONSENT", { consentType, granted: !!granted, ip: req.ip });
    return res.json({ success: true, consents: privacy.consents });
  },

  // ===== EXPORT DATA =====
  exportData(req, res) {
    const data = exportUserData(req.user.id);
    if (!data) return res.status(404).json({ error: "User not found." });
    addAuditLog(req.user.id, "DATA_EXPORT", { ip: req.ip });
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="future-ai-pro-data-${req.user.id}.json"`);
    return res.json(data);
  },

  // ===== DELETE ACCOUNT =====
  deleteAccount(req, res) {
    const { confirm } = req.body;
    if (confirm !== "DELETE") {
      return res.status(400).json({ error: 'Send { "confirm": "DELETE" } to confirm account deletion.' });
    }

    addAuditLog(req.user.id, "ACCOUNT_DELETED", { ip: req.ip });
    const success = anonymizeUser(req.user.id);
    if (!success) return res.status(404).json({ error: "User not found." });
    return res.json({ success: true, message: "Account and all data permanently deleted." });
  },

  // ===== GET AUDIT LOG =====
  getAuditLog(req, res) {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const log   = getUserAuditLog(req.user.id, limit);
    return res.json({ auditLog: log });
  },

  // ===== CLEAR MESSAGES =====
  clearMessages(req, res) {
    const db     = loadDB();
    const before = (db.messages || []).filter(m => m.userId === req.user.id).length;
    db.messages  = (db.messages || []).filter(m => m.userId !== req.user.id);
    saveDB(db);
    addAuditLog(req.user.id, "CLEAR_MESSAGES", { count: before, ip: req.ip });
    return res.json({ success: true, deleted: before });
  },

  // ===== ENFORCE RETENTION =====
  enforceRetention(req, res) {
    const user = UserModel.findById(req.user.id);
    const days = user?.privacy?.dataRetentionDays || DEFAULT_PRIVACY.dataRetentionDays;
    const deleted = enforceRetention(req.user.id, days);
    addAuditLog(req.user.id, "RETENTION_ENFORCED", { days, deleted, ip: req.ip });
    return res.json({ success: true, deleted, retentionDays: days });
  },
};

module.exports = PrivacyController;
