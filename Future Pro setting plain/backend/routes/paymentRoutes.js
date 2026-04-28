const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/paymentController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/config",          PaymentController.getConfig);
router.post("/checkout",       requireAuth, PaymentController.createCheckout);
router.post("/paypal-order",   requireAuth, PaymentController.createPaypalOrder);
router.post("/paypal-capture", requireAuth, PaymentController.capturePaypal);
router.post("/webhook",        express.raw({ type: "application/json" }), PaymentController.webhook);
router.post("/upgrade-test",   requireAuth, PaymentController.upgradeTest);

module.exports = router;
