const mongoose = require("mongoose");

const livraisonSchema = new mongoose.Schema({
  numeroLivraison: { 
    type: String, 
    required: true, 
    unique: true 
  },
  commande: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Commande' 
  },
  transporteur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  dateLivraison: { 
    type: Date 
  },
  adresseLivraison: { 
    type: String 
  },
  commentaire: { 
    type: String, 
    default: '' 
  },
  statut: {
    type: String,
    enum: ['En attente', 'Prête', 'En cours', 'Livrée', 'Annulée'],
    default: 'En attente'
  },
  etat: {
    type: String,
    enum: ['À préparer', 'Prête', 'En cours', 'Livrée', 'Annulée'],
    default: 'À préparer'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateDerniereMiseAJour: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Middleware pre-save pour mettre à jour dateDerniereMiseAJour
livraisonSchema.pre('save', function(next) {
  this.dateDerniereMiseAJour = new Date();
  next();
});

// Middleware pre-findOneAndUpdate pour mettre à jour dateDerniereMiseAJour
livraisonSchema.pre('findOneAndUpdate', function(next) {
  this.set({ dateDerniereMiseAJour: new Date() });
  next();
});

module.exports = mongoose.models.Livraison || mongoose.model('Livraison', livraisonSchema);