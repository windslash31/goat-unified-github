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

let _isMasterSyncRunning = false;
const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 1000;

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
      // ADD THIS NEW STEP
      {
        name: "SSO Access Reconciliation",
        func: jumpcloudService.reconcileSsoAccess,
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

const syncAllGoogleData = async () => {
  const JOB_NAME = "google_sync";
  try {
    await startJob(JOB_NAME);
    await updateProgress(JOB_NAME, "Syncing all Google Workspace users...", 50);
    await googleService.syncAllGoogleUsers();
    await updateProgress(JOB_NAME, "Finished syncing users.", 100);
    await finishJob(JOB_NAME, "SUCCESS");
    console.log(`CRON JOB: ${JOB_NAME} finished successfully.`);
  } catch (error) {
    console.error(`CRON JOB: An error occurred during ${JOB_NAME}:`, error);
    await finishJob(JOB_NAME, "FAILED", error);
    throw error;
  }
};

const reconcileDirectApiAccess = async () => {
  const client = await db.pool.connect();
  try {
    console.log(
      "CRON JOB: Starting 3-state access reconciliation (active/suspended/deactivated)..."
    );
    await client.query("BEGIN");

    // Note the time before we start the updates.
    const syncStartTime = new Date();

    const employeesResult = await client.query(
      "SELECT id, employee_email FROM employees"
    );
    const employeeEmailToIdMap = new Map(
      employeesResult.rows.map((e) => [e.employee_email, e.id])
    );

    // The "recipes" now include info on how to determine status
    const syncStrategies = [
      {
        key: "GOOGLE_WORKSPACE",
        rawTable: "gws_users",
        emailColumn: "primary_email",
        statusColumn: "suspended", // boolean
        // This function translates the raw status into our standard status
        statusMapper: (rawStatus) => (rawStatus ? "suspended" : "active"),
      },
      {
        key: "SLACK",
        rawTable: "slack_users",
        emailColumn: "email",
        statusColumn: "status", // text: 'Active' or something else
        statusMapper: (rawStatus) =>
          rawStatus === "Active" ? "active" : "suspended",
      },
      {
        key: "ATLASSIAN",
        rawTable: "atlassian_users",
        emailColumn: "email_address",
        statusColumn: "account_status", // text: 'active' or 'inactive'
        statusMapper: (rawStatus) =>
          rawStatus === "active" ? "active" : "suspended",
      },
      {
        key: "JUMPCLOUD",
        rawTable: "jumpcloud_users",
        emailColumn: "email",
        statusColumn: "suspended", // boolean
        statusMapper: (rawStatus) => (rawStatus ? "suspended" : "active"),
      },
    ];

    for (const strategy of syncStrategies) {
      const appInstanceResult = await client.query(
        `SELECT ai.id FROM app_instances ai
         JOIN managed_applications ma ON ai.application_id = ma.id
         WHERE ma.key = $1 AND ai.is_primary = true`,
        [strategy.key]
      );

      if (appInstanceResult.rows.length === 0) continue;
      const appInstanceId = appInstanceResult.rows[0].id;

      // 1. Get ALL users from the raw table, not just active ones
      const platformUsersResult = await client.query(
        `SELECT ${strategy.emailColumn}, ${strategy.statusColumn} FROM ${strategy.rawTable}`
      );

      if (platformUsersResult.rows.length > 0) {
        // 2. Loop and upsert with the correct status
        for (const user of platformUsersResult.rows) {
          const email = user[strategy.emailColumn];
          const employeeId = employeeEmailToIdMap.get(email);

          if (employeeId) {
            const rawStatus = user[strategy.statusColumn];
            const newStatus = strategy.statusMapper(rawStatus);

            await client.query(
              `INSERT INTO user_accounts (user_id, app_instance_id, status, updated_at)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (user_id, app_instance_id) DO UPDATE SET
                 status = EXCLUDED.status,
                 updated_at = EXCLUDED.updated_at;`,
              [employeeId, appInstanceId, newStatus, syncStartTime]
            );
          }
        }
      }
    }

    // 3. Deactivate any account that wasn't touched during this sync
    const deactivateResult = await client.query(
      `UPDATE user_accounts SET status = 'deactivated' WHERE updated_at < $1`,
      [syncStartTime]
    );

    if (deactivateResult.rowCount > 0) {
      console.log(
        `CRON JOB: Marked ${deactivateResult.rowCount} stale user accounts as 'deactivated'.`
      );
    }

    await client.query("COMMIT");
    console.log("CRON JOB: Finished 3-state access reconciliation.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during 3-state access reconciliation:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncJobs = {
  jumpcloud_sync: syncAllJumpCloudData,
  atlassian_sync: atlassianService.syncAllAtlassianData,
  google_sync: syncAllGoogleData,
  slack_sync: () =>
    runIndividualUserSync("slack_sync", slackService.syncUserData),
  jumpcloud_log_sync: jumpcloudService.syncAllUserLogs,
  reconciliation: reconcileDirectApiAccess,
};

const allJobKeys = Object.keys(syncJobs);

const isMasterSyncRunning = () => _isMasterSyncRunning;

const runSelectiveSyncs = async (jobNames) => {
  if (isMasterSyncRunning()) {
    console.log(
      "CRON JOB: Skipping run, a master sync process is still in progress."
    );
    return;
  }
  _isMasterSyncRunning = true;

  const jobsToRun = jobNames && jobNames.length > 0 ? jobNames : allJobKeys;
  console.log(
    `CRON JOB: Starting selective sync for jobs: ${jobsToRun.join(", ")}...`
  );

  try {
    for (const jobKey of jobsToRun) {
      const jobFunction = syncJobs[jobKey];
      if (jobFunction) {
        console.log(`--- Running job: ${jobKey} ---`);
        await jobFunction();
        console.log(`--- Finished job: ${jobKey} ---`);
      } else {
        console.warn(
          `CRON JOB: Unknown job key '${jobKey}' was requested and skipped.`
        );
      }
    }
  } catch (error) {
    console.error(
      "CRON JOB: Master sync stopped due to a failure in a sub-process.",
      error
    );
  } finally {
    _isMasterSyncRunning = false;
    console.log("CRON JOB: Master sync job complete. Releasing lock.");
  }
};

const runAllSyncs = async () => {
  await runSelectiveSyncs(allJobKeys);
};

const schedulePlatformSync = () => {
  cron.schedule("0 2 * * *", runAllSyncs, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log("Master cron job for all platform syncs has been scheduled.");
};

module.exports = {
  schedulePlatformSync,
  runAllSyncs,
  isMasterSyncRunning,
  runSelectiveSyncs,
};
