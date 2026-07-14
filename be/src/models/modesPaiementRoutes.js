
const mongoose = require('mongoose');

const modePaiementSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ModePaiement', modePaiementSchema);
