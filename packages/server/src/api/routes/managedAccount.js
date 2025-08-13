const express = require("express");
const router = express.Router();
const managedAccountController = require("../controllers/managedAccountController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

// @route   GET /api/managed-accounts
// @desc    Get all managed accounts
// @access  Private (Requires 'managed_account:manage' permission)
router.get(
  "/",
  authenticateToken,
  authorize("managed_account:manage"),
  managedAccountController.getAllManagedAccounts
);

router.get(
  "/:id/licenses",
  authenticateToken,
  authorize("managed_account:manage"), // Reuse existing permission
  managedAccountController.getAccountLicenses
);

// @route   POST /api/managed-accounts
// @desc    Create a new managed account
// @access  Private (Requires 'managed_account:manage' permission)
router.post(
  "/",
  authenticateToken,
  authorize("managed_account:manage"),
  managedAccountController.createManagedAccount
);

// @route   PUT /api/managed-accounts/:id
// @desc    Update a specific managed account
// @access  Private (Requires 'managed_account:manage' permission)
router.put(
  "/:id",
  authenticateToken,
  authorize("managed_account:manage"),
  managedAccountController.updateManagedAccount
);

// @route   DELETE /api/managed-accounts/:id
// @desc    Delete a specific managed account
// @access  Private (Requires 'managed_account:manage' permission)
router.delete(
  "/:id",
  authenticateToken,
  authorize("managed_account:manage"),
  managedAccountController.deleteManagedAccount
);

router.get(
  "/:id/platform-statuses",
  authenticateToken,
  authorize("managed_account:manage"),
  managedAccountController.getAccountPlatformStatuses
);

router.get(
  "/:id/application-access",
  authenticateToken,
  authorize("managed_account:manage"),
  managedAccountController.getAccountApplicationAccess
);

module.exports = router;
