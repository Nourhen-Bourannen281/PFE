const Commande = require('../models/Commande');
const Facture = require('../models/Facture');
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// ==================== VERIFIER STOCKS ====================
exports.verifierStocks = async (req, res) => {
  try {
    const { produits } = req.body;
    const ruptures = [];
    let disponible = true;
    
    if (!produits || !produits.length) {
      return res.json({ success: true, disponible: true, ruptures: [] });
    }
    
    for (const item of produits) {
      const productId = item.sousProduit || item.produitId;
      if (!productId) continue;
      
      const stock = await Stock.findOne({ product: productId });
      const stockDisponible = stock?.quantity || 0;
      const quantiteDemandee = item.quantite || 0;
      
      if (stockDisponible < quantiteDemandee) {
        disponible = false;
        const product = await Product.findById(productId);
        ruptures.push({
          produitId: productId,
          nom: product?.nom || 'Produit',
          quantiteDemandee: quantiteDemandee,
          stockDisponible: stockDisponible,
          manquant: quantiteDemandee - stockDisponible
        });
      }
    }
    
    res.json({ success: true, disponible, ruptures });
  } catch (err) {
    console.error('Erreur verifierStocks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==================== GET COMMANDES ====================
exports.getCommandes = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role !== 'Admin' && req.user.role !== 'Commercial') {
      query.user = req.user.id;
    }
    
    const commandes = await Commande.find(query)
      .populate('user', 'nom email')
      .sort({ dateCreation: -1 });
    
    res.json({ success: true, data: commandes });
  } catch (err) {
    console.error('Erreur getCommandes:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('user', 'nom email telephone');
    
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    if (req.user.role !== 'Admin' && req.user.role !== 'Commercial' && commande.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    
    res.json({ success: true, data: commande });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserCommandes = async (req, res) => {
  try {
    const commandes = await Commande.find({ user: req.user.id })
      .sort({ dateCreation: -1 });
    
    res.json({ success: true, data: commandes });
  } catch (err) {
    console.error('Erreur getUserCommandes:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== CREATE COMMANDE ====================
exports.createCommande = async (req, res) => {
  try {
    console.log('========== CRÉATION COMMANDE ==========');
    console.log('Utilisateur:', req.user.id, req.user.email);
    
    const { produits, devise = 'TND', notes, conditionsPaiement, dateLivraisonPrevue } = req.body;
    
    if (!produits || produits.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun produit dans la commande' });
    }
    
    // Valider et enrichir les produits
    for (const item of produits) {
      if (!item.sousProduit || !item.quantite) {
        return res.status(400).json({ success: false, message: 'Produit incomplet' });
      }
      if (item.quantite <= 0) {
        return res.status(400).json({ success: false, message: 'Quantité invalide' });
      }
      
      if (!item.prixUnitaire || item.prixUnitaire === 0) {
        const product = await Product.findById(item.sousProduit);
        if (product && product.prixUnitaire) {
          item.prixUnitaire = product.prixUnitaire;
        } else {
          return res.status(400).json({ 
            success: false, 
            message: `Prix non défini pour ${item.nom}` 
          });
        }
      }
      
      const stock = await Stock.findOne({ product: item.sousProduit });
      if (!stock || stock.quantity < item.quantite) {
        const product = await Product.findById(item.sousProduit);
        return res.status(400).json({ 
          success: false, 
          message: `Stock insuffisant pour ${product?.nom || item.nom}. Disponible: ${stock?.quantity || 0}` 
        });
      }
    }
    
    const numeroCommande = await Commande.genererNumero();
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    const commande = new Commande({
      numeroCommande,
      user: req.user.id,
      userNom: user.nom || user.email?.split('@')[0] || 'Client',
      userEmail: user.email,
      userTelephone: user.telephone || '',
      userAdresse: user.adresse || '',
      produits: produits.map(p => ({
        sousProduit: p.sousProduit,
        nom: p.nom || 'Produit',
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
        remise: p.remise || 0,
        tva: p.tva || 19
      })),
      devise,
      statut: 'En attente',
      dateLivraisonPrevue: dateLivraisonPrevue || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      conditionsPaiement: conditionsPaiement || '30 jours',
      notes: notes || `Commande créée par ${user.nom || user.email}`
    });
    
    await commande.save();
    
    console.log('✅ Commande créée:', commande.numeroCommande, 'Montant:', commande.montantTTC);
    
    res.status(201).json({ 
      success: true, 
      data: commande,
      message: `Commande ${numeroCommande} créée. Total: ${commande.montantTTC.toLocaleString()} ${commande.devise}`
    });
    
  } catch (err) {
    console.error('❌ Erreur createCommande:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== VALIDER COMMANDE (avec facture) - CORRIGÉ ====================
exports.validerCommande = async (req, res) => {
  try {
    const { statut } = req.body;
    
    console.log('📝 Validation commande:', req.params.id, 'Statut:', statut);
    
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    if (commande.statut !== 'En attente') {
      return res.status(400).json({ success: false, message: 'Cette commande a déjà été traitée' });
    }
    
    let factureGeneree = null;
    
    if (statut === 'Validée') {
      // Vérifier les stocks
      for (const item of commande.produits) {
        const stock = await Stock.findOne({ product: item.sousProduit });
        if (!stock || stock.quantity < item.quantite) {
          const product = await Product.findById(item.sousProduit);
          return res.status(400).json({ 
            success: false, 
            message: `Stock insuffisant pour ${product?.nom || item.nom || 'le produit'}`
          });
        }
      }
      
      // Déduire les stocks
      for (const item of commande.produits) {
        await Stock.findOneAndUpdate(
          { product: item.sousProduit },
          { $inc: { quantity: -item.quantite }, $set: { lastUpdated: new Date() } }
        );
      }
      
      // Créer la facture
      const date = new Date();
      const annee = date.getFullYear();
      const factureCount = await Facture.countDocuments();
      const numeroFacture = `FACT-${annee}-${String(factureCount + 1).padStart(4, '0')}`;
      const dateEcheance = new Date();
      dateEcheance.setDate(dateEcheance.getDate() + 30);
      
      factureGeneree = await Facture.create({
        numeroFacture,
        commandeId: commande._id,
        clientId: commande.user,
        clientNom: commande.userNom,
        clientEmail: commande.userEmail,
        dateEmission: new Date(),
        dateEcheance,
        produits: commande.produits.map(p => ({
          produitId: p.sousProduit,
          nom: p.nom,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire,
          tva: p.tva,
          montantHT: p.montantHT,
          montantTVA: p.montantTTC - p.montantHT,
          montantTTC: p.montantTTC
        })),
        montantHT: commande.montantHT,
        montantTVA: commande.montantTVA,
        montantTTC: commande.montantTTC,
        devise: commande.devise,
        statut: 'En attente de paiement',
        conditionsPaiement: commande.conditionsPaiement,
        notes: `Facture générée depuis la commande ${commande.numeroCommande}`,
        createdBy: req.user._id
      });
      
      console.log(`✅ Facture ${numeroFacture} créée pour ${commande.userNom} - Montant: ${commande.montantTTC} TND`);
    }
    
    commande.statut = statut;
    commande.commercial = req.user.id;
    commande.dateValidation = new Date();
    await commande.save();
    
    res.json({ 
      success: true, 
      data: commande,
      facture: factureGeneree ? { 
        _id: factureGeneree._id, 
        numeroFacture: factureGeneree.numeroFacture,
        montantTTC: factureGeneree.montantTTC
      } : null,
      message: statut === 'Validée' ? 'Commande validée et facture générée' : 'Commande refusée'
    });
    
  } catch (err) {
    console.error('Erreur validerCommande:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== CHANGE STATUT ====================
exports.changeStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const commande = await Commande.findById(req.params.id);
    
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    commande.statut = statut;
    if (statut === 'Livrée') {
      commande.dateLivraisonReelle = new Date();
    }
    await commande.save();
    
    res.json({ success: true, data: commande });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== UPDATE COMMANDE ====================
exports.updateCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    if (req.user.role !== 'Admin' && req.user.role !== 'Commercial' && commande.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    if (commande.statut !== 'En attente') {
      return res.status(400).json({ success: false, message: 'Seules les commandes en attente peuvent être modifiées' });
    }
    
    const { produits, devise, notes, conditionsPaiement, dateLivraisonPrevue } = req.body;
    
    if (produits) {
      for (const item of produits) {
        const stock = await Stock.findOne({ product: item.sousProduit });
        if (!stock || stock.quantity < item.quantite) {
          const product = await Product.findById(item.sousProduit);
          return res.status(400).json({ 
            success: false, 
            message: `Stock insuffisant pour ${product?.nom || item.nom}` 
          });
        }
      }
      
      commande.produits = produits.map(p => ({
        sousProduit: p.sousProduit,
        nom: p.nom || 'Produit',
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
        remise: p.remise || 0,
        tva: p.tva || 19
      }));
      
      commande.recalculerTotaux();
    }
    
    if (devise) commande.devise = devise;
    if (notes) commande.notes = notes;
    if (conditionsPaiement) commande.conditionsPaiement = conditionsPaiement;
    if (dateLivraisonPrevue) commande.dateLivraisonPrevue = dateLivraisonPrevue;
    
    await commande.save();
    
    res.json({ success: true, data: commande });
  } catch (err) {
    console.error('Erreur updateCommande:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== DELETE COMMANDE ====================
exports.deleteCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    if (req.user.role !== 'Admin' && req.user.role !== 'Commercial' && commande.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    if (commande.statut !== 'En attente') {
      return res.status(400).json({ success: false, message: 'Seules les commandes en attente peuvent être supprimées' });
    }
    
    await Commande.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Commande supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== STATISTIQUES ====================
exports.getCommandesStats = async (req, res) => {
  try {
    const total = await Commande.countDocuments();
    const enAttente = await Commande.countDocuments({ statut: 'En attente' });
    const validee = await Commande.countDocuments({ statut: 'Validée' });
    const livree = await Commande.countDocuments({ statut: 'Livrée' });
    const refusee = await Commande.countDocuments({ statut: 'Refusée' });
    
    const totalMontant = await Commande.aggregate([
      { $match: { statut: { $in: ['Validée', 'Livrée'] } } },
      { $group: { _id: null, total: { $sum: '$montantTTC' } } }
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        total, enAttente, validee, livree, refusee,
        montantTotal: totalMontant[0]?.total || 0
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== EXPORT PDF ====================
exports.exportCommandePDF = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id).lean();
    
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=commande_${commande.numeroCommande}.pdf`);
      res.send(pdfBuffer);
    });
    
    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').text('BON DE COMMANDE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N° ${commande.numeroCommande}`, { align: 'center' });
    doc.moveDown();
    
    // Informations client
    doc.fontSize(12).font('Helvetica-Bold').text('Informations client', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Client: ${commande.userNom}`);
    doc.text(`Email: ${commande.userEmail}`);
    if (commande.userTelephone) doc.text(`Tél: ${commande.userTelephone}`);
    if (commande.userAdresse) doc.text(`Adresse: ${commande.userAdresse}`);
    doc.moveDown();
    
    // Informations commande
    doc.fontSize(12).font('Helvetica-Bold').text('Détails commande', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Date: ${new Date(commande.dateCreation).toLocaleDateString('fr-FR')}`);
    doc.text(`Statut: ${commande.statut}`);
    doc.text(`Conditions de paiement: ${commande.conditionsPaiement || '30 jours'}`);
    if (commande.dateLivraisonPrevue) {
      doc.text(`Livraison prévue: ${new Date(commande.dateLivraisonPrevue).toLocaleDateString('fr-FR')}`);
    }
    doc.moveDown();
    
    // Produits
    doc.fontSize(12).font('Helvetica-Bold').text('Produits commandés', { underline: true });
    doc.moveDown(0.5);
    
    let y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Produit', 50, y);
    doc.text('Qté', 250, y);
    doc.text('Prix U.', 320, y);
    doc.text('TVA', 380, y);
    doc.text('Total TTC', 450, y);
    
    doc.fontSize(10).font('Helvetica');
    y += 20;
    
    for (const item of commande.produits) {
      const totalTTC = item.quantite * item.prixUnitaire * (1 + (item.tva || 19) / 100);
      doc.text(item.nom || 'Produit', 50, y, { width: 180 });
      doc.text(String(item.quantite), 250, y);
      doc.text(`${item.prixUnitaire.toLocaleString()}`, 320, y);
      doc.text(`${item.tva || 19}%`, 380, y);
      doc.text(`${totalTTC.toLocaleString()} ${commande.devise}`, 450, y);
      y += 20;
    }
    
    // Totaux
    y += 20;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total HT: ${(commande.montantHT || 0).toLocaleString()} ${commande.devise}`, 350, y);
    y += 20;
    doc.text(`TVA: ${(commande.montantTVA || 0).toLocaleString()} ${commande.devise}`, 350, y);
    y += 20;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total TTC: ${(commande.montantTTC || 0).toLocaleString()} ${commande.devise}`, 350, y);
    
    if (commande.notes) {
      y += 40;
      doc.fontSize(10).font('Helvetica');
      doc.text('Notes:', 50, y);
      y += 15;
      doc.text(commande.notes, 50, y, { width: 450 });
    }
    
    doc.end();
  } catch (err) {
    console.error('Erreur exportPDF:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};