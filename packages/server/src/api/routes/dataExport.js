const express = require("express");
const router = express.Router();
const dataExportController = require("../controllers/dataExportController");
const {
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/atlassian-sync",
  authenticateApiKey,
  authorize("log:read:platform"),
  dataExportController.getAtlassianSyncData
);

module.exports = router;
