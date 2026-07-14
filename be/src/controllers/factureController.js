// backend/src/controllers/factureController.js
const Facture = require('../models/Facture');
const Tiers = require('../models/Tiers');
const PDFDocument = require('pdfkit');

exports.getFactures = async (req, res) => {
  try {
    const factures = await Facture.find({})
      .populate('commandeId', 'numeroCommande')
      .populate('clientId', 'raisonSociale nom email')
      .sort({ dateEmission: -1 });
    
    res.json({ success: true, data: factures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFactureById = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('commandeId')
      .populate('clientId');
    
    if (!facture) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }
    
    res.json({ success: true, data: facture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFactureByCommande = async (req, res) => {
  try {
    const facture = await Facture.findOne({ commandeId: req.params.commandeId });
    if (!facture) {
      return res.status(404).json({ success: false, message: 'Aucune facture trouvée' });
    }
    res.json({ success: true, data: facture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMesFactures = async (req, res) => {
  try {
    const client = await Tiers.findOne({ user: req.user.id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }
    
    const factures = await Facture.find({ clientId: client._id })
      .populate('commandeId', 'numeroCommande')
      .sort({ dateEmission: -1 });
    
    res.json({ success: true, data: factures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.ajouterPaiement = async (req, res) => {
  try {
    const { montant, mode, reference } = req.body;
    const facture = await Facture.findById(req.params.id);
    
    if (!facture) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }
    
    if (facture.statut === 'Payée') {
      return res.status(400).json({ success: false, message: 'Facture déjà payée' });
    }
    
    await facture.ajouterPaiement(montant, mode, reference, req.user._id);
    
    res.json({ success: true, data: facture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFacturesStats = async (req, res) => {
  try {
    const total = await Facture.countDocuments();
    const enAttente = await Facture.countDocuments({ statut: 'En attente de paiement' });
    const payees = await Facture.countDocuments({ statut: 'Payée' });
    
    const resultat = await Facture.aggregate([
      { $group: { _id: null, totalMontant: { $sum: '$montantTTC' } } }
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        total, enAttente, payees,
        montantTotal: resultat[0]?.totalMontant || 0
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportFacturePDF = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('clientId');
    
    if (!facture) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }
    
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=facture_${facture.numeroFacture}.pdf`);
      res.send(pdfBuffer);
    });
    
    doc.fontSize(20).font('Helvetica-Bold').text('FACTURE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`N° ${facture.numeroFacture}`, { align: 'center' });
    doc.moveDown();
    
    const client = facture.clientId;
    doc.fontSize(12).font('Helvetica-Bold').text('Client', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(client?.raisonSociale || client?.nom || 'Client');
    doc.moveDown();
    
    doc.fontSize(10);
    doc.text(`Date d'émission: ${new Date(facture.dateEmission).toLocaleDateString('fr-FR')}`);
    doc.text(`Date d'échéance: ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}`);
    doc.text(`Statut: ${facture.statut}`);
    doc.moveDown();
    
    let y = doc.y + 10;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Produit', 50, y);
    doc.text('Qté', 250, y);
    doc.text('Prix U.', 320, y);
    doc.text('Total', 400, y);
    
    doc.fontSize(10).font('Helvetica');
    y += 20;
    
    for (const p of facture.produits) {
      doc.text(p.nom, 50, y);
      doc.text(String(p.quantite), 250, y);
      doc.text(`${p.prixUnitaire.toLocaleString()} ${facture.devise}`, 320, y);
      doc.text(`${p.montantTTC.toLocaleString()} ${facture.devise}`, 400, y);
      y += 20;
    }
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total TTC: ${facture.montantTTC.toLocaleString()} ${facture.devise}`, 350, y + 20);
    
    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};