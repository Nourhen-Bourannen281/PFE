// backend/routes/portRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPorts,
  getPortById,
  createPort,
  updatePort,
  deletePort,
  togglePortStatus
} = require('../controllers/portController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes CRUD
router.route('/')
  .get(getPorts)
  .post(authorize('admin'), createPort);

router.route('/:id')
  .get(getPortById)
  .put(authorize('admin'), updatePort)
  .delete(authorize('admin'), deletePort);

// Route pour activer/désactiver
router.patch('/:id/toggle', authorize('admin'), togglePortStatus);

module.exports = router;