const mongoose = require("mongoose");

const typeProduitSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  description: { type: String }
});

module.exports = mongoose.models.TypeProduit || mongoose.model('TypeProduit', typeProduitSchema);