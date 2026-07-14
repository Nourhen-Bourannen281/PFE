const mongoose = require("mongoose");

const tiersSchema = new mongoose.Schema({
  raisonSociale: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['Client', 'Fournisseur', 'Transporteur'],
    required: true
  },
  email: { type: String },
  telephone: { type: String },
  adresse: { type: String }
});

module.exports = mongoose.models.Tiers || mongoose.model('Tiers', tiersSchema);