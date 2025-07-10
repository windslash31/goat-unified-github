// packages/server/src/api/routes/auth.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

// Limiter for login attempts, now keyed by email address
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each email to 10 login attempts per windowMs
  message:
    "Too many login attempts for this account, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // --- THIS IS THE KEY CHANGE ---
  keyGenerator: (req) => {
    // Use the email address from the request body as the key
    return req.body.email;
  },
});

// --- NEW: Limiter for token refresh ---
const refreshTokenLimiter = rateLimit({
  // ... (rest of the limiter is unchanged)
});

router.post("/login", loginLimiter, authController.login);
router.post("/refresh", refreshTokenLimiter, authController.refreshToken);
router.post("/logout", authController.logout);
router.get(
  "/me",
  authenticateToken,
  authorize("profile:read:own"),
  authController.getMe
);

module.exports = router;
