const fetch = require("node-fetch");

// This function is kept as is from your provided file.
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

    if (response.status === 404) throw new Error("Jira ticket not found.");
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Jira API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const fields = data.fields;

    // This object now extracts fields from both "Employee Onboarding" and "DB Onboarding" tickets
    const details = {
      summary: fields.summary,
      reporter: fields.reporter?.displayName || "N/A",
      assignee: fields.assignee?.displayName || "N/A",
      status: fields.status?.name || "N/A",
      created: fields.created,
      issueType: fields.issuetype?.name || "N/A",
      employee_details: {
        // Shared fields
        firstName: fields.customfield_10897,
        lastName: fields.customfield_10961,
        managerEmail: fields.customfield_10960,

        // Fields that can come from different places depending on the ticket
        employeeEmail: fields.customfield_10970 || fields.customfield_10984, // Use whichever is available
        joinDate: fields.customfield_10985, // Used by both onboarding types in your examples
        position: fields.customfield_11552,

        // Fields that have a '.value' property
        legalEntity: fields.customfield_11529?.value,
        employmentType: fields.customfield_11530?.value,
        laptopType: fields.customfield_11531?.value,
        officeLocation: fields.customfield_10729?.value,
        employeeSubType: fields.customfield_11557?.value, // e.g., Professional
        employeeStatus: fields.customfield_11551?.value, // e.g., Non Expat

        // Offboarding specific (will be null on onboarding tickets)
        resignationDate: fields.customfield_10727,
        accessCutoffDate: fields.customfield_10982,
      },
      asset_details: {
        // The assigned laptop can be in different fields, so we check both
        assignedLaptop:
          fields.customfield_11745?.[0] || fields.customfield_11747?.[0],
      },
    };

    return details;
  } catch (error) {
    console.error("Jira Service Error:", error.message);
    throw error;
  }
};

// This function is new, to resolve asset IDs
const getAssetDetails = async (workspaceId, objectId) => {
  if (!workspaceId || !objectId) {
    throw new Error("Workspace ID and Object ID are required.");
  }
  const url = `https://api.atlassian.com/jsm/assets/workspace/${workspaceId}/v1/object/${objectId}`;
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${process.env.ATLASSIAN_API_USER}:${process.env.ATLASSIAN_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
  };
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(
      `Failed to fetch Jira asset ${objectId}:`,
      error.response?.data
    );
    throw new Error("Could not retrieve asset details from Jira.");
  }
};

// This function is kept as is.
const deactivateUser = async (email) => {
  return {
    success: true,
    message: `Deactivate action for ${email} would be performed here.`,
  };
};

module.exports = {
  getUserStatus,
  deactivateUser,
  getTicketDetails,
  getAssetDetails,
};
