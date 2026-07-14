const Reception = require('../models/Reception');
const Contrat = require('../models/Contrat');
const Document = require('../models/Document');
const Conformite = require('../models/Conformite');
const pdfGenerator = require('../utils/pdfGenerator');

exports.getReceptions = async (req, res) => {
  try {
    const receptions = await Reception.find()
      .populate('contrat', 'numeroContrat')
      .populate('origine', 'nom')
      .populate('produits.sousProduit', 'nom')
      .populate('documentDouanier')
      .sort({ dateCreation: -1 });
    res.json(receptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReceptionById = async (req, res) => {
  try {
    const reception = await Reception.findById(req.params.id)
      .populate('contrat', 'numeroContrat')
      .populate('origine', 'nom')
      .populate('produits.sousProduit', 'nom');
    if (!reception) return res.status(404).json({ message: 'Réception non trouvée' });
    res.json(reception);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReception = async (req, res) => {
  try {
    const { numeroReception, contrat, origine, dateReception, produits } = req.body;
    
    const contratExist = await Contrat.findById(contrat);
    if (!contratExist) return res.status(404).json({ message: 'Contrat non trouvé' });
    
    const numero = numeroReception || `RC-${Date.now()}`;
    
    const reception = await Reception.create({
      numeroReception: numero,
      contrat,
      origine,
      dateReception: dateReception || Date.now(),
      produits: produits || []
    });
    
    const pdfPath = await pdfGenerator.generateDouanierPDF(reception, 'Reception');
    const document = await Document.create({
      type: 'CertificatDouanier',
      referenceId: reception._id,
      filePath: pdfPath,
      generePar: req.user.id
    });
    
    reception.documentDouanier = document._id;
    await reception.save();
    
    await Conformite.create({
      document: document._id,
      typeControle: 'Douane',
      statut: 'Conforme',
      commentaire: `Contrôle automatique pour réception ${reception.numeroReception}`,
      verifiePar: req.user.id
    });
    
    const populated = await Reception.findById(reception._id)
      .populate('contrat', 'numeroContrat')
      .populate('origine', 'nom');
    
    res.status(201).json(populated);
  } catch (err) {
    console.error('Erreur createReception:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateReception = async (req, res) => {
  try {
    const reception = await Reception.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true }
    ).populate('contrat', 'numeroContrat').populate('origine', 'nom');
    if (!reception) return res.status(404).json({ message: 'Réception non trouvée' });
    res.json(reception);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteReception = async (req, res) => {
  try {
    const reception = await Reception.findByIdAndDelete(req.params.id);
    if (!reception) return res.status(404).json({ message: 'Réception non trouvée' });
    if (reception.documentDouanier) {
      await Document.findByIdAndDelete(reception.documentDouanier);
    }
    res.json({ message: 'Réception supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const reception = await Reception.findByIdAndUpdate(
      req.params.id,
      { statut, dateModification: Date.now() },
      { new: true }
    );
    res.json(reception);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.exportToCSV = async (req, res) => {
  try {
    const receptions = await Reception.find().populate('contrat', 'numeroContrat').populate('origine', 'nom');
    let csv = 'Numéro,Contrat,Origine,Date,Statut\n';
    receptions.forEach(r => {
      csv += `${r.numeroReception},${r.contrat?.numeroContrat || ''},${r.origine?.nom || ''},${new Date(r.dateReception).toLocaleDateString()},${r.statut}\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=receptions.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};