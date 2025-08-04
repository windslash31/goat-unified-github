// packages/server/src/api/routes/sync.js

// Add a log at the very top of the file to confirm it's being loaded
console.log("--- LOADING sync.js route file: VERSION 2 ---");

const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");
const {
  authenticateToken,
  authorize,
  authenticateApiKey,
} = require("../middleware/authMiddleware");

router.get(
  "/status",
  authenticateToken,
  authorize("log:read:platform"),
  syncController.getSyncStatuses
);

router.post(
  "/trigger",
  // Add a temporary middleware for logging before authentication
  (req, res, next) => {
    console.log("--- TRIGGER ROUTE HIT ---");
    console.log("The server is now executing the /api/sync/trigger route.");
    console.log("The next middleware in the chain is 'authenticateApiKey'.");
    next();
  },
  authenticateApiKey,
  authorize("log:read:platform"),
  syncController.triggerMasterSync
);

module.exports = router;
