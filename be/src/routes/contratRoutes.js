const express = require("express");
const router = express.Router();
const { protectRoute } = require("../middlewares/authMiddleware");
const contratController = require("../controllers/contratController");
const createCrudRoutes = require("../controllers/crudController");
const Contrat = require("../models/Contrat");
const ContratVente = require("../models/ContratVente");

// ==================== LISTE DES CONTRATS ====================
router.get('/', protectRoute, async (req, res) => {
  try {
    console.log(`📋 GET /contrats — user: ${req.user?.email} role: ${req.user?.role}`);
    let contrats = [];
    if (req.user.role === 'Admin' || req.user.role === 'Commercial') {
      contrats = await Contrat.find()
        .populate('tiers', 'raisonSociale type code adresse matriculeFiscale telephone')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure codeProduit')
        .sort({ dateCreation: -1 });
    }
    console.log(`✅ GET /contrats — ${contrats.length} contrats retournés`);
    res.json(contrats);
  } catch (err) {
    console.error('❌ Erreur getContrats:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ==================== CRÃ‰ER UN CONTRAT ====================
router.post('/', protectRoute, async (req, res) => {
  try {
    const contratData = {
      ...req.body,
      createdBy: req.user._id,
      clientId: req.body.clientId || req.body.tiers || req.user._id,
      montantTotal: req.body.produits?.reduce((total, p) => total + (p.quantite * p.prixUnitaire), 0) || 0
    };
    
    const contrat = await Contrat.create(contratData);
    const populatedContrat = await Contrat.findById(contrat._id)
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');
    
    res.status(201).json(populatedContrat);
  } catch (err) {
    console.error('Erreur createContrat:', err);
    res.status(400).json({ message: err.message });
  }
});

// ==================== MODIFIER UN CONTRAT ====================
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvÃ©' });
    }
    
    if (contrat.statut === 'ValidÃ©') {
      return res.status(400).json({ message: 'Impossible de modifier un contrat dÃ©jÃ  validÃ©' });
    }
    
    const updatedData = {
      ...req.body,
      montantTotal: req.body.produits?.reduce((total, p) => total + (p.quantite * p.prixUnitaire), 0) || 0,
      updatedAt: Date.now()
    };
    
    const updatedContrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('tiers', 'raisonSociale type')
     .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');
    
    res.json(updatedContrat);
  } catch (err) {
    console.error('Erreur updateContrat:', err);
    res.status(400).json({ message: err.message });
  }
});

// ==================== VALIDER UN CONTRAT ====================
router.put('/:id/valider', protectRoute, async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvÃ©' });
    }
    
    if (contrat.statut === 'ValidÃ©') {
      return res.status(400).json({ message: 'Ce contrat est dÃ©jÃ  validÃ©' });
    }
    
    contrat.statut = 'ValidÃ©';
    contrat.dateValidation = Date.now();
    await contrat.save();
    
    const populatedContrat = await Contrat.findById(contrat._id)
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');
    
    res.json({ message: 'Contrat validÃ© avec succÃ¨s', contrat: populatedContrat });
  } catch (err) {
    console.error('Erreur validerContrat:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== SUPPRIMER UN CONTRAT ====================
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvÃ©' });
    }
    
    if (contrat.statut === 'ValidÃ©') {
      return res.status(400).json({ message: 'Impossible de supprimer un contrat dÃ©jÃ  validÃ©' });
    }
    
    await Contrat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contrat supprimÃ© avec succÃ¨s' });
  } catch (err) {
    console.error('Erreur deleteContrat:', err);
    res.status(400).json({ message: err.message });
  }
});

// ==================== EXPORT PDF ====================
router.get('/:id/export-pdf', protectRoute, async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id)
      .populate('tiers', 'raisonSociale type code adresse matriculeFiscale telephone email')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure codeProduit');
    
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvÃ©' });
    }
    
    // VÃ©rification des droits
    if (req.user.role !== 'Admin' && req.user.role !== 'Commercial') {
      return res.status(403).json({ message: 'AccÃ¨s non autorisÃ©' });
    }
    
    // Retourner les donnÃ©es du contrat pour gÃ©nÃ©ration PDF cÃ´tÃ© frontend
    res.json(contrat);
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ message: error.message });
  }
});
router.get('/client/:clientId', protectRoute, contratController.getContrats);

router.use('/vente', createCrudRoutes(ContratVente, 'ContratVente', {
  populateFields: ['produit', 'client']
}));
module.exports = router;
