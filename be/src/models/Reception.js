const mongoose = require("mongoose");

const receptionSchema = new mongoose.Schema({
  numeroReception: { type: String, required: true, unique: true },
  commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' },
  dateReception: { type: Date, default: Date.now },
  statut: {
    type: String,
    enum: ['En attente', 'Validée', 'Rejetée'],
    default: 'En attente'
  }
});

module.exports = mongoose.models.Reception || mongoose.model('Reception', receptionSchema);