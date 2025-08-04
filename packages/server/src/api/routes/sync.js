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
  authorize("dashboard:view"), //placeholder
  syncController.getSyncStatuses
);

module.exports = router;
