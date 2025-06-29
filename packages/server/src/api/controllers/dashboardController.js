const dashboardService = require('../../services/dashboardService');

const getDashboardData = async (req, res, next) => {
    try {
        const [stats, recentActivity, recentTickets] = await Promise.all([
            dashboardService.getDashboardStats(),
            dashboardService.getRecentActivity(),
            dashboardService.getRecentTickets()
        ]);
        res.json({ stats, recentActivity, recentTickets });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardData,
};