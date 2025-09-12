const cron = require("node-cron");
const { syncAllGoogleLogs } = require("../services/googleService");
const {
  startJob,
  finishJob,
  updateProgress,
} = require("../services/syncLogService");

const JOB_NAME = "gws_log_sync";

const runGwsLogSync = async () => {
  try {
    await startJob(JOB_NAME);
    console.log(`CRON JOB: Starting scheduled GWS log sync for ${JOB_NAME}...`);

    await updateProgress(
      JOB_NAME,
      "Fetching logs from Google Workspace...",
      25
    );
    const result = await syncAllGoogleLogs();

    await updateProgress(JOB_NAME, `Ingested ${result.ingested} new logs.`, 90);

    // MODIFICATION: Log success upon completion
    await finishJob(JOB_NAME, "SUCCESS");
    console.log(`CRON JOB: ${JOB_NAME} finished successfully.`);
  } catch (error) {
    console.error(
      `CRON JOB: An error occurred during the GWS log sync for ${JOB_NAME}:`,
      error
    );
    // MODIFICATION: Log failure to the database
    await finishJob(JOB_NAME, "FAILED", error);
  }
};

const scheduleGwsLogSync = () => {
  cron.schedule("* * * * *", runGwsLogSync, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log(
    `Cron job for ${JOB_NAME} has been scheduled to run every minute.`
  );
};

module.exports = {
  scheduleGwsLogSync,
  runGwsLogSync,
};
