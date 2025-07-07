const fetch = require("node-fetch");

const getUserStatus = async (email) => {
  // Use the exact environment variable names you have defined
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
      message: "Server configuration error.",
    };
  }

  // Construct the URL using your ATLASSIAN_DOMAIN variable
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
        message: "User does not exist in Atlassian.",
      };
    }

    const user = users[0];
    return {
      platform: "Atlassian",
      email: user.emailAddress,
      status: user.active ? "Active" : "Suspended",
      message: user.active ? "Account is active." : "Account is deactivated.",
    };
  } catch (error) {
    console.error("Atlassian Error:", error.message);
    return {
      platform: "Atlassian",
      email: email,
      status: "Error",
      message: "Failed to fetch status from Atlassian.",
    };
  }
};

// --- NEW FUNCTION ADDED HERE ---
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

  const url = `https://${process.env.ATLASSIAN_DOMAIN}/rest/api/3/issue/${ticketId}`;

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

    const details = {
      summary: data.fields.summary,
      reporter: data.fields.reporter ? data.fields.reporter.displayName : "N/A",
      assignee: data.fields.assignee
        ? data.fields.assignee.displayName
        : "Unassigned",
      created: data.fields.created,
      status: data.fields.status.name,
      issueType: data.fields.issuetype.name,
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
  getTicketDetails, // Export the new function
};
