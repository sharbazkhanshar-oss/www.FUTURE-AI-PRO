// ============================================================
// FUTURE AI PRO — backend/config/db.js
// Accuracy improvements:
// - Atomic writes (write to temp file, then rename)
// - Corrupt JSON recovery
// - Consistent findUser logic
// - Thread-safe read/write pattern
// ============================================================

const fs   = require("fs");
const path = require("path");

const DB_PATH  = path.join(__dirname, "../../database/db.json");
const TMP_PATH = DB_PATH + ".tmp";

const DEFAULT_DB = () => ({ users: [], messages: [], uploads: [] });

// ===== ENSURE DB EXISTS =====
function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB(), null, 2), "utf8");
  }
}

// ===== LOAD =====
function loadDB() {
  ensureDB();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const data = JSON.parse(raw);
    // Ensure all required keys exist
    return {
      users:    Array.isArray(data.users)    ? data.users    : [],
      messages: Array.isArray(data.messages) ? data.messages : [],
      uploads:  Array.isArray(data.uploads)  ? data.uploads  : [],
    };
  } catch (e) {
    console.error("[DB] Failed to parse db.json, resetting:", e.message);
    const fresh = DEFAULT_DB();
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }
}

// ===== SAVE (atomic write) =====
function saveDB(data) {
  ensureDB();
  try {
    const json = JSON.stringify(data, null, 2);
    // Write to temp file first, then rename (atomic on most OS)
    fs.writeFileSync(TMP_PATH, json, "utf8");
    fs.renameSync(TMP_PATH, DB_PATH);
  } catch (e) {
    console.error("[DB] Save failed:", e.message);
    // Fallback: direct write
    try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8"); } catch {}
  }
}

// ===== FIND USER =====
function findUser(query) {
  if (!query || typeof query !== "object") return null;
  const db = loadDB();
  return db.users.find(u => {
    if (query.id    && u.id    === query.id)    return true;
    if (query.email && u.email === query.email) return true;
    return false;
  }) || null;
}

// ===== UPDATE USER =====
function updateUser(id, updates) {
  if (!id || typeof updates !== "object") return null;
  const db  = loadDB();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  // Merge updates, never allow overwriting id or password via this method
  const { id: _id, password: _pw, ...safeUpdates } = updates;
  db.users[idx] = { ...db.users[idx], ...safeUpdates };
  saveDB(db);
  return db.users[idx];
}

// ===== CREATE USER =====
function createUser(user) {
  if (!user || !user.id || !user.email) throw new Error("Invalid user object.");
  const db = loadDB();
  // Double-check no duplicate email
  if (db.users.find(u => u.email === user.email)) {
    throw new Error("Email already registered.");
  }
  db.users.push(user);
  saveDB(db);
  return user;
}

module.exports = { loadDB, saveDB, findUser, updateUser, createUser };
