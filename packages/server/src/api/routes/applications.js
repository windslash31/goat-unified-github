const express = require("express");
const router = express.Router();
const {
  listAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  onboardApplication,
  setLicensableStatus,
  listApplicationNames,
} = require("../controllers/applicationController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get("/", authenticateToken, listAllApplications);

router.get(
  "/names",
  authenticateToken,
  authorize("employee:read:all"),
  listApplicationNames
);

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
