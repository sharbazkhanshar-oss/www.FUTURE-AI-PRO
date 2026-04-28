// ============================================================
// FUTURE AI PRO — authController.js
// Accuracy improvements:
// - Proper email validation regex
// - Password strength check
// - Consistent error messages (no info leakage)
// - JWT expiry handled gracefully
// - Name sanitization
// ============================================================

const jwt       = require("jsonwebtoken");
const UserModel = require("../../database/models/userModel");

// ===== SIGN TOKEN =====
function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not configured.");
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ===== VALIDATE EMAIL =====
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ===== SANITIZE NAME =====
function sanitizeName(name) {
  return name.trim().replace(/[<>]/g, "").substring(0, 50);
}

const AuthController = {

  // ===== REGISTER =====
  async register(req, res) {
    const { name, email, password } = req.body;

    // Validate all fields present
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are all required." });
    }

    // Validate name
    const cleanName = sanitizeName(name);
    if (cleanName.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }

    // Validate email
    const cleanEmail = email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    // Validate password
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: "Password is too long." });
    }

    try {
      const user  = await UserModel.create({ name: cleanName, email: cleanEmail, password });
      const token = signToken(user);
      return res.status(201).json({ token, user: UserModel.toPublic(user) });
    } catch (e) {
      // Don't leak internal errors — map known ones
      if (e.message.includes("already registered")) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
      console.error("[Auth Register Error]", e.message);
      return res.status(500).json({ error: "Registration failed. Please try again." });
    }
  },

  // ===== LOGIN =====
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email or password." }); // generic for security
    }

    try {
      const user = UserModel.findByEmail(cleanEmail);
      // Use same error message for both "not found" and "wrong password" (security)
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const match = await UserModel.verifyPassword(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = signToken(user);
      return res.json({ token, user: UserModel.toPublic(user) });
    } catch (e) {
      console.error("[Auth Login Error]", e.message);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  },

  // ===== GET CURRENT USER =====
  me(req, res) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing." });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = UserModel.findById(decoded.id);
      if (!user) return res.status(404).json({ error: "User not found." });
      return res.json({ user: UserModel.toPublic(user) });
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Session expired. Please login again." });
      }
      return res.status(401).json({ error: "Invalid session. Please login again." });
    }
  }
};

module.exports = AuthController;
