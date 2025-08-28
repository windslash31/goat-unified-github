const express = require("express");
const router = express.Router();
const {
  getJumpCloudUsersData,
} = require("../controllers/jumpcloudExportController");
const {
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

// All routes in this file will require an API key and the 'log:read:platform' permission.
router.use(authenticateApiKey, authorize("log:read:platform"));

// GET /api/data-export/jumpcloud/users
router.get("/users", getJumpCloudUsersData);

module.exports = router;
