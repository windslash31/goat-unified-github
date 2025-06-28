const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

// Protect all user management routes
router.use(authenticateToken);
router.use(authorize('role:manage'));

router.get('/', userController.listUsers);
router.post('/', userController.createUser); // New route to create a user
router.put('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser); // New route to delete a user

module.exports = router;