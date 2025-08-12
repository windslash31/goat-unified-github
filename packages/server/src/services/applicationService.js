// packages/server/src/services/applicationService.js

const db = require("../config/db");
const { logActivity } = require("./logService");

const getAllApplications = async () => {
  const result = await db.query(
    "SELECT * FROM managed_applications ORDER BY name"
  );
  return result.rows;
};

const createApplication = async (appData, actorId, reqContext) => {
  const { name, description, category, type, is_licensable } = appData;

  const result = await db.query(
    "INSERT INTO managed_applications (name, description, category, type, is_licensable) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [name, description, category, type, is_licensable]
  );

  const newApp = result.rows[0];
  await logActivity(
    actorId,
    "APPLICATION_CREATE",
    { createdApplication: newApp },
    reqContext
  );
  return newApp;
};

const updateApplication = async (id, appData, actorId, reqContext) => {
  // --- FIX: Added 'is_licensable' to the destructuring ---
  const { name, description, category, type, is_licensable } = appData;

  // --- FIX: Added is_licensable to the UPDATE query ---
  const result = await db.query(
    "UPDATE managed_applications SET name = $1, description = $2, category = $3, type = $4, is_licensable = $5 WHERE id = $6 RETURNING *",
    [name, description, category, type, is_licensable, id]
  );

  if (result.rows.length === 0) throw new Error("Application not found.");
  const updatedApp = result.rows[0];
  await logActivity(
    actorId,
    "APPLICATION_UPDATE",
    { updatedApplication: updatedApp },
    reqContext
  );
  return updatedApp;
};

const deleteApplication = async (id, actorId, reqContext) => {
  const result = await db.query(
    "DELETE FROM managed_applications WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rows.length === 0) throw new Error("Application not found.");
  const deletedApp = result.rows[0];
  await logActivity(
    actorId,
    "APPLICATION_DELETE",
    { deletedApplication: deletedApp },
    reqContext
  );
  return { message: "Application deleted successfully." };
};

module.exports = {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
};
