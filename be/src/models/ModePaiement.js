const mongoose = require("mongoose");

const modePaiementSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String }
});

module.exports = mongoose.models.ModePaiement || mongoose.model('ModePaiement', modePaiementSchema);