const mongoose = require("mongoose");

const referentielSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  valeur: { type: String },
  actif: { type: Boolean, default: true }
});

module.exports = mongoose.models.Referentiel || mongoose.model('Referentiel', referentielSchema);