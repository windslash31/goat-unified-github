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

const reconcileLicenseAssignments = async (
  applicationId,
  licensedUserEmails,
  client
) => {
  if (!licensedUserEmails || licensedUserEmails.length === 0) {
    await client.query(
      "DELETE FROM license_assignments WHERE application_id = $1",
      [applicationId]
    );
    console.log(
      `No licensed users found for application ID ${applicationId}. Cleared all assignments.`
    );
    return;
  }

  // Step 1: Find all possible matching principals (both employees and managed accounts)
  const employeeRes = await client.query(
    "SELECT id, employee_email as email FROM employees WHERE employee_email = ANY($1::text[])",
    [licensedUserEmails]
  );
  const managedAccountRes = await client.query(
    "SELECT id, account_identifier as email FROM managed_accounts WHERE account_identifier = ANY($1::text[])",
    [licensedUserEmails]
  );

  // Step 2: Create a map of email -> { id, type } for easy lookup
  const principalMap = new Map();
  employeeRes.rows.forEach((e) =>
    principalMap.set(e.email, { id: e.id, type: "EMPLOYEE" })
  );
  managedAccountRes.rows.forEach((m) =>
    principalMap.set(m.email, { id: m.id, type: "MANAGED_ACCOUNT" })
  );

  // Step 3: Delete all old assignments for this application
  await client.query(
    "DELETE FROM license_assignments WHERE application_id = $1",
    [applicationId]
  );

  // Step 4: Prepare the new assignments
  const insertValues = licensedUserEmails
    .map((email) => {
      const principal = principalMap.get(email);
      // Only create an assignment if we found a matching principal in our DB
      if (principal) {
        return {
          application_id: applicationId,
          principal_id: principal.id,
          principal_type: principal.type,
          source: "AUTOMATED_SYNC",
        };
      }
      return null;
    })
    .filter(Boolean); // Filter out any nulls

  if (insertValues.length > 0) {
    const values = insertValues.map((v) => [
      v.application_id,
      v.principal_id,
      v.principal_type,
      v.source,
    ]);
    const query = `
            INSERT INTO license_assignments (application_id, principal_id, principal_type, source)
            SELECT * FROM unnest($1::int[], $2::int[], $3::varchar[], $4::text[])
        `;
    const columns = [
      values.map((v) => v[0]),
      values.map((v) => v[1]),
      values.map((v) => v[2]),
      values.map((v) => v[3]),
    ];
    await client.query(query, columns);
  }

  console.log(
    `Reconciled ${insertValues.length} licenses for application ID ${applicationId}.`
  );
};

module.exports = {
  getLicenseData,
  updateLicenseCost,
  reconcileLicenseAssignments,
};
