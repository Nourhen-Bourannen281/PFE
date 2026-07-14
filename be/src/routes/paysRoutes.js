// routes/paysRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  getPays,
  getPaysById,
  createPays,
  updatePays,
  deletePays
} = require('../controllers/paysController');

// Routes protégées avec contrôleurs
router.route('/')
  .get(protect, getPays)           // Tous les utilisateurs authentifiés peuvent voir
  .post(protect, admin, createPays); // Seul l'admin peut créer

router.route('/:id')
  .get(protect, getPaysById)        // Voir un pays spécifique
  .put(protect, admin, updatePays)  // Modifier (admin uniquement)
  .delete(protect, admin, deletePays); // Supprimer (admin uniquement)

module.exports = router;