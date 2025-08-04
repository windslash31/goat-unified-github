const fetch = require("node-fetch");
const axios = require("axios");
const config = require("../config/config");
const db = require("../config/db");

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

const getJiraUserByEmail = async (email) => {
  if (!email) return null;
  const res = await db.query(
    "SELECT account_id FROM atlassian_users WHERE email_address = $1",
    [email]
  );
  return res.rows[0] || null;
};

const getAtlassianAccessByAccountId = async (atlassianAccountId) => {
  if (!atlassianAccountId) {
    return {
      jiraProjects: [],
      bitbucketRepositories: [],
      confluenceSpaces: [],
    };
  }

  const jiraProjectsQuery = `
    SELECT DISTINCT p.project_id, p.project_key, p.project_name, r.role_name
    FROM jira_project_permissions jpp
    JOIN jira_projects p ON p.project_id = jpp.project_id
    LEFT JOIN jira_roles r ON r.role_id = jpp.role_id
    WHERE jpp.actor_id = $1 AND jpp.actor_type = 'user';
  `;
  const jiraRes = await db.query(jiraProjectsQuery, [atlassianAccountId]);

  const bitbucketReposQuery = `
    SELECT DISTINCT br.repo_uuid, br.full_name, brp.permission_level
    FROM bitbucket_repositories br
    JOIN bitbucket_repository_permissions brp ON br.repo_uuid = brp.repo_uuid
    WHERE brp.user_account_id = $1;
  `;
  const bitbucketRes = await db.query(bitbucketReposQuery, [
    atlassianAccountId,
  ]);

  const confluenceSpacesQuery = `
    SELECT cs.id, cs.key, cs.name, csp.operation
    FROM confluence_space_permission csp
    JOIN confluence_space cs ON cs.id = csp.space_id
    WHERE csp.principal_id = $1 AND csp.principal_type = 'user';
  `;
  const confluenceRes = await db.query(confluenceSpacesQuery, [
    atlassianAccountId,
  ]);

  const confluenceSpaces = confluenceRes.rows.reduce((acc, row) => {
    if (!acc[row.id]) {
      acc[row.id] = {
        id: row.id,
        key: row.key,
        name: row.name,
        permissions: [],
      };
    }
    acc[row.id].permissions.push(row.operation);
    return acc;
  }, {});

  return {
    jiraProjects: jiraRes.rows,
    bitbucketRepositories: bitbucketRes.rows,
    confluenceSpaces: Object.values(confluenceSpaces),
  };
};

const syncUserData = async (employeeId, email) => {
  console.log(`SYNC: Starting Atlassian sync for ${email}`);
  try {
    const statusResult = await getUserStatus(email);

    // If the user doesn't exist in Atlassian, remove them from our local table.
    if (
      statusResult.status === "Error" ||
      statusResult.status === "Not Found"
    ) {
      await db.query("DELETE FROM atlassian_users WHERE email_address = $1", [
        email,
      ]);
      console.log(
        `SYNC: User ${email} not found or error in Atlassian. Removed from local DB.`
      );
      return;
    }

    const userDetails = statusResult.details;

    // ✨ FIX: The query now correctly targets the 'account_status' column
    // as defined in your DDL schema.
    const query = `
          INSERT INTO atlassian_users (account_id, email_address, display_name, account_status, last_updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (account_id) DO UPDATE SET
              email_address = EXCLUDED.email_address,
              display_name = EXCLUDED.display_name,
              account_status = EXCLUDED.account_status,
              last_updated_at = NOW();
      `;

    const values = [
      userDetails.accountId,
      userDetails.emailAddress || email,
      userDetails.displayName,
      statusResult.status, // This will insert the string 'Active', 'Suspended', etc.
    ];

    await db.query(query, values);
    console.log(`SYNC: Successfully synced Atlassian user ${email}`);
  } catch (error) {
    console.error(`SYNC: Error during Atlassian sync for ${email}:`, error);
  }
};

const syncAllAtlassianUsers = async () => {
  console.log("Starting Atlassian user sync...");
  if (!config.atlassian.orgId || !config.atlassian.orgToken) {
    throw new Error(
      "Atlassian Organization ID or Organization API Token is not configured."
    );
  }

  let allUsers = [];
  let nextCursor = null;
  let keepFetching = true;

  // --- FIX: Use the new Bearer token for authorization ---
  const headers = {
    Authorization: `Bearer ${config.atlassian.orgToken}`,
    Accept: "application/json",
  };

  // The rest of the function remains the same
  while (keepFetching) {
    const url = `https://api.atlassian.com/admin/v1/orgs/${
      config.atlassian.orgId
    }/users?limit=100${nextCursor ? `&cursor=${nextCursor}` : ""}`;

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Atlassian API Error: ${response.status} - ${errorBody}`
        );
      }

      const page = await response.json();
      const users = page.data;

      if (users && users.length > 0) {
        allUsers = allUsers.concat(users);
      }

      if (page.links && page.links.next) {
        const nextUrl = new URL(page.links.next);
        nextCursor = nextUrl.searchParams.get("cursor");
      } else {
        keepFetching = false;
      }
    } catch (error) {
      console.error("Failed to fetch a page of Atlassian users:", error);
      keepFetching = false;
    }
  }

  if (allUsers.length === 0) {
    console.log("No users found in Atlassian to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    for (const user of allUsers) {
      const query = `
        INSERT INTO atlassian_users (
          account_id, email_address, display_name, account_status, 
          billable, product_access, last_updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (account_id) DO UPDATE SET
          email_address = EXCLUDED.email_address,
          display_name = EXCLUDED.display_name,
          account_status = EXCLUDED.account_status,
          billable = EXCLUDED.billable,
          product_access = EXCLUDED.product_access,
          last_updated_at = NOW();
      `;
      const values = [
        user.account_id,
        user.email,
        user.name,
        user.account_status,
        user.is_billable,
        user.product_access ? JSON.stringify(user.product_access) : null,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
    console.log(`Successfully synced ${allUsers.length} Atlassian users.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Atlassian user database sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncAllAtlassianGroupsAndMembers = async () => {
  console.log("Starting Atlassian group sync...");
  if (
    !config.atlassian.orgId ||
    !config.atlassian.orgToken ||
    !config.atlassian.directoryId
  ) {
    throw new Error(
      "Atlassian Org ID, Token, or Directory ID is not configured."
    );
  }

  let allGroups = [];
  let nextCursor = null;
  let keepFetching = true;

  const headers = {
    Authorization: `Bearer ${config.atlassian.orgToken}`,
    Accept: "application/json",
  };

  while (keepFetching) {
    const url = `https://api.atlassian.com/admin/v2/orgs/${
      config.atlassian.orgId
    }/directories/${config.atlassian.directoryId}/groups?limit=100${
      nextCursor ? `&cursor=${nextCursor}` : ""
    }`;

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Atlassian API Error fetching groups: ${response.status} - ${errorBody}`
        );
      }
      const page = await response.json();
      const groups = page.data;

      if (groups && groups.length > 0) {
        allGroups = allGroups.concat(groups);
      }

      if (page.links && page.links.next) {
        nextCursor = page.links.next; // Use the cursor string directly
      } else {
        keepFetching = false;
      }
    } catch (error) {
      console.error("Failed to fetch a page of Atlassian groups:", error);
      keepFetching = false;
    }
  }

  if (allGroups.length === 0) {
    console.log("No groups found in Atlassian to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    for (const group of allGroups) {
      await client.query(
        `INSERT INTO atlassian_groups (group_id, group_name, last_updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (group_id) DO UPDATE SET group_name = EXCLUDED.group_name, last_updated_at = NOW()`,
        [group.id, group.name]
      );
    }
    await client.query("COMMIT");
    console.log(`Successfully synced ${allGroups.length} Atlassian groups.`);

    console.log("Starting Atlassian group member sync...");
    const jiraHeaders = {
      Authorization: `Basic ${Buffer.from(
        `${config.atlassian.apiUser}:${config.atlassian.apiToken}`
      ).toString("base64")}`,
      Accept: "application/json",
    };

    for (const group of allGroups) {
      let allMembers = [];
      let startAt = 0;
      let isLast = false;

      // Loop to handle pagination for group members
      while (!isLast) {
        const memberUrl = `https://${config.atlassian.domain}/rest/api/3/group/member?groupId=${group.id}&startAt=${startAt}&maxResults=50`;
        try {
          const memberResponse = await fetch(memberUrl, {
            headers: jiraHeaders,
          });
          if (!memberResponse.ok) {
            // It's common for some org-level groups not to exist in Jira, so we'll warn instead of erroring.
            console.warn(
              `Could not fetch members for group ${group.name} (${group.id}). Status: ${memberResponse.status}`
            );
            break; // Stop trying for this group
          }

          const memberData = await memberResponse.json();
          const members = memberData.values;

          if (members && members.length > 0) {
            allMembers.push(...members);
          }

          isLast = memberData.isLast;
          startAt += 50; // Increment for the next page
        } catch (e) {
          console.error(
            `An error occurred fetching members for group ${group.id}:`,
            e
          );
          isLast = true; // Stop on error
        }
      }

      if (allMembers.length > 0) {
        await client.query("BEGIN");
        await client.query(
          "DELETE FROM atlassian_group_members WHERE group_id = $1",
          [group.id]
        );
        for (const member of allMembers) {
          await client.query(
            "INSERT INTO atlassian_group_members (group_id, account_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [group.id, member.accountId] // Use accountId from the new response
          );
        }
        await client.query("COMMIT");
      }
    }
    console.log("Successfully finished syncing Atlassian group members.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Atlassian group database sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncAllJiraProjects = async () => {
  console.log("Starting Jira project sync...");
  if (
    !config.atlassian.domain ||
    !config.atlassian.apiUser ||
    !config.atlassian.apiToken
  ) {
    throw new Error("Jira API credentials are not fully configured.");
  }

  let allProjects = [];
  let startAt = 0;
  let isLast = false;

  const jiraHeaders = {
    Authorization: `Basic ${Buffer.from(
      `${config.atlassian.apiUser}:${config.atlassian.apiToken}`
    ).toString("base64")}`,
    Accept: "application/json",
  };

  while (!isLast) {
    const url = `https://${config.atlassian.domain}/rest/api/3/project/search?startAt=${startAt}&maxResults=50`;
    try {
      const response = await fetch(url, { headers: jiraHeaders });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Jira API Error fetching projects: ${response.status} - ${errorBody}`
        );
      }
      const page = await response.json();
      const projects = page.values;

      if (projects && projects.length > 0) {
        allProjects.push(...projects);
      }

      isLast = page.isLast;
      startAt = page.nextPage
        ? new URL(page.nextPage).searchParams.get("startAt")
        : startAt;
      if (!page.nextPage) isLast = true; // Handle cases where nextPage isn't present
    } catch (error) {
      console.error("Failed to fetch a page of Jira projects:", error);
      isLast = true; // Stop on error
    }
  }

  if (allProjects.length === 0) {
    console.log("No Jira projects found to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    for (const project of allProjects) {
      const query = `
        INSERT INTO jira_projects (
          project_id, project_key, project_name, jira_url, project_type, last_updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (project_id) DO UPDATE SET
          project_key = EXCLUDED.project_key,
          project_name = EXCLUDED.project_name,
          jira_url = EXCLUDED.jira_url,
          project_type = EXCLUDED.project_type,
          last_updated_at = NOW();
      `;
      const values = [
        project.id,
        project.key,
        project.name,
        project.self,
        project.projectTypeKey,
      ];
      await client.query(query, values);
    }
    await client.query("COMMIT");
    console.log(`Successfully synced ${allProjects.length} Jira projects.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Jira project database sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncJiraRolesAndPermissions = async () => {
  console.log("Starting Jira roles and permissions sync...");
  if (
    !config.atlassian.domain ||
    !config.atlassian.apiUser ||
    !config.atlassian.apiToken
  ) {
    throw new Error("Jira API credentials are not fully configured.");
  }

  const client = await db.pool.connect();
  try {
    const projectsResult = await client.query(
      "SELECT project_id FROM jira_projects"
    );
    const projects = projectsResult.rows;

    if (projects.length === 0) {
      console.log("No Jira projects found in the database to sync roles for.");
      return;
    }

    const jiraHeaders = {
      Authorization: `Basic ${Buffer.from(
        `${config.atlassian.apiUser}:${config.atlassian.apiToken}`
      ).toString("base64")}`,
      Accept: "application/json",
    };

    for (const project of projects) {
      const rolesUrl = `https://${config.atlassian.domain}/rest/api/3/project/${project.project_id}/role`;
      const rolesResponse = await fetch(rolesUrl, { headers: jiraHeaders });

      if (!rolesResponse.ok) {
        console.warn(
          `Could not fetch roles for project ${project.project_id}. Status: ${rolesResponse.status}`
        );
        continue;
      }

      const projectRoles = await rolesResponse.json();

      if (projectRoles && Object.keys(projectRoles).length > 0) {
        // Clear old permissions for this project before re-inserting
        await client.query(
          "DELETE FROM jira_project_permissions WHERE project_id = $1",
          [project.project_id]
        );

        for (const roleName in projectRoles) {
          const roleDetailsUrl = projectRoles[roleName];
          const roleId = new URL(roleDetailsUrl).pathname.split("/").pop();

          // Insert or update the role in the jira_roles table
          await client.query(
            `
            INSERT INTO jira_roles (role_id, role_name, last_updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (role_id) DO UPDATE SET
              role_name = EXCLUDED.role_name,
              last_updated_at = NOW();
          `,
            [roleId, roleName]
          );

          // Fetch the details for this specific role to get its actors (users/groups)
          const roleDetailResponse = await fetch(roleDetailsUrl, {
            headers: jiraHeaders,
          });
          if (!roleDetailResponse.ok) {
            console.warn(
              `Could not fetch actors for role ${roleName} in project ${project.project_id}.`
            );
            continue;
          }

          const roleData = await roleDetailResponse.json();
          if (roleData.actors && roleData.actors.length > 0) {
            for (const actor of roleData.actors) {
              await client.query(
                `
                INSERT INTO jira_project_permissions (project_id, role_id, actor_type, actor_id, last_updated_at)
                VALUES ($1, $2, $3, $4, NOW())
              `,
                [
                  project.project_id,
                  roleId,
                  actor.type,
                  actor.actorUser?.accountId || actor.actorGroup?.groupId,
                ]
              );
            }
          }
        }
      }
    }
    console.log("Successfully finished syncing Jira roles and permissions.");
  } catch (error) {
    console.error("Error during Jira roles and permissions sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncAllBitbucketRepositoriesAndPermissions = async () => {
  console.log(
    "CRON JOB: Starting Bitbucket repository and permissions sync..."
  );
  if (
    !config.atlassian.bitbucketWorkspace ||
    !config.atlassian.bitbucketToken ||
    !config.atlassian.apiUser ||
    !config.atlassian.bitbucketUserToken
  ) {
    throw new Error("Bitbucket API credentials are not fully configured.");
  }

  const bitbucketRepoHeaders = {
    Authorization: `Bearer ${config.atlassian.bitbucketToken}`,
    Accept: "application/json",
  };
  const bitbucketPermsHeaders = {
    Authorization: `Basic ${Buffer.from(
      `${config.atlassian.apiUser}:${config.atlassian.bitbucketUserToken}`
    ).toString("base64")}`,
    Accept: "application/json",
  };

  // Stage 1: Fetch all repository metadata
  let allRepositories = [];
  const lastYear = new Date().getFullYear() - 1;
  const startDate = `${lastYear}-01-01`;
  const encodedQuery = encodeURIComponent(`updated_on > "${startDate}"`);
  let nextPageUrl = `https://api.bitbucket.org/2.0/repositories/${config.atlassian.bitbucketWorkspace}?q=${encodedQuery}&sort=-updated_on`;

  while (nextPageUrl) {
    try {
      const response = await fetch(nextPageUrl, {
        headers: bitbucketRepoHeaders,
      });
      if (!response.ok) {
        throw new Error(
          `Bitbucket API Error fetching repositories: ${
            response.status
          } - ${await response.text()}`
        );
      }
      const page = await response.json();
      if (page.values && page.values.length > 0) {
        allRepositories.push(...page.values);
      }
      nextPageUrl = page.next;
    } catch (error) {
      console.error("Failed to fetch a page of Bitbucket repositories:", error);
      nextPageUrl = null;
    }
  }

  if (allRepositories.length === 0) {
    console.log("CRON JOB: No Bitbucket repositories found to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    // Stage 2: Save repository metadata to DB
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE TABLE bitbucket_repositories RESTART IDENTITY CASCADE;"
    );
    for (const repo of allRepositories) {
      await client.query(
        `INSERT INTO bitbucket_repositories (repo_uuid, full_name, name, created_on, updated_on, description, project_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          repo.uuid.replace(/[{}]/g, ""),
          repo.full_name,
          repo.name,
          repo.created_on,
          repo.updated_on,
          repo.description,
          repo.project?.name,
        ]
      );
    }
    await client.query("COMMIT");
    console.log(
      `CRON JOB: Successfully synced ${allRepositories.length} Bitbucket repositories.`
    );

    // Stage 3: Fetch permissions in parallel batches
    console.log(
      "CRON JOB: Starting Bitbucket repository permissions sync in parallel batches..."
    );
    await client.query(
      "TRUNCATE TABLE bitbucket_repository_permissions RESTART IDENTITY;"
    );

    const BATCH_SIZE = 50;
    const DELAY_BETWEEN_BATCHES_MS = 1000;
    let allPermissionsToInsert = [];

    for (let i = 0; i < allRepositories.length; i += BATCH_SIZE) {
      const batch = allRepositories.slice(i, i + BATCH_SIZE);
      console.log(
        `CRON JOB: Processing permissions for batch ${
          Math.floor(i / BATCH_SIZE) + 1
        }...`
      );

      const permissionPromises = batch.map(async (repo) => {
        let permissionsUrl = `https://api.bitbucket.org/2.0/workspaces/${config.atlassian.bitbucketWorkspace}/permissions/repositories/${repo.name}`;
        const repoPermissions = [];
        while (permissionsUrl) {
          const response = await fetch(permissionsUrl, {
            headers: bitbucketPermsHeaders,
          });
          if (!response.ok) {
            console.warn(
              `Could not fetch permissions for repo ${repo.full_name}. Status: ${response.status}`
            );
            return [];
          }
          const data = await response.json();
          if (data.values) {
            data.values.forEach((perm) => {
              if (perm.user && perm.user.account_id) {
                repoPermissions.push({
                  repo_uuid: repo.uuid.replace(/[{}]/g, ""),
                  user_account_id: perm.user.account_id,
                  permission_level: perm.permission,
                });
              }
            });
          }
          permissionsUrl = data.next;
        }
        return repoPermissions;
      });

      const results = await Promise.allSettled(permissionPromises);
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.length > 0) {
          allPermissionsToInsert.push(...result.value);
        } else if (result.status === "rejected") {
          console.error("A permission fetch failed:", result.reason);
        }
      });

      if (i + BATCH_SIZE < allRepositories.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)
        );
      }
    }

    // Stage 4: Perform a single bulk insert for all collected permissions
    if (allPermissionsToInsert.length > 0) {
      await client.query("BEGIN");
      const repoUuids = allPermissionsToInsert.map((p) => p.repo_uuid);
      const userAccountIds = allPermissionsToInsert.map(
        (p) => p.user_account_id
      );
      const permissionLevels = allPermissionsToInsert.map(
        (p) => p.permission_level
      );

      const query = `
            INSERT INTO bitbucket_repository_permissions (repo_uuid, user_account_id, permission_level)
            SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
        `;
      await client.query(query, [repoUuids, userAccountIds, permissionLevels]);
      await client.query("COMMIT");
      console.log(
        `CRON JOB: Successfully synced ${allPermissionsToInsert.length} Bitbucket permissions.`
      );
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Bitbucket database sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncAllConfluenceSpaces = async () => {
  console.log(
    "CRON JOB: Starting Confluence space sync for global, collaboration, and knowledge_base types..."
  );

  const jiraHeaders = {
    Authorization: `Basic ${Buffer.from(
      `${config.atlassian.apiUser}:${config.atlassian.apiToken}`
    ).toString("base64")}`,
    Accept: "application/json",
  };

  const fetchSpacesByType = async (spaceType) => {
    let spaces = [];
    let nextUrl = `https://${config.atlassian.domain}/wiki/api/v2/spaces?limit=250&type=${spaceType}`;

    while (nextUrl) {
      try {
        const response = await fetch(nextUrl, { headers: jiraHeaders });
        if (!response.ok) {
          throw new Error(
            `Confluence API Error fetching '${spaceType}' spaces: ${
              response.status
            } - ${await response.text()}`
          );
        }
        const page = await response.json();
        // The spaces API returns a single object with a results array
        const results = page.results;

        if (results && results.length > 0) {
          spaces.push(...results);
        }

        nextUrl = page._links?.next;
      } catch (error) {
        console.error(`Failed to fetch a page of ${spaceType} spaces:`, error);
        nextUrl = null;
      }
    }
    return spaces;
  };

  const spaceTypesToFetch = ["global", "collaboration", "knowledge_base"];
  const allSpacesArrays = await Promise.all(
    spaceTypesToFetch.map((type) => fetchSpacesByType(type))
  );
  const allSpaces = allSpacesArrays.flat();

  if (allSpaces.length === 0) {
    console.log("CRON JOB: No Confluence spaces found to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const spaceIds = allSpaces.map((s) => s.id);
    const spaceKeys = allSpaces.map((s) => s.key);
    const spaceNames = allSpaces.map((s) => s.name);
    const spaceTypes = allSpaces.map((s) => s.type);
    const spaceStatuses = allSpaces.map((s) => s.status);
    const spaceDescriptions = allSpaces.map(
      (s) => s.description?.plain?.value || null
    );
    const ownerAccountIds = allSpaces.map((s) => s.spaceOwnerId || null);
    const createdAtDates = allSpaces.map((s) => s.createdAt || null);

    const query = `
      INSERT INTO confluence_space (id, key, name, type, status, description, owner_account_id, created_at, updated_at)
      SELECT * FROM unnest(
          $1::bigint[], $2::varchar[], $3::varchar[], $4::varchar[], $5::varchar[],
          $6::text[], $7::varchar[], $8::timestamptz[], array_fill(NOW(), ARRAY[array_length($1, 1)])
      )
      ON CONFLICT (id) DO UPDATE SET
        key = EXCLUDED.key, name = EXCLUDED.name, type = EXCLUDED.type,
        status = EXCLUDED.status, description = EXCLUDED.description,
        owner_account_id = EXCLUDED.owner_account_id, created_at = EXCLUDED.created_at,
        updated_at = NOW();
    `;

    await client.query(query, [
      spaceIds,
      spaceKeys,
      spaceNames,
      spaceTypes,
      spaceStatuses,
      spaceDescriptions,
      ownerAccountIds,
      createdAtDates,
    ]);
    await client.query("COMMIT");
    console.log(
      `CRON JOB: Successfully synced ${allSpaces.length} Confluence spaces.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Confluence space database sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncAllConfluencePermissions = async () => {
  console.log(
    "CRON JOB: Starting Confluence space permissions sync using V2 API..."
  );
  const jiraHeaders = {
    Authorization: `Basic ${Buffer.from(
      `${config.atlassian.apiUser}:${config.atlassian.apiToken}`
    ).toString("base64")}`,
    Accept: "application/json",
  };

  const client = await db.pool.connect();
  try {
    const spacesResult = await client.query("SELECT id FROM confluence_space");
    const spaces = spacesResult.rows;
    if (spaces.length === 0) {
      console.log("CRON JOB: No spaces in DB to sync permissions for.");
      return;
    }

    const BATCH_SIZE = 250;
    const DELAY_BETWEEN_BATCHES_MS = 1000;
    let allPermissionsToInsert = [];

    for (let i = 0; i < spaces.length; i += BATCH_SIZE) {
      const batch = spaces.slice(i, i + BATCH_SIZE);
      console.log(
        `CRON JOB: Processing permissions for batch ${
          Math.floor(i / BATCH_SIZE) + 1
        }...`
      );

      const permissionPromises = batch.map(async (space) => {
        let nextUrl = `https://${config.atlassian.domain}/wiki/api/v2/spaces/${space.id}/permissions?limit=250`;
        const spacePermissions = [];

        while (nextUrl) {
          try {
            const response = await fetch(nextUrl, { headers: jiraHeaders });
            if (!response.ok) {
              console.warn(
                `Could not fetch permissions for space ${space.id}. Status: ${response.status}`
              );
              return [];
            }

            const rawPageData = await response.json();
            // FIX: Normalize the response to always be an array to handle API inconsistency.
            const pageArray = Array.isArray(rawPageData)
              ? rawPageData
              : [rawPageData];

            let nextPath = null;

            // Loop over the now-guaranteed-to-be-an-array page data
            for (const page of pageArray) {
              if (page && page.results) {
                page.results.forEach((perm) => {
                  const principalId = perm.principal.id;
                  if (principalId) {
                    spacePermissions.push({
                      spaceId: space.id,
                      principalId: principalId,
                      operation: perm.operation.key,
                      principalType: perm.principal.type,
                    });
                  }
                });
              }
              // Capture the 'next' link from the last valid page in the response
              if (page && page._links?.next) {
                nextPath = page._links.next;
              }
            }

            const baseUrl = `https://${config.atlassian.domain}`;
            nextUrl = nextPath ? `${baseUrl}${nextPath}` : null;
          } catch (error) {
            console.error(
              `Error processing permissions for space ${space.id}:`,
              error
            );
            nextUrl = null;
          }
        }
        return spacePermissions;
      });

      const results = await Promise.allSettled(permissionPromises);
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.length > 0) {
          allPermissionsToInsert.push(...result.value);
        } else if (result.status === "rejected") {
          console.error("A permission fetch promise failed:", result.reason);
        }
      });

      if (i + BATCH_SIZE < spaces.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)
        );
      }
    }

    if (allPermissionsToInsert.length === 0) {
      console.log("CRON JOB: No Confluence permissions found to sync.");
      return;
    }

    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE confluence_space_permission;");

    const spaceIds = allPermissionsToInsert.map((p) => p.spaceId);
    const principalIds = allPermissionsToInsert.map((p) => p.principalId);
    const operations = allPermissionsToInsert.map((p) => p.operation);
    const principalTypes = allPermissionsToInsert.map((p) => p.principalType);

    const query = `
          INSERT INTO confluence_space_permission (space_id, principal_id, operation, principal_type, updated_at)
          SELECT * FROM unnest($1::bigint[], $2::varchar[], $3::varchar[], $4::varchar[], array_fill(NOW(), ARRAY[array_length($1, 1)]))
          ON CONFLICT (space_id, principal_id, operation) DO NOTHING;
      `;

    await client.query(query, [
      spaceIds,
      principalIds,
      operations,
      principalTypes,
    ]);
    await client.query("COMMIT");
    console.log(
      `CRON JOB: Successfully synced ${allPermissionsToInsert.length} Confluence permissions.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during Confluence permissions sync:", error);
    throw error;
  } finally {
    client.release();
  }
};

const syncConfluenceUsersFromAtlassian = async () => {
  console.log(
    "CRON JOB: Syncing Confluence users from master Atlassian user list..."
  );
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
          INSERT INTO confluence_users (account_id, display_name, email, account_status, account_type, updated_at)
          SELECT 
              account_id, 
              display_name, 
              email_address, 
              account_status,
              'atlassian' as account_type,
              last_updated_at
          FROM atlassian_users
          -- FIX: Changed "confluence.ondemand" to "confluence" to match the actual data
          WHERE product_access @> '[{"key": "confluence"}]'
          ON CONFLICT (account_id) DO UPDATE SET
              display_name = EXCLUDED.display_name,
              email = EXCLUDED.email,
              account_status = EXCLUDED.account_status,
              account_type = EXCLUDED.account_type,
              updated_at = NOW();
      `;
    const result = await client.query(query);
    await client.query("COMMIT");
    console.log(
      `CRON JOB: Successfully synced ${result.rowCount} Confluence users.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error syncing Confluence users:", error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getUserStatus,
  deactivateUser,
  getTicketDetails,
  getAssetDetails,
  findAssetByName,
  getJiraUserByEmail,
  getAtlassianAccessByAccountId,
  syncUserData,
  syncAllAtlassianUsers,
  syncAllAtlassianGroupsAndMembers,
  syncAllJiraProjects,
  syncJiraRolesAndPermissions,
  syncAllBitbucketRepositoriesAndPermissions,
  syncAllConfluenceSpaces,
  syncAllConfluencePermissions,
  syncConfluenceUsersFromAtlassian,
};
