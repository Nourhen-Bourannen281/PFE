const Pays = require('../models/Pays');
const Banque = require('../models/Banque');
const Navire = require('../models/Navire');
const ModePaiement = require('../models/ModePaiement');
const TypeFacture = require('../models/TypeFacture');

// ====================== PAYS ======================
exports.getPays = async (req, res) => {
  try {
    const pays = await Pays.find().sort({ nom: 1 });
    res.json(pays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.createPays = async (req, res) => {
  try {
    const pays = await Pays.create(req.body);
    res.status(201).json(pays);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.updatePays = async (req, res) => {
  try {
    const pays = await Pays.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pays) return res.status(404).json({ message: 'Pays non trouvé' });
    res.json(pays);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deletePays = async (req, res) => {
  try {
    await Pays.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pays supprimé' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ====================== BANQUE ======================
exports.getBanques = async (req, res) => {
  try {
    const banques = await Banque.find().populate('pays', 'nom code');
    res.json(banques);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.createBanque = async (req, res) => {
  try {
    const banque = await Banque.create(req.body);
    res.status(201).json(banque);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.updateBanque = async (req, res) => {
  try {
    const banque = await Banque.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('pays');
    if (!banque) return res.status(404).json({ message: 'Banque non trouvée' });
    res.json(banque);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteBanque = async (req, res) => {
  try {
    await Banque.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banque supprimée' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ====================== NAVIRE ======================
exports.getNavires = async (req, res) => {
  try {
    const navires = await Navire.find().populate('pays', 'nom code');
    res.json(navires);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.createNavire = async (req, res) => {
  try {
    const navire = await Navire.create(req.body);
    res.status(201).json(navire);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.updateNavire = async (req, res) => {
  try {
    const navire = await Navire.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('pays');
    if (!navire) return res.status(404).json({ message: 'Navire non trouvé' });
    res.json(navire);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteNavire = async (req, res) => {
  try {
    await Navire.findByIdAndDelete(req.params.id);
    res.json({ message: 'Navire supprimé' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ====================== MODE PAIEMENT ======================
exports.getModePaiements = async (req, res) => {
  try {
    const modes = await ModePaiement.find().sort({ nom: 1 });
    res.json(modes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.createModePaiement = async (req, res) => {
  try {
    const mode = await ModePaiement.create(req.body);
    res.status(201).json(mode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.updateModePaiement = async (req, res) => {
  try {
    const mode = await ModePaiement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mode) return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    res.json(mode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteModePaiement = async (req, res) => {
  try {
    await ModePaiement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mode de paiement supprimé' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ====================== TYPE FACTURE ======================
exports.getTypeFactures = async (req, res) => {
  try {
    const types = await TypeFacture.find().sort({ nom: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.createTypeFacture = async (req, res) => {
  try {
    const type = await TypeFacture.create(req.body);
    res.status(201).json(type);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.updateTypeFacture = async (req, res) => {
  try {
    const type = await TypeFacture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!type) return res.status(404).json({ message: 'Type de facture non trouvé' });
    res.json(type);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.deleteTypeFacture = async (req, res) => {
  try {
    await TypeFacture.findByIdAndDelete(req.params.id);
    res.json({ message: 'Type de facture supprimé' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};