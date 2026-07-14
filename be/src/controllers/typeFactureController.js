const TypeFacture = require('../models/TypeFacture');

const getTypesFacture = async (req, res) => {
  try {
    const types = await TypeFacture.find().sort({ code: 1 });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTypeFacture = async (req, res) => {
  try {
    const type = await TypeFacture.create(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTypeFacture = async (req, res) => {
  try {
    const type = await TypeFacture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!type) return res.status(404).json({ success: false, message: 'Non trouvé' });
    res.status(200).json({ success: true, data: type });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTypeFacture = async (req, res) => {
  try {
    const type = await TypeFacture.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Non trouvé' });
    res.status(200).json({ success: true, message: 'Supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTypesFacture, createTypeFacture, updateTypeFacture, deleteTypeFacture };