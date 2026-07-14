// backend/src/models/Contrat.js - Version complète et unifiée
const mongoose = require('mongoose');

const contratSchema = new mongoose.Schema({
  // ==================== IDENTIFIANTS ====================
  numeroContrat: { 
    type: String, 
    required: true, 
    unique: true 
  },
  numero: { 
    type: String, 
    unique: true, 
    sparse: true  // Alias pour compatibilité
  },
  
  // ==================== TYPE DE CONTRAT ====================
  type: { 
    type: String, 
    enum: ['Vente', 'Achat', 'vente', 'achat', 'export', 'Vente', 'Achat'], 
    required: true 
  },
  
  // ==================== PARTIES PRENANTES ====================
  // Version 1 - Tiers
  tiers: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tiers' 
  },
  // Version 2 - Client et Commercial
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  commercialId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  // Alias pour compatibilité
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  fournisseur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  importateur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // ==================== PRODUITS ====================
  produits: [{
    // Références
    sousProduit: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'SousProduit' 
    },
    produit: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    
    // Informations produit
    nom: { 
      type: String 
    },
    code: { 
      type: String 
    },
    description: { 
      type: String 
    },
    
    // Quantités et prix
    quantite: { 
      type: Number, 
      required: true, 
      min: [1, 'La quantité doit être au moins 1']
    },
    prixUnitaire: { 
      type: Number, 
      required: true, 
      min: [0, 'Le prix unitaire doit être positif']
    },
    
    // Remises et taxes
    remise: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    tva: { 
      type: Number, 
      default: 19 
    },
    
    // Montants calculés
    montantHT: { 
      type: Number 
    },
    montantTTC: { 
      type: Number 
    },
    
    // Suivi livraison
    quantiteLivree: { 
      type: Number, 
      default: 0 
    },
    quantiteRestante: { 
      type: Number, 
      default: 0 
    },
    echeances: [{
      date: Date,
      quantite: Number,
      livree: { type: Boolean, default: false },
      dateLivraison: Date
    }]
  }],
  
  // ==================== MONTANTS ====================
  montantTotal: { 
    type: Number, 
    default: 0 
  },
  montant: { 
    type: Number, 
    sparse: true  // Alias pour compatibilité
  },
  montantHT: { 
    type: Number, 
    default: 0 
  },
  montantTVA: { 
    type: Number, 
    default: 0 
  },
  montantTTC: { 
    type: Number, 
    default: 0 
  },
  
  // ==================== DEVISES ET PAIEMENT ====================
  devise: { 
    type: String, 
    default: 'TND', 
    enum: ['TND', 'USD', 'EUR', 'GBP', 'CAD'] 
  },
  tauxChange: { 
    type: Number, 
    default: 1 
  },
  conditionsPaiement: { 
    type: String, 
    default: '' 
  },
  modePaiement: { 
    type: String, 
    enum: ['Especes', 'Cheque', 'Virement', 'Credit', 'Lettre de credit', 'Crédit documentaire'],
    default: 'Virement' 
  },
  echeancesPaiement: [{
    date: Date,
    montant: Number,
    paye: { type: Boolean, default: false },
    datePaiement: Date,
    reference: String
  }],
  
  // ==================== DATES ====================
  dateDebut: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  dateFin: { 
    type: Date,
    required: true 
  },
  dateCreation: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  dateValidation: { 
    type: Date 
  },
  dateSignature: { 
    type: Date 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // ==================== STATUTS ====================
  statut: { 
    type: String, 
    enum: [
      // Version 1
      'En cours', 'Validé', 'Terminé',
      // Version 2
      'brouillon', 'en_attente', 'valide', 'rejete', 'termine',
      // Version 3
      'En attente', 'Validé admin', 'Signé', 'Annulé'
    ], 
    default: 'brouillon' 
  },
  
  // ==================== DOCUMENTS ====================
  documents: [{
    nom: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['PDF', 'DOC', 'DOCX', 'IMG', 'AUTRE'], default: 'PDF' },
    taille: Number,
    dateUpload: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // ==================== INFORMATIONS COMPLÉMENTAIRES ====================
  description: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  conditionsGenerales: { 
    type: String 
  },
  clausesSpeciales: { 
    type: String 
  },
  
  // ==================== SUIVI ====================
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  validePar: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  historique: [{
    action: { type: String },
    utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    details: { type: String },
    ancienStatut: String,
    nouveauStatut: String
  }],
  
  // ==================== LIVRAISON ====================
  livraison: {
    adresse: {
      rue: String,
      ville: String,
      codePostal: String,
      pays: String
    },
    transporteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dateLivraisonPrevue: Date,
    dateLivraisonReelle: Date,
    fraisLivraison: { type: Number, default: 0 }
  },
  
  // ==================== PENALITES ====================
  penalites: {
    retardLivraison: { type: Number, default: 0 },  // Pourcentage par jour
    retardPaiement: { type: Number, default: 0 },   // Pourcentage par jour
    montantMax: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEX ====================
contratSchema.index({ numeroContrat: 1 });
contratSchema.index({ numero: 1 });
contratSchema.index({ clientId: 1 });
contratSchema.index({ tiers: 1 });
contratSchema.index({ statut: 1 });
contratSchema.index({ dateDebut: -1 });
contratSchema.index({ dateFin: 1 });
contratSchema.index({ type: 1 });
contratSchema.index({ 'produits.sousProduit': 1 });

// ==================== PRE-SAVE MIDDLEWARE ====================
contratSchema.pre('save', async function(next) {
  try {
    // Mettre à jour updatedAt
    this.updatedAt = Date.now();
    
    // Aligner les numéros
    if (!this.numeroContrat && this.numero) {
      this.numeroContrat = this.numero;
    } else if (!this.numero && this.numeroContrat) {
      this.numero = this.numeroContrat;
    }
    
    // Aligner clientId et client
    if (this.clientId && !this.client) {
      this.client = this.clientId;
    }
    if (this.client && !this.clientId) {
      this.clientId = this.client;
    }
    
    // Normaliser le type
    if (this.type) {
      const typeMap = {
        'Vente': 'Vente',
        'vente': 'Vente',
        'Achat': 'Achat',
        'achat': 'Achat',
        'export': 'Vente'
      };
      this.type = typeMap[this.type] || this.type;
    }
    
    // Calculer les montants
    if (this.produits && this.produits.length > 0) {
      let montantHT = 0;
      let montantTTC = 0;
      
      for (const produit of this.produits) {
        // Calculer montant HT
        const montantProduitHT = produit.quantite * produit.prixUnitaire;
        const remiseMontant = montantProduitHT * (produit.remise / 100);
        const montantApresRemise = montantProduitHT - remiseMontant;
        const tvaMontant = montantApresRemise * (produit.tva / 100);
        
        produit.montantHT = montantApresRemise;
        produit.montantTTC = montantApresRemise + tvaMontant;
        produit.quantiteRestante = produit.quantite - (produit.quantiteLivree || 0);
        
        montantHT += produit.montantHT;
        montantTTC += produit.montantTTC;
      }
      
      this.montantHT = montantHT;
      this.montantTotal = montantHT;
      this.montant = montantHT;  // Alias
      this.montantTVA = montantTTC - montantHT;
      this.montantTTC = montantTTC;
    }
    
    // Mettre à jour dateValidation si nécessaire
    if (this.statut === 'valide' && !this.dateValidation) {
      this.dateValidation = new Date();
    }
    if (this.statut === 'Validé' && !this.dateValidation) {
      this.dateValidation = new Date();
    }
    
    // Aligner createdAt et dateCreation
    if (!this.dateCreation && this.createdAt) {
      this.dateCreation = this.createdAt;
    } else if (!this.createdAt && this.dateCreation) {
      this.createdAt = this.dateCreation;
    }
    
    next();
  } catch (err) {
    next(err);
  }
});

// ==================== POST-SAVE MIDDLEWARE ====================
contratSchema.post('save', function(doc) {
  console.log(`📄 Contrat ${doc.numeroContrat} sauvegardé - Statut: ${doc.statut}`);
});

// ==================== VIRTUALS ====================
contratSchema.virtual('estActif').get(function() {
  const now = new Date();
  return this.statut !== 'termine' && 
         this.statut !== 'Terminé' && 
         this.statut !== 'annule' && 
         this.statut !== 'Annulé' &&
         this.dateDebut <= now && 
         this.dateFin >= now;
});

contratSchema.virtual('estExpire').get(function() {
  return new Date() > this.dateFin && this.estActif === false;
});

contratSchema.virtual('joursRestants').get(function() {
  if (this.estExpire) return 0;
  const diff = this.dateFin - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

contratSchema.virtual('montantTotalRestant').get(function() {
  let totalRestant = 0;
  if (this.produits) {
    totalRestant = this.produits.reduce((sum, produit) => {
      return sum + (produit.quantiteRestante * produit.prixUnitaire);
    }, 0);
  }
  return totalRestant;
});

// ==================== METHODS ====================

// Ajouter une entrée dans l'historique
contratSchema.methods.ajouterHistorique = async function(action, utilisateurId, details = null, ancienStatut = null, nouveauStatut = null) {
  if (!this.historique) this.historique = [];
  
  this.historique.push({
    action,
    utilisateur: utilisateurId,
    date: new Date(),
    details,
    ancienStatut,
    nouveauStatut
  });
  
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Changer le statut
contratSchema.methods.changerStatut = async function(nouveauStatut, utilisateurId, raison = null) {
  const ancienStatut = this.statut;
  this.statut = nouveauStatut;
  
  if (nouveauStatut === 'valide' || nouveauStatut === 'Validé') {
    this.dateValidation = new Date();
    this.validePar = utilisateurId;
  }
  
  if (nouveauStatut === 'termine' || nouveauStatut === 'Terminé') {
    this.dateFin = new Date();
  }
  
  await this.ajouterHistorique(
    'Changement de statut',
    utilisateurId,
    raison,
    ancienStatut,
    nouveauStatut
  );
  
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Ajouter un document
contratSchema.methods.ajouterDocument = async function(nom, url, utilisateurId, type = 'PDF', taille = null) {
  if (!this.documents) this.documents = [];
  
  this.documents.push({
    nom,
    url,
    type,
    taille,
    dateUpload: new Date(),
    uploadedBy: utilisateurId
  });
  
  await this.ajouterHistorique(
    'Ajout document',
    utilisateurId,
    `Document ajouté: ${nom}`
  );
  
  await this.save();
  return this;
};

// Mettre à jour la livraison d'un produit
contratSchema.methods.mettreAJourLivraison = async function(produitIndex, quantiteLivree, dateLivraison = new Date()) {
  if (!this.produits[produitIndex]) {
    throw new Error('Produit non trouvé');
  }
  
  const produit = this.produits[produitIndex];
  const nouvelleQuantiteLivree = (produit.quantiteLivree || 0) + quantiteLivree;
  
  if (nouvelleQuantiteLivree > produit.quantite) {
    throw new Error('Quantité livrée dépasse la quantité commandée');
  }
  
  produit.quantiteLivree = nouvelleQuantiteLivree;
  produit.quantiteRestante = produit.quantite - nouvelleQuantiteLivree;
  
  // Vérifier si le contrat est entièrement livré
  const totalLivree = this.produits.reduce((sum, p) => sum + (p.quantiteLivree || 0), 0);
  const totalCommande = this.produits.reduce((sum, p) => sum + p.quantite, 0);
  
  if (totalLivree === totalCommande && this.statut !== 'termine' && this.statut !== 'Terminé') {
    await this.changerStatut('termine', null, 'Contrat entièrement livré');
  }
  
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// ==================== STATICS ====================

// Générer un numéro de contrat unique
contratSchema.statics.genererNumeroContrat = async function(type = 'Vente') {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = type === 'Vente' ? 'CTV' : 'CTA';
  const prefixComplet = `${prefix}-${annee}${mois}`;
  
  const dernierContrat = await this.findOne({
    numeroContrat: { $regex: `^${prefixComplet}` }
  }).sort({ numeroContrat: -1 });
  
  if (!dernierContrat) {
    return `${prefixComplet}-0001`;
  }
  
  const dernierNumero = dernierContrat.numeroContrat;
  const sequence = parseInt(dernierNumero.slice(-4)) + 1;
  return `${prefixComplet}-${String(sequence).padStart(4, '0')}`;
};

// Trouver les contrats actifs
contratSchema.statics.trouverContratsActifs = function() {
  const now = new Date();
  return this.find({
    statut: { $in: ['En cours', 'valide', 'Validé'] },
    dateDebut: { $lte: now },
    dateFin: { $gte: now }
  });
};

// Trouver les contrats expirant bientôt (dans 30 jours)
contratSchema.statics.trouverContratsExpirantBientot = function(jours = 30) {
  const now = new Date();
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + jours);
  
  return this.find({
    statut: { $nin: ['termine', 'Terminé', 'annule', 'Annulé'] },
    dateFin: { $gte: now, $lte: dateLimite }
  }).populate('clientId tiers');
};

// Statistiques par commercial
contratSchema.statics.statistiquesParCommercial = function(commercialId) {
  return this.aggregate([
    { $match: { commercialId: commercialId } },
    { $group: {
      _id: '$statut',
      total: { $sum: 1 },
      montantTotal: { $sum: '$montantTotal' }
    }}
  ]);
};

// ==================== EXPORT ====================
module.exports = mongoose.models.Contrat || mongoose.model('Contrat', contratSchema);