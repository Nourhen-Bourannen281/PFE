// backend/routes/cabotage.js (version corrigée)
const express = require('express');
const router = express.Router();
const Cabotage = require('../models/Cabotage');
const { protect } = require('../middlewares/authMiddleware');

// GET - Récupérer tous les cabotages
router.get('/', protect, async (req, res) => {
  try {
    const cabotages = await Cabotage.find()
      .populate('produit', 'nom')
      .populate('navireId', 'nom')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: cabotages });
  } catch (error) {
    console.error('Erreur GET cabotage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - Créer un nouveau cabotage
router.post('/', protect, async (req, res) => {
  try {
    const { 
      numeroCabotage, produit, client, quantite, 
      uniteMesure, origine, destination, navireId, 
      dateChargement, dateDechargement, statut 
    } = req.body;

    // Validation
    if (!produit) {
      return res.status(400).json({ success: false, message: 'Le produit est requis' });
    }
    if (!quantite || quantite <= 0) {
      return res.status(400).json({ success: false, message: 'La quantité doit être supérieure à 0' });
    }
    if (!origine) {
      return res.status(400).json({ success: false, message: 'Le port d\'origine est requis' });
    }
    if (!destination) {
      return res.status(400).json({ success: false, message: 'Le port de destination est requis' });
    }
    if (!navireId) {
      return res.status(400).json({ success: false, message: 'Le navire est requis' });
    }

    // Générer un numéro si non fourni
    let finalNumero = numeroCabotage;
    if (!finalNumero) {
      const year = new Date().getFullYear();
      const count = await Cabotage.countDocuments();
      finalNumero = `CAB-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    const cabotage = new Cabotage({
      numeroCabotage: finalNumero,
      produit,
      client: client || 'STIR',
      quantite: parseFloat(quantite),
      uniteMesure: uniteMesure || 'm³',
      origine,
      destination,
      navireId,
      dateChargement: dateChargement || new Date(),
      dateDechargement: dateDechargement || null,
      statut: statut || 'planifie',
      createdBy: req.user._id
    });

    await cabotage.save();
    
    const populatedCabotage = await Cabotage.findById(cabotage._id)
      .populate('produit', 'nom')
      .populate('navireId', 'nom');

    res.status(201).json({ success: true, data: populatedCabotage });
  } catch (error) {
    console.error('Erreur POST cabotage:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce numéro de cabotage existe déjà' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;