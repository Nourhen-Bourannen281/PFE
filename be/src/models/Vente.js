const mongoose = require("mongoose");

const venteSchema = new mongoose.Schema({
  numeroVente: { type: String, required: true, unique: true },
  client: { type: String, required: true },
  produit: { type: String, required: true },
  quantite: { type: Number, required: true },
  montant: { type: Number, required: true },
  dateVente: { type: Date, default: Date.now },
  statut: {
    type: String,
    enum: ['En attente', 'Confirmée', 'Livrée', 'Annulée'],
    default: 'En attente'
  }
});

module.exports = mongoose.models.Vente || mongoose.model('Vente', venteSchema);