const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

router.get('/activity', authenticateToken, authorize('log:read'), logController.listActivityLogs);

module.exports = router;