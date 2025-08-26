const express = require("express");
const router = express.Router();
const licenseController = require("../controllers/licenseController");

const {
  authenticateToken,
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

// A permission like 'licenses:manage' would be ideal here
// For now, we'll reuse 'admin:manage_applications'
router.use(authenticateToken, authorize("admin:manage_applications"));
router.post(
  "/assignments",
  authenticateToken,
  authorize("employee:update"),
  licenseController.assignLicense
);

router.delete(
  "/assignments/:assignmentId",
  authenticateToken,
  authorize("employee:update"),
  licenseController.removeAssignment
);

router.post(
  "/assign-license",
  authenticateApiKey,
  authorize("employee:update"),
  licenseController.assignLicenseFromAPI
);

router.get("/:appId", licenseController.getAppLicenses);
router.post("/:appId", licenseController.addAppLicense);
module.exports = router;
