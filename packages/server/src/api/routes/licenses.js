const express = require("express");
const router = express.Router();
const licenseController = require("../controllers/licenseController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  authenticateToken,
  authorize("license:manage"), // Or a new, more general read permission
  licenseController.getLicenses
);

router.put(
  "/:applicationId",
  authenticateToken,
  authorize("license:manage"),
  licenseController.updateCost
);

module.exports = router;
