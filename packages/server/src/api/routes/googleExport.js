const express = require("express");
const router = express.Router();
const { getGoogleUsersData } = require("../controllers/googleExportController");
const {
  authenticateApiKey,
  authorize,
} = require("../middleware/authMiddleware");

router.use(authenticateApiKey, authorize("log:read:platform"));

// GET /api/data-export/google/users
router.get("/users", getGoogleUsersData);

module.exports = router;
