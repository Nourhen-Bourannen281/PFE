const mongoose = require("mongoose");

const ligneDevisSchema = new mongoose.Schema({
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  designation: { type: String, required: true },
  quantite: { type: Number, required: true, min: 0 },
  prixUnitaire: { type: Number, required: true, min: 0 },
  remise: { type: Number, default: 0, min: 0, max: 100 },
  montantHT: { type: Number, default: 0 }
}, { _id: false });

const devisSchema = new mongoose.Schema({
  numeroDevis: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commercial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lignes: [ligneDevisSchema],
  montantHT: { type: Number, default: 0 },
  remiseGlobale: { type: Number, default: 0, min: 0, max: 100 },
  montantApresRemise: { type: Number, default: 0 },
  tva: { type: Number, default: 19 },
  montantTVA: { type: Number, default: 0 },
  montantTTC: { type: Number, default: 0 },
  devise: { type: String, default: 'TND' },
  statut: {
    type: String,
    enum: [
      'Brouillon',
      'Envoyé',
      'Accepté',
      'Refusé',
      'Expiré',
      'Converti'
    ],
    default: 'Brouillon'
  },
  dateDevis: { type: Date, default: Date.now },
  dateExpiration: { type: Date },
  dateAcceptation: { type: Date },
  conditionsPaiement: { type: String, default: '' },
  delaiLivraison: { type: String, default: '' },
  noteInterne: { type: String, default: '' },
  noteClient: { type: String, default: '' },
  contratGenere: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContratVente',
    default: null
  },
  signatureClient: { type: Boolean, default: false },
  dateSignature: { type: Date }
}, { timestamps: true });

// Calcul automatique des montants avant sauvegarde
devisSchema.pre('save', function(next) {
  // Calcul montant HT de chaque ligne
  this.lignes.forEach(ligne => {
    const montantBrut = ligne.quantite * ligne.prixUnitaire;
    ligne.montantHT = montantBrut - (montantBrut * ligne.remise / 100);
  });

  // Total HT
  this.montantHT = this.lignes.reduce((sum, l) => sum + l.montantHT, 0);

  // Remise globale
  this.montantApresRemise = this.montantHT - (this.montantHT * this.remiseGlobale / 100);

  // TVA et TTC
  this.montantTVA = this.montantApresRemise * this.tva / 100;
  this.montantTTC = this.montantApresRemise + this.montantTVA;

  next();
});

module.exports = mongoose.models.Devis || mongoose.model('Devis', devisSchema);