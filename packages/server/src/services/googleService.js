const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const db = require("../config/db");
const config = require("../config/config");

let oauth2Client;

async function getAuthClient() {
  if (oauth2Client) {
    return oauth2Client;
  }

  if (
    !config.google.clientId ||
    !config.google.clientSecret ||
    !config.google.refreshToken
  ) {
    throw new Error(
      "Google OAuth 2.0 environment variables are not set. Please check your .env file and config."
    );
  }

  try {
    const client = new OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      "urn:ietf:wg:oauth:2.0:oob"
    );

    client.setCredentials({
      refresh_token: config.google.refreshToken,
    });

    oauth2Client = client;
    return oauth2Client;
  } catch (error) {
    console.error(
      "Failed to create Google OAuth2 authenticated client:",
      error.message
    );
    throw new Error(
      "Google authentication setup failed. Check your OAuth 2.0 credentials."
    );
  }
}

async function getDirectoryClient() {
  const auth = await getAuthClient();
  return google.admin({
    version: "directory_v1",
    auth,
  });
}

const getLicensingClient = async () => {
  const auth = await getAuthClient();
  return google.licensing({ version: "v1", auth });
};

const getUserStatus = async (email) => {
  try {
    const directory = await getDirectoryClient();
    const response = await directory.users.get({
      userKey: email,
      fields:
        "suspended,primaryEmail,isAdmin,isDelegatedAdmin,aliases,orgUnitPath,lastLoginTime,isEnrolledIn2Sv",
    });

    const userData = response.data;

    const details = {
      isAdmin: userData.isAdmin,
      isDelegatedAdmin: userData.isDelegatedAdmin,
      aliases: userData.aliases || [],
      orgUnitPath: userData.orgUnitPath,
      lastLoginTime: userData.lastLoginTime,
      isEnrolledIn2Sv: userData.isEnrolledIn2Sv,
    };

    return {
      platform: "Google",
      status: userData.suspended ? "Suspended" : "Active",
      details: details,
    };
  } catch (error) {
    if (error.code === 404) {
      return {
        platform: "Google",
        status: "Not Found",
        details: { message: "User does not exist." },
      };
    }
    console.error("Google Workspace Error:", error.message);
    return {
      platform: "Google",
      status: "Error",
      details: { message: "Failed to fetch status." },
    };
  }
};

const suspendUser = async (email) => {
  try {
    const directory = await getDirectoryClient();
    await directory.users.update({
      userKey: email,
      requestBody: {
        suspended: true,
      },
    });
    return {
      success: true,
      message: `Successfully suspended ${email} in Google Workspace.`,
    };
  } catch (error) {
    console.error(
      `Failed to suspend user ${email} in Google Workspace:`,
      error.message
    );
    return {
      success: false,
      message: "Failed to suspend user in Google Workspace.",
    };
  }
};

const getLoginEvents = async (email) => {
  try {
    const auth = await getAuthClient();
    const reports = google.reports({
      version: "reports_v1",
      auth: auth,
    });

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const response = await reports.activities.list({
      userKey: email,
      applicationName: "login",
      startTime: thirtyDaysAgo,
    });

    return response.data.items || [];
  } catch (error) {
    console.error(
      `Failed to get Google Workspace login events for ${email}:`,
      error.message
    );
    return [];
  }
};

const getUserLicense = async (email) => {
  try {
    const licensing = await getLicensingClient();

    const response = await licensing.licenseAssignments.listForProduct({
      productId: "Google-Apps",
      customerId: process.env.GOOGLE_CUSTOMER_ID,
      userId: email,
    });

    const licenses = response.data.items || [];

    return licenses.map((lic) => ({
      skuName: lic.skuName,
      planName: "Google Workspace",
    }));
  } catch (error) {
    if (error.code === 404) {
      return [];
    }
    console.error("Error fetching Google User License:", error.message);
    throw error;
  }
};

const syncUserData = async (employeeId, email) => {
  console.log(`SYNC: Starting Google Workspace sync for ${email}`);
  try {
    const statusResult = await getUserStatus(email);

    if (
      statusResult.status === "Error" ||
      statusResult.status === "Not Found"
    ) {
      await db.query("DELETE FROM google_users WHERE primary_email = $1", [
        email,
      ]);
      console.log(
        `SYNC: User ${email} not found or error in Google. Removed from local DB.`
      );
      return;
    }

    const userDetails = statusResult.details;
    const query = `
      INSERT INTO google_users (
        primary_email, suspended, is_admin, is_delegated_admin, last_login_time, 
        is_enrolled_in_2sv, org_unit_path, aliases, last_synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (primary_email) DO UPDATE SET
        suspended = EXCLUDED.suspended,
        is_admin = EXCLUDED.is_admin,
        is_delegated_admin = EXCLUDED.is_delegated_admin,
        last_login_time = EXCLUDED.last_login_time,
        is_enrolled_in_2sv = EXCLUDED.is_enrolled_in_2sv,
        org_unit_path = EXCLUDED.org_unit_path,
        aliases = EXCLUDED.aliases,
        last_synced_at = NOW();
    `;

    const values = [
      email,
      statusResult.status === "Suspended",
      userDetails.isAdmin,
      userDetails.isDelegatedAdmin,
      userDetails.lastLoginTime,
      userDetails.isEnrolledIn2Sv,
      userDetails.orgUnitPath,
      JSON.stringify(userDetails.aliases || []),
    ];

    await db.query(query, values);
    console.log(`SYNC: Successfully synced Google Workspace user ${email}`);
  } catch (error) {
    console.error(
      `SYNC: Error during Google Workspace sync for ${email}:`,
      error
    );
  }
};

const fetchAllGoogleUsers = async () => {
  const directory = await getDirectoryClient();
  let allUsers = [];
  let pageToken = null;

  console.log("SYNC: Starting fetch of all users from Google Workspace...");

  do {
    try {
      const response = await directory.users.list({
        // Use the config object here
        domain: config.google.domain,
        maxResults: 500,
        pageToken: pageToken,
        orderBy: "email",
      });

      if (response.data.users) {
        allUsers = allUsers.concat(response.data.users);
      }
      pageToken = response.data.nextPageToken;
    } catch (error) {
      console.error("Error fetching a page of Google users:", error);
      throw new Error("Failed to fetch all users from Google Workspace.");
    }
  } while (pageToken);

  console.log(`SYNC: Fetched a total of ${allUsers.length} users from Google.`);
  return allUsers;
};

// NEW FUNCTION to sync all fetched users to the database
const syncAllGoogleUsers = async () => {
  const allUsers = await fetchAllGoogleUsers();
  if (!allUsers || allUsers.length === 0) {
    console.log("SYNC: No Google Workspace users found to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Optional: Clear the table for a full refresh, or rely on ON CONFLICT
    // await client.query("TRUNCATE TABLE google_users;");

    for (const user of allUsers) {
      const query = `
        INSERT INTO google_users (
          primary_email, suspended, is_admin, is_delegated_admin, last_login_time, 
          is_enrolled_in_2sv, org_unit_path, aliases, last_synced_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (primary_email) DO UPDATE SET
          suspended = EXCLUDED.suspended,
          is_admin = EXCLUDED.is_admin,
          is_delegated_admin = EXCLUDED.is_delegated_admin,
          last_login_time = EXCLUDED.last_login_time,
          is_enrolled_in_2sv = EXCLUDED.is_enrolled_in_2sv,
          org_unit_path = EXCLUDED.org_unit_path,
          aliases = EXCLUDED.aliases,
          last_synced_at = NOW();
      `;
      const values = [
        user.primaryEmail,
        user.suspended,
        user.isAdmin,
        user.isDelegatedAdmin,
        user.lastLoginTime,
        user.isEnrolledIn2Sv,
        user.orgUnitPath,
        JSON.stringify(user.aliases || []),
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
    console.log(
      `SYNC: Successfully synced ${allUsers.length} Google Workspace users to the database.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Google user database sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getUserStatus,
  suspendUser,
  getLoginEvents,
  getUserLicense,
  syncUserData,
  syncAllGoogleUsers,
};
