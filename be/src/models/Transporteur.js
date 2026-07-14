const mongoose = require('mongoose');

const transporteurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  raisonSociale: { type: String },
  email: { type: String },
  telephone: { type: String },
  adresse: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transporteur', transporteurSchema);