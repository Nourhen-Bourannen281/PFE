const Emission = require('../models/Emission');
const Contrat = require('../models/Contrat');
const Document = require('../models/Document');
const Conformite = require('../models/Conformite');
const pdfGenerator = require('../utils/pdfGenerator');

exports.getEmissions = async (req, res) => {
  try {
    const emissions = await Emission.find()
      .populate('contrat', 'numeroContrat')
      .populate('destination', 'nom')
      .populate('produits.sousProduit', 'nom')
      .populate('documentDouanier')
      .sort({ dateCreation: -1 });
    res.json(emissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEmissionById = async (req, res) => {
  try {
    const emission = await Emission.findById(req.params.id)
      .populate('contrat', 'numeroContrat')
      .populate('destination', 'nom')
      .populate('produits.sousProduit', 'nom');
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    res.json(emission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEmission = async (req, res) => {
  try {
    const { numeroEmission, contrat, destination, dateEmission, produits } = req.body;
    
    const contratExist = await Contrat.findById(contrat);
    if (!contratExist) return res.status(404).json({ message: 'Contrat non trouvé' });
    
    const numero = numeroEmission || `EM-${Date.now()}`;
    
    const emission = await Emission.create({
      numeroEmission: numero,
      contrat,
      destination,
      dateEmission: dateEmission || Date.now(),
      produits: produits || []
    });
    
    // Générer document douanier et contrôle conformité
    const pdfPath = await pdfGenerator.generateDouanierPDF(emission, 'Emission');
    const document = await Document.create({
      type: 'CertificatDouanier',
      referenceId: emission._id,
      filePath: pdfPath,
      generePar: req.user.id
    });
    
    emission.documentDouanier = document._id;
    await emission.save();
    
    // Contrôle de conformité automatique
    await Conformite.create({
      document: document._id,
      typeControle: 'Douane',
      statut: 'Conforme',
      commentaire: `Contrôle automatique pour émission ${emission.numeroEmission}`,
      verifiePar: req.user.id
    });
    
    const populated = await Emission.findById(emission._id)
      .populate('contrat', 'numeroContrat')
      .populate('destination', 'nom');
    
    res.status(201).json(populated);
  } catch (err) {
    console.error('Erreur createEmission:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateEmission = async (req, res) => {
  try {
    const emission = await Emission.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true }
    ).populate('contrat', 'numeroContrat').populate('destination', 'nom');
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    res.json(emission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEmission = async (req, res) => {
  try {
    const emission = await Emission.findByIdAndDelete(req.params.id);
    if (!emission) return res.status(404).json({ message: 'Émission non trouvée' });
    if (emission.documentDouanier) {
      await Document.findByIdAndDelete(emission.documentDouanier);
    }
    res.json({ message: 'Émission supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/emissions/:id/statut
exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!statut) {
      return res.status(400).json({ success: false, message: 'Statut requis' });
    }

    const emission = await Emission.findByIdAndUpdate(
      req.params.id,
      { statut, updatedAt: new Date() },
      { new: true }
    )
      .populate('contrat')
      .populate('destination');

    if (!emission) {
      return res.status(404).json({ success: false, message: 'Emission introuvable' });
    }

    res.json({ success: true, data: emission, message: 'Statut mis à jour' });
  } catch (err) {
    console.error('Erreur PATCH /api/emissions/:id/statut:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.exportToCSV = async (req, res) => {
  try {
    const emissions = await Emission.find().populate('contrat', 'numeroContrat').populate('destination', 'nom');
    let csv = 'Numéro,Contrat,Destination,Date,Statut\n';
    emissions.forEach(e => {
      csv += `${e.numeroEmission},${e.contrat?.numeroContrat || ''},${e.destination?.nom || ''},${new Date(e.dateEmission).toLocaleDateString()},${e.statut}\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=emissions.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};