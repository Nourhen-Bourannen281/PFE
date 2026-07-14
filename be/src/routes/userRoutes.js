const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const userController = require('../controllers/userController');

// ⚠️ L'ordre des routes est IMPORTANT
// Les routes spécifiques DOIVENT être avant les routes génériques

// Routes spécifiques
router.get('/transporteurs', protect, authorizeRoles('Admin', 'Commercial'), userController.getTransporteurs);

// Routes génériques
router.get('/', protect, authorizeRoles('Admin'), userController.getUsers);
router.get('/:id', protect, authorizeRoles('Admin'), userController.getUserById);
router.post('/', protect, authorizeRoles('Admin'), userController.createUser);
router.put('/:id', protect, authorizeRoles('Admin'), userController.updateUser);
router.delete('/:id', protect, authorizeRoles('Admin'), userController.deleteUser);
router.patch('/:id/activate', protect, authorizeRoles('Admin'), userController.activateUser);
router.patch('/:id/deactivate', protect, authorizeRoles('Admin'), userController.deactivateUser);
router.get('/:id/profile', protect, authorizeRoles('Admin'), userController.getProfile);
router.put('/:id/profile', protect, authorizeRoles('Admin'), userController.updateProfile);
router.post('/:id/change-password', protect, authorizeRoles('Admin'), userController.changePassword);
router.get('/:id/statistics', protect, authorizeRoles('Admin'), userController.getUserStats);
module.exports = router;