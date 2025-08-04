const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");
const {
  authenticateToken,
  authorize,
  authenticateApiKey,
} = require("../middleware/authMiddleware");

router.get(
  "/status",
  authenticateToken,
  authorize("log:read:platform"),
  syncController.getSyncStatuses
);

router.post(
  "/trigger",
  authenticateApiKey,
  authorize("log:read:platform"),
  syncController.triggerMasterSync
);

module.exports = router;
