const express = require('express');
const router = express.Router();
const multer = require('multer');
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authenticateApiKey, authorize, authorizeAdminOrSelf, authorizeAdminOrSelfForLogs } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// General Employee Routes for the UI
router.get('/', authenticateToken, authorize('employee:read:all'), employeeController.listEmployees);
router.get('/export', authenticateToken, authorize('employee:read:all'), employeeController.exportEmployees);
router.get('/:id', authenticateToken, authorizeAdminOrSelf, employeeController.getEmployee);
router.post('/', authenticateToken, authorize('employee:create'), employeeController.createEmployee);
router.put('/:id', authenticateToken, authorize('employee:update'), employeeController.updateEmployee);

// Bulk import route
router.post('/import', authenticateToken, authorize('employee:create'), upload.single('file'), employeeController.importEmployees);

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

// Route for N8N
router.post('/onboard', authenticateApiKey, authorize('employee:create'), employeeController.onboardFromTicket);
router.post('/offboard', authenticateApiKey, authorize('employee:update'), employeeController.offboardFromTicket);
router.post('/application-access', authenticateApiKey, authorize('employee:update'), employeeController.createApplicationAccess);

module.exports = router;