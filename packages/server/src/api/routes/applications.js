const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { authenticateToken, authorize } = require("../middleware/authMiddleware");
const validate = require('../middleware/validateResource');
const { 
    createApplicationSchema, 
    updateApplicationSchema, 
    applicationParamsSchema 
} = require('../../utils/schemas/applicationSchemas');

router.get("/", authenticateToken, applicationController.listAllApplications);

router.post(
  "/",
  authenticateToken,
  authorize("admin:manage_applications"),
  validate(createApplicationSchema),
  applicationController.createApplication
);
router.put(
  "/:id",
  authenticateToken,
  authorize("admin:manage_applications"),
  validate(updateApplicationSchema),
  applicationController.updateApplication
);
router.delete(
  "/:id",
  authenticateToken,
  authorize("admin:manage_applications"),
  validate(applicationParamsSchema),
  applicationController.deleteApplication
);

module.exports = router;