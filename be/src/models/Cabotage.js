const mongoose = require("mongoose");

const cabotageSchema = new mongoose.Schema({
  numeroCabotage: { type: String, required: true, unique: true },
  navire: { type: String, required: true },
  portDepart: { type: String, required: true },
  portArrivee: { type: String, required: true },
  dateDepart: { type: Date, required: true },
  dateArrivee: { type: Date },
  statut: {
    type: String,
    enum: ['Planifié', 'En cours', 'Terminé', 'Annulé'],
    default: 'Planifié'
  }
});

module.exports = mongoose.models.Cabotage || mongoose.model('Cabotage', cabotageSchema);