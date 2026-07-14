// backend/routes/fournisseur.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

// Récupérer les contrats du fournisseur connecté
router.get('/contrats/fournisseur', protect, async (req, res) => {
  try {
    const Contrat = require('../models/Contrat');
    const contrats = await Contrat.find({ fournisseurId: req.user._id })
      .populate('client', 'nom email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: contrats });
  } catch (error) {
    console.error('Erreur contrats fournisseur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Récupérer les livraisons du fournisseur connecté
router.get('/livraisons/fournisseur', protect, async (req, res) => {
  try {
    const Livraison = require('../models/Livraison');
    const livraisons = await Livraison.find({ fournisseurId: req.user._id })
      .populate('commande', 'numeroCommande')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: livraisons });
  } catch (error) {
    console.error('Erreur livraisons fournisseur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Récupérer les factures du fournisseur connecté
router.get('/factures/fournisseur', protect, async (req, res) => {
  try {
    const Facture = require('../models/Facture');
    const factures = await Facture.find({ fournisseurId: req.user._id })
      .populate('commande', 'numeroCommande')
      .sort({ dateEmission: -1 });
    res.json({ success: true, data: factures });
  } catch (error) {
    console.error('Erreur factures fournisseur:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;