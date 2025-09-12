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

router.get(
  "/options/search",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.searchEmployeeOptions
);

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

router.get(
  "/access-matrix",
  authenticateToken,
  authorize("employee:read:all"),
  employeeController.getAccessMatrix
);
router.get(
  "/reports/user-access-review",
  authenticateToken,
  authorize("log:read"),
  employeeController.getUserAccessReviewReport
);
router.get(
  "/reports/dormant-accounts",
  authenticateToken,
  authorize("log:read"),
  employeeController.getDormantAccountsReport
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
  "/:id/application-access",
  authenticateToken,
  authorizeAdminOrSelf,
  employeeController.getEmployeeApplicationAccess
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
  "/:id/platform-logs",
  authenticateToken,
  authorizeAdminOrSelfForLogs,
  employeeController.getPlatformLogs
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
router.post(
  "/onboard-deferred",
  authenticateApiKey,
  authorize("employee:create"),
  employeeController.onboardDeferred
);
router.post(
  "/reconcile-managers",
  authenticateToken,
  authorize("employee:create"),
  employeeController.reconcileManagers
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

router.get(
  "/:id/access-details/:platformKey",
  authenticateToken,
  authorizeAdminOrSelf,
  employeeController.getApplicationAccessDetails
);

router.post("/trigger-sync", employeeController.triggerPlatformSync);

router.delete(
  "/:employeeId/accounts/:accountId",
  authenticateToken,
  authorize("employee:update"),
  employeeController.removeProvisionedAccount
);

module.exports = router;
