const express = require("express");
const router = express.Router();
const {
  listAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  onboardApplication,
  setLicensableStatus,
} = require("../controllers/applicationController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get("/", authenticateToken, listAllApplications);

router.post(
  "/",
  authenticateToken,
  authorize("admin:manage_applications"),
  createApplication
);

router.put(
  "/:id",
  authenticateToken,
  authorize("admin:manage_applications"),
  updateApplication
);

router.delete(
  "/:id",
  authenticateToken,
  authorize("admin:manage_applications"),
  deleteApplication
);

// This is the new route you added
router.post(
  "/onboard",
  authenticateToken,
  authorize("admin:manage_applications"),
  onboardApplication
);

router.put(
  "/:appId/licensable",
  authenticateToken,
  authorize("admin:manage_applications"),
  setLicensableStatus
);

module.exports = router;
