const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

router.use(authenticateToken, authorize("admin:view_roles"));

router.get("/with-permissions", roleController.listRolesAndPermissions);
router.get("/permissions", roleController.listAllPermissions);
router.get("/", roleController.listSimpleRoles);
router.post("/", authorize("role:manage"), roleController.createRole);
router.put(
  "/:id/permissions",
  authorize("role:manage"),
  roleController.updateRolePermissions
);
router.delete("/:id", authorize("role:manage"), roleController.deleteRole);

module.exports = router;
