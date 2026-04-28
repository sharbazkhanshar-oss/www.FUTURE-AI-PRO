// ============================================================
// FUTURE AI PRO — privacyControl.js
// Data Privacy Middleware & Utilities
// - PII detection & masking
// - Data retention enforcement
// - Consent checking
// - Audit logging
// ============================================================

const { loadDB, saveDB } = require("../config/db");

// ===== PII PATTERNS =====
const PII_PATTERNS = [
  { name: "email",       regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,        mask: "[EMAIL]" },
  { name: "phone",       regex: /(\+?\d[\d\s\-().]{7,}\d)/g,                                mask: "[PHONE]" },
  { name: "ssn",         regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,                        mask: "[SSN]" },
  { name: "credit_card", regex: /\b(?:\d[ -]?){13,16}\b/g,                                  mask: "[CARD]" },
  { name: "ip_address",  regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,                            mask: "[IP]" },
  { name: "password",    regex: /\b(password|passwd|pwd)\s*[:=]\s*\S+/gi,                   mask: "[PASSWORD]" },
];

// ===== MASK PII IN TEXT =====
function maskPII(text) {
  if (typeof text !== "string") return text;
  let masked = text;
  PII_PATTERNS.forEach(({ regex, mask }) => {
    masked = masked.replace(regex, mask);
  });
  return masked;
}

// ===== DETECT PII =====
function detectPII(text) {
  if (typeof text !== "string") return [];
  const found = [];
  PII_PATTERNS.forEach(({ name, regex }) => {
    if (regex.test(text)) found.push(name);
    regex.lastIndex = 0; // reset stateful regex
  });
  return found;
}

// ===== AUDIT LOG =====
function addAuditLog(userId, action, details = {}) {
  try {
    const db = loadDB();
    if (!db.auditLog) db.auditLog = [];
    db.auditLog.push({
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: details.ip || "unknown"
    });
    // Keep last 1000 audit entries total
    db.auditLog = db.auditLog.slice(-1000);
    saveDB(db);
  } catch (e) {
    console.error("[Audit Log Error]", e.message);
  }
}

// ===== GET USER AUDIT LOG =====
function getUserAuditLog(userId, limit = 50) {
  const db = loadDB();
  return (db.auditLog || [])
    .filter(e => e.userId === userId)
    .slice(-limit)
    .reverse();
}

// ===== CHECK CONSENT =====
function hasConsent(user, consentType) {
  return user?.privacy?.consents?.[consentType] === true;
}

// ===== DATA RETENTION =====
// Delete messages older than retentionDays for a user
function enforceRetention(userId, retentionDays) {
  if (!retentionDays || retentionDays <= 0) return 0;
  const db = loadDB();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const before = (db.messages || []).length;
  db.messages = (db.messages || []).filter(m =>
    m.userId !== userId || m.timestamp >= cutoff
  );
  const deleted = before - db.messages.length;
  if (deleted > 0) saveDB(db);
  return deleted;
}

// ===== ANONYMIZE USER DATA =====
function anonymizeUser(userId) {
  const db  = loadDB();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) return false;

  const anon = `deleted_${Date.now()}`;
  db.users[idx] = {
    id:        userId,
    name:      "Deleted User",
    email:     `${anon}@deleted.invalid`,
    password:  "DELETED",
    plan:      "free",
    credits:   0,
    deleted:   true,
    deletedAt: new Date().toISOString(),
  };

  // Remove all messages
  db.messages = (db.messages || []).filter(m => m.userId !== userId);
  saveDB(db);
  return true;
}

// ===== EXPORT USER DATA =====
function exportUserData(userId) {
  const db   = loadDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;

  const { password, ...safeUser } = user;
  const messages  = (db.messages  || []).filter(m => m.userId === userId);
  const auditLog  = (db.auditLog  || []).filter(e => e.userId === userId);

  return {
    exportedAt: new Date().toISOString(),
    profile:    safeUser,
    messages:   messages.map(m => ({ ...m, userId: undefined })),
    auditLog:   auditLog.map(e => ({ ...e, userId: undefined })),
    dataTypes:  ["profile", "messages", "auditLog"],
  };
}

// ===== PRIVACY MIDDLEWARE =====
// Attaches privacy utilities to req, checks consent
function privacyMiddleware(req, res, next) {
  req.privacy = {
    maskPII,
    detectPII,
    addAuditLog: (action, details) => addAuditLog(req.user?.id, action, { ...details, ip: req.ip }),
  };
  next();
}

module.exports = {
  privacyMiddleware,
  maskPII,
  detectPII,
  addAuditLog,
  getUserAuditLog,
  hasConsent,
  enforceRetention,
  anonymizeUser,
  exportUserData,
};
