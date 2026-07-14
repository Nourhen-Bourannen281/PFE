const mongoose = require("mongoose");

const conformiteSchema = new mongoose.Schema({
  document: { type: String, required: true },
  typeControle: {
    type: String,
    enum: ['Douane', 'Qualité', 'Sécurité'],
    default: 'Douane'
  },
  statut: {
    type: String,
    enum: ['Conforme', 'Non conforme', 'En attente'],
    default: 'En attente'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verification: { type: Date, default: Date.now },
  commentaire: { type: String }
});

module.exports = mongoose.models.Conformite || mongoose.model('Conformite', conformiteSchema);