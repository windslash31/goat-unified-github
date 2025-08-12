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
  reqContext,
  source = "MANUAL" // Default to 'MANUAL' for UI-driven actions
) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // 1. CHECK FOR DUPLICATES FIRST
    const existingAssignment = await client.query(
      `SELECT id FROM license_assignments WHERE application_id = $1 AND principal_id = $2 AND principal_type = $3`,
      [applicationId, principalId, principalType]
    );

    if (existingAssignment.rows.length > 0) {
      // Throw a specific error that the controller can catch
      throw new Error("This license assignment already exists.");
    }

    // 2. USE THE 'source' PARAMETER IN THE QUERY (THE FIX FOR THE 'MANUAL' BUG)
    const result = await client.query(
      `INSERT INTO license_assignments (application_id, principal_id, principal_type, source)
               VALUES ($1, $2, $3, $4) RETURNING *`,
      [applicationId, principalId, principalType, source] // Use the source parameter here
    );

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

const addAssignmentByName = async (assignmentData, actorId, reqContext) => {
  const { applicationName, principalIdentifier, principalType } =
    assignmentData;

  // 1. Find the application ID from its name
  const appRes = await db.query(
    "SELECT id FROM managed_applications WHERE name ILIKE $1",
    [applicationName]
  );
  if (appRes.rows.length === 0) {
    throw new Error(`Application with name "${applicationName}" not found.`);
  }
  const applicationId = appRes.rows[0].id;

  // 2. Find the principal ID from its identifier and type
  let principalId;
  if (principalType === "EMPLOYEE") {
    const empRes = await db.query(
      "SELECT id FROM employees WHERE employee_email ILIKE $1",
      [principalIdentifier]
    );
    if (empRes.rows.length === 0) {
      throw new Error(
        `Employee with email "${principalIdentifier}" not found.`
      );
    }
    principalId = empRes.rows[0].id;
  } else if (principalType === "MANAGED_ACCOUNT") {
    const accRes = await db.query(
      "SELECT id FROM managed_accounts WHERE account_identifier ILIKE $1",
      [principalIdentifier]
    );
    if (accRes.rows.length === 0) {
      throw new Error(
        `Managed Account with identifier "${principalIdentifier}" not found.`
      );
    }
    principalId = accRes.rows[0].id;
  } else {
    throw new Error(
      `Invalid principalType: "${principalType}". Must be EMPLOYEE or MANAGED_ACCOUNT.`
    );
  }

  // 3. Call the existing ID-based function to create the assignment
  return addAssignment(
    applicationId,
    principalId,
    principalType,
    actorId,
    reqContext,
    "API"
  );
};

module.exports = {
  getUnassignedPrincipals,
  addAssignment,
  removeAssignment,
  addAssignmentByName, // Export the new function
};
