const { google } = require("googleapis");
const { OAuth2 } = google.auth;

let oauth2Client;

async function getAuthClient() {
  if (oauth2Client) {
    return oauth2Client;
  }

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    throw new Error(
      "Google OAuth 2.0 environment variables are not set. Please check your .env file."
    );
  }

  try {
    const client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "urn:ietf:wg:oauth:2.0:oob"
    );

    client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
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
      fields: "suspended,primaryEmail",
    });

    const userData = response.data;
    return {
      platform: "Google Workspace",
      email: userData.primaryEmail,
      status: userData.suspended ? "Suspended" : "Active",
      message: userData.suspended
        ? "Account is suspended."
        : "Account is active.",
    };
  } catch (error) {
    if (error.code === 404) {
      return {
        platform: "Google Workspace",
        email: email,
        status: "Not Found",
        message: "User does not exist in Google Workspace.",
      };
    }
    console.error("Google Workspace Error:", error.message);
    return {
      platform: "Google Workspace",
      email: email,
      status: "Error",
      message: "Failed to fetch status from Google Workspace.",
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

module.exports = {
  getUserStatus,
  suspendUser,
  getLoginEvents,
  getUserLicense,
};
