const Contrat = require('../models/Contrat');
const PDFService = require('../services/pdfService');
const HistoriqueController = require('./historiqueController');

// ==================== LISTE ====================
exports.getContrats = async (req, res) => {
  try {
    let contrats;
    
    // Filtrer selon le rôle
    if (req.user.role === 'Admin') {
      // Admin voit tous les contrats
      contrats = await Contrat.find()
        .populate('tiers', 'raisonSociale type')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    } 
    else if (req.user.role === 'Commercial') {
      // Commercial voit tous les contrats (pour la gestion commerciale)
      contrats = await Contrat.find()
        .populate('tiers', 'raisonSociale type')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    }
    else if (req.user.role === 'Client') {
      // Client ne voit que ses contrats (ventes)
      contrats = await Contrat.find({ 
        type: 'Vente',
        tiers: req.user._id 
      })
        .populate('tiers', 'raisonSociale type')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    }
    else if (req.user.role === 'Fournisseur') {
      // Fournisseur ne voit que ses contrats (achats)
      contrats = await Contrat.find({ 
        type: 'Achat',
        tiers: req.user._id 
      })
        .populate('tiers', 'raisonSociale type')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    }
    else {
      contrats = [];
    }
    
    res.json(contrats);
  } catch (err) {
    console.error('Erreur getContrats:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER ====================
exports.createContrat = async (req, res) => {
  try {
    // Vérifier que l'utilisateur a le droit (Commercial uniquement)
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({ 
        message: 'Accès refusé. Seuls les commerciaux peuvent créer des contrats.' 
      });
    }
    
    const contratData = {
      ...req.body,
      createdBy: req.user._id,
      montantTotal: req.body.produits?.reduce((total, p) => total + (p.quantite * p.prixUnitaire), 0) || 0
    };
    
    const contrat = await Contrat.create(contratData);
    const populatedContrat = await Contrat.findById(contrat._id)
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');
    
    // Ajout de l'historique
    await HistoriqueController.addHistorique({
      entityType: "Contrat",
      entityId: contrat._id,
      action: "Création",
      details: `Contrat #${contrat.numeroContrat} créé (Type: ${contrat.type}, Montant: ${contrat.montantTotal} ${contrat.devise})`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    res.status(201).json(populatedContrat);
  } catch (err) {
    console.error('Erreur createContrat:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== MODIFIER ====================
exports.updateContrat = async (req, res) => {
  try {
    // Vérifier que l'utilisateur a le droit (Commercial uniquement)
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({ 
        message: 'Accès refusé. Seuls les commerciaux peuvent modifier les contrats.' 
      });
    }
    
    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }
    
    // Vérifier si le contrat est déjà validé
    if (contrat.statut === 'Validé') {
      return res.status(400).json({ message: 'Impossible de modifier un contrat déjà validé' });
    }
    
    const updatedData = {
      ...req.body,
      montantTotal: req.body.produits?.reduce((total, p) => total + (p.quantite * p.prixUnitaire), 0) || 0,
      updatedAt: Date.now()
    };
    
    const updatedContrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('tiers', 'raisonSociale type')
     .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');
    
    // Ajout de l'historique
    await HistoriqueController.addHistorique({
      entityType: "Contrat",
      entityId: contrat._id,
      action: "Modification",
      details: `Contrat #${contrat.numeroContrat} modifié`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    res.json(updatedContrat);
  } catch (err) {
    console.error('Erreur updateContrat:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== SUPPRIMER ====================
exports.deleteContrat = async (req, res) => {
  try {
    // Vérifier que l'utilisateur a le droit (Commercial uniquement)
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({ 
        message: 'Accès refusé. Seuls les commerciaux peuvent supprimer les contrats.' 
      });
    }
    
    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }
    
    // Vérifier si le contrat peut être supprimé
    if (contrat.statut === 'Validé') {
      return res.status(400).json({ message: 'Impossible de supprimer un contrat déjà validé' });
    }
    
    // Ajout de l'historique
    await HistoriqueController.addHistorique({
      entityType: "Contrat",
      entityId: contrat._id,
      action: "Suppression",
      details: `Contrat #${contrat.numeroContrat} supprimé`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    await Contrat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contrat supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteContrat:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== VALIDER CONTRAT ====================
exports.validerContrat = async (req, res) => {
  try {
    // Vérifier que l'utilisateur a le droit (Commercial uniquement)
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({ 
        message: 'Accès refusé. Seuls les commerciaux peuvent valider les contrats.' 
      });
    }
    
    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }
    
    if (contrat.statut === 'Validé') {
      return res.status(400).json({ message: 'Ce contrat est déjà validé' });
    }
    
    contrat.statut = 'Validé';
    contrat.dateValidation = Date.now();
    await contrat.save();
    
    // Ajout de l'historique
    await HistoriqueController.addHistorique({
      entityType: "Contrat",
      entityId: contrat._id,
      action: "Validation",
      details: `Contrat #${contrat.numeroContrat} validé par ${req.user.nom || req.user.email}`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    const populatedContrat = await Contrat.findById(contrat._id)
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');
    
    res.json({ 
      message: 'Contrat validé avec succès', 
      contrat: populatedContrat 
    });
  } catch (err) {
    console.error('Erreur validerContrat:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== EXPORT PDF ====================
exports.exportContratPDF = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id)
      .populate('tiers', 'raisonSociale type email telephone adresse')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');
    
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }
    
    // Vérifier les droits d'accès
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    const tiersId = contrat.tiers?._id?.toString() || contrat.tiers?.toString();
    
    if (userRole === 'Admin' || userRole === 'Commercial') {
      // Accès autorisé
    }
    else if (userRole === 'Client' && contrat.type === 'Vente' && tiersId === userId) {
      // Client peut voir ses contrats de vente
    }
    else if (userRole === 'Fournisseur' && contrat.type === 'Achat' && tiersId === userId) {
      // Fournisseur peut voir ses contrats d'achat
    }
    else {
      return res.status(403).json({ message: 'Accès non autorisé à ce contrat' });
    }
    
    const pdfBuffer = await PDFService.generateContratPDF(contrat, userRole);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contrat_${contrat.numeroContrat}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== EXPORT TOUS LES CONTRATS PDF ====================
exports.exportAllContratsPDF = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        message: 'Accès refusé. Seul l\'administrateur peut exporter tous les contrats.' 
      });
    }
    
    const contrats = await Contrat.find()
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
      .sort({ dateCreation: -1 });
    
    // Créer un PDF avec tous les contrats
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=tous_les_contrats.pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });
    
    // En-tête
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .text('RAPPORT GLOBAL DES CONTRATS', { align: 'center' })
      .moveDown();
    
    doc.fontSize(10)
      .font('Helvetica')
      .text(`Nombre total de contrats: ${contrats.length}`, { align: 'center' })
      .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })
      .moveDown();
    
    // Parcourir chaque contrat
    for (let i = 0; i < contrats.length; i++) {
      const contrat = contrats[i];
      
      if (i > 0) {
        doc.addPage();
      }
      
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(`Contrat N°: ${contrat.numeroContrat}`, { underline: true })
        .moveDown(0.5);
      
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Type: ${contrat.type === 'Vente' ? '📝 Vente' : '💰 Achat'}`)
        .text(`Date: ${new Date(contrat.dateCreation).toLocaleDateString('fr-FR')}`)
        .text(`Statut: ${contrat.statut}`)
        .text(`Tiers: ${contrat.tiers?.raisonSociale || '-'}`)
        .text(`Montant total: ${contrat.montantTotal?.toLocaleString()} ${contrat.devise || 'TND'}`)
        .moveDown();
      
      // Produits
      doc.font('Helvetica-Bold')
        .text('Produits:')
        .moveDown(0.5);
      
      contrat.produits?.forEach(produit => {
        doc.font('Helvetica')
          .text(`• ${produit.sousProduit?.nom} - Quantité: ${produit.quantite} - Prix unitaire: ${produit.prixUnitaire?.toLocaleString()} ${contrat.devise || 'TND'} - Total: ${(produit.quantite * produit.prixUnitaire).toLocaleString()} ${contrat.devise || 'TND'}`);
      });
      
      doc.moveDown();
    }
    
    doc.end();
  } catch (error) {
    console.error('Erreur export tous contrats:', error);
    res.status(500).json({ message: error.message });
  }
};