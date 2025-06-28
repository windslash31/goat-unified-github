const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorize('role:manage'));

router.get('/with-permissions', roleController.listRolesAndPermissions);
router.get('/permissions', roleController.listAllPermissions);
router.get('/', roleController.listSimpleRoles);
router.post('/', roleController.createRole);
router.put('/:id/permissions', roleController.updateRolePermissions);
router.delete('/:id', roleController.deleteRole);

module.exports = router;