const ModePaiement = require('../models/ModePaiement');

// @desc    Obtenir tous les modes de paiement
// @route   GET /api/modes-paiement
// @access  Private
const getModesPaiement = async (req, res) => {
  try {
    const modes = await ModePaiement.find().sort({ nom: 1 });
    res.status(200).json(modes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un mode de paiement par ID
// @route   GET /api/modes-paiement/:id
// @access  Private
const getModePaiementById = async (req, res) => {
  try {
    const mode = await ModePaiement.findById(req.params.id);
    if (!mode) {
      return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    }
    res.status(200).json(mode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un nouveau mode de paiement
// @route   POST /api/modes-paiement
// @access  Private (Admin only)
const createModePaiement = async (req, res) => {
  try {
    const { nom } = req.body;
    
    // Vérifier si le nom existe déjà
    const existingMode = await ModePaiement.findOne({ nom });
    if (existingMode) {
      return res.status(400).json({ message: 'Ce mode de paiement existe déjà' });
    }
    
    const mode = new ModePaiement({ nom });
    const savedMode = await mode.save();
    res.status(201).json(savedMode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour un mode de paiement
// @route   PUT /api/modes-paiement/:id
// @access  Private (Admin only)
const updateModePaiement = async (req, res) => {
  try {
    const { nom } = req.body;
    
    const mode = await ModePaiement.findById(req.params.id);
    if (!mode) {
      return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    }
    
    // Vérifier si le nouveau nom n'est pas déjà utilisé
    if (nom && nom !== mode.nom) {
      const existingMode = await ModePaiement.findOne({ nom });
      if (existingMode) {
        return res.status(400).json({ message: 'Ce mode de paiement existe déjà' });
      }
      mode.nom = nom;
    }
    
    const updatedMode = await mode.save();
    res.status(200).json(updatedMode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un mode de paiement
// @route   DELETE /api/modes-paiement/:id
// @access  Private (Admin only)
const deleteModePaiement = async (req, res) => {
  try {
    const mode = await ModePaiement.findById(req.params.id);
    if (!mode) {
      return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    }
    
    await mode.deleteOne();
    res.status(200).json({ message: 'Mode de paiement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getModesPaiement,
  getModePaiementById,
  createModePaiement,
  updateModePaiement,
  deleteModePaiement
};