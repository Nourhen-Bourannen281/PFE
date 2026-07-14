const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  type: {
    type: String,
    enum: ['Contrat', 'Facture', 'Bon de livraison', 'Attestation'],
    required: true
  },
  reference: { type: String },
  fichier: { type: String },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema);