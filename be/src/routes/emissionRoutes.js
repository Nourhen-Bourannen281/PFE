const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const Emission = require('../models/Emission');
const Contrat = require('../models/Contrat');
const Pays = require('../models/Pays');

// GET toutes les émissions
router.get('/', protect, authorizeRoles('Admin', 'Commercial'), async (req, res) => {
  try {
    const emissions = await Emission.find()
      .populate('contrat', 'numeroContrat')
      .populate('destination', 'nom code')
      .sort({ dateCreation: -1 });
    res.json(emissions);
  } catch (err) {
    console.error('Erreur GET emissions:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET une émission par ID
router.get('/:id', protect, authorizeRoles('Admin', 'Commercial'), async (req, res) => {
  try {
    const emission = await Emission.findById(req.params.id)
      .populate('contrat', 'numeroContrat')
      .populate('destination', 'nom code');
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    res.json(emission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST créer une émission
router.post('/', protect, authorizeRoles('Admin', 'Commercial'), async (req, res) => {
  try {
    const { numeroEmission, contrat, destination, dateEmission, statut } = req.body;
    
    if (!numeroEmission || !destination) {
      return res.status(400).json({ message: 'Numéro et destination sont requis' });
    }
    
    // Vérifier si le pays existe
    const paysExist = await Pays.findById(destination);
    if (!paysExist) {
      return res.status(404).json({ message: 'Pays de destination non trouvé' });
    }
    
    // Vérifier si le numéro d'émission est unique
    const existingEmission = await Emission.findOne({ numeroEmission });
    if (existingEmission) {
      return res.status(400).json({ message: 'Ce numéro d\'émission existe déjà' });
    }
    
    const emission = await Emission.create({
      numeroEmission,
      contrat: contrat || null,
      destination,
      dateEmission: dateEmission || Date.now(),
      statut: statut || 'En cours'
    });
    
    const populatedEmission = await Emission.findById(emission._id)
      .populate('contrat', 'numeroContrat')
      .populate('destination', 'nom code');
    
    res.status(201).json(populatedEmission);
  } catch (err) {
    console.error('Erreur création émission:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT modifier une émission
router.put('/:id', protect, authorizeRoles('Admin', 'Commercial'), async (req, res) => {
  try {
    const emission = await Emission.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true }
    ).populate('contrat', 'numeroContrat')
     .populate('destination', 'nom code');
    
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    res.json(emission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE supprimer une émission
router.delete('/:id', protect, authorizeRoles('Admin'), async (req, res) => {
  try {
    const emission = await Emission.findByIdAndDelete(req.params.id);
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    res.json({ message: 'Émission supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH modifier le statut
router.patch('/:id/statut', protect, authorizeRoles('Admin', 'Commercial'), async (req, res) => {
  try {
    const { statut } = req.body;
    const emission = await Emission.findByIdAndUpdate(
      req.params.id,
      { statut, dateModification: Date.now() },
      { new: true }
    ).populate('contrat', 'numeroContrat')
     .populate('destination', 'nom code');
    
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    res.json(emission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH associer un contrat
router.patch('/:id/associate', protect, authorizeRoles('Admin', 'Commercial'), async (req, res) => {
  try {
    const { contratId } = req.body;
    
    if (!contratId) {
      return res.status(400).json({ message: 'ID du contrat requis' });
    }
    
    const contrat = await Contrat.findById(contratId);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }
    
    const emission = await Emission.findByIdAndUpdate(
      req.params.id,
      { contrat: contratId, dateModification: Date.now() },
      { new: true }
    ).populate('contrat', 'numeroContrat')
     .populate('destination', 'nom code');
    
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    res.json(emission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;