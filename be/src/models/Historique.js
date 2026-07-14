const mongoose = require("mongoose");

const historiqueSchema = new mongoose.Schema({
  action: { type: String, required: true },
  utilisateur: { type: String, required: true },
  date: { type: Date, default: Date.now },
  details: { type: String }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
historiqueSchema.index({ createdAt: -1 });
historiqueSchema.index({ entityType: 1 });
historiqueSchema.index({ utilisateur: 1 });
historiqueSchema.index({ action: 1 });

module.exports = mongoose.models.Historique || mongoose.model('Historique', historiqueSchema);
