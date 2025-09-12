const syncLogService = require("../../services/syncLogService");
const {
  runSelectiveSyncs,
  isMasterSyncRunning,
} = require("../../cron/platformSync");

const getSyncStatuses = async (req, res, next) => {
  try {
    const statuses = await syncLogService.getAllJobStatuses();
    res.json(statuses);
  } catch (error) {
    next(error);
  }
};

const triggerSync = (req, res, next) => {
  if (isMasterSyncRunning()) {
    return res.status(409).json({ message: "A sync is already in progress." });
  }

  const { jobs } = req.body;

  runSelectiveSyncs(jobs).catch((err) => {
    console.error("Manual sync trigger failed:", err);
  });

  const jobList = jobs && jobs.length > 0 ? jobs.join(", ") : "all";
  res
    .status(202)
    .json({ message: `Sync triggered successfully for jobs: ${jobList}.` });
};

const triggerReconciliationJobs = (req, res, next) => {
  if (isMasterSyncRunning()) {
    return res.status(409).json({ message: "A sync is already in progress." });
  }

  // Define which jobs are part of the main reconciliation process
  const reconciliationJobs = ["reconciliation", "gws_log_reconciliation"];

  runSelectiveSyncs(reconciliationJobs).catch((err) => {
    console.error("Manual reconciliation trigger failed:", err);
  });

  res
    .status(202)
    .json({ message: "Reconciliation jobs triggered successfully." });
};

module.exports = { getSyncStatuses, triggerSync, triggerReconciliationJobs };
