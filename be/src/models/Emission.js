const mongoose = require("mongoose");

const emissionSchema = new mongoose.Schema({
  numeroEmission: { type: String, required: true, unique: true },
  contrat: { type: mongoose.Schema.Types.ObjectId, ref: 'Contrat', default: null },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Pays', required: true },
  dateEmission: { type: Date, default: Date.now },
  statut: { type: String, enum: ['En cours', 'Terminé', 'Annulé'], default: 'En cours' },
  dateCreation: { type: Date, default: Date.now },
  dateModification: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Emission || mongoose.model('Emission', emissionSchema);