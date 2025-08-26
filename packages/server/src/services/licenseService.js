const db = require("../config/db");
const { logActivity } = require("./logService");

const getLicensesForApplication = async (applicationId) => {
  const result = await db.query(
    `SELECT * FROM licenses WHERE application_id = $1 ORDER BY tier_name`,
    [applicationId]
  );
  return result.rows;
};

const addLicenseToApplication = async (applicationId, licenseData) => {
  const { tier_name, monthly_cost, currency, total_seats, is_unlimited } =
    licenseData;
  const result = await db.query(
    `INSERT INTO licenses (application_id, tier_name, monthly_cost, currency, total_seats, is_unlimited)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (application_id, tier_name) DO UPDATE SET
        monthly_cost = EXCLUDED.monthly_cost,
        currency = EXCLUDED.currency,
        total_seats = EXCLUDED.total_seats,
        is_unlimited = EXCLUDED.is_unlimited,
        updated_at = NOW()
     RETURNING *;`,
    [
      applicationId,
      tier_name,
      monthly_cost,
      currency,
      total_seats,
      is_unlimited,
    ]
  );
  return result.rows[0];
};

const assignLicenseToEmployee = async (
  employeeId,
  applicationId,
  tierName,
  actorId,
  reqContext
) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // FIX #1: Convert all incoming string IDs to numbers at the start.
    const numericEmployeeId = parseInt(employeeId, 10);
    const numericApplicationId = parseInt(applicationId, 10);

    if (isNaN(numericEmployeeId) || isNaN(numericApplicationId)) {
      throw new Error("Invalid Employee or Application ID format.");
    }

    let availableLicenseQuery = `
        SELECT l.id FROM licenses l
        LEFT JOIN (SELECT license_id, COUNT(*) as assigned_seats FROM license_assignments GROUP BY license_id) la 
        ON l.id = la.license_id
        WHERE l.application_id = $1 AND (l.is_unlimited = TRUE OR COALESCE(la.assigned_seats, 0) < l.total_seats)
      `;
    // FIX #2: Use the numeric ID in the query parameters.
    const queryParams = [numericApplicationId];

    if (tierName) {
      queryParams.push(tierName);
      availableLicenseQuery += ` AND l.tier_name = $2`;
    }
    availableLicenseQuery += ` ORDER BY l.id LIMIT 1;`;

    const licenseRes = await client.query(availableLicenseQuery, queryParams);
    if (licenseRes.rows.length === 0) {
      const errorMessage = tierName
        ? `No available seats found for license tier "${tierName}".`
        : "No available seats found for this application.";
      throw new Error(errorMessage);
    }
    const licenseId = licenseRes.rows[0].id;

    const instanceRes = await client.query(
      `SELECT id FROM app_instances WHERE application_id = $1 AND is_primary = true LIMIT 1`,
      [numericApplicationId]
    );
    if (instanceRes.rows.length === 0) {
      throw new Error(
        "Could not find a primary instance for this application."
      );
    }
    const appInstanceId = instanceRes.rows[0].id;

    const actorRes = await client.query(
      "SELECT email FROM users WHERE id = $1",
      [actorId]
    );
    const actorEmail = actorRes.rows[0]?.email || "Unknown";
    const sourceDetails = JSON.stringify({
      source: "UI Assignment",
      actor: actorEmail,
      timestamp: new Date().toISOString(),
    });

    await client.query(
      `INSERT INTO user_accounts (user_id, app_instance_id, status, last_seen_at)
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (user_id, app_instance_id) DO UPDATE SET
            status = 'active',
            last_seen_at = NOW();`,
      [numericEmployeeId, appInstanceId]
    );
    const insertQuery = `INSERT INTO license_assignments (employee_id, license_id) VALUES ($1, $2) ON CONFLICT (employee_id, license_id) DO NOTHING RETURNING id;`;
    const assignmentResult = await client.query(insertQuery, [
      numericEmployeeId,
      licenseId,
    ]);

    // FIX #3: Use the numeric ID to guarantee the name lookup works.
    const appRes = await client.query(
      "SELECT name FROM managed_applications WHERE id = $1",
      [numericApplicationId]
    );
    const applicationName = appRes.rows[0]?.name || "Unknown Application";

    await logActivity(
      actorId,
      "LICENSE_ASSIGNMENT_CREATE",
      {
        targetEmployeeId: numericEmployeeId,
        details: {
          applicationName: applicationName,
          tierName: tierName || "Any Available",
          licenseId,
        },
      },
      reqContext,
      client
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: "License assigned successfully.",
      assignment: assignmentResult.rows[0],
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const removeLicenseAssignment = async (assignmentId, actorId, reqContext) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch details for logging BEFORE deleting (This part is correct)
    const detailsRes = await client.query(
      `
      SELECT la.employee_id, l.tier_name, ma.name as application_name
      FROM license_assignments la
      JOIN licenses l ON la.license_id = l.id
      JOIN managed_applications ma ON l.application_id = ma.id
      WHERE la.id = $1
  `,
      [assignmentId]
    );

    if (detailsRes.rows.length === 0) {
      throw new Error("License assignment not found.");
    }
    const { employee_id, tier_name, application_name } = detailsRes.rows[0];

    // 2. Delete the record
    await client.query(`DELETE FROM license_assignments WHERE id = $1`, [
      assignmentId,
    ]);

    // 3. THIS IS THE CORRECTED PART: Use the variables fetched above for the log.
    await logActivity(
      actorId,
      "LICENSE_ASSIGNMENT_DELETE",
      {
        targetEmployeeId: employee_id,
        details: { applicationName: application_name, tierName: tier_name },
      },
      reqContext,
      client
    );

    await client.query("COMMIT");
    return { success: true, message: "License assignment removed." };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
module.exports = {
  getLicensesForApplication,
  addLicenseToApplication,
  assignLicenseToEmployee,
  removeLicenseAssignment,
};
