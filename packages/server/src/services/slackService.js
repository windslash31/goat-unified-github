const { WebClient } = require("@slack/web-api");

let web;
const getWebClient = () => {
  if (!web) {
    if (!process.env.SLACK_BOT_TOKEN) {
      throw new Error(
        "Slack Bot Token is not defined. Please set SLACK_BOT_TOKEN in your .env file."
      );
    }
    web = new WebClient(process.env.SLACK_BOT_TOKEN);
  }
  return web;
};

const getUserStatus = async (email) => {
  if (!email) {
    return {
      platform: "Slack",
      email: "N/A",
      status: "Error",
      message: "No email provided.",
    };
  }

  try {
    const client = getWebClient();
    const result = await client.users.lookupByEmail({ email });

    if (result.ok && result.user) {
      const user = result.user;

      // --- THIS IS THE CHANGE ---
      // Create the details object with the specific fields you wanted.
      const details = {
        id: user.id,
        is_admin: user.is_admin,
        is_owner: user.is_owner,
        is_restricted: user.is_restricted,
        is_ultra_restricted: user.is_ultra_restricted,
      };

      return {
        platform: "Slack",
        email: user.profile.email || email,
        status: user.deleted ? "Suspended" : "Active",
        details: details, // Return the new details object
      };
      // --- END OF CHANGE ---
    }

    // This line is kept for safety but should ideally not be reached if result.ok is true
    throw new Error("User found but data is incomplete.");
  } catch (error) {
    if (
      error.code === "slack_webapi_platform_error" &&
      error.data.error === "users_not_found"
    ) {
      return {
        platform: "Slack",
        email,
        status: "Not Found",
        details: { message: "User does not exist in Slack." },
      };
    }
    console.error("Slack API Error:", error.message);
    return {
      platform: "Slack",
      email,
      status: "Error",
      details: { message: "Failed to fetch status from Slack." },
    };
  }
};

const deactivateUser = async (email) => {
  try {
    const client = getWebClient();
    const result = await client.users.lookupByEmail({ email });
    if (result.ok && result.user) {
      // In a real implementation, you would call admin.users.setInactive here
      // await client.admin.users.setInactive({ user_id: result.user.id });
      return {
        success: true,
        message: `Deactivation for ${email} would be performed here.`,
      };
    }
    return { success: false, message: "User not found, could not deactivate." };
  } catch (error) {
    if (error.data?.error === "users_not_found") {
      return {
        success: false,
        message: "User not found, could not deactivate.",
      };
    }
    console.error(
      `Failed to deactivate user ${email} in Slack:`,
      error.message
    );
    return {
      success: false,
      message: "An error occurred during deactivation.",
    };
  }
};

const getAuditLogs = async (email) => {
  try {
    const client = getWebClient();
    const userResult = await client.users.lookupByEmail({ email });
    if (userResult.ok && userResult.user) {
      console.warn(
        "Slack audit log fetching is mocked. Requires Enterprise Grid for real data."
      );
      // This is mocked data. Real implementation requires Enterprise Grid.
      return [
        {
          id: "slack1",
          action: "user_joined_channel",
          date_create: Date.now() / 1000 - 3600,
          entity: { channel: { name: "#project-owl" } },
        },
        {
          id: "slack2",
          action: "message_posted",
          date_create: Date.now() / 1000 - 7200,
          entity: { channel: { name: "#engineering-team" } },
        },
      ];
    }
    return [];
  } catch (error) {
    console.error(`Failed to get Slack logs for ${email}:`, error.message);
    return [];
  }
};

module.exports = {
  getUserStatus,
  deactivateUser,
  getAuditLogs,
};
