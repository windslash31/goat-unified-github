const express = require("express");
const router = express.Router();
const jiraController = require("../controllers/jiraController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/ticket/:ticketId",
  authenticateToken,
  authorize("employee:read:all"),
  jiraController.getTicket
);

router.get(
  "/asset/search",
  authenticateToken,
  authorize("employee:read:all"),
  jiraController.searchAsset
);

module.exports = router;
