const syncLogService = require("../../services/syncLogService");
const { runAllSyncs, isMasterSyncRunning } = require("../../cron/platformSync");

const getSyncStatuses = async (req, res, next) => {
  try {
    const statuses = await syncLogService.getAllJobStatuses();
    res.json(statuses);
  } catch (error) {
    next(error);
  }
};

const triggerMasterSync = (req, res, next) => {
  if (isMasterSyncRunning) {
    return res.status(409).json({ message: "A sync is already in progress." });
  }

  // Run the sync in the background, but don't make the user wait
  runAllSyncs().catch((err) => {
    console.error("Manual sync trigger failed:", err);
  });

  res.status(202).json({ message: "Master sync has been triggered." });
};

module.exports = { getSyncStatuses, triggerMasterSync };
