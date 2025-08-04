const syncLogService = require("../../services/syncLogService");

const getSyncStatuses = async (req, res, next) => {
  try {
    const statuses = await syncLogService.getAllJobStatuses();
    res.json(statuses);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSyncStatuses };
