const express = require("express");
const router = express.Router();
const licenseController = require("../controllers/licenseController");
const {
  authenticateToken,
  authorize,
  authenticateApiKey,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  authenticateToken,
  authorize("license:manage"),
  licenseController.getLicenses
);

router.get(
  "/:applicationId/assignments",
  authenticateToken,
  authorize("license:manage"),
  licenseController.getApplicationAssignments
);

router.put(
  "/:applicationId",
  authenticateToken,
  authorize("license:manage"),
  licenseController.updateCost
);

router.post(
  "/assignments",
  authenticateApiKey,
  authorize("license:manage"),
  licenseController.createAssignmentByName
);

module.exports = router;
