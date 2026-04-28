const express = require("express");
const router  = express.Router();
const PrivacyController = require("../controllers/privacyController");
const { requireAuth }   = require("../middleware/authMiddleware");

router.get("/settings",        requireAuth, PrivacyController.getSettings);
router.put("/settings",        requireAuth, PrivacyController.saveSettings);
router.get("/export",          requireAuth, PrivacyController.exportData);
router.delete("/delete",       requireAuth, PrivacyController.deleteAccount);
router.get("/audit-log",       requireAuth, PrivacyController.getAuditLog);
router.post("/consent",        requireAuth, PrivacyController.updateConsent);
router.delete("/messages",     requireAuth, PrivacyController.clearMessages);
router.post("/enforce-retention", requireAuth, PrivacyController.enforceRetention);

module.exports = router;
