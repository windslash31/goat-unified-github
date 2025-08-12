const db = require("../config/db");
const { logActivity } = require("./logService");

const getLicenseData = async () => {
  const query = `
      SELECT
          ma.id, ma.name, ma.description, ma.category, ma.type,
          COALESCE(lc.license_tier, 'STANDARD') as license_tier,
          COALESCE(lc.monthly_cost_decimal, 0.00) as cost_per_seat_monthly,
          COALESCE(lc.currency, 'USD') as currency,
          COALESCE(lc.total_seats, 0) as total_seats,
          lc.purchase_date, -- ADD THIS
          lc.renewal_date,   -- ADD THIS
          COUNT(la.id) as assigned_seats
      FROM managed_applications ma
      LEFT JOIN license_costs lc ON ma.id = lc.application_id
      LEFT JOIN license_assignments la ON ma.id = la.application_id
      WHERE ma.is_licensable = TRUE
      GROUP BY ma.id, lc.id -- Group by lc.id to get all fields
      ORDER BY ma.name;
    `;
  const result = await db.query(query);
  return result.rows;
};

const updateLicenseCost = async (data, actorId, reqContext) => {
  const {
    applicationId,
    cost,
    total_seats,
    purchase_date,
    renewal_date,
    tier = "STANDARD",
  } = data;
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
          INSERT INTO license_costs (application_id, license_tier, monthly_cost_decimal, total_seats, purchase_date, renewal_date)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (application_id, license_tier) DO UPDATE SET
              monthly_cost_decimal = EXCLUDED.monthly_cost_decimal,
              total_seats = EXCLUDED.total_seats,
              purchase_date = EXCLUDED.purchase_date,
              renewal_date = EXCLUDED.renewal_date,
              updated_at = NOW()
          RETURNING *;
      `;
    const result = await client.query(query, [
      applicationId,
      tier,
      cost,
      total_seats,
      purchase_date || null,
      renewal_date || null,
    ]);

    // This is the corrected, complete logActivity call
    await logActivity(
      actorId,
      "LICENSE_COST_UPDATE",
      {
        applicationId,
        updatedCost: { cost, total_seats, purchase_date, renewal_date },
      },
      reqContext,
      client
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
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

const getAssignmentsForApplication = async (applicationId) => {
  const query = `
        SELECT
            la.id as assignment_id, -- <<< THIS LINE IS THE FIX
            la.principal_type,
            COALESCE(e.first_name || ' ' || e.last_name, ma.name) as principal_name,
            COALESCE(e.employee_email, ma.account_identifier) as principal_identifier
        FROM license_assignments la
        LEFT JOIN employees e ON la.principal_id = e.id AND la.principal_type = 'EMPLOYEE'
        LEFT JOIN managed_accounts ma ON la.principal_id = ma.id AND la.principal_type = 'MANAGED_ACCOUNT'
        WHERE la.application_id = $1
        ORDER BY principal_name;
    `;
  const result = await db.query(query, [applicationId]);
  return result.rows;
};

module.exports = {
  getLicenseData,
  updateLicenseCost,
  reconcileLicenseAssignments,
  getAssignmentsForApplication,
};
