const Tiers = require('../models/Tiers');

// Récupérer tous les tiers
const getTiers = async (req, res) => {
  try {
    const { type, actif, search } = req.query;
    let filter = {};
    
    if (type && type !== 'all') {
      filter.type = type === 'client' ? 0 : 1;
    }
    
    if (actif !== undefined) {
      filter.actif = actif === 'true';
    }
    
    if (search) {
      filter.$or = [
        { raisonSociale: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { matriculeFiscale: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tiers = await Tiers.find(filter).sort({ raisonSociale: 1 });
    
    res.status(200).json({
      success: true,
      count: tiers.length,
      data: tiers
    });
  } catch (error) {
    console.error('Erreur getTiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tiers',
      error: error.message
    });
  }
};

// Récupérer un tiers par ID
const getTiersById = async (req, res) => {
  try {
    const tiers = await Tiers.findById(req.params.id);
    
    if (!tiers) {
      return res.status(404).json({
        success: false,
        message: 'Tiers non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tiers
    });
  } catch (error) {
    console.error('Erreur getTiersById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tiers',
      error: error.message
    });
  }
};

// Créer un tiers
const createTiers = async (req, res) => {
  try {
    const { raisonSociale, code, type, matriculeFiscale, adresse, telephone, email, responsable, actif } = req.body;
    
    // Vérifier si le code existe déjà
    const existingTiers = await Tiers.findOne({ code: code.toUpperCase() });
    if (existingTiers) {
      return res.status(400).json({
        success: false,
        message: 'Un tiers avec ce code existe déjà'
      });
    }
    
    const tiers = await Tiers.create({
      raisonSociale,
      code: code.toUpperCase(),
      type: type === 'client' ? 0 : 1,
      matriculeFiscale,
      adresse,
      telephone,
      email,
      responsable,
      actif: actif !== undefined ? actif : true
    });
    
    res.status(201).json({
      success: true,
      message: 'Tiers créé avec succès',
      data: tiers
    });
  } catch (error) {
    console.error('Erreur createTiers:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un tiers avec ce code existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du tiers',
      error: error.message
    });
  }
};

// Mettre à jour un tiers
const updateTiers = async (req, res) => {
  try {
    let tiers = await Tiers.findById(req.params.id);
    
    if (!tiers) {
      return res.status(404).json({
        success: false,
        message: 'Tiers non trouvé'
      });
    }
    
    const { raisonSociale, code, type, matriculeFiscale, adresse, telephone, email, responsable, actif } = req.body;
    
    // Vérifier si le nouveau code existe déjà
    if (code && code !== tiers.code) {
      const existingTiers = await Tiers.findOne({ code: code.toUpperCase() });
      if (existingTiers) {
        return res.status(400).json({
          success: false,
          message: 'Un tiers avec ce code existe déjà'
        });
      }
      tiers.code = code.toUpperCase();
    }
    
    tiers.raisonSociale = raisonSociale || tiers.raisonSociale;
    tiers.type = type === 'client' ? 0 : 1;
    tiers.matriculeFiscale = matriculeFiscale || tiers.matriculeFiscale;
    tiers.adresse = adresse || tiers.adresse;
    tiers.telephone = telephone || tiers.telephone;
    tiers.email = email || tiers.email;
    tiers.responsable = responsable || tiers.responsable;
    tiers.actif = actif !== undefined ? actif : tiers.actif;
    
    await tiers.save();
    
    res.status(200).json({
      success: true,
      message: 'Tiers mis à jour avec succès',
      data: tiers
    });
  } catch (error) {
    console.error('Erreur updateTiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du tiers',
      error: error.message
    });
  }
};

// Supprimer un tiers
const deleteTiers = async (req, res) => {
  try {
    const tiers = await Tiers.findById(req.params.id);
    
    if (!tiers) {
      return res.status(404).json({
        success: false,
        message: 'Tiers non trouvé'
      });
    }
    
    await tiers.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Tiers supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteTiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du tiers',
      error: error.message
    });
  }
};

module.exports = {
  getTiers,
  getTiersById,
  createTiers,
  updateTiers,
  deleteTiers
};