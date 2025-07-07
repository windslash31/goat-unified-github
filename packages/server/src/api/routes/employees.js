// packages/server/src/api/routes/employees.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const employeeController = require("../controllers/employeeController");
const {
  authenticateToken,
  authenticateApiKey,
  authorize,
  authorizeAdminOrSelf,
  authorizeAdminOrSelfForLogs,
} = require("../middleware/authMiddleware");

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new Error("Only .csv files are allowed!"), false);
    }
  },
});

// --- FIXED: N8N routes moved to the top to ensure they are matched first ---
router.post(
  "/onboard",
  authenticateApiKey,
  authorize("employee:create"),
  employeeController.onboardFromTicket
);
router.post(
  "/offboard",
  authenticateApiKey,
  authorize("employee:update"),
  employeeController.offboardFromTicket
);
router.post(
  "/application-access",
  authenticateApiKey,
  authorize("employee:update"),
  employeeController.createApplicationAccess
);

// General Employee Routes for the UI
router.get(
  "/",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.listEmployees
);
router.get(
  "/export",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.exportEmployees
);

// --- NEW: Route for bulk employee import ---
router.post(
  "/bulk-import",
  authenticateToken,
  authorize("employee:create"),
  upload.single("file"), // 'file' should match the name attribute in the form
  employeeController.bulkImportEmployees
);

router.get(
  "/:id",
  authenticateToken,
  authorizeAdminOrSelf,
  employeeController.getEmployee
);
router.put(
  "/:id",
  authenticateToken,
  authorize("employee:update"),
  employeeController.updateEmployee
);

// --- NEW: Route for fetching license details ---
router.get(
  "/:id/licenses",
  authenticateToken,
  authorizeAdminOrSelf,
  employeeController.getLicenseDetails
);

// Platform and Log related routes
router.get(
  "/:id/platform-statuses",
  authenticateToken,
  authorizeAdminOrSelf,
  employeeController.getPlatformStatuses
);
router.get(
  "/:id/jumpcloud-logs",
  authenticateToken,
  authorizeAdminOrSelfForLogs,
  employeeController.getJumpCloudLogs
);
router.get(
  "/:id/google-logs",
  authenticateToken,
  authorizeAdminOrSelfForLogs,
  employeeController.getGoogleLogs
);
router.get(
  "/:id/slack-logs",
  authenticateToken,
  authorizeAdminOrSelfForLogs,
  employeeController.getSlackLogs
);
router.get(
  "/:id/unified-timeline",
  authenticateToken,
  authorizeAdminOrSelfForLogs,
  employeeController.getUnifiedTimeline
);
router.post(
  "/:id/deactivate",
  authenticateToken,
  authorize("employee:deactivate"),
  employeeController.deactivateOnPlatforms
);

// Log a view action
router.post(
  "/logs/view",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.logEmployeeView
);

// Routes for dropdown options
router.get(
  "/options/:table",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.getEmployeeOptions
);

// Route for bulk actions
router.post(
  "/bulk-deactivate",
  authenticateToken,
  authorize("employee:deactivate"),
  employeeController.bulkDeactivateOnPlatforms
);

module.exports = router;
