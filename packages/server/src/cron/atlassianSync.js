const cron = require("node-cron");
const {
  syncAllAtlassianUsers,
  syncAllAtlassianGroupsAndMembers,
  syncAllJiraProjects,
  syncJiraRolesAndPermissions, // Add this import
} = require("../services/atlassianService");

// --- MODIFICATION START ---
// A flag to prevent overlapping runs for the Atlassian sync
let isAtlassianSyncRunning = false;
// --- MODIFICATION END ---

// This is the master function for all Atlassian sync tasks.
const syncAllAtlassianData = async () => {
  // --- MODIFICATION START ---
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
    await syncJiraRolesAndPermissions();
    console.log("CRON JOB: Finished Atlassian data sync.");
  } catch (error) {
    console.error(
      "CRON JOB: An error occurred during the Atlassian data sync:",
      error
    );
  } finally {
    // IMPORTANT: Release the flag, allowing the next run to start
    isAtlassianSyncRunning = false;
    console.log("CRON JOB: Atlassian sync process complete. Releasing lock.");
  }
  // --- MODIFICATION END ---
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
