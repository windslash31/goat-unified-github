const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Anyone who is logged in can get the list of applications for filtering
router.get('/', authenticateToken, applicationController.listAllApplications);

module.exports = router;