const cron = require("node-cron");
const {
  syncAllAtlassianUsers,
  syncAllAtlassianGroupsAndMembers,
  syncAllJiraProjects,
  //syncAllBitbucketRepositoriesAndPermissions,
  syncAllConfluenceSpaces,
  syncAllConfluencePermissions,
  syncConfluenceUsersFromAtlassian,
} = require("../services/atlassianService");

let isAtlassianSyncRunning = false;

// This is the master function for all Atlassian sync tasks.
const syncAllAtlassianData = async () => {
  // Check if the sync is already running
  if (isAtlassianSyncRunning) {
    console.log(
      "CRON JOB: Skipping Atlassian sync, previous job is still in progress."
    );
    return;
  }

  // Set the flag to indicate the sync has started
  isAtlassianSyncRunning = true;
  console.log("CRON JOB: Starting Atlassian data sync...");

  try {
    await syncAllAtlassianUsers();
    await syncConfluenceUsersFromAtlassian(); // Syncs users with Confluence access
    await syncAllAtlassianGroupsAndMembers();
    await syncAllJiraProjects();
    await syncAllConfluenceSpaces(); // Sync spaces before permissions
    //await syncAllBitbucketRepositoriesAndPermissions();
    await syncAllConfluencePermissions(); // Sync permissions last

    console.log("CRON JOB: Finished Atlassian data sync.");
  } catch (error) {
    console.error(
      "CRON JOB: An error occurred during the Atlassian data sync:",
      error
    );
  } finally {
    isAtlassianSyncRunning = false;
    console.log("CRON JOB: Atlassian sync process complete. Releasing lock.");
  }
};

// This function sets up the schedule
const scheduleAtlassianSync = () => {
  // Use '* * * * *' to run every minute for testing
  cron.schedule("* * * * *", syncAllAtlassianData, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  });

  console.log(
    "Atlassian cron job has been scheduled to run every minute for testing."
  );
};

module.exports = { scheduleAtlassianSync };
