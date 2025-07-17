const cron = require("node-cron");
const db = require("../config/db");
const employeeService = require("../services/employeeService");

// Define batching constants to avoid overwhelming APIs
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 seconds

const syncAllUserStatuses = async () => {
  console.log("CRON JOB: Starting nightly platform status sync...");
  try {
    const employeeResult = await db.query("SELECT id FROM employees");
    const employeeIds = employeeResult.rows.map((row) => row.id);

    console.log(
      `CRON JOB: Found ${employeeIds.length} active employees to sync.`
    );

    for (let i = 0; i < employeeIds.length; i += BATCH_SIZE) {
      const batch = employeeIds.slice(i, i + BATCH_SIZE);
      console.log(`CRON JOB: Syncing batch of ${batch.length} employees...`);

      const syncPromises = batch.map((id) =>
        employeeService
          .syncPlatformStatus(id)
          .catch((e) =>
            console.error(`CRON JOB: Failed to sync employee ${id}:`, e.message)
          )
      );

      await Promise.all(syncPromises);

      if (i + BATCH_SIZE < employeeIds.length) {
        console.log(
          `CRON JOB: Waiting for ${
            DELAY_BETWEEN_BATCHES_MS / 1000
          } seconds before next batch...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)
        );
      }
    }
    console.log(
      "CRON JOB: Nightly platform status sync completed successfully."
    );
  } catch (error) {
    console.error(
      "CRON JOB: An unexpected error occurred during the nightly sync:",
      error
    );
  }
};

/**
 * Initializes and schedules the cron job.
 */
const schedulePlatformSync = () => {
  cron.schedule("* * * * *", syncAllUserStatuses, {
    // Schedule to run at 2 AM every day in Jakarta's timezone
    //cron.schedule("0 2 * * *", syncAllUserStatuses, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });

  console.log(
    "Cron job for platform status sync has been scheduled for 2:00 AM (Asia/Jakarta)."
  );
};

module.exports = { schedulePlatformSync };
