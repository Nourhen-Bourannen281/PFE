const express = require('express');
const router = express.Router();
const {
  getTiers,
  getTiersById,
  createTiers,
  updateTiers,
  deleteTiers
} = require('../controllers/tiersController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

router.route('/')
  .get(getTiers)
  .post(authorize('admin'), createTiers);

router.route('/:id')
  .get(getTiersById)
  .put(authorize('admin'), updateTiers)
  .delete(authorize('admin'), deleteTiers);

module.exports = router;