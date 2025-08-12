const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/licenseAssignmentController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.use(authenticateToken, authorize("license:manage"));

router.get("/unassigned/:applicationId", assignmentController.getUnassigned);
router.post("/:applicationId", assignmentController.createAssignment);
router.delete("/:assignmentId", assignmentController.deleteAssignment);

module.exports = router;
