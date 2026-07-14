const Banque = require('../models/Banque');
const Pays = require('../models/Pays');

// @desc    Obtenir toutes les banques
// @route   GET /api/banques
// @access  Private
const getBanques = async (req, res) => {
  try {
    const banques = await Banque.find()
      .populate('pays', 'nom code')
      .sort({ nom: 1 });
    res.status(200).json(banques);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir une banque par ID
// @route   GET /api/banques/:id
// @access  Private
const getBanqueById = async (req, res) => {
  try {
    const banque = await Banque.findById(req.params.id).populate('pays', 'nom code');
    if (!banque) {
      return res.status(404).json({ message: 'Banque non trouvée' });
    }
    res.status(200).json(banque);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer une nouvelle banque
// @route   POST /api/banques
// @access  Private (Admin only)
const createBanque = async (req, res) => {
  try {
    const { nom, codeSwift, adresse, pays } = req.body;
    
    // Vérifier si le pays existe
    if (pays) {
      const paysExists = await Pays.findById(pays);
      if (!paysExists) {
        return res.status(400).json({ message: 'Pays non trouvé' });
      }
    }
    
    const banque = new Banque({
      nom,
      codeSwift,
      adresse,
      pays
    });
    
    const savedBanque = await banque.save();
    const populatedBanque = await Banque.findById(savedBanque._id).populate('pays', 'nom code');
    
    res.status(201).json(populatedBanque);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour une banque
// @route   PUT /api/banques/:id
// @access  Private (Admin only)
const updateBanque = async (req, res) => {
  try {
    const { nom, codeSwift, adresse, pays } = req.body;
    
    const banque = await Banque.findById(req.params.id);
    if (!banque) {
      return res.status(404).json({ message: 'Banque non trouvée' });
    }
    
    // Vérifier si le pays existe
    if (pays && pays !== banque.pays) {
      const paysExists = await Pays.findById(pays);
      if (!paysExists) {
        return res.status(400).json({ message: 'Pays non trouvé' });
      }
      banque.pays = pays;
    }
    
    if (nom) banque.nom = nom;
    if (codeSwift !== undefined) banque.codeSwift = codeSwift;
    if (adresse !== undefined) banque.adresse = adresse;
    
    const updatedBanque = await banque.save();
    const populatedBanque = await Banque.findById(updatedBanque._id).populate('pays', 'nom code');
    
    res.status(200).json(populatedBanque);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer une banque
// @route   DELETE /api/banques/:id
// @access  Private (Admin only)
const deleteBanque = async (req, res) => {
  try {
    const banque = await Banque.findById(req.params.id);
    if (!banque) {
      return res.status(404).json({ message: 'Banque non trouvée' });
    }
    
    // Vérifier si la banque est utilisée par d'autres entités
    const Tiers = require('../models/Tiers');
    const tiers = await Tiers.findOne({ banque: req.params.id });
    if (tiers) {
      return res.status(400).json({ 
        message: 'Cette banque est utilisée par des tiers, suppression impossible' 
      });
    }
    
    await banque.deleteOne();
    res.status(200).json({ message: 'Banque supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBanques,
  getBanqueById,
  createBanque,
  updateBanque,
  deleteBanque
};