// ============================================================
// FUTURE AI PRO — contextStore.js
// Persistence layer for User Context Profiles
// Extends backend/config/db.js atomic write pattern
// ============================================================

const { loadDB, saveDB } = require("../config/db");

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// ===== DEFAULT EMPTY PROFILE =====
function createEmptyProfile(userId) {
  return {
    userId,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    emotionalBaseline: { current: "neutral", history: [] },
    intentHistory: [],
    expertise: { level: "beginner", source: "inferred", confidence: 0.5, lastEstimatedAt: new Date().toISOString() },
    style: { formality: "casual", verbosity: "concise", format: "prose", confidence: 0, overriddenAt: null },
    cultural: { indicators: [], confirmedBackground: null },
    preferences: {
      confirmed: [],
      implicit: { positiveSignals: 0, negativeSignals: 0, lastNegativeStyle: null }
    },
    session: { turnCount: 0, startedAt: new Date().toISOString(), currentIntent: null, currentEmotion: null },
    privacySettings: { contextLearningEnabled: true }
  };
}

// ===== INITIALIZE =====
function initialize() {
  try {
    const db = loadDB();
    if (!db.context_profiles) {
      db.context_profiles = {};
      saveDB(db);
    }
  } catch (e) {
    console.error("[ContextStore] initialize failed:", e.message);
  }
}

// ===== LOAD =====
function load(userId) {
  try {
    const db = loadDB();
    const profiles = db.context_profiles || {};
    const stored = profiles[userId];
    if (!stored) return createEmptyProfile(userId);
    // Validate it's a proper object
    if (typeof stored !== "object" || !stored.userId) {
      console.error(`[ContextStore] Corrupted profile for userId ${userId}, resetting.`);
      return createEmptyProfile(userId);
    }
    return stored;
  } catch (e) {
    console.error(`[ContextStore] Corrupted profile for userId ${userId}, resetting.`);
    return createEmptyProfile(userId);
  }
}

// ===== SAVE =====
function save(userId, profile) {
  try {
    const db = loadDB();
    if (!db.context_profiles) db.context_profiles = {};
    db.context_profiles[userId] = { ...profile, lastUpdated: new Date().toISOString() };
    saveDB(db);
  } catch (e) {
    console.error("[ContextStore] Save failed:", e.message);
  }
}

// ===== REMOVE =====
function remove(userId) {
  try {
    const db = loadDB();
    if (db.context_profiles) {
      delete db.context_profiles[userId];
      saveDB(db);
    }
  } catch (e) {
    console.error("[ContextStore] Remove failed:", e.message);
  }
}

// ===== PURGE EXPIRED (90 days) =====
function purgeExpired() {
  try {
    const db = loadDB();
    if (!db.context_profiles) return 0;
    const cutoff = Date.now() - NINETY_DAYS_MS;
    let count = 0;
    for (const [userId, profile] of Object.entries(db.context_profiles)) {
      if (new Date(profile.lastUpdated).getTime() < cutoff) {
        delete db.context_profiles[userId];
        count++;
      }
    }
    if (count > 0) saveDB(db);
    return count;
  } catch (e) {
    console.error("[ContextStore] purgeExpired failed:", e.message);
    return 0;
  }
}

module.exports = { initialize, load, save, remove, purgeExpired, createEmptyProfile };
