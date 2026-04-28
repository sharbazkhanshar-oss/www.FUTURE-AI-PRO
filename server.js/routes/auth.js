const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { loadDB, saveDB } = require("../db");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required." });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters." });

  const db = loadDB();
  if (db.users.find(u => u.email === email))
    return res.status(400).json({ error: "Email already registered." });

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: hashed,
    plan: "free",
    credits: 10,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  saveDB(db);

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, plan: user.plan }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, credits: user.credits } });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required." });

  const db = loadDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "Invalid email or password." });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid email or password." });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, plan: user.plan }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan, credits: user.credits } });
});

module.exports = router;
