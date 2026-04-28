// ============================================================
// database/models/userModel.js
// User schema definition and helper methods
// ============================================================

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { loadDB, saveDB, findUser, updateUser, createUser } = require("../config/db");

// Re-export config db for convenience
const db = require("../config/db");

const PLANS = {
  free:  { credits: 10,    label: "Free" },
  pro:   { credits: 500,   label: "Pro" },
  elite: { credits: 99999, label: "Elite" }
};

const UserModel = {
  // Create a new user
  async create({ name, email, password, plan = "free" }) {
    const existing = db.findUser({ email });
    if (existing) throw new Error("Email already registered.");
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashed,
      plan,
      credits: PLANS[plan]?.credits || 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return db.createUser(user);
  },

  // Find by email
  findByEmail(email) {
    return db.findUser({ email });
  },

  // Find by ID
  findById(id) {
    return db.findUser({ id });
  },

  // Verify password
  async verifyPassword(plaintext, hashed) {
    return bcrypt.compare(plaintext, hashed);
  },

  // Update user fields
  update(id, updates) {
    return db.updateUser(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  // Deduct one credit (free plan only)
  deductCredit(id) {
    const user = db.findUser({ id });
    if (!user) return null;
    if (user.plan === "free" && user.credits > 0) {
      return db.updateUser(id, { credits: user.credits - 1 });
    }
    return user;
  },

  // Upgrade plan
  upgradePlan(id, plan) {
    if (!PLANS[plan]) throw new Error("Invalid plan.");
    return db.updateUser(id, { plan, credits: PLANS[plan].credits });
  },

  // Safe public profile (no password)
  toPublic(user) {
    const { password, ...pub } = user;
    return pub;
  },

  PLANS
};

module.exports = UserModel;
