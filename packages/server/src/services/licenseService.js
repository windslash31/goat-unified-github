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

module.exports = {
  getLicensesForApplication,
  addLicenseToApplication,
};
