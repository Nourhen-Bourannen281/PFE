const TypeProduit = require('../models/TypeProduit');

// ==================== LISTE ====================
exports.getTypeProduits = async (req, res) => {
  try {
    const types = await TypeProduit.find().sort({ nom: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER ====================
exports.createTypeProduit = async (req, res) => {
  try {
    const { nom, description } = req.body;
    const typeProduit = await TypeProduit.create({ nom, description });
    res.status(201).json(typeProduit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==================== MODIFIER ====================
exports.updateTypeProduit = async (req, res) => {
  try {
    const typeProduit = await TypeProduit.findByIdAndUpdate(
      req.params.id,
      { nom: req.body.nom, description: req.body.description },
      { new: true, runValidators: true }
    );
    if (!typeProduit) return res.status(404).json({ message: 'Type de produit non trouvé' });
    res.json(typeProduit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==================== SUPPRIMER ====================
exports.deleteTypeProduit = async (req, res) => {
  try {
    const typeProduit = await TypeProduit.findByIdAndDelete(req.params.id);
    if (!typeProduit) return res.status(404).json({ message: 'Type de produit non trouvé' });
    res.json({ message: 'Type de produit supprimé avec succès' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};