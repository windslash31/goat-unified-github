const db = require("../config/db");
const googleService = require("./googleService");
const slackService = require("./slackService");
const atlassianService = require("./atlassianService");
const jumpcloudService = require("./jumpcloudService");

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

const getPlatformStatusesForAccount = async (accountId) => {
  const accountRes = await db.query(
    "SELECT account_identifier FROM managed_accounts WHERE id = $1",
    [accountId]
  );
  if (accountRes.rows.length === 0) {
    throw new Error("Managed account not found.");
  }
  const identifier = accountRes.rows[0].account_identifier;

  const promises = [
    googleService.getUserStatus(identifier),
    slackService.getUserStatus(identifier),
    atlassianService.getUserStatus(identifier),
    jumpcloudService.getUserStatus(identifier),
  ];

  const results = await Promise.allSettled(promises);
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value)
    .filter(Boolean);
};

// --- NEW FUNCTION ---
const getApplicationAccessForAccount = async (accountId) => {
  const accountRes = await db.query(
    "SELECT account_identifier FROM managed_accounts WHERE id = $1",
    [accountId]
  );
  if (accountRes.rows.length === 0) {
    throw new Error("Managed account not found.");
  }
  const identifier = accountRes.rows[0].account_identifier;

  try {
    const atlassianUser = await atlassianService.getJiraUserByEmail(identifier);
    if (!atlassianUser) return { atlassian: null, jumpcloud: [] };

    const atlassianAccess =
      await atlassianService.getAtlassianAccessByAccountId(
        atlassianUser.account_id
      );
    const jumpcloudRes = await db.query(
      `SELECT DISTINCT ja.* FROM jumpcloud_applications ja JOIN jumpcloud_application_bindings jab ON ja.id = jab.application_id JOIN jumpcloud_user_group_members jugm ON jab.group_id = jugm.group_id JOIN jumpcloud_users ju ON jugm.user_id = ju.id WHERE ju.email = $1;`,
      [identifier]
    );

    return {
      accessData: {
        atlassian: atlassianAccess,
        jumpcloud: jumpcloudRes.rows,
      },
    };
  } catch (error) {
    console.error(
      "Error fetching application access for managed account:",
      error
    );
    throw error;
  }
};

module.exports = {
  getLicensesForAccount,
  getPlatformStatusesForAccount,
  getApplicationAccessForAccount,
};
