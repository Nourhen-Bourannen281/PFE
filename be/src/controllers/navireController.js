const Navire = require('../models/Navire');
const Pays = require('../models/Pays');

// @desc    Obtenir tous les navires
// @route   GET /api/navires
// @access  Private
const getNavires = async (req, res) => {
  try {
    const navires = await Navire.find()
      .populate('pays', 'nom code')
      .sort({ nom: 1 });
    res.status(200).json(navires);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un navire par ID
// @route   GET /api/navires/:id
// @access  Private
const getNavireById = async (req, res) => {
  try {
    const navire = await Navire.findById(req.params.id).populate('pays', 'nom code');
    if (!navire) {
      return res.status(404).json({ message: 'Navire non trouvé' });
    }
    res.status(200).json(navire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un nouveau navire
// @route   POST /api/navires
// @access  Private (Admin only)
const createNavire = async (req, res) => {
  try {
    const { nom, immatriculation, capacite, pays, proprietaire } = req.body;
    
    // Vérifier si l'immatriculation existe déjà
    if (immatriculation) {
      const existingNavire = await Navire.findOne({ immatriculation });
      if (existingNavire) {
        return res.status(400).json({ message: 'Cette immatriculation existe déjà' });
      }
    }
    
    // Vérifier si le pays existe
    if (pays) {
      const paysExists = await Pays.findById(pays);
      if (!paysExists) {
        return res.status(400).json({ message: 'Pays non trouvé' });
      }
    }
    
    const navire = new Navire({
      nom,
      immatriculation,
      capacite,
      pays,
      proprietaire
    });
    
    const savedNavire = await navire.save();
    const populatedNavire = await Navire.findById(savedNavire._id).populate('pays', 'nom code');
    
    res.status(201).json(populatedNavire);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour un navire
// @route   PUT /api/navires/:id
// @access  Private (Admin only)
const updateNavire = async (req, res) => {
  try {
    const { nom, immatriculation, capacite, pays, proprietaire } = req.body;
    
    const navire = await Navire.findById(req.params.id);
    if (!navire) {
      return res.status(404).json({ message: 'Navire non trouvé' });
    }
    
    // Vérifier si l'immatriculation n'est pas déjà utilisée par un autre navire
    if (immatriculation && immatriculation !== navire.immatriculation) {
      const existingNavire = await Navire.findOne({ immatriculation });
      if (existingNavire) {
        return res.status(400).json({ message: 'Cette immatriculation existe déjà' });
      }
      navire.immatriculation = immatriculation;
    }
    
    // Vérifier si le pays existe
    if (pays && pays !== navire.pays) {
      const paysExists = await Pays.findById(pays);
      if (!paysExists) {
        return res.status(400).json({ message: 'Pays non trouvé' });
      }
      navire.pays = pays;
    }
    
    if (nom) navire.nom = nom;
    if (capacite !== undefined) navire.capacite = capacite;
    if (proprietaire !== undefined) navire.proprietaire = proprietaire;
    
    const updatedNavire = await navire.save();
    const populatedNavire = await Navire.findById(updatedNavire._id).populate('pays', 'nom code');
    
    res.status(200).json(populatedNavire);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un navire
// @route   DELETE /api/navires/:id
// @access  Private (Admin only)
const deleteNavire = async (req, res) => {
  try {
    const navire = await Navire.findById(req.params.id);
    if (!navire) {
      return res.status(404).json({ message: 'Navire non trouvé' });
    }
    
    await navire.deleteOne();
    res.status(200).json({ message: 'Navire supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNavires,
  getNavireById,
  createNavire,
  updateNavire,
  deleteNavire
};