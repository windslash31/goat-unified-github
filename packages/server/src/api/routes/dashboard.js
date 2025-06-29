const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, authorize('dashboard:view'), dashboardController.getDashboardData);

module.exports = router;