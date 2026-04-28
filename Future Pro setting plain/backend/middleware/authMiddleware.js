// ============================================================
// FUTURE AI PRO — authMiddleware.js
// Accuracy improvements:
// - Distinguish expired vs invalid tokens
// - Validate token structure before verifying
// - Attach full user object to req
// ============================================================

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please login." });
  }

  const token = header.split(" ")[1];
  if (!token || token.split(".").length !== 3) {
    return res.status(401).json({ error: "Invalid token format." });
  }

  if (!process.env.JWT_SECRET) {
    console.error("[Auth] JWT_SECRET not set in environment.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please login again." });
    }
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid session. Please login again." });
    }
    return res.status(401).json({ error: "Authentication failed." });
  }
}

module.exports = { requireAuth };
