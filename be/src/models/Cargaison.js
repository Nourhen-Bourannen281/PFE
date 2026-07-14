const mongoose = require("mongoose");

const cargaisonSchema = new mongoose.Schema({
  numeroCargaison: { type: String, required: true, unique: true },
  navire: { type: mongoose.Schema.Types.ObjectId, ref: 'Navire' },
  produits: [
    {
      produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantite: Number
    }
  ],
  portDepart: { type: String },
  portArrivee: { type: String },
  dateDepart: { type: Date },
  dateArriveePrevue: { type: Date },
  statut: {
    type: String,
    enum: ['Planifiée', 'En cours', 'Arrivée', 'Annulée'],
    default: 'Planifiée'
  }
});

module.exports = mongoose.models.Cargaison || mongoose.model('Cargaison', cargaisonSchema);