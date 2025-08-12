const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/licenseAssignmentController");
const {
  authenticateToken,
  authorize,
  authenticateApiKey,
} = require("../middleware/authMiddleware");

// Routes for the UI (used by logged-in users)
router.get(
  "/unassigned/:applicationId",
  authenticateToken,
  authorize("license:manage"),
  assignmentController.getUnassigned
);
router.post(
  "/:applicationId",
  authenticateToken,
  authorize("license:manage"),
  assignmentController.createAssignment
);
router.delete(
  "/:assignmentId",
  authenticateToken,
  authorize("license:manage"),
  assignmentController.deleteAssignment
);

module.exports = router;
