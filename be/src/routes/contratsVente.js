const express = require('express');
const router = express.Router();
const ContratVente = require('../models/ContratVente');
const { protectRoute } = require('../middlewares/authMiddleware');

// GET tous les contrats
router.get('/', protectRoute, async (req, res) => {
  try {
    const contrats = await ContratVente.find()
      .populate('produit', 'nom type unite prixUnitaire')
      .populate('client', 'nom email raisonSociale');
    res.json({ success: true, data: contrats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET contrat par ID
router.get('/:id', protectRoute, async (req, res) => {
  try {
    const contrat = await ContratVente.findById(req.params.id)
      .populate('produit')
      .populate('client');
    if (!contrat) return res.status(404).json({ message: 'Contrat non trouvé' });
    res.json({ success: true, data: contrat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST créer un contrat
router.post('/', protectRoute, async (req, res) => {
  try {
    const { produit, client, quantite, prixUnitaire, dateDebut, dateFin } = req.body;
    
    if (!produit || !client || !quantite || !prixUnitaire || !dateDebut || !dateFin) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const numeroContrat = `CTV-${Date.now()}`;
    
    const contrat = await ContratVente.create({
      ...req.body,
      numeroContrat,
      montantTotal: quantite * prixUnitaire
    });
    
    const populatedContrat = await ContratVente.findById(contrat._id)
      .populate('produit')
      .populate('client');
    
    res.status(201).json({ success: true, data: populatedContrat });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT modifier un contrat
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const contrat = await ContratVente.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('produit').populate('client');
    
    if (!contrat) return res.status(404).json({ message: 'Contrat non trouvé' });
    res.json({ success: true, data: contrat });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE supprimer un contrat
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const contrat = await ContratVente.findByIdAndDelete(req.params.id);
    if (!contrat) return res.status(404).json({ message: 'Contrat non trouvé' });
    res.json({ success: true, message: 'Contrat supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// backend/routes/contratVente.routes.js (ou similaire)
router.post('/api/contrats-vente', createContrat);
router.get('/api/contrats-vente', getContrats);
module.exports = router;