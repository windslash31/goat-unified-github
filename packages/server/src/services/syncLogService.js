const db = require("../config/db");

const startJob = async (jobName, client = db) => {
  await client.query(
    `UPDATE sync_jobs 
     SET status = 'RUNNING', last_run_at = NOW(), progress = 0, current_step = 'Starting sync...', details = null
     WHERE job_name = $1`,
    [jobName]
  );
};

const updateProgress = async (jobName, step, progress, client = db) => {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  await client.query(
    `UPDATE sync_jobs SET current_step = $1, progress = $2 WHERE job_name = $3`,
    [step, safeProgress, jobName]
  );
};

const finishJob = async (jobName, status, error = null, client = db) => {
  const finalStatus = status.toUpperCase();
  const details = error ? { error: error.message, stack: error.stack } : null;

  let query = `UPDATE sync_jobs SET status = $1, progress = 100, current_step = $2, details = $3, `;
  if (finalStatus === "SUCCESS") {
    query += `last_success_at = NOW() `;
  } else {
    query += `last_failure_at = NOW() `;
  }
  query += `WHERE job_name = $1`;

  await client.query(query, [
    jobName,
    `Finished with status: ${finalStatus}`,
    details,
  ]);
};

const getAllJobStatuses = async () => {
  const result = await db.query("SELECT * FROM sync_jobs");
  return result.rows;
};

module.exports = {
  startJob,
  updateProgress,
  finishJob,
  getAllJobStatuses,
};
