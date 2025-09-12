const express = require("express");
const router = express.Router();
const {
  getUsers,
  getGroups,
  getGroupMembers,
  getJiraProjects,
  getJiraPermissions,
  getJiraRoles,
  getConfluenceSpaces,
  getConfluencePermissions,
  getBitbucketRepositories,
  getBitbucketPermissions,
} = require("../controllers/atlassianExportController");
const {
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

// This middleware applies security to all routes defined below
router.use(authenticateApiKey, authorize("log:read:platform"));

// --- Organization-Level Routes ---
router.get("/users", getUsers);
router.get("/groups", getGroups);
router.get("/group-members", getGroupMembers);

// --- Jira Routes ---
router.get("/jira/projects", getJiraProjects);
router.get("/jira/permissions", getJiraPermissions);
router.get("/jira/roles", getJiraRoles);

// --- Confluence Routes ---
router.get("/confluence/spaces", getConfluenceSpaces);
router.get("/confluence/permissions", getConfluencePermissions);

// --- Bitbucket Routes ---
router.get("/bitbucket/repositories", getBitbucketRepositories);
router.get("/bitbucket/permissions", getBitbucketPermissions);

module.exports = router;
