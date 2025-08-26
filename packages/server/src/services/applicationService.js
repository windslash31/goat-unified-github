const db = require("../config/db");

const createApplication = async (name) => {
  const result = await db.query(
    "INSERT INTO internal_applications (name) VALUES ($1) RETURNING *",
    [name]
  );
  return result.rows[0];
};

const updateApplication = async (id, name) => {
  const result = await db.query(
    "UPDATE internal_applications SET name = $1 WHERE id = $2 RETURNING *",
    [name, id]
  );
  if (result.rows.length === 0) {
    throw new Error("Application not found.");
  }
  return result.rows[0];
};

const deleteApplication = async (id) => {
  const result = await db.query(
    "DELETE FROM internal_applications WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Application not found.");
  }
  return { message: "Application deleted successfully." };
};

const getAllManagedApplications = async (filters = {}) => {
  let query =
    "SELECT id, name, key, integration_mode, is_licensable FROM managed_applications";
  const queryParams = [];

  if (filters.is_licensable) {
    query += " WHERE is_licensable = $1";
    queryParams.push(filters.is_licensable);
  }

  query += " ORDER BY name";

  const result = await db.query(query, queryParams);
  return result.rows;
};

// ** NEW FUNCTION to toggle the licensable status **
const setApplicationLicensableStatus = async (appId, isLicensable) => {
  const result = await db.query(
    "UPDATE managed_applications SET is_licensable = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [isLicensable, appId]
  );
  if (result.rows.length === 0) {
    throw new Error("Application not found.");
  }
  // If we are marking it as non-licensable, we should also remove any existing license tiers.
  if (!isLicensable) {
    await db.query("DELETE FROM licenses WHERE application_id = $1", [appId]);
  }
  return result.rows[0];
};

const onboardApplication = async (appData) => {
  const { name, key, integration_mode, jumpcloud_app_id = null } = appData;
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Step A: Insert the main record into the managed_applications table
    const managedAppQuery = `
      INSERT INTO managed_applications (name, key, integration_mode, jumpcloud_app_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, key, integration_mode, is_licensable;
    `;
    const managedAppResult = await client.query(managedAppQuery, [
      name,
      key,
      integration_mode,
      jumpcloud_app_id,
    ]);

    const newApplication = managedAppResult.rows[0];

    // Step B: Create a default "primary" instance for the new application
    const appInstanceQuery = `
      INSERT INTO app_instances (application_id, display_name, is_primary)
      VALUES ($1, $2, true);
    `;
    await client.query(appInstanceQuery, [
      newApplication.id,
      newApplication.name,
    ]);

    await client.query("COMMIT");
    return newApplication;
  } catch (err) {
    await client.query("ROLLBACK");
    // Provide a user-friendly error if the name or key already exists
    if (err.code === "23505") {
      // PostgreSQL unique violation error code
      if (err.constraint.includes("managed_applications_key_key")) {
        throw new Error(`An application with the key "${key}" already exists.`);
      }
      if (err.constraint.includes("managed_applications_name_key")) {
        throw new Error(
          `An application with the name "${name}" already exists.`
        );
      }
    }
    throw err;
  } finally {
    client.release();
  }
};

// 2. ADD the new function to the exports
module.exports = {
  createApplication,
  updateApplication,
  deleteApplication,
  getAllManagedApplications,
  setApplicationLicensableStatus,
  onboardApplication,
};
