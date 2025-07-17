const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Rate limiting configuration
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: "Too many AI requests, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
const validateAiRequest = (req, res, next) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({
      error: "Invalid request",
      message: "Message is required and must be a non-empty string",
    });
  }

  req.body.message = message.trim();
  next();
};

// Error handling middleware
const handleAiErrors = (err, req, res, next) => {
  console.error("AI Route Error:", err);
  res.status(500).json({
    error: "AI Service Error",
    message: "An error occurred while processing your request",
  });
};

// Define the route for the AI chatbot
router.post(
  "/ask",
  aiLimiter,
  authenticateToken,
  validateAiRequest,
  aiController.ask
);

// Apply error handling
router.use(handleAiErrors);

module.exports = router;
