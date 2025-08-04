const cron = require("node-cron");
const {
  syncAllAtlassianUsers,
  syncAllAtlassianGroupsAndMembers,
  syncAllJiraProjects,
  syncAllBitbucketRepositoriesAndPermissions,
  syncAllConfluenceSpaces,
  syncAllConfluencePermissions,
  syncConfluenceUsersFromAtlassian,
} = require("../services/atlassianService");
const {
  startJob,
  updateProgress,
  finishJob,
} = require("../services/syncLogService");

let isAtlassianSyncRunning = false;
const JOB_NAME = "atlassian_sync";

const syncAllAtlassianData = async () => {
  if (isAtlassianSyncRunning) {
    console.log(
      `CRON JOB: Skipping ${JOB_NAME}, previous job is still in progress.`
    );
    return;
  }
  isAtlassianSyncRunning = true;
  let errorOccurred = null;

  try {
    await startJob(JOB_NAME);
    console.log(`CRON JOB: Starting ${JOB_NAME}...`);

    const steps = [
      //{ name: "Atlassian Users", func: syncAllAtlassianUsers },
      { name: "Confluence Users", func: syncConfluenceUsersFromAtlassian },
      //{
      //name: "Atlassian Groups & Members",
      //func: syncAllAtlassianGroupsAndMembers,
      //},
      //{ name: "Jira Projects", func: syncAllJiraProjects },
      { name: "Confluence Spaces", func: syncAllConfluenceSpaces },
      //{
      //name: "Bitbucket Repositories",
      //func: syncAllBitbucketRepositoriesAndPermissions,
      //},
      { name: "Confluence Permissions", func: syncAllConfluencePermissions },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = ((i + 1) / steps.length) * 100;
      await updateProgress(JOB_NAME, `Syncing ${step.name}...`, progress - 5); // Show progress before starting
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
    console.error(`CRON JOB: An error occurred during the ${JOB_NAME}:`, error);
  } finally {
    const finalStatus = errorOccurred ? "FAILED" : "SUCCESS";
    await finishJob(JOB_NAME, finalStatus, errorOccurred);
    isAtlassianSyncRunning = false;
    console.log(`CRON JOB: ${JOB_NAME} process complete. Releasing lock.`);
  }
};

const scheduleAtlassianSync = () => {
  // Your cron schedule
  cron.schedule("* * * * *", syncAllAtlassianData, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });
  console.log("Atlassian cron job has been scheduled with progress logging.");
};

module.exports = { scheduleAtlassianSync };
