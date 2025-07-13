const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const validate = require('../middleware/validateResource');
const { loginSchema } = require('../../utils/schemas/authSchemas');
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
  keyGenerator: (req) => {
    // Use the email address from the request body as the key
    return req.body.email;
  },
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 refresh requests
  message:
    "Too many token refresh requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.post("/refresh", refreshTokenLimiter, authController.refreshToken);
router.post("/logout", authController.logout);
router.get(
  "/me",
  authenticateToken,
  authorize("profile:read:own"),
  authController.getMe
);

module.exports = router;
