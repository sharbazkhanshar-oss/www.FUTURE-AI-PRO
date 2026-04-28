const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/profile",    requireAuth, UserController.getProfile);
router.put("/profile",    requireAuth, UserController.updateProfile);
router.get("/history",    requireAuth, UserController.getHistory);
router.post("/history",   requireAuth, UserController.saveHistory);
router.delete("/history", requireAuth, UserController.clearHistory);
router.get("/bias-prefs", requireAuth, UserController.getBiasPrefs);
router.put("/bias-prefs", requireAuth, UserController.saveBiasPrefs);

module.exports = router;
