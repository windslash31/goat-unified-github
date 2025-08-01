const { WebClient } = require("@slack/web-api");
const db = require("../config/db");

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

const syncUserData = async (employeeId, email) => {
  console.log(`SYNC: Starting Slack sync for ${email}`);
  try {
    const statusResult = await getUserStatus(email);

    if (
      statusResult.status === "Error" ||
      statusResult.status === "Not Found"
    ) {
      await db.query("DELETE FROM slack_users WHERE email = $1", [email]);
      console.log(
        `SYNC: User ${email} not found or error in Slack. Removed from local DB.`
      );
      return;
    }

    const userDetails = statusResult.details;
    const query = `
      INSERT INTO slack_users (
        user_id, email, status, is_admin, is_owner, 
        is_restricted, is_ultra_restricted, last_synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        is_admin = EXCLUDED.is_admin,
        is_owner = EXCLUDED.is_owner,
        is_restricted = EXCLUDED.is_restricted,
        is_ultra_restricted = EXCLUDED.is_ultra_restricted,
        last_synced_at = NOW();
    `;

    const values = [
      userDetails.id,
      email,
      statusResult.status,
      userDetails.is_admin,
      userDetails.is_owner,
      userDetails.is_restricted,
      userDetails.is_ultra_restricted,
    ];

    await db.query(query, values);
    console.log(`SYNC: Successfully synced Slack user ${email}`);
  } catch (error) {
    console.error(`SYNC: Error during Slack sync for ${email}:`, error);
  }
};

module.exports = {
  getUserStatus,
  deactivateUser,
  getAuditLogs,
  syncUserData,
};
