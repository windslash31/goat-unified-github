const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/activity/filters",
  authenticateToken,
  authorize("log:read"),
  logController.getLogFilterOptions
);

router.get(
  "/activity",
  authenticateToken,
  authorize("log:read"),
  logController.listActivityLogs
);
router.get(
  "/activity/export",
  authenticateToken,
  authorize("log:read"),
  logController.exportActivityLogs
);

module.exports = router;
