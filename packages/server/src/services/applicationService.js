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

const getAllManagedApplications = async () => {
  const query =
    "SELECT id, name, key, integration_mode, is_licensable FROM managed_applications ORDER BY name";
  const result = await db.query(query);
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

module.exports = {
  createApplication,
  updateApplication,
  deleteApplication,
  getAllManagedApplications,
  setApplicationLicensableStatus,
};
