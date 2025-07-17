const fetch = require("node-fetch");

const getUserStatus = async (email) => {
  if (
    !process.env.ATLASSIAN_API_TOKEN ||
    !process.env.ATLASSIAN_API_USER ||
    !process.env.ATLASSIAN_DOMAIN
  ) {
    console.error("Atlassian environment variables are not fully configured.");
    return {
      platform: "Atlassian",
      email,
      status: "Error",
      details: { message: "Server configuration error." },
    };
  }

  const url = `https://${
    process.env.ATLASSIAN_DOMAIN
  }/rest/api/3/user/search?query=${encodeURIComponent(email)}`;

  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${process.env.ATLASSIAN_API_USER}:${process.env.ATLASSIAN_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, { method: "GET", headers: headers });

    if (!response.ok) {
      throw new Error(`Atlassian API responded with status ${response.status}`);
    }

    const users = await response.json();

    if (!users || users.length === 0) {
      return {
        platform: "Atlassian",
        email: email,
        status: "Not Found",
        details: { message: "User does not exist in Atlassian." },
      };
    }

    const user = users[0];

    // --- THIS IS THE CHANGE ---
    // Added emailAddress and displayName to the details object.
    const details = {
      accountId: user.accountId,
      accountType: user.accountType,
      displayName: user.displayName,
      emailAddress: user.emailAddress,
    };

    return {
      platform: "Atlassian",
      status: user.active ? "Active" : "Suspended",
      details: details,
    };
    // --- END OF CHANGE ---
  } catch (error) {
    console.error("Atlassian Error:", error.message);
    return {
      platform: "Atlassian",
      email: email,
      status: "Error",
      details: { message: "Failed to fetch status from Atlassian." },
    };
  }
};

const getTicketDetails = async (ticketId) => {
  if (
    !process.env.ATLASSIAN_DOMAIN ||
    !process.env.ATLASSIAN_API_USER ||
    !process.env.ATLASSIAN_API_TOKEN
  ) {
    throw new Error(
      "Atlassian API credentials are not configured on the server."
    );
  }

  const url =
    `https://` + process.env.ATLASSIAN_DOMAIN + `/rest/api/3/issue/${ticketId}`;

  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${process.env.ATLASSIAN_API_USER}:${process.env.ATLASSIAN_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, { method: "GET", headers });

    if (response.status === 404) {
      throw new Error("Jira ticket not found.");
    }
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Jira API responded with status ${response.status}: ${errorBody}`
      );
    }

    const data = await response.json();
    const fields = data.fields;

    const details = {
      summary: fields.summary,
      reporter: fields.reporter?.displayName || "N/A",
      assignee: fields.assignee?.displayName || "Unassigned",
      status: fields.status?.name || "N/A",
      created: fields.created,
      issueType: fields.issuetype?.name || "N/A",
      employee_details: {
        firstName: fields.customfield_10897,
        lastName: fields.customfield_10961,
        email: fields.customfield_10970,
        position: fields.customfield_11552,
        managerEmail: fields.customfield_10960,
        resignationDate: fields.customfield_10727,
        accessCutoffDate: fields.customfield_10982,
      },
      assigned_asset_id: fields.customfield_11745?.[0]?.objectId || "None",
    };

    return details;
  } catch (error) {
    console.error("Jira Service Error:", error.message);
    throw error;
  }
};

const deactivateUser = async (email) => {
  // Placeholder for deactivate logic
  return {
    success: true,
    message: `Deactivate action for ${email} would be performed here.`,
  };
};

module.exports = {
  getUserStatus,
  deactivateUser,
  getTicketDetails,
};
