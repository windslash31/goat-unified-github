const express = require('express');
const router = express.Router();
const jiraController = require('../controllers/jiraController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Any authenticated user can view ticket details
router.get('/ticket/:ticketId', authenticateToken, jiraController.getTicket);

module.exports = router;