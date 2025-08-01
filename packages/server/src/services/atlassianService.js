const fetch = require("node-fetch");
const axios = require("axios");
const config = require("../config/config");

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

const findAttributeValue = (attributes, name) => {
  const attribute = attributes.find(
    (attr) => attr.objectTypeAttribute.name === name
  );
  return attribute?.objectAttributeValues[0]?.displayValue || null;
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
        managerEmail: fields.customfield_10960,

        employeeEmail: fields.customfield_10970 || fields.customfield_10984,
        joinDate: fields.customfield_10985,
        position: fields.customfield_11552,

        legalEntity:
          fields.customfield_10892?.value || fields.customfield_11529?.value,
        employmentType:
          fields.customfield_10724?.value || fields.customfield_11530?.value,
        laptopType: fields.customfield_11531?.value,
        officeLocation: fields.customfield_10729?.value,
        employeeSubType: fields.customfield_11557?.value,
        employeeStatus: fields.customfield_11551?.value, 

        resignationDate: fields.customfield_10727,
        accessCutoffDate: fields.customfield_10982,
      },
      asset_details: {},
    };

    const assetReference =
      fields.customfield_11745?.[0] ||
      fields.customfield_11746?.[0] ||
      fields.customfield_11747?.[0];

    if (
      assetReference &&
      assetReference.workspaceId &&
      assetReference.objectId
    ) {
      try {
        const assetData = await getAssetDetails(
          assetReference.workspaceId,
          assetReference.objectId
        );
        if (assetData && assetData.attributes) {
          const attributes = assetData.attributes;
          details.asset_details = {
            key: assetData.objectKey,
            name: assetData.label,
            type: assetData.objectType.name,
            Tag: findAttributeValue(attributes, "Tag"),
            "Serial Number": findAttributeValue(attributes, "Serial Number"),
            Status: findAttributeValue(attributes, "Status"),
            "Invoice Number": findAttributeValue(attributes, "Invoice Number"),
            "Buying Years": findAttributeValue(attributes, "Buying Years"),
            "Operating System": findAttributeValue(
              attributes,
              "Operating System"
            ),
            Created: findAttributeValue(attributes, "Created"),
            Updated: findAttributeValue(attributes, "Updated"),
            Owner: findAttributeValue(attributes, "Owner"),
            "Model/Type": findAttributeValue(attributes, "Model/Type"),
            Location: findAttributeValue(attributes, "Location"),
          };
        }
      } catch (error) {
        console.error(
          `Could not fetch asset details for ticket ${ticketId}:`,
          error
        );
        details.asset_details.error = "Could not fetch asset details.";
      }
    }

    return details;
  } catch (error) {
    console.error("Jira Service Error:", error.message);
    throw error;
  }
};

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
    return Array.isArray(response.data) ? response.data[0] : response.data;
  } catch (error) {
    console.error(
      `Failed to fetch Jira asset ${objectId}:`,
      error.response?.data
    );
    throw new Error("Could not retrieve asset details from Jira.");
  }
};

const deactivateUser = async (email) => {
  return {
    success: true,
    message: `Deactivate action for ${email} would be performed here.`,
  };
};

const findAssetByName = async (assetName) => {
  const workspaceId = config.atlassian.workspaceId;
  if (!workspaceId) {
    throw new Error("Atlassian Workspace ID is not configured on the server.");
  }
  if (!assetName) {
    throw new Error("Asset name is required for searching.");
  }

  const url = `https://api.atlassian.com/jsm/assets/workspace/${workspaceId}/v1/object/aql`;
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${config.atlassian.apiUser}:${config.atlassian.apiToken}`
    ).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const body = {
    qlQuery: `objectType = "Laptops" AND (key = "${assetName}" OR label = "${assetName}")`,
    resultsPerPage: 1, 
  };

  try {
    const response = await axios.post(url, body, { headers });

    const assetEntries = response.data?.values;
    if (!assetEntries || assetEntries.length === 0) {
      throw new Error(
        `Asset with name or key "${assetName}" not found in Jira.`
      );
    }

    const asset = assetEntries[0];
    const attributeDefinitions = response.data.objectTypeAttributes || [];

    const fullAttributes = asset.attributes.map((attr) => {
      const definition = attributeDefinitions.find(
        (def) => def.id === attr.objectTypeAttributeId
      );
      return {
        ...attr,
        objectTypeAttribute: definition || {},
      };
    });

    return {
      key: asset.objectKey,
      name: asset.label,
      type: asset.objectType.name,
      Tag: findAttributeValue(fullAttributes, "Tag"),
      "Serial Number": findAttributeValue(fullAttributes, "Serial Number"),
      Status: findAttributeValue(fullAttributes, "Status"),
      "Invoice Number": findAttributeValue(fullAttributes, "Invoice Number"),
      "Buying Years": findAttributeValue(fullAttributes, "Buying Years"),
      "Operating System": findAttributeValue(
        fullAttributes,
        "Operating System"
      ),
      Created: findAttributeValue(fullAttributes, "Created"),
      Updated: findAttributeValue(fullAttributes, "Updated"),
      "Model/Type": findAttributeValue(fullAttributes, "Model/Type"),
      Location: findAttributeValue(fullAttributes, "Location"),
      Owner: findAttributeValue(fullAttributes, "Owner"),
    };
  } catch (error) {
    console.error(
      `Failed to search for Jira asset "${assetName}":`,
      error.response?.data?.errorMessages ||
        error.response?.data ||
        error.message
    );
    throw new Error(
      error.response?.data?.message ||
        `Could not find asset details for "${assetName}".`
    );
  }
};

module.exports = {
  getUserStatus,
  deactivateUser,
  getTicketDetails,
  getAssetDetails,
  findAssetByName,
};