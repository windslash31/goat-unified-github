const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");
const { validate } = require("../middleware/validationMiddleware"); // Import the middleware
const { createUserSchema } = require("../schemas/userSchemas"); // Import the schema

const userActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 requests per hour
  message: "Too many requests for this action, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/change-password",
  authenticateToken,
  userController.changePassword
);

router.get(
  "/",
  authenticateToken,
  authorize("admin:view_users"),
  userController.listUsers
);

router.post(
  "/",
  authenticateToken,
  authorize("user:create"),
  validate(createUserSchema), // Apply the validation middleware here
  userController.createUser
);

router.post(
  "/:id/reset-password",
  authenticateToken,
  userActionLimiter,
  authorize("user:reset_password"),
  userController.resetPassword
);
router.put(
  "/:id/role",
  authenticateToken,
  authorize("user:update:role"),
  userController.updateUserRole
);
router.delete(
  "/:id",
  authenticateToken,
  authorize("user:delete"),
  userController.deleteUser
);

router.get(
  "/:id/api-keys",
  authenticateToken,
  authorize("user:manage_api_keys"),
  userController.listApiKeys
);

router.post(
  "/:id/api-keys",
  authenticateToken,
  userActionLimiter,
  authorize("user:manage_api_keys"),
  userController.generateApiKey
);

router.delete(
  "/api-keys/:keyId",
  authenticateToken,
  authorize("user:manage_api_keys"),
  userController.deleteApiKey
);

module.exports = router;
