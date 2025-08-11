const db = require("../config/db");
const { logActivity } = require("./logService");

/**
 * Gets a list of all managed applications with their license costs and user counts.
 */
const getLicenseData = async () => {
  const query = `
    SELECT
        ma.id,
        ma.name,
        ma.description,
        ma.category,
        COALESCE(lc.license_tier, 'STANDARD') as license_tier,
        COALESCE(lc.monthly_cost_decimal, 0.00) as cost_per_seat_monthly,
        COALESCE(lc.currency, 'USD') as currency,
        COALESCE(lc.total_seats, 0) as total_seats, -- Fetch the new total_seats column
        COUNT(la.id) as assigned_seats
    FROM
        managed_applications ma -- Use the new unified applications table
    LEFT JOIN
        license_costs lc ON ma.id = lc.application_id
    LEFT JOIN
        license_assignments la ON ma.id = la.application_id
    GROUP BY
        ma.id, ma.name, ma.description, ma.category, lc.license_tier, lc.monthly_cost_decimal, lc.currency, lc.total_seats
    ORDER BY
        ma.name;
  `;
  const result = await db.query(query);
  return result.rows;
};

/**
 * Updates the cost and total seats for a given application.
 */
const updateLicenseCost = async (
  applicationId,
  cost,
  total_seats,
  tier = "STANDARD",
  actorId,
  reqContext
) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
        INSERT INTO license_costs (application_id, license_tier, monthly_cost_decimal, total_seats)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (application_id, license_tier) DO UPDATE SET
            monthly_cost_decimal = EXCLUDED.monthly_cost_decimal,
            total_seats = EXCLUDED.total_seats,
            updated_at = NOW()
        RETURNING *;
    `;
    const result = await client.query(query, [
      applicationId,
      tier,
      cost,
      total_seats,
    ]);

    await logActivity(
      actorId,
      "LICENSE_COST_UPDATE",
      {
        applicationId,
        newCost: cost,
        newTotalSeats: total_seats,
        licenseTier: tier,
      },
      reqContext,
      client
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateLicenseCost:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reconciles license assignments for a given application based on a list of licensed emails.
 * This is the core of the automation.
 * @param {number} applicationId The ID of the application from managed_applications.
 * @param {string[]} licensedUserEmails An array of emails that are currently licensed according to the platform's API.
 * @param {object} client The database client, to run inside a transaction.
 */
const reconcileLicenseAssignments = async (
  applicationId,
  licensedUserEmails,
  client
) => {
  // Step 1: Get the employee IDs for the licensed emails
  const employeeRes = await client.query(
    "SELECT id FROM employees WHERE employee_email = ANY($1::text[])",
    [licensedUserEmails]
  );
  const licensedEmployeeIds = employeeRes.rows.map((emp) => emp.id);

  // Step 2: Delete assignments for employees who are no longer licensed
  await client.query(
    `DELETE FROM license_assignments
         WHERE application_id = $1
         AND employee_id NOT IN (SELECT unnest($2::int[]))`,
    [applicationId, licensedEmployeeIds]
  );

  // Step 3: Insert new assignments for employees who are now licensed (ignoring conflicts for existing ones)
  if (licensedEmployeeIds.length > 0) {
    await client.query(
      `INSERT INTO license_assignments (employee_id, application_id, source)
             SELECT unnest($1::int[]), $2, 'AUTOMATED_SYNC'
             ON CONFLICT (employee_id, application_id) DO NOTHING`,
      [licensedEmployeeIds, applicationId]
    );
  }
  console.log(
    `Reconciled ${licensedEmployeeIds.length} licenses for application ID ${applicationId}.`
  );
};

module.exports = {
  getLicenseData,
  updateLicenseCost,
  reconcileLicenseAssignments,
};
