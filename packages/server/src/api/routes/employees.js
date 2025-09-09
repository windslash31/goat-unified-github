const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  listEmployees,
  getEmployee,
  updateEmployee,
  onboardFromTicket,
  offboardFromTicket,
  createApplicationAccess,
  logEmployeeView,
  getEmployeeOptions,
  deactivateOnPlatforms,
  bulkDeactivateOnPlatforms,
  getPlatformStatuses,
  getPlatformLogs,
  getUnifiedTimeline,
  exportEmployees,
  getLicenseDetails,
  bulkImportEmployees,
  getEmployeeImportTemplate,
  getEmployeeDevices,
  syncPlatformStatus,
  triggerPlatformSync,
  getEmployeeAtlassianAccess,
  getEmployeeApplicationAccess,
  getApplicationAccessDetails,
  onboardDeferred,
  reconcileManagers,
  removeProvisionedAccount,
  searchEmployeeOptions,
  getAccessMatrix,
  getUserAccessReviewReport,
  getUserAccessReviewReportExcel,
  getUserAccessReviewReportCsv,
} = require("../controllers/employeeController");
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
  searchEmployeeOptions
);

router.post(
  "/onboard",
  authenticateApiKey,
  authorize("employee:create"),
  onboardFromTicket
);
router.post(
  "/offboard",
  authenticateApiKey,
  authorize("employee:update"),
  offboardFromTicket
);
router.post(
  "/application-access",
  authenticateApiKey,
  authorize("employee:update"),
  createApplicationAccess
);

router.get(
  "/",
  authenticateToken,
  authorize("employee:read:all"),
  listEmployees
);

router.get(
  "/access-matrix",
  authenticateToken,
  authorize("employee:read:all"),
  getAccessMatrix
);

router.get(
  "/reports/user-access-review",
  authenticateToken,
  authorize("log:read"),
  getUserAccessReviewReport
);

router.get(
  "/export",
  authenticateToken,
  authorize("employee:read:all"),
  exportEmployees
);

router.post(
  "/bulk-import",
  authenticateToken,
  authorize("employee:create"),
  upload.single("file"),
  bulkImportEmployees
);

router.get(
  "/template/csv",
  authenticateToken,
  authorize("employee:create"),
  getEmployeeImportTemplate
);

router.get("/:id", authenticateToken, authorizeAdminOrSelf, getEmployee);
router.put(
  "/:id",
  authenticateToken,
  authorize("employee:update"),
  updateEmployee
);

router.post(
  "/:id/sync-status",
  authenticateToken,
  authorize("employee:update"),
  syncPlatformStatus
);

router.get(
  "/:id/application-access",
  authenticateToken,
  authorizeAdminOrSelf,
  getEmployeeApplicationAccess
);

router.get(
  "/:id/licenses",
  authenticateToken,
  authorizeAdminOrSelf,
  getLicenseDetails
);

router.get(
  "/:id/platform-statuses",
  authenticateToken,
  authorizeAdminOrSelf,
  getPlatformStatuses
);
router.get(
  "/:id/platform-logs",
  authenticateToken,
  authorizeAdminOrSelfForLogs,
  getPlatformLogs
);
router.get(
  "/:id/unified-timeline",
  authenticateToken,
  authorizeAdminOrSelfForLogs,
  getUnifiedTimeline
);
router.post(
  "/:id/deactivate",
  authenticateToken,
  authorize("employee:deactivate"),
  deactivateOnPlatforms
);

router.post(
  "/logs/view",
  authenticateToken,
  authorize("employee:read:all"),
  logEmployeeView
);
router.post(
  "/onboard-deferred",
  authenticateApiKey,
  authorize("employee:create"),
  onboardDeferred
);
router.post(
  "/reconcile-managers",
  authenticateApiKey,
  authorize("employee:create"),
  reconcileManagers
);

router.get(
  "/options/:table",
  authenticateToken,
  authorize("employee:read:all"),
  getEmployeeOptions
);

router.post(
  "/bulk-deactivate",
  authenticateToken,
  authorize("employee:deactivate"),
  bulkDeactivateOnPlatforms
);

router.get(
  "/:id/devices",
  authenticateToken,
  authorizeAdminOrSelf,
  getEmployeeDevices
);

router.get(
  "/:id/access-details/:platformKey",
  authenticateToken,
  authorizeAdminOrSelf,
  getApplicationAccessDetails
);

router.post("/trigger-sync", triggerPlatformSync);

router.delete(
  "/:employeeId/accounts/:accountId",
  authenticateToken,
  authorize("employee:update"),
  removeProvisionedAccount
);

module.exports = router;
