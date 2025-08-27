const express = require("express");
const router = express.Router();
const {
  getAtlassianData,
  getBitbucketData,
  getConfluenceData,
  getJiraData,
  getGoogleData,
} = require("../controllers/dataExportController");
const {
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

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
router.get(
  "/google",
  authenticateApiKey,
  authorize("log:read:platform"),
  getGoogleData
);

module.exports = router;
