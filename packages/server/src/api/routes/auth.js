const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: 'Too many login attempts from this IP, please try again after 15 minutes',
	standardHeaders: true,
	legacyHeaders: false,
    skipSuccessfulRequests: true,
});

router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refreshToken); // New route for token refresh
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authorize('profile:read:own'), authController.getMe);

module.exports = router;