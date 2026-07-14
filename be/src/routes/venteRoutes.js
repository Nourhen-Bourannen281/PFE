const express = require('express');
const router = express.Router();
const Vente = require('../models/Vente');
const { protectRoute } = require('../middlewares/authMiddleware');

// GET toutes les ventes
router.get('/', protectRoute, async (req, res) => {
  try {
    const ventes = await Vente.find().populate('produit', 'nom unite');
    res.json({ success: true, data: ventes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET vente par ID
router.get('/:id', protectRoute, async (req, res) => {
  try {
    const vente = await Vente.findById(req.params.id).populate('produit');
    if (!vente) return res.status(404).json({ message: 'Vente non trouvée' });
    res.json({ success: true, data: vente });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST créer une vente
router.post('/', protectRoute, async (req, res) => {
  try {
    const { numeroVente, produit, quantite, prixUnitaire } = req.body;
    
    if (!numeroVente || !produit || !quantite || !prixUnitaire) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const vente = await Vente.create({
      ...req.body,
      montantTotal: quantite * prixUnitaire
    });
    
    const populatedVente = await Vente.findById(vente._id).populate('produit');
    res.status(201).json({ success: true, data: populatedVente });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT modifier une vente
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const vente = await Vente.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('produit');
    
    if (!vente) return res.status(404).json({ message: 'Vente non trouvée' });
    res.json({ success: true, data: vente });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE supprimer une vente
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const vente = await Vente.findByIdAndDelete(req.params.id);
    if (!vente) return res.status(404).json({ message: 'Vente non trouvée' });
    res.json({ success: true, message: 'Vente supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;