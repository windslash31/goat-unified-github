// packages/server/src/cron/platformSync.js

const cron = require("node-cron");
const db = require("../config/db");
const employeeService = require("../services/employeeService");
const {
  startJob,
  updateProgress,
  finishJob,
} = require("../services/syncLogService");

// Import JumpCloud services
const {
  syncAllJumpCloudUsers,
  syncAllJumpCloudApplications,
  syncAllJumpCloudGroupAssociations,
  syncAllJumpCloudGroupMembers,
} = require("../services/jumpcloudService");

// Import Atlassian services
const {
  syncAllAtlassianUsers,
  syncConfluenceUsersFromAtlassian,
  syncAllAtlassianGroupsAndMembers,
  syncAllJiraProjects,
  syncAllConfluenceSpaces,
  syncAllBitbucketRepositoriesAndPermissions,
  syncAllConfluencePermissions,
} = require("../services/atlassianService");

let isMasterSyncRunning = false;

// JUMPCLOUD SYNC LOGIC
const syncAllJumpCloudData = async () => {
  const JOB_NAME = "jumpcloud_sync";
  let errorOccurred = null;

  try {
    await startJob(JOB_NAME);
    console.log(`CRON JOB: Starting ${JOB_NAME}...`);

    const steps = [
      { name: "JumpCloud Users", func: syncAllJumpCloudUsers },
      { name: "JumpCloud Applications", func: syncAllJumpCloudApplications },
      {
        name: "JumpCloud Group Associations",
        func: syncAllJumpCloudGroupAssociations,
      },
      { name: "JumpCloud Group Members", func: syncAllJumpCloudGroupMembers },
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
  } catch (error) {
    errorOccurred = error;
    console.error(`CRON JOB: An error occurred during ${JOB_NAME}:`, error);
  } finally {
    const finalStatus = errorOccurred ? "FAILED" : "SUCCESS";
    await finishJob(JOB_NAME, finalStatus, errorOccurred);
    console.log(`CRON JOB: ${JOB_NAME} process complete.`);
  }
};

// ATLASSIAN SYNC LOGIC (moved from atlassianSync.js)
const syncAllAtlassianData = async () => {
  const JOB_NAME = "atlassian_sync";
  let errorOccurred = null;

  try {
    await startJob(JOB_NAME);
    console.log(`CRON JOB: Starting ${JOB_NAME}...`);

    const steps = [
      { name: "Atlassian Users", func: syncAllAtlassianUsers },
      { name: "Confluence Users", func: syncConfluenceUsersFromAtlassian },
      {
        name: "Atlassian Groups & Members",
        func: syncAllAtlassianGroupsAndMembers,
      },
      { name: "Jira Projects", func: syncAllJiraProjects },
      { name: "Confluence Spaces", func: syncAllConfluenceSpaces },
      {
        name: "Bitbucket Repositories",
        func: syncAllBitbucketRepositoriesAndPermissions,
      },
      { name: "Confluence Permissions", func: syncAllConfluencePermissions },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = ((i + 1) / steps.length) * 100;
      await updateProgress(JOB_NAME, `Syncing ${step.name}...`, progress - 5);
      await step.func();
      await updateProgress(
        JOB_NAME,
        `Finished syncing ${step.name}.`,
        progress
      );
    }
  } catch (error) {
    errorOccurred = error;
    console.error(`CRON JOB: An error occurred during ${JOB_NAME}:`, error);
  } finally {
    const finalStatus = errorOccurred ? "FAILED" : "SUCCESS";
    await finishJob(JOB_NAME, finalStatus, errorOccurred);
    console.log(`CRON JOB: ${JOB_NAME} process complete.`);
  }
};

// MASTER SYNC ORCHESTRATOR
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
    // Run syncs sequentially
    await syncAllJumpCloudData();
    await syncAllAtlassianData();
    // You can add more master sync functions here in the future
  } catch (error) {
    console.error(
      "CRON JOB: A critical error occurred in the master sync orchestrator.",
      error
    );
  } finally {
    isMasterSyncRunning = false;
    console.log("CRON JOB: Master sync job complete. Releasing lock.");
  }
};

const schedulePlatformSync = () => {
  // This single schedule now runs all sync jobs in order
  cron.schedule("* 2 * * *", runAllSyncs, {
    // Changed to every 5 mins for easier testing
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log("Master cron job for all platform syncs has been scheduled.");
};

module.exports = { schedulePlatformSync, runAllSyncs, isMasterSyncRunning };
