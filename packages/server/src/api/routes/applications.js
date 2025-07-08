const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

// Anyone who is logged in can get the list of applications for filtering
router.get("/", authenticateToken, applicationController.listAllApplications);

// --- CRUD Routes for Applications ---
// Now protected with the correct permission
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

module.exports = router;
