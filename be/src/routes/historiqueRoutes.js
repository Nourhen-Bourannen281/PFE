// backend/routes/historiqueRoutes.js
const express = require('express');
const router = express.Router();
const Historique = require('../models/Historique');
const { protectRoute, authorize } = require('../middlewares/authMiddleware');

// GET historique pour admin (tous les historiques)
router.get('/', protectRoute, authorize('Admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, entityType, search, dateStart, dateEnd } = req.query;
    
    let filter = {};
    
    if (entityType) {
      filter.entityType = entityType;
    }
    
    if (search) {
      filter.$or = [
        { details: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (dateStart || dateEnd) {
      filter.createdAt = {};
      if (dateStart) filter.createdAt.$gte = new Date(dateStart);
      if (dateEnd) filter.createdAt.$lte = new Date(dateEnd);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [historique, total] = await Promise.all([
      Historique.find(filter)
        .populate('utilisateur', 'nom email raisonSociale role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Historique.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: historique,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur getHistorique:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET historique pour un utilisateur spécifique
router.get('/me', protectRoute, async (req, res) => {
  try {
    const { page = 1, limit = 20, entityType, search, dateStart, dateEnd } = req.query;
    
    let filter = { utilisateur: req.user._id };
    
    if (entityType) {
      filter.entityType = entityType;
    }
    
    if (search) {
      filter.$or = [
        { details: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (dateStart || dateEnd) {
      filter.createdAt = {};
      if (dateStart) filter.createdAt.$gte = new Date(dateStart);
      if (dateEnd) filter.createdAt.$lte = new Date(dateEnd);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [historique, total] = await Promise.all([
      Historique.find(filter)
        .populate('utilisateur', 'nom email raisonSociale')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Historique.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: historique,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur getHistoriqueMe:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET statistiques
router.get('/stats', protectRoute, authorize('Admin'), async (req, res) => {
  try {
    const actionsParType = await Historique.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const totalParEntite = await Historique.aggregate([
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const totalParMois = await Historique.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      success: true,
      actionsParType,
      totalParEntite: totalParEntite.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalParMois
    });
  } catch (error) {
    console.error('Erreur getHistoriqueStats:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST créer une entrée d'historique (fonction utilitaire)
const createHistorique = async (data) => {
  try {
    const historique = new Historique(data);
    await historique.save();
    return historique;
  } catch (error) {
    console.error('Erreur createHistorique:', error);
    return null;
  }
};

module.exports = router;
module.exports.createHistorique = createHistorique;