// backend/src/controllers/livraisonController.js - VERSION FINALE CORRECTE
const Livraison = require('../models/Livraison');
const Commande = require('../models/Commande');
const Tiers = require('../models/Tiers');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// ==================== GESTION HISTORIQUE ====================
let HistoriqueController = null;
try {
  HistoriqueController = require('./historiqueController');
  if (HistoriqueController && typeof HistoriqueController.addHistorique !== 'function') {
    HistoriqueController = { addHistorique: async () => {} };
  }
} catch (err) {
  HistoriqueController = { addHistorique: async () => {} };
}

const addHistoriqueSafe = async (data) => {
  if (HistoriqueController && typeof HistoriqueController.addHistorique === 'function') {
    try {
      await HistoriqueController.addHistorique(data);
    } catch (err) {
      console.error('Erreur historique:', err.message);
    }
  }
};

// ==================== CONSTANTES ====================
const ETAT_TO_STATUT = {
  'À préparer': 'En attente',
  'Prête': 'Prête',
  'En cours': 'En cours',
  'Livrée': 'Livrée',
  'Annulée': 'Annulée'
};

const STATUT_TO_ETAT = {
  'En attente': 'À préparer',
  'Prête': 'Prête',
  'En cours': 'En cours',
  'Livrée': 'Livrée',
  'Annulée': 'Annulée'
};

const getEtatText = (etat) => {
  const map = {
    'À préparer': '⏳ À préparer',
    'Prête': '✅ Prête',
    'En cours': '🚚 En cours',
    'Livrée': '📦 Livrée',
    'Annulée': '❌ Annulée'
  };
  return map[etat] || etat;
};

// ==================== LISTE DES LIVRAISONS ====================
exports.getLivraisons = async (req, res) => {
  try {
    const livraisons = await Livraison.find({}).sort({ _id: -1 }).lean();
    const populated = await Promise.all(
      livraisons.map(async (liv) => {
        try {
          if (liv.commande) {
            const cmd = await Commande.findById(liv.commande).populate('client', 'nom prenom email raisonSociale').lean();
            liv.commande = cmd || { _id: liv.commande };
          }
        } catch (_) {}
        try {
          if (liv.transporteur) {
            const t = await User.findById(liv.transporteur).select('nom prenom email raisonSociale code').lean();
            liv.transporteur = t || { _id: liv.transporteur };
          }
        } catch (_) {}
        return liv;
      })
    );
    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('GET /api/livraisons error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLivraisonDetail = async (req, res) => {
  try {
    const livraison = await Livraison.findById(req.params.id)
      .populate({ path: 'commande', populate: [{ path: 'client', select: 'nom prenom email raisonSociale' }] })
      .populate('transporteur', 'nom prenom email raisonSociale code telephone adresse');
    if (!livraison) {
      return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    }
    res.json({ success: true, data: livraison });
  } catch (err) {
    console.error('Erreur getLivraisonDetail:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== CRÉATION ====================
exports.createLivraison = async (req, res) => {
  try {
    const count = await Livraison.countDocuments();
    const numeroLivraison = `LIV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const { commande, transporteur, adresseLivraison, dateLivraison } = req.body;
    const livraison = await Livraison.create({
      numeroLivraison,
      ...(commande && { commande }),
      ...(transporteur && { transporteur }),
      ...(adresseLivraison && { adresseLivraison }),
      ...(dateLivraison && { dateLivraison }),
      dateCreation: new Date(),
      dateDerniereMiseAJour: new Date()
    });
    const populated = await livraison.populate('commande');
    await addHistoriqueSafe({ entityType: "Livraison", entityId: livraison._id, action: "Création", details: `Livraison #${numeroLivraison} créée`, utilisateur: req.user?._id, ipAddress: req.ip });
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('POST /api/livraisons error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createLivraisonFromCommande = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé.' });
    }
    const commande = await Commande.findById(req.params.commandeId).populate('produits.sousProduit', 'nom uniteMesure');
    if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    if (commande.statut !== 'Validée' && commande.statut !== 'Confirmée') {
      return res.status(400).json({ success: false, message: 'La commande doit être validée' });
    }
    const existingLivraison = await Livraison.findOne({ commande: commande._id });
    if (existingLivraison) return res.status(400).json({ success: false, message: 'Livraison existe déjà' });
    const count = await Livraison.countDocuments();
    const numeroLivraison = `LIV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const livraison = await Livraison.create({ numeroLivraison, commande: commande._id, etat: 'À préparer', statut: 'En attente', dateCreation: new Date(), dateDerniereMiseAJour: new Date() });
    await addHistoriqueSafe({ entityType: "Livraison", entityId: livraison._id, action: "Création", details: `Livraison #${numeroLivraison} créée`, utilisateur: req.user._id, ipAddress: req.ip });
    const populatedLivraison = await Livraison.findById(livraison._id).populate('commande', 'numeroCommande montantTotal dateCreation').populate('transporteur', 'nom raisonSociale email');
    res.status(201).json({ success: true, data: populatedLivraison });
  } catch (err) {
    console.error('Erreur createLivraisonFromCommande:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== MISE À JOUR ====================
exports.updateLivraison = async (req, res) => {
  try {
    const update = { ...req.body, dateDerniereMiseAJour: new Date() };
    if (update.etat && !update.statut) update.statut = ETAT_TO_STATUT[update.etat] || update.etat;
    if (update.statut && !update.etat) update.etat = STATUT_TO_ETAT[update.statut] || update.statut;
    const livraison = await Livraison.findByIdAndUpdate(req.params.id, update, { new: true }).populate('commande').populate('transporteur', 'nom prenom email raisonSociale code');
    if (!livraison) return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    await addHistoriqueSafe({ entityType: "Livraison", entityId: livraison._id, action: "Modification", details: `Livraison #${livraison.numeroLivraison} mise à jour`, utilisateur: req.user?._id, ipAddress: req.ip });
    res.json({ success: true, data: livraison });
  } catch (err) {
    console.error('Erreur updateLivraison:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateEtatLivraison = async (req, res) => {
  try {
    const { etat, commentaire } = req.body;
    const userRole = req.user.role;
    const livraison = await Livraison.findById(req.params.id).populate('commande', 'numeroCommande');
    if (!livraison) return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    const ancienEtat = livraison.etat;
    const transitionsValides = {
      'À préparer': { next: ['Prête', 'Annulée'], roles: ['Commercial', 'Admin'] },
      'Prête': { next: ['En cours', 'Annulée'], roles: ['Commercial', 'Admin', 'Transporteur'] },
      'En cours': { next: ['Livrée', 'Annulée'], roles: ['Commercial', 'Admin', 'Transporteur'] },
      'Livrée': { next: [], roles: [] },
      'Annulée': { next: [], roles: [] }
    };
    const transition = transitionsValides[livraison.etat];
    if (!transition || !transition.next.includes(etat)) return res.status(400).json({ success: false, message: `Transition invalide de ${livraison.etat} vers ${etat}` });
    if (!transition.roles.includes(userRole)) return res.status(403).json({ success: false, message: `Seuls ${transition.roles.join(', ')} peuvent changer l'état` });
    livraison.etat = etat;
    livraison.statut = ETAT_TO_STATUT[etat] || etat;
    if (commentaire) livraison.commentaire = commentaire;
    livraison.dateDerniereMiseAJour = new Date();
    if (etat === 'Livrée') livraison.dateLivraison = new Date();
    await livraison.save();
    await addHistoriqueSafe({ entityType: "Livraison", entityId: livraison._id, action: "Changement statut", ancienStatut: ancienEtat, nouveauStatut: etat, details: `État changé de ${ancienEtat} à ${etat}`, utilisateur: req.user._id, ipAddress: req.ip });
    const populatedLivraison = await Livraison.findById(livraison._id).populate('commande', 'numeroCommande montantTotal').populate('transporteur', 'nom raisonSociale email');
    res.json({ success: true, data: populatedLivraison });
  } catch (err) {
    console.error('Erreur updateEtatLivraison:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== ASSIGNATION TRANSPORTEUR ====================
exports.assignTransporteur = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'Seul l\'admin peut assigner' });
    const { transporteurId } = req.body;
    if (!transporteurId) return res.status(400).json({ success: false, message: 'Sélectionnez un transporteur' });
    const transporteur = await User.findById(transporteurId);
    if (!transporteur || transporteur.role !== 'Transporteur') return res.status(404).json({ success: false, message: 'Transporteur non trouvé' });
    const livraison = await Livraison.findById(req.params.id);
    if (!livraison) return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    const livraisonUpdated = await Livraison.findByIdAndUpdate(req.params.id, { transporteur: transporteurId, dateDerniereMiseAJour: new Date() }, { new: true }).populate('commande', 'numeroCommande montantTotal').populate('transporteur', 'nom raisonSociale email telephone adresse');
    await addHistoriqueSafe({ entityType: "Livraison", entityId: livraison._id, action: "Modification", details: `Transporteur assigné: ${transporteur.raisonSociale || transporteur.nom}`, utilisateur: req.user._id, ipAddress: req.ip });
    res.json({ success: true, data: livraisonUpdated });
  } catch (err) {
    console.error('Erreur assignTransporteur:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== LISTE DES TRANSPORTEURS ====================
exports.getTransporteurs = async (req, res) => {
  try {
    console.log('🔍 Recherche des transporteurs...');
    const transporteurs = await User.find({ role: 'Transporteur' })
      .select('_id nom prenom email raisonSociale code telephone adresse')
      .lean();
    console.log(`✅ ${transporteurs.length} transporteurs trouvés`);
    const formattedTransporteurs = transporteurs.map(t => ({
      _id: t._id,
      id: t._id,
      nom: t.nom || t.prenom || '',
      prenom: t.prenom || '',
      raisonSociale: t.raisonSociale || t.nom || 'Transporteur',
      email: t.email || '',
      code: t.code || '',
      telephone: t.telephone || '',
      adresse: t.adresse || '',
      role: t.role
    }));
    res.json({ success: true, data: formattedTransporteurs, count: formattedTransporteurs.length });
  } catch (err) {
    console.error('❌ Erreur getTransporteurs:', err);
    res.json({ success: true, data: [], count: 0 });
  }
};

// ==================== GÉNÉRATION PDF ====================
exports.generateBonLivraisonPDF = async (req, res) => {
  try {
    const livraison = await Livraison.findById(req.params.id)
      .populate({ path: 'commande', select: 'numeroCommande montantTotal dateCreation produits', populate: { path: 'produits.sousProduit', model: 'SousProduit', select: 'nom uniteMesure prixUnitaire' } })
      .populate('transporteur', 'nom raisonSociale email telephone adresse');
    if (!livraison) return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=bon_livraison_${livraison.numeroLivraison}.pdf`);
      res.send(pdfBuffer);
    });
    doc.fontSize(20).font('Helvetica-Bold').text('BON DE LIVRAISON', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`N° Livraison: ${livraison.numeroLivraison}`, { align: 'center' }).moveDown();
    doc.strokeColor('#000').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('Informations', { underline: true }).moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`État: ${livraison.etat || 'En attente'}`).text(`Date: ${new Date(livraison.dateCreation).toLocaleDateString('fr-FR')}`);
    if (livraison.commentaire) doc.text(`Commentaire: ${livraison.commentaire}`);
    doc.end();
  } catch (error) {
    console.error('Erreur PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SUPPRESSION ====================
exports.deleteLivraison = async (req, res) => {
  try {
    const livraison = await Livraison.findById(req.params.id);
    if (!livraison) return res.status(404).json({ success: false, message: 'Livraison non trouvée' });
    if (livraison.etat === 'En cours' || livraison.etat === 'Livrée') {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer une livraison en cours ou livrée' });
    }
    await Livraison.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Livraison supprimée' });
  } catch (err) {
    console.error('Erreur deleteLivraison:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== EXPORTS ====================
exports.getEtatText = getEtatText;