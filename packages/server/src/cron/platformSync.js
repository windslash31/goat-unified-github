const cron = require("node-cron");
const db = require("../config/db");
const employeeService = require("../services/employeeService");
const {
  syncAllJumpCloudUsers,
  syncAllJumpCloudApplications,
  syncAllJumpCloudGroupAssociations,
  syncAllJumpCloudGroupMembers,
} = require("../services/jumpcloudService");
// Import the new logging service
const {
  startJob,
  updateProgress,
  finishJob,
} = require("../services/syncLogService");

let isSyncRunning = false;
// Define a constant for the job name
const JOB_NAME = "jumpcloud_sync";

const syncAllUserStatuses = async () => {
  console.log("CRON JOB: Starting nightly platform status sync...");
  try {
    const employeeResult = await db.query("SELECT id FROM employees");
    const employeeIds = employeeResult.rows.map((row) => row.id);

    // --- FIX: Define constants inside the function scope ---
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES_MS = 5000; // 5 seconds

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
    // We throw the error so the main job handler can catch it and log the failure.
    throw error;
  }
};

// --- New Master Sync Function ---
const syncAll = async () => {
  if (isSyncRunning) {
    console.log(
      `CRON JOB: Skipping ${JOB_NAME}, previous sync is still in progress.`
    );
    return;
  }
  isSyncRunning = true;
  let errorOccurred = null;

  try {
    // 1. Start the job and initialize its state in the database
    await startJob(JOB_NAME);
    console.log(`CRON JOB: Starting ${JOB_NAME}...`);

    // 2. Define the discrete steps for progress calculation
    const steps = [
      { name: "JumpCloud Users", func: syncAllJumpCloudUsers },
      { name: "JumpCloud Applications", func: syncAllJumpCloudApplications },
      {
        name: "JumpCloud Group Associations",
        func: syncAllJumpCloudGroupAssociations,
      },
      { name: "JumpCloud Group Members", func: syncAllJumpCloudGroupMembers },
      {
        name: "Individual Employee Platform Statuses",
        func: syncAllUserStatuses,
      },
    ];

    // 3. Loop through steps, update progress, and execute each sync function
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = ((i + 1) / steps.length) * 100;
      await updateProgress(JOB_NAME, `Syncing ${step.name}...`, progress - 10);
      await step.func();
      await updateProgress(
        JOB_NAME,
        `Finished syncing ${step.name}.`,
        progress
      );
    }

    console.log(`CRON JOB: Finished ${JOB_NAME}.`);
  } catch (error) {
    errorOccurred = error;
    console.error(
      `CRON JOB: Full nightly data sync failed for ${JOB_NAME}.`,
      error
    );
  } finally {
    // 4. Finalize the job in the 'finally' block to ensure it always runs
    const finalStatus = errorOccurred ? "FAILED" : "SUCCESS";
    await finishJob(JOB_NAME, finalStatus, errorOccurred);
    isSyncRunning = false;
    console.log(`CRON JOB: ${JOB_NAME} process complete. Releasing lock.`);
  }
};

const schedulePlatformSync = () => {
  // Schedule the master 'syncAll' function to run at 2 AM
  cron.schedule("* * * * *", syncAll, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log(
    "Master JumpCloud cron job has been scheduled with progress logging."
  );
};

module.exports = { schedulePlatformSync, syncAllUserStatuses, syncAll };
