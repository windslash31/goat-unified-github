const db = require("../config/db");

const getLicensesForAccount = async (accountId) => {
  const query = `
        SELECT
            la.id as assignment_id,
            ma.name as application_name,
            ma.category as application_category
        FROM license_assignments la
        JOIN managed_applications ma ON la.application_id = ma.id
        WHERE la.principal_id = $1 AND la.principal_type = 'MANAGED_ACCOUNT'
        ORDER BY ma.name;
    `;
  const result = await db.query(query, [accountId]);
  return result.rows;
};

module.exports = {
  getLicensesForAccount,
};
