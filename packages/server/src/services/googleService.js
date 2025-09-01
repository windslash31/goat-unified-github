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

    google.options({ auth: client });

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

function getDirectoryClient() {
  return google.admin({ version: "directory_v1" });
}

function getReportsClient() {
  return google.admin({ version: "reports_v1" });
}

function getLicensingClient() {
  return google.licensing({ version: "v1" });
}

const getUserStatus = async (email) => {
  try {
    await getAuthClient();
    const directory = getDirectoryClient();
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
    await getAuthClient();
    const directory = getDirectoryClient();
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
    await getAuthClient();
    const reports = getReportsClient();

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
    await getAuthClient();
    const licensing = getLicensingClient();

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
      await db.query("DELETE FROM gws_users WHERE primary_email = $1", [email]);
      console.log(
        `SYNC: User ${email} not found or error in Google. Removed from local DB.`
      );
      return;
    }

    const userDetails = statusResult.details;
    const query = `
      INSERT INTO gws_users (
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
  await getAuthClient();
  const directory = getDirectoryClient();
  let allUsers = [];
  let pageToken = null;

  console.log("SYNC: Starting fetch of all users from Google Workspace...");

  do {
    try {
      const response = await directory.users.list({
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

const syncAllGoogleUsers = async () => {
  const allUsers = await fetchAllGoogleUsers();
  if (!allUsers || allUsers.length === 0) {
    console.log("SYNC: No Google Workspace users found to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    for (const user of allUsers) {
      const query = `
        INSERT INTO gws_users (
          primary_email, suspended, is_admin, is_delegated_admin, last_login_time, 
          is_enrolled_in_2sv, org_unit_path, aliases, 
          raw_logs,
          last_synced_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (primary_email) DO UPDATE SET
          suspended = EXCLUDED.suspended,
          is_admin = EXCLUDED.is_admin,
          is_delegated_admin = EXCLUDED.is_delegated_admin,
          last_login_time = EXCLUDED.last_login_time,
          is_enrolled_in_2sv = EXCLUDED.is_enrolled_in_2sv,
          org_unit_path = EXCLUDED.org_unit_path,
          aliases = EXCLUDED.aliases,
          raw_logs = EXCLUDED.raw_logs,
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
        JSON.stringify(user),
      ];
      await client.query(query, values);
    }

    const apiUserEmails = allUsers.map((user) => user.primaryEmail);
    const softDeleteQuery = `
      UPDATE gws_users
      SET suspended = true, last_synced_at = NOW()
      WHERE primary_email <> ALL($1::text[]) AND suspended = false;
    `;
    const result = await client.query(softDeleteQuery, [apiUserEmails]);
    if (result.rowCount > 0) {
      console.log(
        `Successfully marked ${result.rowCount} old Google users as suspended.`
      );
    }

    await client.query("COMMIT");
    console.log(
      `SYNC: Successfully synced ${allUsers.length} Google Workspace users to the database.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during detailed Google user database sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const LOG_APPLICATIONS = ["token", "saml"];

const syncAllGoogleLogs = async (client) => {
  await getAuthClient();
  const reports = getReportsClient();
  const dbClient = client || db;

  const lastLogResult = await dbClient.query(
    "SELECT timestamp FROM gws_logs ORDER BY timestamp DESC LIMIT 1"
  );

  let startTime = lastLogResult.rows[0]?.timestamp
    ? lastLogResult.rows[0].timestamp.toISOString()
    : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  let totalIngested = 0;

  for (const appName of LOG_APPLICATIONS) {
    let pageToken = null;
    do {
      try {
        const requestParams = {
          userKey: "all",
          applicationName: appName,
          maxResults: 1000,
        };

        if (pageToken) {
          requestParams.pageToken = pageToken;
        } else {
          requestParams.startTime = startTime;
        }

        const response = await reports.activities.list(requestParams);

        const logs = response.data.items || [];
        if (logs.length > 0) {
          const employeesRes = await dbClient.query(
            "SELECT id, employee_email FROM employees"
          );
          const emailToIdMap = new Map(
            employeesRes.rows.map((e) => [e.employee_email, e.id])
          );

          const insertPromises = logs.map((log) => {
            const employeeId = emailToIdMap.get(log.actor.email) || null;
            const query = `
              INSERT INTO gws_logs (employee_id, unique_qualifier, timestamp, actor_email, ip_address, application_name, event_name, details)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (unique_qualifier) DO NOTHING;
            `;
            return dbClient.query(query, [
              employeeId,
              log.id.uniqueQualifier,
              new Date(log.id.time),
              log.actor.email,
              log.ipAddress,
              log.id.applicationName,
              log.events[0].name,
              JSON.stringify(log),
            ]);
          });

          const results = await Promise.all(insertPromises);
          totalIngested += results.filter((r) => r.rowCount > 0).length;
        }
        pageToken = response.data.nextPageToken;
      } catch (error) {
        console.error(
          `Error fetching logs for GWS app '${appName}':`,
          error.message
        );
        break;
      }
    } while (pageToken);
  }
  console.log(`CRON JOB: Ingested ${totalIngested} new GWS logs.`);
  return { ingested: totalIngested };
};

module.exports = {
  getUserStatus,
  suspendUser,
  getLoginEvents,
  getUserLicense,
  syncUserData,
  syncAllGoogleUsers,
  syncAllGoogleLogs,
};
