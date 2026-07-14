const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  numeroFacture: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  commandeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Commande',
    required: true
  },
  
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tiers',
    required: true
  },
  
  dateEmission: { type: Date, default: Date.now },
  dateEcheance: { type: Date, required: true },
  
  produits: [{
    produitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    nom: String,
    quantite: Number,
    prixUnitaire: Number,
    tva: Number,
    montantHT: Number,
    montantTVA: Number,
    montantTTC: Number
  }],
  
  montantHT: { type: Number, required: true },
  montantTVA: { type: Number, required: true },
  montantTTC: { type: Number, required: true },
  
  devise: { type: String, default: 'TND' },
  
  statut: { 
    type: String, 
    enum: ['En attente de paiement', 'Payée', 'Partiellement payée', 'Annulée'],
    default: 'En attente de paiement'
  },
  
  paiements: [{
    montant: Number,
    date: { type: Date, default: Date.now },
    mode: { type: String, enum: ['Especes', 'Cheque', 'Virement', 'Carte'] },
    reference: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  conditionsPaiement: String,
  notes: String,
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

factureSchema.index({ numeroFacture: 1 });
factureSchema.index({ commandeId: 1 });
factureSchema.index({ clientId: 1 });
factureSchema.index({ statut: 1 });

factureSchema.virtual('montantRestant').get(function() {
  const totalPaye = (this.paiements || []).reduce((sum, p) => sum + (p.montant || 0), 0);
  return this.montantTTC - totalPaye;
});

factureSchema.methods.ajouterPaiement = async function(montant, mode, reference, userId) {
  if (!this.paiements) this.paiements = [];
  
  this.paiements.push({ montant, mode, reference, userId, date: new Date() });
  
  const totalPaye = this.paiements.reduce((sum, p) => sum + p.montant, 0);
  
  if (totalPaye >= this.montantTTC) {
    this.statut = 'Payée';
  } else if (totalPaye > 0) {
    this.statut = 'Partiellement payée';
  }
  
  this.updatedAt = new Date();
  await this.save();
  return this;
};

factureSchema.statics.genererNumeroFacture = async function() {
  const date = new Date();
  const annee = date.getFullYear();
  const prefix = `FACT-${annee}`;
  
  const dernier = await this.findOne({
    numeroFacture: { $regex: `^${prefix}` }
  }).sort({ numeroFacture: -1 });
  
  if (!dernier) {
    return `${prefix}-0001`;
  }
  
  const sequence = parseInt(dernier.numeroFacture.slice(-4)) + 1;
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

module.exports = mongoose.models.Facture || mongoose.model('Facture', factureSchema);