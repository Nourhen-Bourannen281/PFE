const express = require('express');
const router = express.Router();
const {
  getNavires,
  getNavireById,
  createNavire,
  updateNavire,
  deleteNavire
} = require('../controllers/navireController');

// GET /api/navires - Obtenir tous les navires
router.get('/', getNavires);

// GET /api/navires/:id - Obtenir un navire par ID
router.get('/:id', getNavireById);

// POST /api/navires - Créer un navire (Admin seulement)
router.post('/', createNavire);

// PUT /api/navires/:id - Mettre à jour un navire (Admin seulement)
router.put('/:id', updateNavire);

// DELETE /api/navires/:id - Supprimer un navire (Admin seulement)
router.delete('/:id', deleteNavire);

module.exports = router;