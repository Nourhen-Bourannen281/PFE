// controllers/venteController.js
const Vente = require('../models/Vente');

// Obtenir toutes les ventes
exports.getVentes = async (req, res) => {
  try {
    const ventes = await Vente.find()
      .populate('produit')
      .populate('createdBy', 'nom email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: ventes
    });
  } catch (error) {
    console.error('Erreur getVentes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des ventes'
    });
  }
};

// Obtenir une vente par ID
exports.getVenteById = async (req, res) => {
  try {
    const vente = await Vente.findById(req.params.id)
      .populate('produit')
      .populate('createdBy', 'nom email');
    
    if (!vente) {
      return res.status(404).json({
        success: false,
        error: 'Vente non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vente
    });
  } catch (error) {
    console.error('Erreur getVenteById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement de la vente'
    });
  }
};

// Créer une vente
exports.createVente = async (req, res) => {
  try {
    const { numeroVente, produit, quantite, prixUnitaire, contratRef } = req.body;
    
    const montantTotal = quantite * prixUnitaire;
    
    const vente = new Vente({
      numeroVente,
      client: 'STEG',
      produit,
      quantite,
      prixUnitaire,
      montantTotal,
      contratRef,
      createdBy: req.user.id
    });
    
    await vente.save();
    
    res.status(201).json({
      success: true,
      data: vente,
      message: 'Vente créée avec succès'
    });
  } catch (error) {
    console.error('Erreur createVente:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erreur lors de la création'
    });
  }
};

// Mettre à jour une vente
exports.updateVente = async (req, res) => {
  try {
    const vente = await Vente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!vente) {
      return res.status(404).json({
        success: false,
        error: 'Vente non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vente,
      message: 'Vente mise à jour'
    });
  } catch (error) {
    console.error('Erreur updateVente:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Supprimer une vente
exports.deleteVente = async (req, res) => {
  try {
    const vente = await Vente.findByIdAndDelete(req.params.id);
    
    if (!vente) {
      return res.status(404).json({
        success: false,
        error: 'Vente non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vente supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteVente:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
};

// Statistiques des ventes
exports.getVentesStats = async (req, res) => {
  try {
    const totalVentes = await Vente.countDocuments();
    const montantTotal = await Vente.aggregate([
      { $group: { _id: null, total: { $sum: '$montantTotal' } } }
    ]);
    const parStatut = await Vente.aggregate([
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalVentes,
        montantTotal: montantTotal[0]?.total || 0,
        parStatut
      }
    });
  } catch (error) {
    console.error('Erreur getVentesStats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des statistiques'
    });
  }
};