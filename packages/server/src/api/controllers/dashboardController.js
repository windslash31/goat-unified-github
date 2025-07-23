const dashboardService = require("../../services/dashboardService");

// This function can be removed or kept for other purposes, but we won't use it for the main dashboard view.
const getDashboardData = async (req, res, next) => {
  try {
    const [stats, recentActivity, recentTickets, licenseStats, distribution] =
      await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getRecentTickets(),
        dashboardService.getLicenseStats(),
        dashboardService.getEmployeeDistribution(),
      ]);
    res.json({
      stats,
      recentActivity,
      recentTickets,
      licenseStats,
      distribution,
    });
  } catch (error) {
    next(error);
  }
};

// --- MODIFICATION START ---
// Add new, separate controller functions for each piece of data.

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const getLicenseUtilization = async (req, res, next) => {
  try {
    const licenseStats = await dashboardService.getLicenseStats();
    res.json(licenseStats);
  } catch (error) {
    next(error);
  }
};

const getLocationDistribution = async (req, res, next) => {
  try {
    const distribution = await dashboardService.getEmployeeDistribution();
    res.json(distribution);
  } catch (error) {
    next(error);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const activity = await dashboardService.getRecentActivity();
    res.json(activity);
  } catch (error) {
    next(error);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const tickets = await dashboardService.getRecentTickets();
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
  getStats,
  getLicenseUtilization,
  getLocationDistribution,
  getActivity,
  getTickets,
};
