const Penalty = require("../models/Penalty");
const { createAndSendNotification } = require("../config/socket");

// GET /api/penalties et /api/penalites
exports.getPenalties = async (req, res) => {
  try {
    const penalties = await Penalty.find({ type: 'retard_livraison' })
      .populate({ path: 'userId', select: 'nom prenom email role' })
      .populate({ path: 'contratId', select: 'numero montantTotal' })
      .sort({ dateCreation: -1 });

    const filtered = penalties.filter(p => p.userId?.role !== 'Admin');
    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/penalites/appliquer et /api/penalties/appliquer
exports.applyPenalties = async (req, res) => {
  try {
    const { penalites } = req.body;
    if (!Array.isArray(penalites) || penalites.length === 0) {
      return res.status(400).json({ message: 'Liste de pénalités requise' });
    }
    const created = await Penalty.insertMany(
      penalites.map(p => ({
        contratId: p.contratId,
        userId: p.userId,
        type: 'retard_livraison',
        montant: p.montant || 0,
        statut: 'en_attente',
        description: p.description || ''
      }))
    );
    res.json({ success: true, count: created.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/penalties
exports.createPenalty = async (req, res) => {
  try {
    const penalty = await Penalty.create(req.body);

    await createAndSendNotification(
      penalty.userId,
      'Pénalité appliquée',
      `Une pénalité de ${penalty.montant} TND a été appliquée pour ${penalty.type}`,
      'warning',
      { penaltyId: penalty._id }
    );

    res.status(201).json({ success: true, data: penalty });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/penalties/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    const penalty = await Penalty.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    );
    if (!penalty) {
      return res.status(404).json({ message: 'Pénalité non trouvée' });
    }
    res.json({ success: true, data: penalty });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/penalties/:id/pay
exports.payPenalty = async (req, res) => {
  try {
    const penalty = await Penalty.findOneAndUpdate(
      { _id: req.params.id },
      { statut: 'appliquee' },
      { new: true }
    );

    if (!penalty) {
      return res.json({ success: true, message: 'Paiement enregistré' });
    }

    await createAndSendNotification(
      penalty.userId,
      'Pénalité payée',
      `Votre pénalité de ${penalty.montant} TND a été réglée avec succès.`,
      'success',
      { penaltyId: penalty._id }
    );

    res.json({ success: true, message: 'Paiement effectué avec succès', data: penalty });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.json({ success: true, message: 'Paiement enregistré' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};