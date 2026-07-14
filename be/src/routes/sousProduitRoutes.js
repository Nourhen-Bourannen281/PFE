const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const {
  getSousProduits,
  createSousProduit,
  updateSousProduit,
  deleteSousProduit
} = require('../controllers/sousProduitController');

// Routes de lecture - accessibles à Admin ET Commercial (pour voir les produits dans les contrats)
router.get('/', protect, authorizeRoles('Admin', 'Commercial'), getSousProduits);

// Routes d'écriture (création, modification, suppression) - réservées à l'Admin seulement
router.post('/', protect, authorizeRoles('Admin'), createSousProduit);
router.put('/:id', protect, authorizeRoles('Admin'), updateSousProduit);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteSousProduit);

module.exports = router;