const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  quantity: { type: Number, default: 0 },
  seuilMin: { type: Number, default: 1000 },
  alerteActive: { type: Boolean, default: true },
  dateDerniereMiseAJour: { type: Date, default: Date.now }
}); 
 

module.exports = mongoose.models.Stock || mongoose.model('Stock', stockSchema);
