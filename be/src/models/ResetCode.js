const mongoose = require("mongoose");

const resetCodeSchema = new mongoose.Schema({
  email:      { type: String, required: true },
  code:       { type: String, required: true },
  resetToken: { type: String, unique: true, sparse: true },
  expiresAt:  { type: Date, required: true },
  used:       { type: Boolean, default: false },
  attempts:   { type: Number, default: 0 },
  createdAt:  { type: Date, default: Date.now }
});

// TTL : MongoDB supprime automatiquement les documents expirés
resetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.ResetCode || mongoose.model('ResetCode', resetCodeSchema);