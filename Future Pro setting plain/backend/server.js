require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow localhost for development
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) return callback(null, true);
    // Allow Netlify deployments
    if (origin.includes("netlify.app") || origin.includes("future-ai-pro")) return callback(null, true);
    // Allow the custom domain
    if (origin.includes("future-ai-pro.com")) return callback(null, true);
    callback(null, true); // Allow all for now — restrict in production
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: "Too many requests. Wait a moment." } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many attempts. Try again later." } });

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")));
app.use(express.static(path.join(__dirname, ".."))); // root files
// Serve images folder with spaces in name
app.use("/images", express.static(path.join(__dirname, "../Future AI Pro images")));
app.use("/Future AI Pro images", express.static(path.join(__dirname, "../Future AI Pro images")));

// ===== ROUTES =====
const authRoutes    = require("./routes/authRoutes");
const aiRoutes      = require("./routes/aiRoutes");
const userRoutes    = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const privacyRoutes = require("./routes/privacyRoutes");

app.use("/api/auth",    authLimiter, authRoutes);
app.use("/api/ai",      aiLimiter,   aiRoutes);
app.use("/api/users",   userRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/privacy", privacyRoutes);

// ===== CATCH-ALL: serve index.html =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Future AI Pro running → http://localhost:${PORT}`);
});

module.exports = app;
