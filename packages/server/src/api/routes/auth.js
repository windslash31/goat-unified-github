// packages/server/src/api/routes/auth.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

// Existing limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message:
    "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// --- NEW: Limiter for token refresh ---
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 refresh requests per windowMs
  message:
    "Too many token refresh requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, authController.login);
// Apply the new limiter to the refresh route
router.post("/refresh", refreshTokenLimiter, authController.refreshToken);
router.post("/logout", authController.logout);
router.get(
  "/me",
  authenticateToken,
  authorize("profile:read:own"),
  authController.getMe
);

module.exports = router;
