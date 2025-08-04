const fetch = require("node-fetch");
const db = require("../config/db");

const BASE_URL = "https://console.jumpcloud.com/api";
const API_KEY = process.env.JUMPCLOUD_API_KEY;

const fetchAllJumpCloudUsers = async () => {
  if (!API_KEY) throw new Error("JumpCloud API key is not configured.");
  const limit = 100;
  let skip = 0;
  let allUsers = [];
  let keepFetching = true; // Use a flag to control the loop

  // --- MODIFICATION START: Improved pagination logic ---
  while (keepFetching) {
    const url = `${BASE_URL}/systemusers?limit=${limit}&skip=${skip}`;
    const response = await fetch(url, {
      headers: { "x-api-key": API_KEY, Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `JumpCloud API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const users = data.results || [];

    if (users.length > 0) {
      allUsers = allUsers.concat(users);
      skip += limit;
    }

    if (users.length < limit) {
      keepFetching = false;
    }
  }

  return allUsers;
};

const syncAllJumpCloudUsers = async () => {
  console.log("Starting JumpCloud user sync...");
  const users = await fetchAllJumpCloudUsers();
  if (!users || users.length === 0) {
    console.log("No users found in JumpCloud to sync.");
    return;
  }
  try {
    for (const user of users) {
      const query = `
        INSERT INTO jumpcloud_users (
          id, email, username, display_name, firstname, lastname, 
          activated, suspended, employee_type, account_locked, totp_enabled, 
          password_never_expires, password_expiration_date, created, updated_at,
          attributes, sudo, mfa_enrollment -- New columns
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(),
          $15, $16, $17 -- New value placeholders
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          firstname = EXCLUDED.firstname,
          lastname = EXCLUDED.lastname,
          activated = EXCLUDED.activated,
          suspended = EXCLUDED.suspended,
          employee_type = EXCLUDED.employee_type,
          account_locked = EXCLUDED.account_locked,
          totp_enabled = EXCLUDED.totp_enabled,
          password_never_expires = EXCLUDED.password_never_expires,
          password_expiration_date = EXCLUDED.password_expiration_date,
          created = EXCLUDED.created,
          updated_at = NOW(),
          attributes = EXCLUDED.attributes, -- Update new column
          sudo = EXCLUDED.sudo,             -- Update new column
          mfa_enrollment = EXCLUDED.mfa_enrollment; -- Update new column
      `;
      const values = [
        user.id,
        user.email,
        user.username,
        user.displayname ||
          `${user.firstname || ""} ${user.lastname || ""}`.trim(),
        user.firstname,
        user.lastname,
        user.state === "ACTIVATED",
        user.suspended,
        user.employeeType,
        user.account_locked,
        user.totp_enabled,
        user.password_never_expires,
        user.password_expiration_date,
        user.created,
        user.attributes ? JSON.stringify(user.attributes) : null, // New field
        user.sudo, // New field
        user.mfaEnrollment ? JSON.stringify(user.mfaEnrollment) : null, // New field
      ];
      await db.query(query, values);
    }
    console.log(`Successfully synced ${users.length} JumpCloud users.`);
  } catch (error) {
    console.error("Error during JumpCloud user sync:", error);
    throw error;
  }
};

const fetchAllJumpCloudApplications = async () => {
  if (!API_KEY) throw new Error("JumpCloud API key is not configured.");
  const url = `https://console.jumpcloud.com/api/v2/applications`;
  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY, Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      `JumpCloud API Error: ${response.status} ${response.statusText}`
    );
  return response.json();
};

const syncAllJumpCloudApplications = async () => {
  console.log("Starting JumpCloud application sync...");
  const applications = await fetchAllJumpCloudApplications();
  if (!applications || !applications.length) {
    console.log("No applications found in JumpCloud to sync.");
    return;
  }

  try {
    for (const app of applications) {
      if (!app._id) {
        console.warn(
          `Skipping application with no ID: ${
            app.displayName || "Name not available"
          }`
        );
        continue;
      }

      const query = `
        INSERT INTO jumpcloud_applications (
          id, display_name, display_label, sso_url, sso, updated_at,
          description, provision, organization -- Final Columns
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            display_label = EXCLUDED.display_label,
            sso_url = EXCLUDED.sso_url,
            sso = EXCLUDED.sso,
            updated_at = NOW(),
            description = EXCLUDED.description,
            provision = EXCLUDED.provision,
            organization = EXCLUDED.organization;
      `;
      const values = [
        app._id,
        app.displayName,
        app.displayLabel,
        app.sso?.url,
        app.sso ? JSON.stringify(app.sso) : null,
        app.description,
        app.provision ? JSON.stringify(app.provision) : null,
        app.organization,
      ];
      await db.query(query, values);
    }
    console.log(`Successfully synced JumpCloud applications.`);
  } catch (error) {
    console.error("Error during JumpCloud application sync:", error);
    throw error;
  }
};

const syncAllJumpCloudGroupAssociations = async () => {
  console.log("Starting JumpCloud group association sync...");
  try {
    const res = await db.query("SELECT id FROM jumpcloud_applications");
    const applications = res.rows;
    if (applications.length === 0) {
      console.log("No applications in DB to sync associations for.");
      return;
    }

    for (const app of applications) {
      const url = `https://console.jumpcloud.com/api/v2/applications/${app.id}/associations?targets=user_group`;
      const response = await fetch(url, {
        headers: { "x-api-key": API_KEY, Accept: "application/json" },
      });

      if (!response.ok) {
        console.error(
          `Could not fetch associations for app ${app.id}: ${response.statusText}`
        );
        continue;
      }
      const associations = await response.json();

      for (const assoc of associations) {
        const group = assoc.to;
        if (group.type !== "user_group") continue;

        let groupName = `Group ${group.id}`;
        if (
          group.attributes?.ldapGroups &&
          group.attributes.ldapGroups.length > 0 &&
          group.attributes.ldapGroups[0].name
        ) {
          groupName = group.attributes.ldapGroups[0].name;
        }

        await db.query(
          `
            INSERT INTO jumpcloud_user_groups (id, name, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = NOW();
        `,
          [group.id, groupName]
        );

        await db.query(
          `
            INSERT INTO jumpcloud_application_bindings (application_id, group_id)
            VALUES ($1, $2)
            ON CONFLICT (application_id, group_id) DO NOTHING;
        `,
          [app.id, group.id]
        );
      }
    }
    console.log("Successfully synced JumpCloud group associations.");
  } catch (error) {
    console.error("Error during JumpCloud group association sync:", error);
    throw error;
  }
};

const getUser = async (email) => {
  if (!API_KEY) throw new Error("JumpCloud API key is not configured.");

  const requiredFields = [
    "id",
    "email",
    "username",
    "displayname",
    "firstname",
    "lastname",
    "state",
    "suspended",
    "employeeType",
    "account_locked",
    "totp_enabled",
    "password_never_expires",
    "password_expiration_date",
    "created",
    "jobTitle",
    "department",
    "employeeIdentifier",
    "company",
    "location",
    "manager",
    "mfa",
    "attributes",
    "sudo",
    "mfaEnrollment",
  ].join(" ");

  const url = `${BASE_URL}/systemusers?filter=email:eq:${encodeURIComponent(
    email
  )}&fields=${encodeURIComponent(requiredFields)}`;

  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`JumpCloud API Error: ${response.statusText}`);
  }
  const { results } = await response.json();
  return results.length > 0 ? results[0] : null;
};

const suspendUser = async (email) => {
  try {
    const user = await getUser(email);
    if (!user) {
      return {
        success: false,
        message: `User ${email} not found in JumpCloud.`,
      };
    }
    const url = `${BASE_URL}/systemusers/${user.id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ suspended: true }),
    });
    if (!response.ok) {
      throw new Error(`JumpCloud API Error: ${response.statusText}`);
    }
    return { success: true, message: `User ${email} suspended in JumpCloud.` };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getUserStatus = async (email) => {
  try {
    const user = await getUser(email);
    if (!user) {
      return {
        platform: "JumpCloud",
        status: "Not Found",
        email: email,
        details: { message: "User not found in JumpCloud." },
      };
    }

    const details = {
      coreIdentity: {
        displayName: user.displayname,
        username: user.username,
        email: user.email,
        id: user._id,
      },
      accountStatus: {
        state: user.state,
        activated: user.activated,
        suspended: user.suspended,
        accountLocked: user.account_locked,
        passwordExpired: user.password_expired,
        mfaStatus: user.mfaEnrollment?.overallStatus,
      },
      permissions: {
        isAdmin: user.admin ? "Yes" : "No",
        hasSudo: user.sudo ? "Yes" : "No",
      },
    };

    return {
      platform: "JumpCloud",
      email: user.email,
      status: user.suspended ? "Suspended" : "Active",
      details: details,
    };
  } catch (error) {
    return {
      platform: "JumpCloud",
      status: "Error",
      email: email,
      details: { message: error.message },
    };
  }
};

const getSystemAssociations = async (userId) => {
  if (!API_KEY) {
    throw new Error("JumpCloud API key is not configured.");
  }
  const url = `https://console.jumpcloud.com/api/v2/users/${userId}/associations?targets=system`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`JumpCloud API Error: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

const getSystemDetails = async (systemId) => {
  if (!API_KEY) {
    throw new Error("JumpCloud API key is not configured.");
  }
  const url = `https://console.jumpcloud.com/api/systems/${systemId}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`JumpCloud API Error: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

const syncUserData = async (employeeId, email) => {
  console.log(`SYNC: Starting JumpCloud sync for ${email}`);
  try {
    const user = await getUser(email); // Fetches from API

    if (!user) {
      await db.query("DELETE FROM jumpcloud_users WHERE email = $1", [email]);
      console.log(
        `SYNC: User ${email} not found in JumpCloud. Removed from local DB.`
      );
      return;
    }

    const query = `
      INSERT INTO jumpcloud_users (
        id, email, username, display_name, firstname, lastname,
        activated, suspended, employee_type, account_locked, totp_enabled,
        password_never_expires, password_expiration_date, created, updated_at,
        attributes, sudo, mfa_enrollment -- New columns
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(),
        $15, $16, $17 -- New value placeholders
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        firstname = EXCLUDED.firstname,
        lastname = EXCLUDED.lastname,
        activated = EXCLUDED.activated,
        suspended = EXCLUDED.suspended,
        employee_type = EXCLUDED.employee_type,
        account_locked = EXCLUDED.account_locked,
        totp_enabled = EXCLUDED.totp_enabled,
        password_never_expires = EXCLUDED.password_never_expires,
        password_expiration_date = EXCLUDED.password_expiration_date,
        created = EXCLUDED.created,
        updated_at = NOW(),
        attributes = EXCLUDED.attributes, -- Update new column
        sudo = EXCLUDED.sudo,             -- Update new column
        mfa_enrollment = EXCLUDED.mfa_enrollment; -- Update new column
    `;
    const values = [
      user.id,
      user.email,
      user.username,
      user.displayname ||
        `${user.firstname || ""} ${user.lastname || ""}`.trim(),
      user.firstname,
      user.lastname,
      user.state === "ACTIVATED",
      user.suspended,
      user.employeeType,
      user.account_locked,
      user.totp_enabled,
      user.password_never_expires,
      user.password_expiration_date,
      user.created,
      user.attributes ? JSON.stringify(user.attributes) : null,
      user.sudo,
      user.mfaEnrollment ? JSON.stringify(user.mfaEnrollment) : null,
    ];

    await db.query(query, values);

    console.log(`SYNC: Successfully synced JumpCloud user ${email}`);
  } catch (error) {
    console.error(`SYNC: Error during JumpCloud sync for ${email}:`, error);
  }
};

const syncAllJumpCloudGroupMembers = async () => {
  console.log("Starting JumpCloud group member sync...");
  try {
    const res = await db.query("SELECT id FROM jumpcloud_user_groups");
    const groups = res.rows;
    if (groups.length === 0) {
      console.log("No user groups in DB to sync members for.");
      return;
    }

    for (const group of groups) {
      let allMembers = [];
      let skip = 0;
      const limit = 100;
      let keepFetching = true;

      while (keepFetching) {
        const url = `https://console.jumpcloud.com/api/v2/usergroups/${group.id}/members?limit=${limit}&skip=${skip}`;
        const response = await fetch(url, {
          headers: { "x-api-key": API_KEY, Accept: "application/json" },
        });

        if (!response.ok) {
          console.error(
            `Could not fetch members for group ${group.id}: ${response.statusText}`
          );
          keepFetching = false;
          continue;
        }

        const members = await response.json();

        if (members && members.length > 0) {
          allMembers = allMembers.concat(members);
          skip += limit;
        }

        if (!members || members.length < limit) {
          keepFetching = false;
        }
      }
      await db.query(
        "DELETE FROM jumpcloud_user_group_members WHERE group_id = $1",
        [group.id]
      );

      if (allMembers.length > 0) {
        const insertPromises = allMembers
          .filter((member) => member.to.type === "user")
          .map((member) => {
            return db.query(
              `INSERT INTO jumpcloud_user_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [group.id, member.to.id]
            );
          });
        await Promise.all(insertPromises);
      }
    }
    console.log("Successfully synced JumpCloud group members.");
  } catch (error) {
    console.error("Error during JumpCloud group member sync:", error);
    throw error;
  }
};

module.exports = {
  suspendUser,
  getUserStatus,
  getUser,
  getSystemAssociations,
  getSystemDetails,
  syncAllJumpCloudUsers,
  syncAllJumpCloudApplications,
  syncAllJumpCloudGroupAssociations,
  syncAllJumpCloudGroupMembers,
  syncUserData,
};
