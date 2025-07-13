const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateResource');
const { 
    createRoleSchema, 
    updateRolePermissionsSchema, 
    roleParamsSchema 
} = require('../../utils/schemas/roleSchemas');

router.use(authenticateToken, authorize('admin:view_roles'));

router.get('/with-permissions', roleController.listRolesAndPermissions);
router.get('/permissions', roleController.listAllPermissions);
router.get('/', roleController.listSimpleRoles);

router.post('/', authorize('role:manage'), validate(createRoleSchema), roleController.createRole);
router.put('/:id/permissions', authorize('role:manage'), validate(updateRolePermissionsSchema), roleController.updateRolePermissions);
router.delete('/:id', authorize('role:manage'), validate(roleParamsSchema), roleController.deleteRole);

module.exports = router;