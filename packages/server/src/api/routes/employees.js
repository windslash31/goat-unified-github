const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorize, authorizeAdminOrSelf, authorizeAdminOrSelfForLogs } = require('../middleware/authMiddleware');

// General Employee Routes
router.get('/', authenticateToken, authorize('employee:read:all'), employeeController.listEmployees);
router.get('/:id', authenticateToken, authorizeAdminOrSelf, employeeController.getEmployee);
router.put('/:id', authenticateToken, authorize('employee:update'), employeeController.updateEmployee);

// Platform and Log related routes
router.get('/:id/platform-statuses', authenticateToken, authorizeAdminOrSelf, employeeController.getPlatformStatuses);
router.get('/:id/jumpcloud-logs', authenticateToken, authorizeAdminOrSelfForLogs, employeeController.getJumpCloudLogs);
router.get('/:id/google-logs', authenticateToken, authorizeAdminOrSelfForLogs, employeeController.getGoogleLogs);
router.get('/:id/slack-logs', authenticateToken, authorizeAdminOrSelfForLogs, employeeController.getSlackLogs);
router.get('/:id/unified-timeline', authenticateToken, authorizeAdminOrSelfForLogs, employeeController.getUnifiedTimeline);
router.post('/:id/deactivate', authenticateToken, authorize('employee:deactivate'), employeeController.deactivateOnPlatforms);

// Log a view action
router.post('/logs/view', authenticateToken, authorize('employee:read:all'), employeeController.logEmployeeView);

// Routes for dropdown options
router.get('/options/:table', authenticateToken, authorize('employee:read:all'), employeeController.getEmployeeOptions);

// Route for bulk actions
router.post('/bulk-deactivate', authenticateToken, authorize('employee:deactivate'), employeeController.bulkDeactivateOnPlatforms);


module.exports = router;