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

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new Error("Only .csv files are allowed!"), false);
    }
  },
});

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

router.post(
  "/bulk-import",
  authenticateToken,
  authorize("employee:create"),
  upload.single("file"),
  employeeController.bulkImportEmployees
);

router.get(
  "/template/csv",
  authenticateToken,
  authorize("employee:create"),
  employeeController.getEmployeeImportTemplate
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

router.post(
  "/:id/sync-status",
  authenticateToken,
  authorize("employee:update"),
  employeeController.syncPlatformStatus
);

router.get(
  "/:id/licenses",
  authenticateToken,
  authorizeAdminOrSelf,
  employeeController.getLicenseDetails
);

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

router.post(
  "/logs/view",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.logEmployeeView
);

router.get(
  "/options/:table",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.getEmployeeOptions
);

router.post(
  "/bulk-deactivate",
  authenticateToken,
  authorize("employee:deactivate"),
  employeeController.bulkDeactivateOnPlatforms
);

router.get(
  "/:id/devices",
  authenticateToken,
  authorizeAdminOrSelf,
  employeeController.getEmployeeDevices
);

module.exports = router;
