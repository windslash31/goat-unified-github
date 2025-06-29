const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

router.post('/change-password', authenticateToken, userController.changePassword);

router.post('/:id/reset-password', authenticateToken, authorize('user:reset_password'), userController.resetPassword);

// Apply middleware individually to each route for clarity and safety
router.get('/', authenticateToken, authorize('role:manage'), userController.listUsers);
router.post('/', authenticateToken, authorize('user:create'), userController.createUser);
router.put('/:id/role', authenticateToken, authorize('user:update:role'), userController.updateUserRole);
router.delete('/:id', authenticateToken, authorize('user:delete'), userController.deleteUser);

module.exports = router;