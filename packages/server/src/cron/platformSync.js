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

const reconcileDirectApiAccess = async () => {
  const client = await db.pool.connect();
  try {
    console.log("CRON JOB: Starting Direct API access reconciliation...");
    await client.query("BEGIN");

    // Get all employees for email-to-ID mapping
    const employeesResult = await client.query(
      "SELECT id, employee_email FROM employees"
    );
    const employeeEmailToIdMap = new Map(
      employeesResult.rows.map((e) => [e.employee_email, e.id])
    );

    // Define our direct integration sync strategies
    const syncStrategies = [
      {
        key: "GOOGLE_WORKSPACE",
        rawTable: "google_users",
        emailColumn: "primary_email",
        activeCondition: "suspended = false",
      },
      {
        key: "SLACK",
        rawTable: "slack_users",
        emailColumn: "email",
        activeCondition: "status = 'Active'",
      },
      {
        key: "ATLASSIAN",
        rawTable: "atlassian_users",
        emailColumn: "email_address",
        activeCondition: "account_status = 'active'",
      },
      {
        key: "JUMPCLOUD",
        rawTable: "jumpcloud_users",
        emailColumn: "email",
        activeCondition: "suspended = false",
      },
    ];

    for (const strategy of syncStrategies) {
      // Find the app instance for this integration
      const appInstanceResult = await client.query(
        `
        SELECT ai.id FROM app_instances ai
        JOIN managed_applications ma ON ai.application_id = ma.id
        WHERE ma.key = $1 AND ai.is_primary = true
      `,
        [strategy.key]
      );

      if (appInstanceResult.rows.length === 0) {
        console.log(
          `CRON JOB: No primary app instance found for key '${strategy.key}'. Skipping reconciliation.`
        );
        continue;
      }
      const appInstanceId = appInstanceResult.rows[0].id;

      // Get all active users from the raw data table for this platform
      const activeUsersResult = await client.query(
        `SELECT ${strategy.emailColumn} FROM ${strategy.rawTable} WHERE ${strategy.activeCondition}`
      );

      const employeeIdsWithAccess = new Set();
      for (const user of activeUsersResult.rows) {
        const email = user[strategy.emailColumn];
        const employeeId = employeeEmailToIdMap.get(email);
        if (employeeId) {
          employeeIdsWithAccess.add(employeeId);
        }
      }

      // INSERT or UPDATE records for users who SHOULD have access
      const employeeIdsArray =
        employeeIdsWithAccess.size > 0 ? Array.from(employeeIdsWithAccess) : [];
      if (employeeIdsArray.length > 0) {
        await client.query(
          `
          INSERT INTO user_accounts (user_id, app_instance_id, status, last_seen_at)
          SELECT unnest($1::int[]), $2, 'active', NOW()
          ON CONFLICT (user_id, app_instance_id) DO UPDATE SET
            status = 'active',
            last_seen_at = NOW();
          `,
          [employeeIdsArray, appInstanceId]
        );
      }

      // Deactivate records for users who no longer have access
      await client.query(
        `
        UPDATE user_accounts
        SET status = 'deactivated'
        WHERE app_instance_id = $1
        AND user_id NOT IN (SELECT unnest($2::int[]));
        `,
        [appInstanceId, employeeIdsArray.length > 0 ? employeeIdsArray : [0]]
      );
      console.log(
        `CRON JOB: Reconciled access for ${strategy.key}. Found ${employeeIdsWithAccess.size} active users.`
      );
    }

    await client.query("COMMIT");
    console.log("CRON JOB: Finished Direct API access reconciliation.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Direct API access reconciliation:", error);
    throw error;
  } finally {
    client.release();
  }
};

// REVISED FUNCTION: Update runAllSyncs to call the new reconciliation function at the end.
const runAllSyncs = async () => {
  if (isMasterSyncRunning) {
    console.log(
      "CRON JOB: Skipping run, a master sync process is still in progress."
    );
    return;
  }
  isMasterSyncRunning = true;
  console.log("CRON JOB: Starting master sync job for all platforms...");
  try {
    // Step 1: Run all raw data syncs
    await syncAllJumpCloudData(); // This also handles SSO app reconciliation
    await atlassianService.syncAllAtlassianData();
    await runIndividualUserSync("google_sync", googleService.syncUserData);
    await runIndividualUserSync("slack_sync", slackService.syncUserData);
    await reconcileDirectApiAccess();
    await jumpcloudService.syncAllUserLogs();

    // Step 2: Run the new final reconciliation for direct API apps
  } catch (error) {
    console.error(
      "CRON JOB: Master sync stopped due to a failure in a sub-process.",
      error
    );
  } finally {
    isMasterSyncRunning = false;
    console.log("CRON JOB: Master sync job complete. Releasing lock.");
  }
};

const schedulePlatformSync = () => {
  cron.schedule("0 2 * * *", runAllSyncs, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log("Master cron job for all platform syncs has been scheduled.");
};

module.exports = { schedulePlatformSync, runAllSyncs, isMasterSyncRunning };
