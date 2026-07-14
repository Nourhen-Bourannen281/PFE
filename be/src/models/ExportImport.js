const mongoose = require("mongoose");

const exportImportSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Export', 'Import'], required: true },
  produits: [{
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantite: Number
  }],
  paysOrigine: { type: mongoose.Schema.Types.ObjectId, ref: 'Pays' },
  paysDestination: { type: mongoose.Schema.Types.ObjectId, ref: 'Pays' },
  date: { type: Date, default: Date.now },
  statut: {
    type: String,
    enum: ['En cours', 'Terminé', 'Annulé'],
    default: 'En cours'
  }
});

module.exports = mongoose.models.ExportImport || mongoose.model('ExportImport', exportImportSchema);