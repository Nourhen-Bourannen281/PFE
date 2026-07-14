const mongoose = require("mongoose");

const banqueSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  pays: { type: String },
  adresse: { type: String },
  telephone: { type: String },
  email: { type: String }
});

module.exports = mongoose.models.Banque || mongoose.model('Banque', banqueSchema);