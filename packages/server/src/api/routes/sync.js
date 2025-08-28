const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/status",
  authenticateToken,
  authorize("log:read:platform"),
  syncController.getSyncStatuses
);

router.post(
  "/trigger",
  authenticateToken,
  authorize("log:read:platform"),
  syncController.triggerSync
);

module.exports = router;
