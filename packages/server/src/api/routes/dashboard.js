const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  authenticateToken,
  authorize("dashboard:view"),
  dashboardController.getDashboardData
);

router.get(
  "/stats",
  authenticateToken,
  authorize("dashboard:view"),
  dashboardController.getStats
);

router.get(
  "/license-stats",
  authenticateToken,
  authorize("dashboard:view"),
  dashboardController.getLicenseUtilization
);

router.get(
  "/distribution",
  authenticateToken,
  authorize("dashboard:view"),
  dashboardController.getLocationDistribution
);

router.get(
  "/activity",
  authenticateToken,
  authorize("dashboard:view"),
  dashboardController.getActivity
);

router.get(
  "/tickets",
  authenticateToken,
  authorize("dashboard:view"),
  dashboardController.getTickets
);

module.exports = router;
