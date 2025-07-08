const db = require("../config/db");

const getAllApplications = async () => {
  const result = await db.query(
    "SELECT id, name FROM internal_applications ORDER BY name"
  );
  return result.rows;
};

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

module.exports = {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
};
