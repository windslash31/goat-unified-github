const pool = require("../../config/db");
const { logActivity } = require("../../services/logService");
const managedAccountService = require("../../services/managedAccountService");

const ACTION_TYPES = {
  MANAGED_ACCOUNT_CREATE: "MANAGED_ACCOUNT_CREATE",
  MANAGED_ACCOUNT_UPDATE: "MANAGED_ACCOUNT_UPDATE",
  MANAGED_ACCOUNT_DELETE: "MANAGED_ACCOUNT_DELETE",
};

const getAllManagedAccounts = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    let searchQuery = "";
    const queryParams = [limit, offset];

    if (search) {
      searchQuery = `
                WHERE ma.name ILIKE $3 OR ma.account_identifier ILIKE $3 OR ma.account_type ILIKE $3
            `;
      queryParams.push(`%${search}%`);
    }

    const result = await pool.query(
      `
            SELECT 
                ma.id, 
                ma.name, 
                ma.account_identifier, 
                ma.account_type, 
                ma.description, 
                ma.owner_employee_id,
                e.first_name AS owner_first_name,
                e.last_name AS owner_last_name, 
                ma.status,
                ma.created_at,
                ma.updated_at
            FROM managed_accounts ma
            LEFT JOIN employees e ON ma.owner_employee_id = e.id
            ${searchQuery}
            ORDER BY ma.name
            LIMIT $1 OFFSET $2
        `,
      queryParams
    );

    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM managed_accounts ma ${searchQuery}`,
      search ? [`%${search}%`] : []
    );

    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(totalResult.rows[0].count, 10),
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching managed accounts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new managed account
// @route   POST /api/managed-accounts
// @access  Private (requires 'managed_account:manage' permission)
const createManagedAccount = async (req, res) => {
  const {
    name,
    account_identifier,
    account_type,
    description,
    owner_employee_id,
    status,
  } = req.body;
  const actorUserId = req.user.id; // from authenticateToken middleware

  try {
    const newAccountResult = await pool.query(
      `
            INSERT INTO managed_accounts (name, account_identifier, account_type, description, owner_employee_id, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
      [
        name,
        account_identifier,
        account_type,
        description,
        owner_employee_id,
        status,
      ]
    );

    const newAccount = newAccountResult.rows[0];

    // ✨ FIX: Log the creation activity
    await logActivity(
      actorUserId,
      ACTION_TYPES.MANAGED_ACCOUNT_CREATE,
      {
        createdAccount: newAccount,
      },
      { ip: req.ip, userAgent: req.get("User-Agent") }
    );

    res.status(201).json(newAccount);
  } catch (error) {
    console.error("Error creating managed account:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "An account with this identifier already exists." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a managed account
// @route   PUT /api/managed-accounts/:id
// @access  Private (requires 'managed_account:manage' permission)
const updateManagedAccount = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    account_identifier,
    account_type,
    description,
    owner_employee_id,
    status,
  } = req.body;
  const actorUserId = req.user.id;

  try {
    // ✨ FIX: Get the state *before* the update for logging
    const beforeUpdateResult = await pool.query(
      "SELECT * FROM managed_accounts WHERE id = $1",
      [id]
    );
    if (beforeUpdateResult.rowCount === 0) {
      return res.status(404).json({ message: "Managed account not found" });
    }
    const beforeState = beforeUpdateResult.rows[0];

    const updatedAccountResult = await pool.query(
      `
            UPDATE managed_accounts
            SET name = $1, account_identifier = $2, account_type = $3, description = $4, owner_employee_id = $5, status = $6
            WHERE id = $7
            RETURNING *
            `,
      [
        name,
        account_identifier,
        account_type,
        description,
        owner_employee_id,
        status,
        id,
      ]
    );

    const afterState = updatedAccountResult.rows[0];

    // ✨ FIX: Log the update activity with before and after states
    await logActivity(
      actorUserId,
      ACTION_TYPES.MANAGED_ACCOUNT_UPDATE,
      {
        accountId: id,
        changes: {
          from: beforeState,
          to: afterState,
        },
      },
      { ip: req.ip, userAgent: req.get("User-Agent") }
    );

    res.json(afterState);
  } catch (error) {
    console.error("Error updating managed account:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "An account with this identifier already exists." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a managed account
// @route   DELETE /api/managed-accounts/:id
// @access  Private (requires 'managed_account:manage' permission)
const deleteManagedAccount = async (req, res) => {
  const { id } = req.params;
  const actorUserId = req.user.id;

  try {
    const accountToDeleteResult = await pool.query(
      "SELECT * FROM managed_accounts WHERE id = $1",
      [id]
    );

    if (accountToDeleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Managed account not found" });
    }
    const deletedAccount = accountToDeleteResult.rows[0];

    await pool.query("DELETE FROM managed_accounts WHERE id = $1", [id]);

    await logActivity(
      actorUserId,
      ACTION_TYPES.MANAGED_ACCOUNT_DELETE,
      {
        deletedAccount,
      },
      { ip: req.ip, userAgent: req.get("User-Agent") }
    );

    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error deleting managed account:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAccountLicenses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const licenses = await managedAccountService.getLicensesForAccount(
      parseInt(id, 10)
    );
    res.json(licenses);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllManagedAccounts,
  createManagedAccount,
  updateManagedAccount,
  deleteManagedAccount,
  getAccountLicenses,
};
