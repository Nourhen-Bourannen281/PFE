// backend/models/SousProduit.js
const mongoose = require('mongoose');

const sousProduitSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  produitParent: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  uniteMesure: { type: String },
  prix: { type: Number, default: 0 }
} , {
  timestamps: true
});

// Index pour optimiser les recherches
sousProduitSchema.index({ code: 1 }, { unique: true });
sousProduitSchema.index({ nom: 1 });
sousProduitSchema.index({ produitParent: 1 });

module.exports = mongoose.models.SousProduit || mongoose.model('SousProduit', sousProduitSchema);