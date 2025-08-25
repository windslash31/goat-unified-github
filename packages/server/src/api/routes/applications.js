const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get("/", authenticateToken, applicationController.listAllApplications);

router.post(
  "/",
  authenticateToken,
  authorize("admin:manage_applications"),
  applicationController.createApplication
);
router.put(
  "/:id",
  authenticateToken,
  authorize("admin:manage_applications"),
  applicationController.updateApplication
);
router.delete(
  "/:id",
  authenticateToken,
  authorize("admin:manage_applications"),
  applicationController.deleteApplication
);

router.put(
  "/:appId/licensable",
  authenticateToken,
  authorize("admin:manage_applications"),
  applicationController.setLicensableStatus
);

module.exports = router;
