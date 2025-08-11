const cron = require("node-cron");
const db = require("../config/db");
const {
  startJob,
  updateProgress,
  finishJob,
} = require("../services/syncLogService");

// Import all required service functions
const jumpcloudService = require("../services/jumpcloudService");
const atlassianService = require("../services/atlassianService");
const googleService = require("../services/googleService");
const slackService = require("../services/slackService");

let isMasterSyncRunning = false;
const BATCH_SIZE = 20; // A shared batch size for individual syncs
const DELAY_BETWEEN_BATCHES_MS = 1000; // 1 second delay

// --- JUMPCLOUD SYNC LOGIC ---
const syncAllJumpCloudData = async () => {
  const JOB_NAME = "jumpcloud_sync";
  try {
    await startJob(JOB_NAME);
    console.log(`CRON JOB: Starting ${JOB_NAME}...`);
    const steps = [
      { name: "Users", func: jumpcloudService.syncAllJumpCloudUsers },
      {
        name: "Applications",
        func: jumpcloudService.syncAllJumpCloudApplications,
      },
      {
        name: "Group Associations",
        func: jumpcloudService.syncAllJumpCloudGroupAssociations,
      },
      {
        name: "Group Members",
        func: jumpcloudService.syncAllJumpCloudGroupMembers,
      },
    ];
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
    await finishJob(JOB_NAME, "SUCCESS");
    console.log(`CRON JOB: ${JOB_NAME} finished successfully.`);
  } catch (error) {
    console.error(`CRON JOB: An error occurred during ${JOB_NAME}:`, error);
    await finishJob(JOB_NAME, "FAILED", error);
    throw error; // Propagate error to stop master sync
  }
};

const runIndividualUserSync = async (jobName, serviceSyncFunction) => {
  try {
    await startJob(jobName);
    const employeeResult = await db.query(
      "SELECT id, employee_email FROM employees WHERE is_active = TRUE"
    );
    const employees = employeeResult.rows;
    if (employees.length === 0) {
      await updateProgress(jobName, "No active employees to sync.", 100);
      await finishJob(jobName, "SUCCESS");
      return;
    }

    for (let i = 0; i < employees.length; i += BATCH_SIZE) {
      const batch = employees.slice(i, i + BATCH_SIZE);
      const progress = ((i + batch.length) / employees.length) * 100;
      await updateProgress(
        jobName,
        `Syncing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
          employees.length / BATCH_SIZE
        )}...`,
        progress
      );

      const syncPromises = batch.map((emp) =>
        serviceSyncFunction(emp.id, emp.employee_email)
      );
      await Promise.allSettled(syncPromises);

      if (i + BATCH_SIZE < employees.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)
        );
      }
    }
    await finishJob(jobName, "SUCCESS");
    console.log(`CRON JOB: ${jobName} finished successfully.`);
  } catch (error) {
    console.error(`CRON JOB: An error occurred during ${jobName}:`, error);
    await finishJob(jobName, "FAILED", error);
    throw error; // Propagate error
  }
};

const runAllSyncs = async () => {
  if (isMasterSyncRunning) {
    console.log(
      "CRON JOB: Skipping run, a master sync process is still in progress."
    );
    return;
  }
  isMasterSyncRunning = true;
  console.log("CRON JOB: Starting master sync job for all platforms...");
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // STEP 1: Sync core user data and licenses from all platforms
    console.log(
      "CRON JOB: Starting core data sync and license reconciliation phase..."
    );
    // These functions now handle both user data and license assignments
    await googleService.syncAllGoogleData(client);
    await slackService.syncAllSlackData(client);
    // The Atlassian and JumpCloud syncs are already doing a full user sync, so we just add the license part
    await atlassianService.syncAllAtlassianData(); // This already syncs users
    await atlassianService.syncAtlassianLicenses(client); // This reconciles licenses
    await syncAllJumpCloudData(); // This already syncs users
    await jumpcloudService.syncJumpCloudLicenses(client); // This reconciles licenses

    // STEP 2: Sync special data like total license counts
    console.log("CRON JOB: Starting special data sync phase...");
    await atlassianService.syncAtlassianLicenseCounts(client);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "CRON JOB: Master sync stopped due to a failure. Transaction rolled back.",
      error
    );
  } finally {
    isMasterSyncRunning = false;
    client.release();
    console.log("CRON JOB: Master sync job complete. Releasing lock.");
  }
};

const schedulePlatformSync = () => {
  cron.schedule("* * * * *", runAllSyncs, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log("Master cron job for all platform syncs has been scheduled.");
};

module.exports = { schedulePlatformSync, runAllSyncs, isMasterSyncRunning };
