const db = require("../config/db");
const { logActivity } = require("./logService");

/**
 * Gets a list of all applications with their license costs and user counts.
 */
const getLicenseData = async () => {
  const query = `
    SELECT
        ia.id,
        ia.name,
        ia.description,
        COALESCE(lc.license_tier, 'STANDARD') as license_tier,
        COALESCE(lc.monthly_cost_decimal, 0.00) as cost_per_seat_monthly,
        COALESCE(lc.currency, 'USD') as currency,
        COUNT(la.id) as assigned_seats
    FROM
        internal_applications ia
    LEFT JOIN
        license_costs lc ON ia.id = lc.application_id
    LEFT JOIN
        license_assignments la ON ia.id = la.application_id
    GROUP BY
        ia.id, ia.name, ia.description, lc.license_tier, lc.monthly_cost_decimal, lc.currency
    ORDER BY
        ia.name;
  `;
  const result = await db.query(query);
  return result.rows;
};

/**
 * Updates the cost for a given application and license tier.
 * @param {number} applicationId The ID of the application.
 * @param {number} cost The new monthly cost per seat.
 * @param {string} tier The license tier (defaults to STANDARD).
 * @param {number} actorId The ID of the user performing the action.
 * @param {object} reqContext The request context for logging.
 */
const updateLicenseCost = async (
  applicationId,
  cost,
  tier = "STANDARD",
  actorId,
  reqContext
) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
        INSERT INTO license_costs (application_id, license_tier, monthly_cost_decimal)
        VALUES ($1, $2, $3)
        ON CONFLICT (application_id, license_tier) DO UPDATE SET
            monthly_cost_decimal = EXCLUDED.monthly_cost_decimal,
            updated_at = NOW()
        RETURNING *;
    `;
    const result = await client.query(query, [applicationId, tier, cost]);

    // Log this action
    await logActivity(
      actorId,
      "LICENSE_COST_UPDATE",
      { applicationId, newCost: cost, licenseTier: tier },
      reqContext,
      client
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateLicenseCost:", error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getLicenseData,
  updateLicenseCost,
};
