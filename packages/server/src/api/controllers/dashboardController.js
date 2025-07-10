const dashboardService = require("../../services/dashboardService");

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

module.exports = {
  getDashboardData,
};
