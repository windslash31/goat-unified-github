const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Define the route for the AI chatbot
// POST /api/ai/ask
router.post("/ask", authenticateToken, aiController.ask);

module.exports = router;
