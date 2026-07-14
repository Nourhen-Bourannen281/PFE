const History = require('../models/History');

// Récupérer l'historique d'un utilisateur
exports.getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1, action, entityType, startDate, endDate } = req.query;
    
    const query = { userId };
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [history, total] = await Promise.all([
      History.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      History.countDocuments(query)
    ]);
    
    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer tout l'historique (Admin)
exports.getAllHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1, userRole, action, entityType } = req.query;
    
    const query = {};
    if (userRole) query.userRole = userRole;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [history, total] = await Promise.all([
      History.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'nom email'),
      History.countDocuments(query)
    ]);
    
    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Journaliser une action
exports.logAction = async (userId, userRole, userEmail, action, entityType, entityId, details, req = null) => {
  try {
    await History.create({
      userId,
      userRole,
      userEmail,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (error) {
    console.error('Erreur journalisation:', error);
  }
};