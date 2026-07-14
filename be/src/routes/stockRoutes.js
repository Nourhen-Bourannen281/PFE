const express = require('express');
const router = express.Router();
const {
  getStock,
  getStockById,
  getStockByProduct,
  createStock,
  updateStock,
  updateStockQuantity,
  deleteStock,
  getStockBas
} = require('../controllers/stockController');

// GET /api/stock - Obtenir tout le stock
router.get('/', getStock);

// GET /api/stock/alertes/bas - Obtenir les alertes de stock bas
router.get('/alertes/bas', getStockBas);

// GET /api/stock/product/:productId - Obtenir stock par produit
router.get('/product/:productId', getStockByProduct);

// GET /api/stock/:id - Obtenir un stock par ID
router.get('/:id', getStockById);

// POST /api/stock - Créer une entrée de stock (Admin seulement)
router.post('/', createStock);

// PUT /api/stock/:id - Mettre à jour le stock complet
router.put('/:id', updateStock);

// PUT /api/stock/:id/quantity - Mettre à jour la quantité (Admin/ Fournisseur)
router.put('/:id/quantity', updateStockQuantity);

// DELETE /api/stock/:id - Supprimer une entrée de stock (Admin seulement)
router.delete('/:id', deleteStock);

module.exports = router;