const cron = require("node-cron");
const {
  syncAllAtlassianUsers,
  syncAllAtlassianGroupsAndMembers, // Add this import
} = require("../services/atlassianService");

const syncAllAtlassianData = async () => {
  console.log("CRON JOB: Starting Atlassian data sync...");
  try {
    await syncAllAtlassianUsers();
    await syncAllAtlassianGroupsAndMembers(); // Add this line
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
