// backend/controllers/sousProduitController.js
const SousProduit = require('../models/SousProduit');

// @desc    Récupérer tous les sous-produits
// @route   GET /api/sous-produits
// @access  Private (Admin et Commercial)
const getSousProduits = async (req, res) => {
  try {
    const { produitId, actif, search } = req.query;
    let filter = {};
    
    if (produitId) {
      filter.produitId = produitId;
    }
    
    if (actif !== undefined) {
      filter.actif = actif === 'true';
    }
    
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sousProduits = await SousProduit.find(filter)
      .populate('produitId', 'nom')
      .sort({ nom: 1 });
    
    res.status(200).json({
      success: true,
      count: sousProduits.length,
      data: sousProduits
    });
  } catch (error) {
    console.error('Erreur getSousProduits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sous-produits',
      error: error.message
    });
  }
};

// @desc    Créer un sous-produit
// @route   POST /api/sous-produits
// @access  Private (Admin uniquement)
const createSousProduit = async (req, res) => {
  try {
    const { nom, code, produitId, prixUnitaire, uniteMesure, description, actif } = req.body;
    
    // Vérifier si le code existe déjà
    const existing = await SousProduit.findOne({ code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Un sous-produit avec ce code existe déjà'
      });
    }
    
    const sousProduit = await SousProduit.create({
      nom,
      code: code.toUpperCase(),
      produitId,
      prixUnitaire,
      uniteMesure,
      description: description || '',
      actif: actif !== undefined ? actif : true
    });
    
    res.status(201).json({
      success: true,
      message: 'Sous-produit créé avec succès',
      data: sousProduit
    });
  } catch (error) {
    console.error('Erreur createSousProduit:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un sous-produit avec ce code existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du sous-produit',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un sous-produit
// @route   PUT /api/sous-produits/:id
// @access  Private (Admin uniquement)
const updateSousProduit = async (req, res) => {
  try {
    let sousProduit = await SousProduit.findById(req.params.id);
    
    if (!sousProduit) {
      return res.status(404).json({
        success: false,
        message: 'Sous-produit non trouvé'
      });
    }
    
    const { nom, code, produitId, prixUnitaire, uniteMesure, description, actif } = req.body;
    
    if (code && code !== sousProduit.code) {
      const existing = await SousProduit.findOne({ code });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Un sous-produit avec ce code existe déjà'
        });
      }
      sousProduit.code = code.toUpperCase();
    }
    
    sousProduit.nom = nom || sousProduit.nom;
    sousProduit.produitId = produitId || sousProduit.produitId;
    sousProduit.prixUnitaire = prixUnitaire !== undefined ? prixUnitaire : sousProduit.prixUnitaire;
    sousProduit.uniteMesure = uniteMesure || sousProduit.uniteMesure;
    sousProduit.description = description !== undefined ? description : sousProduit.description;
    sousProduit.actif = actif !== undefined ? actif : sousProduit.actif;
    
    await sousProduit.save();
    
    res.status(200).json({
      success: true,
      message: 'Sous-produit mis à jour avec succès',
      data: sousProduit
    });
  } catch (error) {
    console.error('Erreur updateSousProduit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du sous-produit',
      error: error.message
    });
  }
};

// @desc    Supprimer un sous-produit
// @route   DELETE /api/sous-produits/:id
// @access  Private (Admin uniquement)
const deleteSousProduit = async (req, res) => {
  try {
    const sousProduit = await SousProduit.findById(req.params.id);
    
    if (!sousProduit) {
      return res.status(404).json({
        success: false,
        message: 'Sous-produit non trouvé'
      });
    }
    
    await sousProduit.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Sous-produit supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteSousProduit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du sous-produit',
      error: error.message
    });
  }
};

module.exports = {
  getSousProduits,
  createSousProduit,
  updateSousProduit,
  deleteSousProduit
};