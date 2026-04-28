// ============================================================
// FUTURE AI PRO — paymentController.js
// Supports: Stripe (cards), PayPal, Manual/Test upgrade
// ============================================================

const UserModel = require("../../database/models/userModel");

const PLANS = {
  pro:   { name: "Pro",   price: 19.00, credits: 500,   stripeId: "price_pro_monthly",   paypalId: "PLAN_PRO_MONTHLY" },
  elite: { name: "Elite", price: 49.00, credits: 99999, stripeId: "price_elite_monthly", paypalId: "PLAN_ELITE_MONTHLY" }
};

function stripeConfigured() {
  return process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("your_");
}

function paypalConfigured() {
  return process.env.PAYPAL_CLIENT_ID && !process.env.PAYPAL_CLIENT_ID.includes("your_");
}

const PaymentController = {

  // ===== GET /api/payments/config =====
  // Returns which payment methods are available
  getConfig(req, res) {
    res.json({
      stripe:  stripeConfigured(),
      paypal:  paypalConfigured(),
      plans:   Object.entries(PLANS).map(([key, p]) => ({
        id: key, name: p.name, price: p.price, credits: p.credits
      }))
    });
  },

  // ===== POST /api/payments/checkout (Stripe) =====
  async createCheckout(req, res) {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan." });

    if (!stripeConfigured()) {
      return res.status(400).json({
        error: "Stripe not configured.",
        hint: "Add STRIPE_SECRET_KEY to your .env file, or use the test upgrade endpoint.",
        testUpgrade: true
      });
    }

    try {
      const Stripe = require("stripe");
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: req.user.email,
        line_items: [{ price: PLANS[plan].stripeId, quantity: 1 }],
        success_url: `${req.headers.origin}/dashboard.html?upgraded=true&plan=${plan}`,
        cancel_url:  `${req.headers.origin}/pricing.html`,
        metadata: { userId: req.user.id, plan },
        subscription_data: {
          metadata: { userId: req.user.id, plan }
        }
      });
      res.json({ url: session.url, provider: "stripe" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ===== POST /api/payments/paypal-order =====
  async createPaypalOrder(req, res) {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan." });

    if (!paypalConfigured()) {
      return res.status(400).json({
        error: "PayPal not configured.",
        hint: "Add PAYPAL_CLIENT_ID and PAYPAL_SECRET to your .env file."
      });
    }

    try {
      const { default: fetch } = await import("node-fetch");
      // Get PayPal access token
      const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Create order
      const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: "USD", value: PLANS[plan].price.toFixed(2) },
            description: `Future AI Pro — ${PLANS[plan].name} Plan`,
            custom_id: `${req.user.id}:${plan}`
          }],
          application_context: {
            return_url: `${req.headers.origin}/dashboard.html?upgraded=true&plan=${plan}`,
            cancel_url: `${req.headers.origin}/pricing.html`
          }
        })
      });
      const order = await orderRes.json();
      const approveLink = order.links?.find(l => l.rel === "approve")?.href;
      res.json({ orderId: order.id, approveUrl: approveLink, provider: "paypal" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ===== POST /api/payments/paypal-capture =====
  async capturePaypal(req, res) {
    const { orderId, plan } = req.body;
    if (!orderId || !plan) return res.status(400).json({ error: "orderId and plan required." });

    try {
      const { default: fetch } = await import("node-fetch");
      const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      });
      const { access_token } = await tokenRes.json();

      const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" }
      });
      const capture = await captureRes.json();

      if (capture.status === "COMPLETED") {
        UserModel.upgradePlan(req.user.id, plan);
        res.json({ success: true, plan, message: "Payment successful! Plan upgraded." });
      } else {
        res.status(400).json({ error: "Payment not completed.", status: capture.status });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // ===== POST /api/payments/webhook (Stripe) =====
  webhook(req, res) {
    if (!stripeConfigured()) return res.json({ received: true });
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
      const { userId, plan } = event.data.object.metadata;
      try { UserModel.upgradePlan(userId, plan); } catch {}
    }
    if (event.type === "customer.subscription.deleted") {
      const userId = event.data.object.metadata?.userId;
      if (userId) try { UserModel.upgradePlan(userId, "free"); } catch {}
    }
    res.json({ received: true });
  },

  // ===== POST /api/payments/upgrade-test =====
  // Works without any payment keys — for testing
  upgradeTest(req, res) {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan. Use: pro or elite" });
    try {
      const updated = UserModel.upgradePlan(req.user.id, plan);
      res.json({
        success: true,
        plan: updated.plan,
        credits: updated.credits,
        message: `✅ Upgraded to ${PLANS[plan].name}! You now have ${updated.credits === 99999 ? "unlimited" : updated.credits} credits.`
      });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
};

module.exports = PaymentController;
