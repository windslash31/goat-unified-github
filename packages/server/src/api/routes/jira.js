const express = require("express");
const router = express.Router();
const jiraController = require("../controllers/jiraController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/ticket/:ticketId", authenticateToken, jiraController.getTicket);
router.get("/asset/search", authenticateToken, jiraController.searchAsset);

module.exports = router;
