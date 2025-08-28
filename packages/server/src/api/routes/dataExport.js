const express = require("express");
const router = express.Router();
const {
  getAtlassianData,
  getBitbucketData,
  getConfluenceData,
  getJiraData,
} = require("../controllers/dataExportController");
const jumpcloudExportRoutes = require("./jumpcloudExport");
const googleExportRoutes = require("./googleExport");

const {
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

router.use("/jumpcloud", jumpcloudExportRoutes);
router.use("/google", googleExportRoutes);

router.get(
  "/atlassian",
  authenticateApiKey,
  authorize("log:read:platform"),
  getAtlassianData
);
router.get(
  "/bitbucket",
  authenticateApiKey,
  authorize("log:read:platform"),
  getBitbucketData
);
router.get(
  "/confluence",
  authenticateApiKey,
  authorize("log:read:platform"),
  getConfluenceData
);
router.get(
  "/jira",
  authenticateApiKey,
  authorize("log:read:platform"),
  getJiraData
);

module.exports = router;
