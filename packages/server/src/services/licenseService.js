const db = require("../config/db");

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

    // Find an available license pool for the given application and tier name
    const availableLicenseQuery = `
      SELECT l.id
      FROM licenses l
      LEFT JOIN (
          SELECT license_id, COUNT(*) as assigned_seats
          FROM license_assignments
          GROUP BY license_id
      ) la ON l.id = la.license_id
      WHERE l.application_id = $1 AND l.tier_name = $2
        AND (l.is_unlimited = TRUE OR COALESCE(la.assigned_seats, 0) < l.total_seats)
      ORDER BY l.id -- Find the first available pool
      LIMIT 1;
    `;
    const licenseRes = await client.query(availableLicenseQuery, [
      applicationId,
      tierName,
    ]);

    if (licenseRes.rows.length === 0) {
      throw new Error(
        `No available seats found for license tier "${tierName}".`
      );
    }
    const licenseId = licenseRes.rows[0].id;

    // Assign the employee to the found license pool
    const insertQuery = `
      INSERT INTO license_assignments (employee_id, license_id)
      VALUES ($1, $2)
      ON CONFLICT (employee_id, license_id) DO NOTHING
      RETURNING id;
    `;
    const assignmentResult = await client.query(insertQuery, [
      employeeId,
      licenseId,
    ]);

    await logActivity(
      actorId,
      "LICENSE_ASSIGNMENT_CREATE",
      {
        targetEmployeeId: employeeId,
        details: { applicationId, tierName, licenseId },
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

// --- ADD NEW FUNCTION ---
const removeLicenseAssignment = async (assignmentId, actorId, reqContext) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const deletedAssignment = await client.query(
      `DELETE FROM license_assignments WHERE id = $1 RETURNING *`,
      [assignmentId]
    );

    if (deletedAssignment.rows.length === 0) {
      throw new Error("License assignment not found.");
    }

    await logActivity(
      actorId,
      "LICENSE_ASSIGNMENT_DELETE",
      {
        targetEmployeeId: deletedAssignment.rows[0].employee_id,
        details: { assignment: deletedAssignment.rows[0] },
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
