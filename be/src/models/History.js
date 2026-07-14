const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'view', 'export', 'validate', 'reject', 'upload', 'download']
  },
  entityType: {
    type: String,
    enum: ['contrat', 'commande', 'livraison', 'facture', 'user', 'tiers', 'produit', 'notification', 'penalty']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index pour les recherches
historySchema.index({ userId: 1, createdAt: -1 });
historySchema.index({ userRole: 1, createdAt: -1 });
historySchema.index({ action: 1, entityType: 1 });

module.exports = mongoose.model('History', historySchema);