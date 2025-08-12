const db = require("../config/db");
const { logActivity } = require("./logService");

const getUnassignedPrincipals = async (applicationId) => {
  const query = `
        SELECT id, name, type FROM (
            SELECT id, first_name || ' ' || last_name as name, 'EMPLOYEE' as type FROM employees WHERE is_active = TRUE
            UNION ALL
            SELECT id, name, 'MANAGED_ACCOUNT' as type FROM managed_accounts WHERE status = 'ACTIVE'
        ) AS principals
        WHERE NOT EXISTS (
            SELECT 1 FROM license_assignments la
            WHERE la.application_id = $1 AND la.principal_id = principals.id AND la.principal_type = principals.type
        )
        ORDER BY name;
    `;
  const result = await db.query(query, [applicationId]);
  return result.rows;
};

const addAssignment = async (
  applicationId,
  principalId,
  principalType,
  actorId,
  reqContext
) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO license_assignments (application_id, principal_id, principal_type, source)
             VALUES ($1, $2, $3, 'MANUAL') RETURNING *`,
      [applicationId, principalId, principalType]
    );

    // Get details for a rich log message
    const appRes = await client.query(
      "SELECT name FROM managed_applications WHERE id = $1",
      [applicationId]
    );
    let principalRes;
    if (principalType === "EMPLOYEE") {
      principalRes = await client.query(
        "SELECT employee_email as identifier FROM employees WHERE id = $1",
        [principalId]
      );
    } else {
      principalRes = await client.query(
        "SELECT account_identifier as identifier FROM managed_accounts WHERE id = $1",
        [principalId]
      );
    }

    const logDetails = {
      applicationName: appRes.rows[0]?.name,
      principalIdentifier: principalRes.rows[0]?.identifier,
      principalType: principalType,
    };

    await logActivity(
      actorId,
      "LICENSE_ASSIGNMENT_CREATE",
      logDetails,
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

const removeAssignment = async (assignmentId, actorId, reqContext) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // First, get the details of the assignment we are about to delete for logging
    const detailsRes = await client.query(
      `SELECT la.principal_type, la.principal_id, ma.name as application_name,
                   COALESCE(e.employee_email, m.account_identifier) as principal_identifier
            FROM license_assignments la
            JOIN managed_applications ma ON la.application_id = ma.id
            LEFT JOIN employees e ON la.principal_id = e.id AND la.principal_type = 'EMPLOYEE'
            LEFT JOIN managed_accounts m ON la.principal_id = m.id AND la.principal_type = 'MANAGED_ACCOUNT'
            WHERE la.id = $1`,
      [assignmentId]
    );

    if (detailsRes.rows.length === 0) {
      throw new Error("Assignment not found.");
    }
    const details = detailsRes.rows[0];

    // Now, delete the assignment
    await client.query("DELETE FROM license_assignments WHERE id = $1", [
      assignmentId,
    ]);

    const logDetails = {
      applicationName: details.application_name,
      principalIdentifier: details.principal_identifier,
      principalType: details.principal_type,
    };

    await logActivity(
      actorId,
      "LICENSE_ASSIGNMENT_DELETE",
      logDetails,
      reqContext,
      client
    );

    await client.query("COMMIT");
    return { message: "Assignment removed successfully." };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { getUnassignedPrincipals, addAssignment, removeAssignment };
