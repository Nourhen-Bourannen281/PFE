const mongoose = require("mongoose");

const typeFactureSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String }
});

module.exports = mongoose.models.TypeFacture || mongoose.model('TypeFacture', typeFactureSchema);