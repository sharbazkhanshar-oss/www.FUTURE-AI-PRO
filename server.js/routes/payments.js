const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { loadDB, saveDB } = require("../db");

const router = express.Router();

// Stripe plans
const PLANS = {
  pro: { name: "Pro", price: 1900, credits: 500, priceId: "price_pro_monthly" },
  elite: { name: "Elite", price: 4900, credits: 99999, priceId: "price_elite_monthly" }
};

// Create Stripe checkout session
router.post("/checkout", requireAuth, async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan." });
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("your_")) {
    return res.status(400).json({ error: "Stripe not configured. Add STRIPE_SECRET_KEY to .env" });
  }
  try {
    const Stripe = require("stripe");
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/dashboard.html?upgraded=true`,
      cancel_url: `${req.headers.origin}/pricing.html`,
      metadata: { userId: req.user.id, plan }
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stripe webhook — upgrade user plan after payment
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    const Stripe = require("stripe");
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, plan } = session.metadata;
    const db = loadDB();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx].plan = plan;
      db.users[idx].credits = PLANS[plan].credits;
      saveDB(db);
    }
  }
  res.json({ received: true });
});

// Manual upgrade (for testing without Stripe)
router.post("/upgrade-test", requireAuth, (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan." });
  const db = loadDB();
  const idx = db.users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "User not found." });
  db.users[idx].plan = plan;
  db.users[idx].credits = PLANS[plan].credits;
  saveDB(db);
  res.json({ success: true, plan, credits: PLANS[plan].credits });
});

module.exports = router;
