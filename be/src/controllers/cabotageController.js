const Cabotage = require('../models/Cabotage');

exports.getCabotages = async (req, res) => {
  try {
    const cabotages = await Cabotage.find()
      .populate('produit')
      .populate('navireId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: cabotages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCabotage = async (req, res) => {
  try {
    const cabotage = new Cabotage({ ...req.body, createdBy: req.user.id });
    await cabotage.save();
    res.status(201).json({ success: true, data: cabotage });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateCabotage = async (req, res) => {
  try {
    const cabotage = await Cabotage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: cabotage });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteCabotage = async (req, res) => {
  try {
    await Cabotage.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Supprimé' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
// Ajoutez ces fonctions manquantes
exports.getCabotageById = async (req, res) => {
  try {
    const cabotage = await Cabotage.findById(req.params.id);
    if (!cabotage) {
      return res.status(404).json({ message: 'Cabotage non trouvé' });
    }
    res.json(cabotage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCabotageStats = async (req, res) => {
  try {
    const stats = await Cabotage.aggregate([
      // Vos statistiques ici
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};