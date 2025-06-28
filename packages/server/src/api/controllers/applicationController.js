const applicationService = require('../../services/applicationService');

const listAllApplications = async (req, res, next) => {
    try {
        const applications = await applicationService.getAllApplications();
        res.json(applications);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listAllApplications,
};