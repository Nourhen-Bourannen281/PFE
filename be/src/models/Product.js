// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  type: { type: String, enum: ['STEG', 'STIR'], default: 'STEG' },
  description: { type: String, default: '' },
  unite: { type: String, default: 'm³' },
  prixUnitaire: { type: Number, required: true, min: 0 },
  stockInitial: { type: Number, default: 0, min: 0 },
  codeProduit: { type: String, unique: true, sparse: true },
  category: { type: String, default: 'Autre' },
  typeProduit: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeProduit' },
  uniteMesure: { type: String, enum: ['Litres', 'Barils', 'm³', 'Tonnes'], default: 'Litres' },
  prix: { type: Number, default: 0 }
}, { timestamps: true });

// Middleware pour générer un code UNIQUE automatiquement
productSchema.pre('save', function(next) {
  if (!this.codeProduit) {
    const prefix    = this.type === 'STEG' ? 'STEG' : 'STIR';
    const cleanNom  = this.nom.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() || 'PROD';
    const uniquePart = Date.now().toString(36).toUpperCase()
                     + Math.random().toString(36).substring(2, 7).toUpperCase();
    this.codeProduit = `${prefix}-${cleanNom}-${uniquePart}`;
  }
  next();
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
