// backend/src/controllers/notificationController.js - Version complète et unifiée
const Notification = require('../models/Notification');

// ==================== RÉCUPÉRATION DES NOTIFICATIONS ====================

// GET /api/notifications - Récupérer les notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false, page = 1 } = req.query;
    const userId = req.user?._id || req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID utilisateur requis' 
      });
    }
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.$or = [{ read: false }, { isRead: false }];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ 
        userId, 
        $or: [{ read: false }, { isRead: false }] 
      })
    ]);
    
    res.json({ 
      success: true, 
      notifications, 
      unreadCount,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('Erreur getNotifications:', err.message);
    res.json({ success: false, notifications: [], unreadCount: 0 });
  }
};

// GET /api/notifications/user/:userId - Récupérer les notifications d'un utilisateur spécifique
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unreadOnly = false, page = 1 } = req.query;
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.$or = [{ read: false }, { isRead: false }];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ 
        userId, 
        $or: [{ read: false }, { isRead: false }] 
      })
    ]);
    
    res.json({
      success: true,
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur getUserNotifications:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ==================== CRÉATION DE NOTIFICATIONS ====================

// POST /api/notifications - Créer une notification (Admin/Système)
exports.sendNotification = async (req, res) => {
  try {
    const { userId, userRole, type, title, message, data } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, title et message requis' 
      });
    }
    
    const notification = new Notification({
      userId,
      userRole: userRole || 'system',
      type: type || 'info',
      title,
      message,
      data,
      read: false,
      isRead: false
    });
    
    await notification.save();
    
    // Envoyer via Socket.IO
    const io = req.app?.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('new-notification', notification);
      io.to(`user-${userId}`).emit('new_notification', notification);
    }
    
    console.log(`📨 Notification créée pour ${userId}: ${title}`);
    
    res.status(201).json({ 
      success: true, 
      data: notification 
    });
  } catch (error) {
    console.error('Erreur sendNotification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ==================== MARQUER COMME LUES ====================

// PUT /api/notifications/:id/read - Marquer une notification comme lue
exports.markOneRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: userId },
      { read: true, isRead: true },
      { new: true }
    );
    
    if (!notification) {
      // Vérifier si c'est une erreur de Cast (ID invalide)
      if (req.params.id && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(404).json({ success: false, message: 'Notification non trouvée' });
      }
      // Pour les IDs de démo, retourner succès silencieux
      return res.json({ success: true, data: null });
    }
    
    res.json({ success: true, data: notification });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.json({ success: true, data: null });
    }
    console.error('Erreur markOneRead:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/:id/mark-read - Alias pour marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }
    
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/notifications/read-all - Marquer toutes les notifications comme lues
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Utilisateur non identifié' 
      });
    }
    
    const result = await Notification.updateMany(
      { 
        userId, 
        $or: [{ read: false }, { isRead: false }] 
      },
      { read: true, isRead: true }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marquée(s) comme lue(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Erreur markAllRead:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/user/:userId/mark-all-read - Marquer toutes les notifications d'un utilisateur comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, read: true }
    );
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} notification(s) marquée(s) comme lue(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ==================== SUPPRESSION ====================

// DELETE /api/notifications/:id - Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    
    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      userId: userId 
    });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification non trouvée' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Notification supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur deleteNotification:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /api/notifications/user/:userId - Supprimer toutes les notifications d'un utilisateur
exports.deleteAllUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await Notification.deleteMany({ userId });
    
    res.json({ 
      success: true, 
      message: `${result.deletedCount} notification(s) supprimée(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Erreur deleteAllUserNotifications:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ==================== STATISTIQUES ====================

// GET /api/notifications/stats - Obtenir les statistiques des notifications
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Utilisateur non identifié' 
      });
    }
    
    const [total, unread, read] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ 
        userId, 
        $or: [{ read: false }, { isRead: false }] 
      }),
      Notification.countDocuments({ 
        userId, 
        read: true, 
        isRead: true 
      })
    ]);
    
    // Statistiques par type
    const byType = await Notification.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        unread,
        read,
        byType: byType.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Erreur getNotificationStats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ==================== FONCTIONS UTILITAIRES (pour les autres contrôleurs) ====================

// Créer et envoyer une notification (fonction utilitaire)
const createAndSendNotification = async (io, userId, title, message, type = 'info', data = null) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data,
      read: false,
      isRead: false
    });
    
    if (io) {
      io.to(`user-${userId}`).emit('new_notification', notification);
    }
    
    return notification;
  } catch (err) {
    console.error('Erreur création notification:', err);
    return null;
  }
};

// Exporter la fonction utilitaire
exports.createAndSendNotification = createAndSendNotification;