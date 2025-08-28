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
          password_never_expires, password_expiration_date, created, 
          attributes, sudo, mfa_enrollment, addresses, company, cost_center,
          department, job_title, location, middlename, manager, phone_numbers,
          state, password_expired, password_date, mfa, organization, allow_public_key,
          alternate_email, description, disable_device_max_login_attempts,
          employee_identifier, enable_managed_uid, enable_user_portal_multifactor,
          external_dn, external_source_type, externally_managed, ldap_binding_user,
          managed_apple_id, passwordless_sudo, samba_service_user, ssh_keys,
          system_username, unix_guid, unix_uid
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42,
          $43, $44, $45, $46, $47, $48, $49
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email, username = EXCLUDED.username, display_name = EXCLUDED.display_name,
          firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, activated = EXCLUDED.activated,
          suspended = EXCLUDED.suspended, employee_type = EXCLUDED.employee_type,
          account_locked = EXCLUDED.account_locked, totp_enabled = EXCLUDED.totp_enabled,
          password_never_expires = EXCLUDED.password_never_expires,
          password_expiration_date = EXCLUDED.password_expiration_date, created = EXCLUDED.created,
          updated_at = NOW(), attributes = EXCLUDED.attributes, sudo = EXCLUDED.sudo,
          mfa_enrollment = EXCLUDED.mfa_enrollment, addresses = EXCLUDED.addresses,
          company = EXCLUDED.company, cost_center = EXCLUDED.cost_center, department = EXCLUDED.department,
          job_title = EXCLUDED.job_title, location = EXCLUDED.location, middlename = EXCLUDED.middlename,
          manager = EXCLUDED.manager, phone_numbers = EXCLUDED.phone_numbers, state = EXCLUDED.state,
          password_expired = EXCLUDED.password_expired, password_date = EXCLUDED.password_date,
          mfa = EXCLUDED.mfa, organization = EXCLUDED.organization, allow_public_key = EXCLUDED.allow_public_key,
          alternate_email = EXCLUDED.alternate_email, description = EXCLUDED.description,
          disable_device_max_login_attempts = EXCLUDED.disable_device_max_login_attempts,
          employee_identifier = EXCLUDED.employee_identifier, enable_managed_uid = EXCLUDED.enable_managed_uid,
          enable_user_portal_multifactor = EXCLUDED.enable_user_portal_multifactor,
          external_dn = EXCLUDED.external_dn, external_source_type = EXCLUDED.external_source_type,
          externally_managed = EXCLUDED.externally_managed, ldap_binding_user = EXCLUDED.ldap_binding_user,
          managed_apple_id = EXCLUDED.managed_apple_id, passwordless_sudo = EXCLUDED.passwordless_sudo,
          samba_service_user = EXCLUDED.samba_service_user, ssh_keys = EXCLUDED.ssh_keys,
          system_username = EXCLUDED.system_username, unix_guid = EXCLUDED.unix_guid,
          unix_uid = EXCLUDED.unix_uid;
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
        user.addresses ? JSON.stringify(user.addresses) : null,
        user.company || null,
        user.costCenter || null,
        user.department || null,
        user.jobTitle || null,
        user.location || null,
        user.middlename || null,
        user.manager || null,
        user.phoneNumbers ? JSON.stringify(user.phoneNumbers) : null,
        user.state || null,
        user.password_expired,
        user.password_date || null,
        user.mfa ? JSON.stringify(user.mfa) : null,
        user.organization || null,
        user.allow_public_key,
        user.alternateEmail || null,
        user.description || null,
        user.disableDeviceMaxLoginAttempts,
        user.employeeIdentifier || null,
        user.enable_managed_uid,
        user.enable_user_portal_multifactor,
        user.external_dn || null,
        user.external_source_type || null,
        user.externally_managed,
        user.ldap_binding_user,
        user.managedAppleId || null,
        user.passwordless_sudo,
        user.samba_service_user,
        user.ssh_keys ? JSON.stringify(user.ssh_keys) : null,
        user.systemUsername || null,
        user.unix_guid || null,
        user.unix_uid || null,
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

  const limit = 100;
  let skip = 0;
  let allApplications = [];
  let keepFetching = true;

  while (keepFetching) {
    const url = `https://console.jumpcloud.com/api/v2/applications?limit=${limit}&skip=${skip}`;
    const response = await fetch(url, {
      headers: { "x-api-key": API_KEY, Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `JumpCloud API Error: ${response.status} ${response.statusText}`
      );
    }

    const applications = await response.json();

    if (applications && applications.length > 0) {
      allApplications = allApplications.concat(applications);
      skip += limit;
    }

    if (!applications || applications.length < limit) {
      keepFetching = false;
    }
  }

  return allApplications;
};

const syncAllJumpCloudApplications = async () => {
  console.log("Starting JumpCloud application sync...");
  const applications = await fetchAllJumpCloudApplications();
  if (!applications || !applications.length) {
    console.log("No applications found in JumpCloud to sync.");
    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    for (const app of applications) {
      if (!app._id) {
        console.warn(
          `Skipping application with no ID: ${
            app.displayName || "Name not available"
          }`
        );
        continue;
      }

      // Step 1: Sync the raw data to the jumpcloud_applications table (as before)
      await client.query(
        `INSERT INTO jumpcloud_applications (id, display_name, display_label, sso_url, sso, updated_at, description, provision, organization) 
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name, display_label = EXCLUDED.display_label, sso_url = EXCLUDED.sso_url,
            sso = EXCLUDED.sso, updated_at = NOW(), description = EXCLUDED.description, provision = EXCLUDED.provision,
            organization = EXCLUDED.organization;`,
        [
          app._id,
          app.displayName,
          app.displayLabel,
          app.sso?.url,
          app.sso ? JSON.stringify(app.sso) : null,
          app.description,
          app.provision ? JSON.stringify(app.provision) : null,
          app.organization,
        ]
      );

      // ** FIX: Use jumpcloud_app_id as the conflict key, per your suggestion **
      const name =
        app.displayLabel || app.displayName || `JumpCloud App ${app._id}`;
      const category = "SSO";
      const type = "EXTERNAL";
      const integrationMode = "SSO_JUMPCLOUD";
      const jumpcloudAppId = app._id;

      // Step 2: Ensure it exists in managed_applications
      const managedAppResult = await client.query(
        `INSERT INTO managed_applications ("name", "category", "type", "integration_mode", "jumpcloud_app_id")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (jumpcloud_app_id) DO UPDATE SET 
            "name" = EXCLUDED."name", 
            "category" = EXCLUDED."category",
            "type" = EXCLUDED."type",
            "integration_mode" = EXCLUDED."integration_mode",
            "updated_at" = NOW()
         RETURNING id;`,
        [name, category, type, integrationMode, jumpcloudAppId]
      );
      const applicationId = managedAppResult.rows[0].id;

      // Step 3: Ensure its primary instance exists in app_instances
      await client.query(
        `INSERT INTO app_instances (application_id, display_name, is_primary)
         VALUES ($1, $2, true)
         ON CONFLICT (application_id, display_name) DO NOTHING;`,
        [applicationId, name]
      );
    }

    await client.query("COMMIT");
    console.log(
      `Successfully synced and onboarded ${applications.length} JumpCloud applications.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during JumpCloud application sync:", error);
    throw error;
  } finally {
    client.release();
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

const reconcileSsoAccess = async () => {
  const client = await db.pool.connect();
  try {
    console.log(
      "CRON JOB: Starting FINAL JumpCloud SSO access reconciliation..."
    );
    await client.query("BEGIN");

    // Step 1: Build the map of which emails have access to which JumpCloud App IDs.
    const provisionedAccessResult = await client.query(`
      SELECT
        ju.email,
        jab.application_id as jumpcloud_app_id
      FROM jumpcloud_users ju
      JOIN jumpcloud_user_group_members jugm ON ju.id = jugm.user_id
      JOIN jumpcloud_application_bindings jab ON jugm.group_id = jab.group_id
    `);
    const provisionedAccessMap = new Map();
    for (const row of provisionedAccessResult.rows) {
      if (!provisionedAccessMap.has(row.jumpcloud_app_id)) {
        provisionedAccessMap.set(row.jumpcloud_app_id, new Set());
      }
      provisionedAccessMap.get(row.jumpcloud_app_id).add(row.email);
    }

    // Step 2: Get all of our internal apps that have a JumpCloud App ID configured.
    // This query now correctly uses your 'jumpcloud_app_id' column.
    const ssoAppsResult = await client.query(`
      SELECT
        ma.id as managed_application_id,
        ai.id as app_instance_id,
        ma.jumpcloud_app_id
      FROM managed_applications ma
      JOIN app_instances ai ON ma.id = ai.application_id
      WHERE ma.jumpcloud_app_id IS NOT NULL
    `);
    const ssoApps = ssoAppsResult.rows;

    if (ssoApps.length === 0) {
      console.log(
        "CRON JOB: No applications found with a configured 'jumpcloud_app_id'. Skipping SSO reconciliation."
      );
      await client.query("COMMIT");
      return;
    }

    // Step 3: Get all our employees for email-to-ID mapping
    const employeesResult = await client.query(
      "SELECT id, employee_email FROM employees"
    );
    const employeeEmailToIdMap = new Map(
      employeesResult.rows.map((e) => [e.employee_email, e.id])
    );

    // Step 4: Reconcile each app.
    for (const app of ssoApps) {
      const emailsWithAccess =
        provisionedAccessMap.get(app.jumpcloud_app_id) || new Set();
      const employeeIdsWithAccess = new Set();

      for (const email of emailsWithAccess) {
        const employeeId = employeeEmailToIdMap.get(email);
        if (employeeId) {
          employeeIdsWithAccess.add(employeeId);
          await client.query(
            `
            INSERT INTO user_accounts (user_id, app_instance_id, status, last_seen_at)
            VALUES ($1, $2, 'active', NOW())
            ON CONFLICT (user_id, app_instance_id) DO UPDATE SET
               status = 'active',
              last_seen_at = NOW();
            `,
            [employeeId, app.app_instance_id]
          );
        }
      }

      const employeeIdsArray =
        employeeIdsWithAccess.size > 0
          ? Array.from(employeeIdsWithAccess)
          : [0];
      await client.query(
        `
        UPDATE user_accounts
        SET status = 'deactivated'
        WHERE app_instance_id = $1
        AND user_id NOT IN (SELECT unnest($2::int[]));
        `,
        [app.app_instance_id, employeeIdsArray]
      );
    }

    await client.query("COMMIT");
    console.log(
      "CRON JOB: Finished JumpCloud SSO access reconciliation with corrected logic and schema."
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "Error during final JumpCloud SSO access reconciliation:",
      error
    );
    throw error;
  } finally {
    client.release();
  }
};

const syncAllUserLogs = async () => {
  console.log(
    "CRON JOB: Starting JumpCloud log sync (ingesting ALL raw logs)..."
  );
  const client = await db.pool.connect();

  try {
    // Reconciliation Step to link previously unmatched logs
    console.log("CRON JOB: Reconciling previously unmatched logs...");
    const emailUpdateResult = await client.query(`
      UPDATE jumpcloud_logs l SET employee_id = e.id
      FROM employees e
      WHERE l.employee_id IS NULL
      AND e.employee_email = l.details -> 'initiated_by' ->> 'email';
    `);
    const usernameUpdateResult = await client.query(`
      UPDATE jumpcloud_logs l SET employee_id = e.id
      FROM jumpcloud_users ju
      JOIN employees e ON ju.email = e.employee_email
      WHERE l.employee_id IS NULL
      AND ju.username = l.details -> 'initiated_by' ->> 'username';
    `);
    const reconciledCount =
      emailUpdateResult.rowCount + usernameUpdateResult.rowCount;
    if (reconciledCount > 0) {
      console.log(
        `CRON JOB: Successfully linked ${reconciledCount} previously unmatched logs.`
      );
    }

    // Prepare lookup maps
    const employeesResult = await client.query(
      "SELECT id, employee_email FROM employees"
    );
    const emailToEmployeeIdMap = new Map(
      employeesResult.rows.map((e) => [e.employee_email, e.id])
    );

    const jcUsersResult = await client.query(
      "SELECT username, email FROM jumpcloud_users"
    );
    const usernameToEmailMap = new Map(
      jcUsersResult.rows.map((u) => [u.username, u.email])
    );

    // Get last synced timestamp
    const lastLogResult = await client.query(
      "SELECT timestamp FROM jumpcloud_logs ORDER BY timestamp DESC LIMIT 1"
    );

    let startTime;
    if (lastLogResult.rows[0]?.timestamp) {
      startTime = lastLogResult.rows[0].timestamp.toISOString();
    } else {
      startTime = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      console.log(
        "CRON JOB: No previous JumpCloud logs found. Starting sync from 90 days ago."
      );
    }

    let keepFetching = true;
    let searchAfterToken = null;
    let totalIngested = 0;

    await client.query("BEGIN");

    while (keepFetching) {
      const body = {
        service: ["all"],
        sort: "asc",
        limit: 10000,
        start_time: startTime,
        ...(searchAfterToken && { search_after: searchAfterToken }),
      };

      const response = await fetch(
        "https://api.jumpcloud.com/insights/directory/v1/events",
        {
          method: "POST",
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(
          `JumpCloud Events API Error: ${
            response.status
          } ${await response.text()}`
        );
      }

      const resultCount = parseInt(response.headers.get("x-result-count"), 10);
      const limit = parseInt(response.headers.get("x-limit"), 10);
      const searchAfterHeader = response.headers.get("x-search_after");
      const newLogs = await response.json();

      if (newLogs && newLogs.length > 0) {
        const values = [];
        const valuePlaceholders = [];
        let paramIndex = 1;

        for (const log of newLogs) {
          // ** FIX: Skip any log that is missing the essential event_type field **
          if (!log.event_type) {
            console.warn(
              "CRON JOB: Skipping a malformed log from JumpCloud API (missing event_type).",
              log
            );
            continue; // Go to the next log
          }

          let employeeId = null;
          const initiatedBy = log.initiated_by || {};

          if (
            initiatedBy.email &&
            emailToEmployeeIdMap.has(initiatedBy.email)
          ) {
            employeeId = emailToEmployeeIdMap.get(initiatedBy.email);
          } else if (
            initiatedBy.username &&
            usernameToEmailMap.has(initiatedBy.username)
          ) {
            const emailFromUsername = usernameToEmailMap.get(
              initiatedBy.username
            );
            if (emailToEmployeeIdMap.has(emailFromUsername)) {
              employeeId = emailToEmployeeIdMap.get(emailFromUsername);
            }
          }

          values.push(
            employeeId,
            log.event_type,
            log.timestamp,
            log.success,
            log.client_ip,
            JSON.stringify(log)
          );

          const placeholders = [];
          for (let i = 0; i < 6; i++) {
            placeholders.push(`$${paramIndex++}`);
          }
          valuePlaceholders.push(`(${placeholders.join(", ")})`);
        }

        if (values.length > 0) {
          const insertQuery = `
            INSERT INTO jumpcloud_logs (employee_id, event_type, timestamp, success, client_ip, details)
            VALUES ${valuePlaceholders.join(", ")}
          `;
          await client.query(insertQuery, values);
          totalIngested += values.length / 6;
        }

        console.log(
          `CRON JOB: Bulk ingested a page of ${newLogs.length} raw logs. Total so far: ${totalIngested}`
        );
      }

      if (resultCount < limit) {
        keepFetching = false;
      } else {
        searchAfterToken = JSON.parse(searchAfterHeader);
      }
    }

    await client.query("COMMIT");

    console.log(
      `CRON JOB: Sync complete. Successfully ingested a total of ${totalIngested} new raw JumpCloud logs.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      "CRON JOB: Error during JumpCloud log sync. Transaction rolled back.",
      error
    );
    throw error;
  } finally {
    client.release();
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
  reconcileSsoAccess,
  syncAllUserLogs,
};
