const mongoose = require('mongoose');

// backend/models/ContratVente.js (devrait ressembler à ça)
const contratVenteSchema = new mongoose.Schema({
  numeroContrat: { type: String, required: true, unique: true },
  produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantite: { type: Number, required: true, min: 0 },
  prixUnitaire: { type: Number, required: true, min: 0 },
  montantTotal: { type: Number, required: true },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  statut: {
    type: String,
    enum: ['Brouillon', 'En Cours', 'Terminé', 'Annulé'],
    default: 'Brouillon'
  },
  conditionsPaiement: { type: String, default: '' },
  livraisonEffectuee: { type: Boolean, default: false },
  quantiteLivree: { type: Number, default: 0 }
}, { timestamps: true });

contratVenteSchema.pre('save', function(next) {
  this.montantTotal = this.quantite * this.prixUnitaire;
  next();
});

module.exports = mongoose.models.ContratVente || mongoose.model('ContratVente', contratVenteSchema);
