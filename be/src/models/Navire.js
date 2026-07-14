const mongoose = require("mongoose");

const navireSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  capacite: { type: Number, default: 0 },
  portAttache: { type: String },
  statut: {
    type: String,
    enum: ['Disponible', 'En transit', 'En maintenance'],
    default: 'Disponible'
  }
});

module.exports = mongoose.models.Navire || mongoose.model('Navire', navireSchema);