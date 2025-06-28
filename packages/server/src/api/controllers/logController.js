const { getActivityLogs } = require('../../services/logService');

const listActivityLogs = async (req, res, next) => {
    try {
        const logs = await getActivityLogs();
        res.json(logs);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listActivityLogs,
};