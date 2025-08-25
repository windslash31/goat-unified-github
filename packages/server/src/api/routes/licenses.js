const express = require("express");
const router = express.Router();
const licenseController = require("../controllers/licenseController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

// A permission like 'licenses:manage' would be ideal here
// For now, we'll reuse 'admin:manage_applications'
router.use(authenticateToken, authorize("admin:manage_applications"));

router.get("/:appId", licenseController.getAppLicenses);
router.post("/:appId", licenseController.addAppLicense);

module.exports = router;
