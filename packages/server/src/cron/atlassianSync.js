const cron = require("node-cron");
const { syncAllAtlassianUsers } = require("../services/atlassianService");

// This is the master function for all Atlassian sync tasks.
// For now, it will only sync users.
const syncAllAtlassianData = async () => {
  console.log("CRON JOB: Starting Atlassian data sync...");
  try {
    await syncAllAtlassianUsers();
    console.log("CRON JOB: Finished Atlassian data sync.");
  } catch (error) {
    console.error(
      "CRON JOB: An error occurred during the Atlassian data sync:",
      error
    );
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
