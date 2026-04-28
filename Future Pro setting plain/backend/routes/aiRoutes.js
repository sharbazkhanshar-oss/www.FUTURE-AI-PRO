const express = require("express");
const router = express.Router();
const AIController = require("../controllers/aiController");
const { requireAuth } = require("../middleware/authMiddleware");

// All routes defined BEFORE module.exports
router.post("/chat",    requireAuth, AIController.chat);
router.post("/write",   requireAuth, AIController.write);
router.post("/analyze", requireAuth, AIController.analyze);
router.post("/learn",   requireAuth, AIController.learn);
router.post("/image",   requireAuth, AIController.generateImage);
router.post("/robot",   requireAuth, AIController.chat);
router.post("/social",  requireAuth, AIController.chat);

module.exports = router;
