const express = require('express');
const router = express.Router();
const {
  getBanques,
  getBanqueById,
  createBanque,
  updateBanque,
  deleteBanque
} = require('../controllers/banqueController');

// Routes
// GET /api/banques - Obtenir toutes les banques
router.get('/', getBanques);

// GET /api/banques/:id - Obtenir une banque par ID
router.get('/:id', getBanqueById);

// POST /api/banques - Créer une banque (Admin seulement)
router.post('/', createBanque);

// PUT /api/banques/:id - Mettre à jour une banque (Admin seulement)
router.put('/:id', updateBanque);

// DELETE /api/banques/:id - Supprimer une banque (Admin seulement)
router.delete('/:id', deleteBanque);

module.exports = router;