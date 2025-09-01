const cron = require("node-cron");
const { syncAllGoogleLogs } = require("../services/googleService");
const db = require("../config/db");

let isGwsSyncRunning = false;

const runGwsLogSync = async () => {
  if (isGwsSyncRunning) {
    console.log(
      "CRON JOB: Skipping GWS log sync, a previous run is still in progress."
    );
    return;
  }
  isGwsSyncRunning = true;
  console.log("CRON JOB: Starting scheduled GWS log sync...");

  const client = await db.pool.connect();
  try {
    await syncAllGoogleLogs(client);
  } catch (error) {
    console.error(
      "CRON JOB: An error occurred during the GWS log sync:",
      error
    );
  } finally {
    isGwsSyncRunning = false;
    client.release();
    console.log("CRON JOB: GWS log sync finished. Releasing lock.");
  }
};

const scheduleGwsLogSync = () => {
  cron.schedule("* * * * *", runGwsLogSync, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log(
    "Cron job for GWS log sync has been scheduled to run every 5 minutes."
  );
};

module.exports = {
  scheduleGwsLogSync,
  runGwsLogSync,
};
