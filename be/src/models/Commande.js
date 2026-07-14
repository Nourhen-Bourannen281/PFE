const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  numeroCommande: { 
    type: String, 
    required: true, 
    unique: true 
  },
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tiers',
    required: false 
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userNom: { type: String, required: true },
  userEmail: { type: String, required: true },
  userTelephone: { type: String, default: '' },
  userAdresse: { type: String, default: '' },
  
  commercial: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  produits: [{
    sousProduit: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    nom: { type: String, required: true },
    quantite: { type: Number, required: true, min: 0.001 },
    prixUnitaire: { type: Number, required: true, min: 0 },
    remise: { type: Number, default: 0 },
    tva: { type: Number, default: 19 },
    montantHT: { type: Number, default: 0 },
    montantTTC: { type: Number, default: 0 }
  }],
  montantTotal: { type: Number, default: 0 },
  montantHT: { type: Number, default: 0 },
  montantTVA: { type: Number, default: 0 },
  montantTTC: { type: Number, default: 0 },
  devise: { type: String, default: 'TND' },
  statut: { 
    type: String, 
    enum: ['En attente', 'Validée', 'Refusée', 'Livrée', 'Annulée'], 
    default: 'En attente' 
  },
  dateCreation: { type: Date, default: Date.now },
  dateValidation: Date,
  dateLivraisonPrevue: Date,
  dateLivraisonReelle: Date,
  conditionsPaiement: { type: String, default: '30 jours' },
  notes: { type: String }
}, { 
  timestamps: true 
});

commandeSchema.pre('save', function(next) {
  let totalHT = 0;
  let totalTTC = 0;
  
  this.produits.forEach(p => {
    const montantHT = p.quantite * p.prixUnitaire;
    const montantTTC = montantHT * (1 + p.tva / 100);
    
    p.montantHT = montantHT;
    p.montantTTC = montantTTC;
    
    totalHT += montantHT;
    totalTTC += montantTTC;
  });
  
  this.montantHT = totalHT;
  this.montantTTC = totalTTC;
  this.montantTVA = totalTTC - totalHT;
  this.montantTotal = totalTTC;
  
  next();
});

commandeSchema.methods.recalculerTotaux = function() {
  let totalHT = 0;
  let totalTTC = 0;
  
  this.produits.forEach(p => {
    const montantHT = p.quantite * p.prixUnitaire;
    const montantTTC = montantHT * (1 + p.tva / 100);
    
    p.montantHT = montantHT;
    p.montantTTC = montantTTC;
    
    totalHT += montantHT;
    totalTTC += montantTTC;
  });
  
  this.montantHT = totalHT;
  this.montantTTC = totalTTC;
  this.montantTVA = totalTTC - totalHT;
  this.montantTotal = totalTTC;
  
  return this;
};

commandeSchema.statics.genererNumero = async function() {
  const count = await this.countDocuments();
  const annee = new Date().getFullYear();
  const mois = String(new Date().getMonth() + 1).padStart(2, '0');
  return `CMD-${annee}${mois}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Commande', commandeSchema);