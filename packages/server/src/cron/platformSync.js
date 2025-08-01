const cron = require("node-cron");
const db = require("../config/db");
const employeeService = require("../services/employeeService");

const {
  syncAllJumpCloudUsers,
  syncAllJumpCloudApplications,
  syncAllJumpCloudGroupAssociations,
  syncAllJumpCloudGroupMembers,
} = require("../services/jumpcloudService");

let isSyncRunning = false;

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

// --- New master function for all JumpCloud sync tasks ---
const syncAllJumpCloudData = async () => {
  console.log("CRON JOB: Starting full JumpCloud data sync...");
  try {
    // These functions will run in order
    await syncAllJumpCloudUsers();
    await syncAllJumpCloudApplications();
    await syncAllJumpCloudGroupAssociations();
    await syncAllJumpCloudGroupMembers(); // Add this line
    console.log("CRON JOB: Successfully finished full JumpCloud data sync.");
  } catch (error) {
    console.error(
      "CRON JOB: An error occurred during the JumpCloud data sync:",
      error
    );
    // We throw the error so the main job knows something went wrong
    throw error;
  }
};

// --- New Master Sync Function ---
const syncAll = async () => {
  if (isSyncRunning) {
    console.log("CRON JOB: Skipping run, previous sync is still in progress.");
    return;
  }
  isSyncRunning = true;
  console.log("CRON JOB: Starting full nightly data sync job...");
  try {
    // Step 1: Sync all data from platforms like JumpCloud
    await syncAllJumpCloudData();

    // Step 2: Sync individual employee statuses (your existing logic)
    await syncAllUserStatuses();

    console.log("CRON JOB: Full nightly data sync finished successfully.");
  } catch (error) {
    console.error("CRON JOB: Full nightly data sync failed.", error);
  } finally {
    // IMPORTANT
    isSyncRunning = false;
    console.log("CRON JOB: Sync process complete. Releasing lock.");
  }
};

const schedulePlatformSync = () => {
  // Schedule the new master 'syncAll' function to run at 2 AM
  cron.schedule("* * * * *", syncAll, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });

  console.log(
    "Master cron job for all platform syncs has been scheduled for 2:00 AM (Asia/Jakarta)."
  );
};

module.exports = { schedulePlatformSync, syncAllUserStatuses, syncAll };
