const express = require('express');
const router = express.Router();
const {
  getModesPaiement,
  getModePaiementById,
  createModePaiement,
  updateModePaiement,
  deleteModePaiement
} = require('../controllers/modePaiementController');

// GET /api/modes-paiement - Obtenir tous les modes de paiement
router.get('/', getModesPaiement);

// GET /api/modes-paiement/:id - Obtenir un mode de paiement par ID
router.get('/:id', getModePaiementById);

// POST /api/modes-paiement - Créer un mode de paiement (Admin seulement)
router.post('/', createModePaiement);

// PUT /api/modes-paiement/:id - Mettre à jour un mode de paiement (Admin seulement)
router.put('/:id', updateModePaiement);

// DELETE /api/modes-paiement/:id - Supprimer un mode de paiement (Admin seulement)
router.delete('/:id', deleteModePaiement);

module.exports = router;