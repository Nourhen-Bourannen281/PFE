const mongoose = require("mongoose");

const penaltySchema = new mongoose.Schema({
  contratId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContratVente', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['retard_livraison', 'non_conformite', 'rupture_stock'],
    required: true
  },
  montant:     { type: Number, required: true },
  statut:      { type: String, enum: ['en_attente', 'appliquee', 'conteste'], default: 'en_attente' },
  description: { type: String },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Penalty || mongoose.model('Penalty', penaltySchema);