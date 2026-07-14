const Pays = require('../models/Pays');

// @desc    Obtenir tous les pays
// @route   GET /api/pays
// @access  Private
const getPays = async (req, res) => {
  try {
    const pays = await Pays.find().sort({ nom: 1 });
    res.status(200).json(pays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un pays par ID
// @route   GET /api/pays/:id
// @access  Private
const getPaysById = async (req, res) => {
  try {
    const pays = await Pays.findById(req.params.id);
    if (!pays) {
      return res.status(404).json({ message: 'Pays non trouvé' });
    }
    res.status(200).json(pays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un nouveau pays
// @route   POST /api/pays
// @access  Private/Admin
const createPays = async (req, res) => {
  try {
    const { code, nom, continent } = req.body;
    
    // Vérifier si le code existe déjà
    const existingPays = await Pays.findOne({ code: code.toUpperCase() });
    if (existingPays) {
      return res.status(400).json({ message: 'Ce code pays existe déjà' });
    }
    
    const pays = await Pays.create({
      code: code.toUpperCase(),
      nom,
      continent: continent || 'Afrique'
    });
    
    res.status(201).json(pays);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour un pays
// @route   PUT /api/pays/:id
// @access  Private/Admin
const updatePays = async (req, res) => {
  try {
    const pays = await Pays.findById(req.params.id);
    
    if (!pays) {
      return res.status(404).json({ message: 'Pays non trouvé' });
    }
    
    const { code, nom, continent } = req.body;
    
    if (code && code !== pays.code) {
      const existingPays = await Pays.findOne({ code: code.toUpperCase() });
      if (existingPays) {
        return res.status(400).json({ message: 'Ce code pays existe déjà' });
      }
      pays.code = code.toUpperCase();
    }
    
    if (nom) pays.nom = nom;
    if (continent) pays.continent = continent;
    
    const updatedPays = await pays.save();
    res.status(200).json(updatedPays);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un pays
// @route   DELETE /api/pays/:id
// @access  Private/Admin
const deletePays = async (req, res) => {
  try {
    const pays = await Pays.findById(req.params.id);
    
    if (!pays) {
      return res.status(404).json({ message: 'Pays non trouvé' });
    }
    
    // Vérifier si le pays est utilisé (optionnel)
    // const utilisations = await SomeModel.findOne({ pays: req.params.id });
    // if (utilisations) {
    //   return res.status(400).json({ message: 'Ce pays est utilisé, suppression impossible' });
    // }
    
    await pays.deleteOne();
    res.status(200).json({ message: 'Pays supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPays,
  getPaysById,
  createPays,
  updatePays,
  deletePays
};