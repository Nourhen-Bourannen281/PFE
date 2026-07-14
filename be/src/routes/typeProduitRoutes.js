const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const {
  getTypeProduits,
  createTypeProduit,
  updateTypeProduit,
  deleteTypeProduit
} = require('../controllers/typeProduitController');

// Toutes les routes du Sprint 2 sont protégées et réservées à l'Admin
router.get('/', protect, authorizeRoles('Admin'), getTypeProduits);
router.post('/', protect, authorizeRoles('Admin'), createTypeProduit);
router.put('/:id', protect, authorizeRoles('Admin'), updateTypeProduit);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteTypeProduit);

module.exports = router;