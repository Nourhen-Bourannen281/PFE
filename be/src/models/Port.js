// backend/models/Port.js
const mongoose = require('mongoose');

const portSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  pays: { type: String },
  ville: { type: String }
  }
, { 
  timestamps: true
});

// Index pour les recherches
portSchema.index({ nom: 1 });
portSchema.index({ code: 1 });
portSchema.index({ ville: 1 });

module.exports = mongoose.models.Port || mongoose.model('Port', portSchema);
