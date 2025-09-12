const express = require("express");
const router = express.Router();
const {
  getJumpCloudUsersData,
  getJumpCloudLogsData,
} = require("../controllers/jumpcloudExportController");
const {
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

router.use(authenticateApiKey, authorize("log:read:platform"));

// GET /api/data-export/jumpcloud/users
router.get("/users", getJumpCloudUsersData);

// GET /api/data-export/jumpcloud/logs
router.get("/logs", getJumpCloudLogsData);

module.exports = router;
