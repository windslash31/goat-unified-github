const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorize } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");
const validate = require("../middleware/validateResource");
const {
  createUserSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  userParamsSchema,
  generateApiKeySchema,
  apiKeyParamsSchema,
} = require("../../utils/schemas/userSchemas");

const userActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 requests per hour for these sensitive actions
  message: "Too many requests for this action, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/change-password",
  authenticateToken,
  validate(changePasswordSchema),
  userController.changePassword
);

router.get("/", authenticateToken, authorize("admin:view_users"), userController.listUsers);

router.post(
  "/",
  authenticateToken,
  authorize("user:create"),
  validate(createUserSchema),
  userController.createUser
);

router.post(
  "/:id/reset-password",
  authenticateToken,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 15 }),
  authorize("user:reset_password"),
  validate(userParamsSchema),
  userController.resetPassword
);

router.put(
  "/:id/role",
  authenticateToken,
  authorize("user:update:role"),
  validate(updateUserRoleSchema),
  userController.updateUserRole
);

router.delete(
  "/:id",
  authenticateToken,
  authorize("user:delete"),
  validate(userParamsSchema),
  userController.deleteUser
);

// api keys management
router.get(
  "/:id/api-keys",
  authenticateToken,
  authorize("user:manage_api_keys"),
  validate(userParamsSchema),
  userController.listApiKeys
);

router.post(
  "/:id/api-keys",
  authenticateToken,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 15 }),
  authorize("user:manage_api_keys"),
  validate(generateApiKeySchema),
  userController.generateApiKey
);

router.delete(
  "/api-keys/:keyId",
  authenticateToken,
  authorize("user:manage_api_keys"),
  validate(apiKeyParamsSchema),
  userController.deleteApiKey
);

module.exports = router;