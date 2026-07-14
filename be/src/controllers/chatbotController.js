const ChatbotConversation = require("../models/ChatbotConversation");
const ChatbotIntent = require("../models/ChatbotIntent");
const ChatSession = require("../models/ChatSession");
const Notification = require("../models/Notification");
const Penalty = require("../models/Penalty");
const Facture = require("../models/Facture");
const Commande = require("../models/Commande");
const ContratVente = require("../models/ContratVente");
const Contrat = require("../models/Contrat");
const Stock = require("../models/Stock");
const Livraison = require("../models/Livraison");
const Tiers = require("../models/Tiers");
const User = require("../models/User");
const PDFDocument = require("pdfkit");

// ── Helper PDF ────────────────────────────────────────────────────
const buildFacturePDF = (commandes, clientName) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0d2b3e')
       .text('ETAP — Facture', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#555')
       .text("Entreprise Tunisienne d'Activités Pétrolières", 50, 78);
    doc.fontSize(11).fillColor('#000')
       .text(`Client : ${clientName}`, 50, 110)
       .text(`Date   : ${new Date().toLocaleDateString('fr-FR')}`, 50, 125)
       .text(`Réf.   : FAC-${Date.now().toString().slice(-8)}`, 50, 140);
    doc.moveTo(50, 158).lineTo(545, 158).stroke('#0d2b3e');

    let y = 170, total = 0;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff');
    doc.rect(50, y, 495, 20).fill('#0d2b3e');
    doc.text('N°', 55, y + 5)
       .text('Commande', 90, y + 5)
       .text('Statut', 230, y + 5)
       .text('Date', 340, y + 5)
       .text('Montant', 450, y + 5);
    y += 22;

    commandes.forEach((c, i) => {
      const montant = c.montantTotal || 0;
      total += montant;
      doc.rect(50, y, 495, 18).fill(i % 2 === 0 ? '#f0f5fb' : '#fff');
      doc.fontSize(9).font('Helvetica').fillColor('#000')
         .text(String(i + 1), 55, y + 4)
         .text(`#${String(c._id).slice(-6)}`, 90, y + 4)
         .text(c.statut || 'N/A', 230, y + 4)
         .text(c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : 'N/A', 340, y + 4)
         .text(`${montant.toFixed(2)} TND`, 450, y + 4);
      y += 20;
      if (y > 720) { doc.addPage(); y = 50; }
    });

    doc.moveTo(50, y + 6).lineTo(545, y + 6).stroke('#0d2b3e');
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0d2b3e')
       .text(`TOTAL TTC (19% TVA) :  ${(total * 1.19).toFixed(2)} TND`, 260, y + 14);
    doc.fontSize(9).font('Helvetica').fillColor('#aaa')
       .text('Document généré automatiquement par ETAP Mobile Assistant',
             50, 760, { align: 'center', width: 495 });
    doc.end();
  });
};

// ── GET /api/chatbot/conversations ───────────────────────────────
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const conversations = await ChatbotConversation
      .find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: conversations, count: conversations.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/chatbot/conversations/:id ──────────────────────────
exports.getConversation = async (req, res) => {
  try {
    const conversation = await ChatbotConversation.findById(req.params.id).lean();
    if (!conversation)
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/chatbot/conversations ─────────────────────────────
exports.createConversation = async (req, res) => {
  try {
    const { sessionId, title, deviceType } = req.body;
    const userId = req.user._id || req.user.id;

    const conversation = await ChatbotConversation.create({
      userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      sessionId: sessionId || `session-${Date.now()}`,
      title: title || 'Nouvelle conversation',
      messages: [],
      metadata: {
        deviceType: deviceType || 'web',
        userAgent: req.headers['user-agent'] || '',
        locale: 'fr-TN'
      }
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/chatbot/conversations/:id/messages ─────────────────
exports.addMessage = async (req, res) => {
  try {
    const { role, content, intent, action } = req.body;

    const conversation = await ChatbotConversation.findByIdAndUpdate(
      req.params.id,
      {
        $push: { messages: { role, content, intent, action, timestamp: new Date() } },
        $inc: { totalMessages: 1 },
        $set: { lastMessage: content.substring(0, 200) }
      },
      { new: true }
    );

    if (!conversation)
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE /api/chatbot/conversations/:id ────────────────────────
exports.deleteConversation = async (req, res) => {
  try {
    await ChatbotConversation.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Conversation archivée' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/chatbot/intents ─────────────────────────────────────
exports.getIntents = async (req, res) => {
  try {
    const intents = await ChatbotIntent.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const stats = await ChatbotIntent.aggregate([
      {
        $group: {
          _id: '$detectedIntent',
          count: { $sum: 1 },
          successRate: { $avg: { $cond: ['$success', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, data: intents, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/chatbot/intents ────────────────────────────────────
exports.createIntent = async (req, res) => {
  try {
    const intent = await ChatbotIntent.create({
      userId: req.user._id || req.user.id,
      userRole: req.user.role,
      ...req.body
    });
    res.status(201).json({ success: true, data: intent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/chatbot — chatbot simple par rôle ──────────────────
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message requis' });

    const role = req.user.role;
    const name = req.user.raisonSociale || req.user.nom || 'utilisateur';
    const lowerMsg = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    let response = '', suggestions = [];

    if (/bonjour|salut|bonsoir|hello/.test(lowerMsg)) {
      const greetings = {
        Admin: `Bonjour ${name} 👋 En tant qu'Administrateur, vous avez accès à toutes les fonctionnalités ETAP. Que souhaitez-vous consulter ?`,
        Commercial: `Bonjour ${name} 👋 Bienvenue sur votre espace Commercial. Je peux vous aider avec vos clients, commandes et livraisons.`,
        Client: `Bonjour ${name} 👋 Bienvenue sur votre espace Client ETAP. Je suis là pour suivre vos commandes et livraisons.`,
        Transporteur: `Bonjour ${name} 👋 Bienvenue sur votre espace Transporteur. Je peux vous aider avec vos missions de livraison.`,
        Fournisseur: `Bonjour ${name} 👋 Bienvenue sur votre espace Fournisseur ETAP. Je peux vous renseigner sur vos commandes et pénalités.`
      };
      const suggByRole = {
        Admin: ['Statistiques système', 'Pénalités en attente', 'Utilisateurs', 'Historique activité'],
        Commercial: ['Mes clients', 'Commandes en cours', 'Livraisons en cours', 'Mes factures'],
        Client: ['Suivre ma livraison', 'Mes commandes', 'Mes factures', 'Aide'],
        Transporteur: ['Mes livraisons du jour', 'Livraisons en retard', 'Itinéraire', 'Aide'],
        Fournisseur: ['Commandes reçues', 'Mes pénalités', 'Mes livraisons', 'Factures émises']
      };
      response = greetings[role] || `Bonjour ${name} 👋 Comment puis-je vous aider ?`;
      suggestions = suggByRole[role] || ['Aide'];

    } else if (/notification|alerte|message/.test(lowerMsg)) {
      const myCount = await Notification.countDocuments({
        userId: req.user._id,
        $or: [{ read: false }, { isRead: false }]
      });
      if (role === 'Admin') {
        const totalUnread = await Notification.countDocuments({
          $or: [{ read: false }, { isRead: false }]
        });
        response = `📊 Vue Admin : ${totalUnread} notification(s) non lue(s) dans tout le système. Vous personnellement : ${myCount} non lue(s).`;
        suggestions = ['Voir toutes les notifications', 'Marquer tout comme lu', 'Notifications système'];
      } else {
        response = myCount > 0
          ? `🔔 Vous avez ${myCount} notification(s) non lue(s). Consultez l'onglet Notifications pour les détails.`
          : '✅ Vous n\'avez aucune notification non lue pour le moment.';
        suggestions = ['Voir mes notifications', 'Marquer tout comme lu'];
      }

    } else if (/penalite|amende|retard|sanction/.test(lowerMsg)) {
      if (role === 'Admin') {
        const pending = await Penalty.countDocuments({ statut: 'en_attente' });
        const agg = await Penalty.aggregate([
          { $match: { statut: 'en_attente' } },
          { $group: { _id: null, total: { $sum: '$montant' } } }
        ]);
        const totalAmt = agg[0]?.total || 0;
        response = `📋 Récapitulatif Admin : ${pending} pénalité(s) en attente — Total : ${totalAmt.toFixed(2)} TND.`;
        suggestions = ['Voir toutes les pénalités', 'Créer une pénalité', 'Pénalités réglées'];
      } else if (role === 'Fournisseur') {
        const mine = await Penalty.find({ userId: req.user._id });
        const pending = mine.filter(p => p.statut === 'en_attente');
        const total = pending.reduce((s, p) => s + (p.montant || 0), 0);
        response = pending.length > 0
          ? `⚠️ Vous avez ${pending.length} pénalité(s) en attente pour un total de ${total.toFixed(2)} TND.`
          : '✅ Aucune pénalité en attente. Continuez à respecter les délais !';
        suggestions = ['Voir mes pénalités', 'Payer une pénalité', 'Contacter l\'admin'];
      } else if (role === 'Client') {
        response = '💡 Les pénalités s\'appliquent aux fournisseurs en cas de retard. En tant que client, vous bénéficiez de compensations si votre livraison est tardive.';
        suggestions = ['Ma livraison est en retard', 'Contacter le support', 'Mes commandes'];
      } else if (role === 'Transporteur') {
        response = '🚚 Les pénalités sont appliquées aux fournisseurs, pas aux transporteurs. Assurez-vous de respecter les délais de livraison indiqués.';
        suggestions = ['Mes livraisons du jour', 'Livraisons en retard', 'Aide'];
      } else {
        response = 'Les pénalités concernent les retards de livraison. Contactez votre administrateur pour plus d\'informations.';
        suggestions = ['Aide', 'Contacter l\'admin'];
      }

    } else if (/livraison|expedition|transport|colis/.test(lowerMsg)) {
      if (role === 'Transporteur') {
        response = '🚚 Vos missions de livraison sont dans votre espace. Consultez l\'historique pour le suivi détaillé et mettez à jour le statut à chaque étape.';
        suggestions = ['Mes livraisons du jour', 'Livraisons en retard', 'Confirmer une livraison', 'Itinéraire'];
      } else if (role === 'Client') {
        response = '📦 Votre livraison est prise en charge par notre équipe logistique. Consultez l\'historique pour le suivi en temps réel.';
        suggestions = ['Voir l\'historique', 'Ma livraison est en retard', 'Contacter le support'];
      } else if (role === 'Fournisseur') {
        response = '⏱️ Vos livraisons aux clients sont visibles dans l\'historique. Respectez les délais contractuels pour éviter les pénalités.';
        suggestions = ['Mes livraisons', 'Mes retards', 'Voir mes pénalités'];
      } else {
        response = '📋 Toutes les livraisons en cours sont accessibles dans l\'historique. Vous pouvez filtrer par date, statut ou client.';
        suggestions = ['Livraisons en cours', 'Livraisons en retard', 'Voir l\'historique'];
      }

    } else if (/commande|contrat|achat/.test(lowerMsg)) {
      if (role === 'Admin' || role === 'Commercial') {
        let count = 0;
        try { count = await ContratVente.countDocuments(); } catch {}
        response = `📦 ${count} commande(s)/contrat(s) dans le système. Consultez le tableau de bord pour les détails et les statuts.`;
        suggestions = ['Voir toutes les commandes', 'Commandes en attente', 'Créer une commande'];
      } else if (role === 'Client') {
        let count = 0;
        try { count = await ContratVente.countDocuments({ client: req.user._id }); } catch {}
        response = count > 0
          ? `📦 Vous avez ${count} commande(s). Consultez l'historique pour le statut de chacune.`
          : '📭 Vous n\'avez aucune commande active pour le moment. Souhaitez-vous en passer une ?';
        suggestions = ['Voir mes commandes', 'Passer une commande', 'Aide'];
      } else if (role === 'Fournisseur') {
        let count = 0;
        try { count = await ContratVente.countDocuments({ fournisseur: req.user._id }); } catch {}
        response = count > 0
          ? `📋 Vous avez ${count} commande(s) à traiter. Vérifiez les délais de livraison pour éviter les pénalités.`
          : '📭 Aucune commande en attente pour le moment.';
        suggestions = ['Mes commandes reçues', 'Délais à respecter', 'Mes pénalités'];
      } else if (role === 'Transporteur') {
        response = '🚚 Les commandes sont gérées par les commerciaux et les fournisseurs. Votre rôle est d\'assurer la livraison dans les délais.';
        suggestions = ['Mes livraisons du jour', 'Aide'];
      }

    } else if (/client|acheteur|partenaire/.test(lowerMsg)) {
      if (role === 'Admin') {
        let count = 0;
        try { count = await User.countDocuments({ role: 'Client' }); } catch {}
        response = `👥 Il y a ${count} client(s) enregistrés dans le système.`;
        suggestions = ['Voir tous les clients', 'Ajouter un client', 'Clients inactifs'];
      } else if (role === 'Commercial') {
        response = '👥 Votre portefeuille clients est accessible depuis le tableau de bord. Consultez leurs commandes, livraisons et factures.';
        suggestions = ['Voir mes clients', 'Commandes clients', 'Factures impayées'];
      } else {
        response = 'ℹ️ La gestion des clients est réservée aux rôles Commercial et Admin.';
        suggestions = ['Aide'];
      }

    } else if (/stock|produit|inventaire|rupture|materiel/.test(lowerMsg)) {
      if (role === 'Admin' || role === 'Commercial') {
        try {
          const alerts = await Stock.find({
            $expr: { $lte: ['$quantity', '$seuilMin'] }
          }).populate('product').limit(5);
          response = alerts.length > 0
            ? `⚠️ ${alerts.length} produit(s) en dessous du seuil minimum : ${alerts.map(s => s.product?.nom || 'produit').join(', ')}.`
            : '✅ Tous les niveaux de stock sont au-dessus du seuil minimum.';
          suggestions = ['Voir tout le stock', 'Produits critiques', 'Créer une commande'];
        } catch {
          response = 'ℹ️ Les informations de stock sont disponibles dans le tableau de bord.';
          suggestions = ['Aide'];
        }
      } else {
        response = 'ℹ️ La gestion des stocks est réservée aux rôles Admin et Commercial.';
        suggestions = ['Aide', 'Contacter l\'admin'];
      }

    } else if (/facture|paiement|reglement|invoice/.test(lowerMsg)) {
      if (role === 'Admin' || role === 'Commercial') {
        try {
          const count = await Facture.countDocuments({ statut: 'En attente' });
          response = count > 0
            ? `💵 ${count} facture(s) en attente de paiement dans le système.`
            : '✅ Toutes les factures sont réglées.';
          suggestions = ['Voir les factures', 'Factures en retard', 'Émettre une facture'];
        } catch {
          response = 'ℹ️ Les informations de facturation sont disponibles dans le tableau de bord.';
          suggestions = ['Aide'];
        }
      } else if (role === 'Client') {
        try {
          const count = await Facture.countDocuments({ client: req.user._id, statut: 'En attente' });
          response = count > 0
            ? `💵 Vous avez ${count} facture(s) en attente de paiement.`
            : '✅ Toutes vos factures sont réglées.';
          suggestions = ['Voir mes factures', 'Effectuer un paiement', 'Aide'];
        } catch {
          response = 'Vos factures sont disponibles dans votre espace client.';
          suggestions = ['Aide'];
        }
      } else if (role === 'Fournisseur') {
        try {
          const count = await Facture.countDocuments({ fournisseur: req.user._id });
          response = `💵 Vous avez ${count} facture(s) émise(s). Consultez l'historique pour le suivi des paiements.`;
          suggestions = ['Mes factures émises', 'Factures impayées', 'Créer une facture'];
        } catch {
          response = 'Vos factures sont disponibles dans votre espace fournisseur.';
          suggestions = ['Aide'];
        }
      } else if (role === 'Transporteur') {
        response = '🚚 Les paiements sont gérés par votre entreprise. Contactez votre responsable pour toute question de facturation.';
        suggestions = ['Aide', 'Contacter l\'admin'];
      }

    } else if (/historique|activite|log|journal/.test(lowerMsg)) {
      if (role === 'Admin') {
        response = '📋 Le journal d\'activité complet est accessible depuis l\'écran Historique. Filtrez par utilisateur, action ou date.';
        suggestions = ['Voir l\'historique complet', 'Activité récente', 'Filtrer par utilisateur'];
      } else {
        response = '📋 Votre historique personnel est disponible dans l\'application via l\'onglet Historique.';
        suggestions = ['Voir mon historique', 'Aide'];
      }

    } else if (/itineraire|route|chemin|gps|navigation/.test(lowerMsg)) {
      if (role === 'Transporteur') {
        response = '🗺️ Votre itinéraire optimisé est calculé en fonction des adresses des clients. Consultez votre liste de missions pour commencer la tournée.';
        suggestions = ['Mes livraisons du jour', 'Commencer la tournée', 'Aide navigation'];
      } else {
        response = 'ℹ️ La navigation et les itinéraires sont des fonctionnalités dédiées aux transporteurs.';
        suggestions = ['Aide'];
      }

    } else if (/utilisateur|employe|personnel|compte/.test(lowerMsg)) {
      if (role === 'Admin') {
        try {
          const counts = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
          const summary = counts.map(c => `${c._id}: ${c.count}`).join(' | ');
          response = `👥 Comptes dans le système — ${summary}.`;
          suggestions = ['Voir tous les utilisateurs', 'Ajouter un utilisateur', 'Comptes inactifs'];
        } catch {
          response = 'La gestion des utilisateurs est accessible depuis le tableau de bord Admin.';
          suggestions = ['Aide'];
        }
      } else {
        response = 'ℹ️ La gestion des utilisateurs est réservée aux administrateurs.';
        suggestions = ['Aide', 'Contacter l\'admin'];
      }

    } else if (/aide|help|\?|comment|que faire/.test(lowerMsg)) {
      const helpTexts = {
        Admin: `En tant qu'Admin je peux vous aider avec :\n• 📊 Statistiques système\n• 👥 Gestion des utilisateurs\n• 💰 Pénalités globales\n• 📦 Alertes de stock\n• 🔔 Toutes les notifications\n• 📋 Historique d'activité`,
        Commercial: `En tant que Commercial je peux vous aider avec :\n• 👥 Votre portefeuille clients\n• 📦 Commandes en cours\n• 🚚 Suivi des livraisons\n• 💵 Factures clients`,
        Client: `En tant que Client je peux vous aider avec :\n• 📦 Suivi de vos commandes\n• 🚚 Suivi de vos livraisons\n• 💵 Vos factures\n• 📞 Support client`,
        Transporteur: `En tant que Transporteur je peux vous aider avec :\n• 🚚 Vos missions du jour\n• 🗺️ Itinéraires optimisés\n• 📱 Mise à jour de statut\n• 📞 Contact client`,
        Fournisseur: `En tant que Fournisseur je peux vous aider avec :\n• 📋 Commandes reçues\n• ⏱️ Délais de livraison\n• 💰 Vos pénalités\n• 💵 Vos factures émises`
      };
      const helpSugg = {
        Admin: ['Pénalités en attente', 'Utilisateurs', 'Stock critique', 'Notifications'],
        Commercial: ['Mes clients', 'Commandes en cours', 'Mes livraisons', 'Mes factures'],
        Client: ['Mes commandes', 'Ma livraison', 'Mes factures', 'Aide'],
        Transporteur: ['Mes livraisons du jour', 'Livraisons en retard', 'Itinéraire', 'Aide'],
        Fournisseur: ['Mes pénalités', 'Commandes reçues', 'Mes livraisons', 'Mes factures']
      };
      response = helpTexts[role] || 'Je peux vous aider avec les notifications, commandes, livraisons et factures.';
      suggestions = helpSugg[role] || ['Aide'];

    } else if (/merci|super|parfait|bien|bravo/.test(lowerMsg)) {
      response = `De rien ${name} ! 😊 N'hésitez pas si vous avez d'autres questions. Bonne journée !`;
      suggestions = ['Nouvelle question', 'Aide'];

    } else {
      const fallbacks = {
        Admin: `Je n'ai pas compris votre demande. En tant qu'Admin, je peux vous renseigner sur les utilisateurs, pénalités, stock, notifications et l'historique.`,
        Commercial: `Je n'ai pas compris. Je peux vous aider avec vos clients, commandes, livraisons et factures.`,
        Client: `Je n'ai pas compris. Je peux vous aider avec le suivi de vos commandes, livraisons et factures.`,
        Transporteur: `Je n'ai pas compris. Je peux vous aider avec vos livraisons et itinéraires.`,
        Fournisseur: `Je n'ai pas compris. Je peux vous aider avec vos commandes, pénalités et factures.`
      };
      const fallbackSugg = {
        Admin: ['Pénalités en attente', 'Utilisateurs', 'Notifications', 'Aide'],
        Commercial: ['Mes clients', 'Commandes en cours', 'Aide'],
        Client: ['Mes commandes', 'Ma livraison', 'Aide'],
        Transporteur: ['Mes livraisons', 'Itinéraire', 'Aide'],
        Fournisseur: ['Commandes reçues', 'Mes pénalités', 'Aide']
      };
      response = fallbacks[role] || 'Je n\'ai pas compris. Tapez "aide" pour voir ce que je peux faire.';
      suggestions = fallbackSugg[role] || ['Aide'];
    }

    res.json({ success: true, response, suggestions });
  } catch (err) {
    console.error('Erreur chatbot:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/chatbot/action ─────────────────────────────────────
exports.chatAction = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message requis' });

    const userId = req.user._id;
    const role = req.user.role;
    const name = req.user.raisonSociale || req.user.nom || 'utilisateur';
    const lowerMsg = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    let response = '', action = null, suggestions = [];

    if (/amen|aller|ouvrir|voir|acceder|page|navigue/.test(lowerMsg)) {
      if (/notification/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'Notifications', params: {} };
        response = '🔔 Ouverture de vos notifications.';
      } else if (/penalite|amende/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'Penalties', params: {} };
        response = '⚠️ Ouverture des pénalités.';
      } else if (/historique/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'History', params: {} };
        response = '📜 Ouverture de l\'historique.';
      } else if (/accueil|home/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'Accueil', params: {} };
        response = '🏠 Retour à l\'accueil.';
      } else if (role === 'Admin' && /contrat|commande|facture|livraison/.test(lowerMsg)) {
        response = '⛔ Ces pages ne sont pas disponibles pour l\'Admin.\n\nEssayez : "Liste utilisateurs", "Tiers", "Notifications admin".';
        suggestions = ['Liste utilisateurs', 'Tiers', 'Notifications admin', 'Contrats expirés'];
      } else if (/contrat/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'Accueil', params: {} };
        response = '📋 Je vous amène à l\'accueil pour gérer vos contrats.';
      } else if (/commande/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'Accueil', params: {} };
        response = '📦 Je vous amène à l\'accueil pour voir vos commandes.';
      } else if (/facture/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'Accueil', params: {} };
        response = '💳 Je vous amène à l\'accueil pour consulter vos factures.';
      } else if (/livraison/.test(lowerMsg)) {
        action = { type: 'navigate', screen: 'Accueil', params: {} };
        response = '🚚 Je vous amène à l\'accueil pour le suivi de vos livraisons.';
      } else {
        const navAdmin = 'Notifications admin, Pénalités, Historique';
        const navOthers = 'Contrats, Commandes, Factures, Livraisons, Notifications, Pénalités, Historique';
        response = `Où souhaitez-vous aller ? Dites-moi : ${role === 'Admin' ? navAdmin : navOthers}.`;
        suggestions = role === 'Admin'
          ? ['Notifications admin', 'Pénalités', 'Historique']
          : ['Mes commandes', 'Mes factures', 'Mes contrats', 'Mes livraisons'];
      }

    } else if (role === 'Transporteur' && /livraison|expedition|mes livraison|livraisons du jour|livraisons en retard/.test(lowerMsg)) {
      const livraisons = await Livraison.find({ transporteur: userId })
        .populate('commande')
        .sort({ createdAt: -1 }).limit(20).lean();

      const allLivs = livraisons.length > 0
        ? livraisons
        : await Livraison.find({}).populate('commande').sort({ createdAt: -1 }).limit(20).lean();

      if (allLivs.length === 0) {
        response = '📭 Aucune livraison trouvée dans le système. Demandez à un Admin ou Commercial d\'en créer.';
        suggestions = ['Mes notifications livraison', 'Contrats bientôt expirés', 'Aide'];
      } else {
        response = `🚚 **${allLivs.length}** livraison(s) trouvée(s) :`;
        action = {
          type: 'table',
          title: '🚚 Mes Livraisons',
          columns: ['N° Livraison', 'État', 'Commande', 'Date'],
          rows: allLivs.map(l => [
            l.numeroLivraison || ('LIV-' + String(l._id).slice(-6)),
            l.etat || l.statut || 'N/A',
            l.commande?.numeroCommande || 'N/A',
            l.createdAt ? new Date(l.createdAt).toLocaleDateString('fr-FR') : 'N/A'
          ])
        };
        suggestions = ['Générer facture PDF', 'Mes notifications livraison', 'Contrats bientôt expirés'];
      }

    } else if (role !== 'Admin' && /panier|commande.*attente|attente.*commande|mes commandes|en cours|mes factures/.test(lowerMsg)) {
      if (role === 'Transporteur') {
        const livraisons = await Livraison.find({ transporteur: userId })
          .populate('commande')
          .sort({ createdAt: -1 }).limit(20).lean();

        const allLivs = livraisons.length > 0 ? livraisons : await Livraison.find({})
          .populate('commande').sort({ createdAt: -1 }).limit(20).lean();

        if (allLivs.length === 0) {
          response = '📭 Aucune livraison dans le système. Demandez à un Admin/Commercial d\'en créer.';
          suggestions = ['Mes livraisons', 'Statistiques'];
        } else {
          const lines = allLivs.map((l, i) =>
            `${i + 1}. ${l.numeroLivraison || 'LIV-' + String(l._id).slice(-6)} — ${l.etat || l.statut || 'N/A'} — Cmd: ${l.commande?.numeroCommande || 'N/A'}`
          ).join('\n');
          response = `🚚 **${allLivs.length}** livraison(s) trouvée(s) :\n\n${lines}\n\nDites "générer facture PDF" pour créer une facture.`;
          action = { type: 'data', items: allLivs.map(l => ({ id: l._id, etat: l.etat, commande: l.commande?.numeroCommande })) };
          suggestions = ['Générer facture PDF', 'Livraisons en cours', 'Statistiques'];
        }
      } else {
        let commandes = await Commande.find({ client: userId })
          .sort({ createdAt: -1 }).limit(20).lean();

        if (commandes.length === 0) {
          commandes = await Commande.find({}).sort({ createdAt: -1 }).limit(20).lean();
        }

        if (commandes.length === 0) {
          response = '📭 Aucune commande dans la base de données. Créez votre première commande!';
          suggestions = ['Passer une commande', 'Mes factures', 'Mes livraisons'];
        } else {
          const lines = commandes.map((c, i) =>
            `${i + 1}. ${c.numeroCommande || '#' + String(c._id).slice(-6)} — ${c.statut || 'N/A'} — ${c.montantTotal ? c.montantTotal.toFixed(2) + ' TND' : 'N/A'}`
          ).join('\n');
          response = `📦 **${commandes.length}** commande(s) trouvée(s) :\n\n${lines}\n\nDites "générer facture PDF" pour créer la facture.`;
          action = { type: 'data', items: commandes.map(c => ({ id: c._id, statut: c.statut, montant: c.montantTotal })) };
          suggestions = ['Générer facture PDF', 'Mes livraisons', 'Contrats expirés'];
        }
      }

    } else if (role !== 'Admin' && /genere|creer|faire|etablir|preparer|telecharger|sauvegarder/.test(lowerMsg) && /facture|invoice|pdf/.test(lowerMsg)) {
      let commandes = [];

      if (role === 'Transporteur') {
        const livraisons = await Livraison.find({ transporteur: userId })
          .populate('commande').sort({ createdAt: -1 }).limit(20).lean();
        commandes = livraisons.map(l => l.commande).filter(Boolean);

        if (commandes.length === 0) {
          const allLivs = await Livraison.find({})
            .populate('commande').sort({ createdAt: -1 }).limit(20).lean();
          commandes = allLivs.map(l => l.commande).filter(Boolean);
        }
      } else {
        commandes = await Commande.find({ client: userId })
          .sort({ createdAt: -1 }).limit(20).lean();
      }

      if (commandes.length === 0) {
        commandes = await Commande.find({}).sort({ createdAt: -1 }).limit(20).lean();
      }

      if (commandes.length === 0) {
        response = '📭 Aucune commande/livraison dans la base de données pour générer une facture.\n\n💡 Créez d\'abord des commandes depuis la page Commandes.';
        suggestions = ['Mes livraisons', 'Catalogue produits', 'Aide'];
      } else {
        try {
          const pdfBuffer = await buildFacturePDF(commandes, name);
          const total = commandes.reduce((s, c) => s + (c.montantTotal || 0), 0);
          const filename = role === 'Transporteur'
            ? `facture_livraisons_${Date.now()}.pdf`
            : `facture_${Date.now()}.pdf`;

          response = `✅ **Facture PDF générée!**\n\n📦 **${commandes.length}** commande(s)\n💰 Total: **${total.toFixed(2)} TND**\n\n💾 Appuyez sur le bouton ci-dessous pour sauvegarder sur votre téléphone.`;
          action = { type: 'pdf', base64: pdfBuffer.toString('base64'), filename };
          suggestions = role === 'Transporteur'
            ? ['Mes livraisons', 'Mes notifications livraison', 'Aide']
            : ['Mes commandes', 'Passer une nouvelle commande'];
        } catch (pdfErr) {
          console.error('Erreur génération PDF:', pdfErr);
          response = '❌ Erreur lors de la génération du PDF: ' + pdfErr.message;
          suggestions = ['Réessayer', 'Aide'];
        }
      }

    } else if (role === 'Admin' && /^(tiers|liste tiers|voir tiers|afficher tiers)$/.test(lowerMsg.trim())) {
      const clients = await Tiers.find({ type: 'Client' }).lean();
      const fournisseurs = await Tiers.find({ type: 'Fournisseur' }).lean();
      const all = [...clients, ...fournisseurs];

      response = `📋 **Tableau Tiers :**\n👤 Clients : **${clients.length}**\n🏭 Fournisseurs : **${fournisseurs.length}**`;
      action = {
        type: 'table',
        title: '📋 Tableau Tiers',
        columns: ['Raison Sociale', 'Type', 'Email', 'Tél'],
        rows: all.map(t => [
          t.raisonSociale || '—',
          t.type === 'Client' ? '👤 Client' : '🏭 Fournisseur',
          t.email || '—',
          t.telephone || '—'
        ])
      };
      suggestions = ['Tiers clients seulement', 'Tiers fournisseurs seulement', 'Liste utilisateurs', 'Notifications admin'];

    } else if (role === 'Admin' && /tiers client|client.*seulement|seulement.*client/.test(lowerMsg)) {
      const clients = await Tiers.find({ type: 'Client' }).lean();
      response = `👤 **${clients.length} client(s) enregistré(s)**`;
      action = {
        type: 'table',
        title: '👤 Clients',
        columns: ['Raison Sociale', 'Email', 'Téléphone', 'Adresse'],
        rows: clients.map(t => [t.raisonSociale || '—', t.email || '—', t.telephone || '—', t.adresse || '—'])
      };
      suggestions = ['Tiers fournisseurs seulement', 'Liste utilisateurs', 'Tiers'];

    } else if (role === 'Admin' && /tiers fourni|fourni.*seulement|seulement.*fourni/.test(lowerMsg)) {
      const fournisseurs = await Tiers.find({ type: 'Fournisseur' }).lean();
      response = `🏭 **${fournisseurs.length} fournisseur(s) enregistré(s)**`;
      action = {
        type: 'table',
        title: '🏭 Fournisseurs',
        columns: ['Raison Sociale', 'Email', 'Téléphone', 'Adresse'],
        rows: fournisseurs.map(t => [t.raisonSociale || '—', t.email || '—', t.telephone || '—', t.adresse || '—'])
      };
      suggestions = ['Tiers clients seulement', 'Liste utilisateurs', 'Tiers'];

    } else if (role === 'Admin' && /utilisateur|user|membre|employe|liste user/.test(lowerMsg)) {
      const ROLE_ICON = { Admin: '👑', Commercial: '📊', Client: '👤', Transporteur: '🚚', Fournisseur: '🏭' };
      const users = await User.find({}).select('nom prenom email role actif code telephone').lean();

      const byRole = { Admin: 0, Commercial: 0, Client: 0, Transporteur: 0, Fournisseur: 0 };
      let actifs = 0, inactifs = 0;
      users.forEach(u => {
        if (byRole[u.role] !== undefined) byRole[u.role]++;
        if (u.actif !== false) actifs++; else inactifs++;
      });

      const statsLine = Object.entries(byRole)
        .map(([r, n]) => `${ROLE_ICON[r] || ''} ${r}: ${n}`)
        .join('  ·  ');

      response = `👥 **${users.length} utilisateur(s)**  ·  ✅ Actifs: ${actifs}  ·  ⛔ Inactifs: ${inactifs}\n${statsLine}`;
      action = {
        type: 'table',
        title: '👥 Gestion des Utilisateurs',
        columns: ['Nom & Prénom', 'Email', 'Rôle', 'Statut'],
        rows: users.map(u => [
          `${u.nom || ''}${u.prenom ? ' ' + u.prenom : ''}${u.code ? ' (' + u.code + ')' : ''}`.trim() || '—',
          u.email || '—',
          `${ROLE_ICON[u.role] || ''} ${u.role || '—'}`,
          u.actif !== false ? '✅ Actif' : '⛔ Inactif'
        ])
      };
      suggestions = ['Liste des tiers', 'Tiers clients seulement', 'Notifications admin'];

    } else if (role === 'Admin' && /notification|alerte|systeme|system/.test(lowerMsg)) {
      const notifs = await Notification.find({}).sort({ createdAt: -1 }).limit(15).lean();
      if (notifs.length === 0) {
        response = '✅ Aucune notification système en attente.';
        suggestions = ['Liste utilisateurs', 'Liste des tiers', 'Contrats expirés'];
      } else {
        response = `🔔 **${notifs.length} notification(s) système** :`;
        action = {
          type: 'table',
          title: '🔔 Notifications Système (Admin)',
          columns: ['Titre', 'Message', 'Type', 'Date'],
          rows: notifs.map(n => [
            n.title || '—',
            (n.message || '').slice(0, 30) + ((n.message || '').length > 30 ? '…' : ''),
            n.type || 'info',
            n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR') : '—'
          ])
        };
        suggestions = ['Liste utilisateurs', 'Liste des tiers', 'Contrats expirés'];
      }

    } else if (role === 'Transporteur' && /notification|alerte|livraison.*notif|notif.*livraison/.test(lowerMsg)) {
      const notifs = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(15).lean();
      const unread = notifs.filter(n => !n.read && !n.isRead).length;
      if (notifs.length === 0) {
        response = '✅ Aucune notification de livraison.';
        suggestions = ['Mes livraisons', 'Contrats bientôt expirés', 'Aide'];
      } else {
        response = `🚚 **${notifs.length} notification(s) de livraison** — ${unread} non lue(s)`;
        action = {
          type: 'table',
          title: '🚚 Notifications Livraison',
          columns: ['Titre', 'Message', 'Lu ?', 'Date'],
          rows: notifs.map(n => [
            n.title || '—',
            (n.message || '').slice(0, 30) + ((n.message || '').length > 30 ? '…' : ''),
            (!n.read && !n.isRead) ? '🔴 Non lu' : '✅ Lu',
            n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR') : '—'
          ])
        };
        suggestions = ['Mes livraisons', 'Contrats bientôt expirés', 'Aide'];
      }

    } else if (['Commercial', 'Client', 'Fournisseur'].includes(role) && /notification|alerte/.test(lowerMsg)) {
      const notifs = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(15).lean();
      const unread = notifs.filter(n => !n.read && !n.isRead).length;
      if (notifs.length === 0) {
        response = '✅ Aucune notification pour le moment.';
      } else {
        response = `🔔 **${notifs.length} notification(s)** — ${unread} non lue(s)`;
        action = {
          type: 'table',
          title: '🔔 Mes Notifications',
          columns: ['Titre', 'Message', 'Lu ?', 'Date'],
          rows: notifs.map(n => [
            n.title || '—',
            (n.message || '').slice(0, 30) + ((n.message || '').length > 30 ? '…' : ''),
            (!n.read && !n.isRead) ? '🔴 Non lu' : '✅ Lu',
            n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR') : '—'
          ])
        };
      }
      suggestions = ['Mes commandes en attente', 'Contrats expirés', 'Générer facture PDF'];

    } else if (/contrat.*expir|expir|fin.*contrat|contrat.*valide|bientot|proche|toufa|echeanc/.test(lowerMsg)) {
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      const query = role === 'Admin'
        ? {}
        : { $or: [{ client: userId }, { fournisseur: userId }] };

      let expiredContrats = await ContratVente.find({ ...query, dateFin: { $lt: now } }).lean();
      let expiringContrats = await ContratVente.find({ ...query, dateFin: { $gte: now, $lte: in30 } }).lean();

      if (expiredContrats.length === 0 && expiringContrats.length === 0) {
        const allContrats = await ContratVente.find({}).lean();
        const tousContrats = allContrats.length > 0 ? allContrats : await Contrat.find({}).lean();

        if (tousContrats.length === 0) {
          response = '📭 Aucun contrat dans la base de données.';
          suggestions = ['Mes commandes', 'Liste tiers', 'Aide'];
        } else {
          expiredContrats = tousContrats.filter(c => c.dateFin && new Date(c.dateFin) < now);
          expiringContrats = tousContrats.filter(c => c.dateFin && new Date(c.dateFin) >= now && new Date(c.dateFin) <= in30);
          const actifs = tousContrats.filter(c => !c.dateFin || new Date(c.dateFin) > in30);

          response =
            `📋 **${tousContrats.length}** contrat(s) dans la base:\n` +
            `🟢 **Actifs** : ${actifs.length}\n` +
            `🔴 **Expirés** : ${expiredContrats.length}\n` +
            `🟡 **Expirent dans 30 jours** : ${expiringContrats.length}`;

          const allRows = tousContrats.slice(0, 15).map(c => [
            c.numeroContrat || c.numero || `#${String(c._id).slice(-6)}`,
            c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : 'N/A',
            `${(c.montantTotal || c.montant || 0).toFixed(0)} TND`,
            !c.dateFin ? '⚪ N/A' : new Date(c.dateFin) < now ? '🔴 Expiré' : new Date(c.dateFin) <= in30 ? '🟡 Bientôt' : '🟢 Actif'
          ]);

          action = {
            type: 'table',
            title: 'Tous les Contrats',
            columns: ['N° Contrat', 'Date fin', 'Montant', 'État'],
            rows: allRows
          };
          suggestions = role === 'Admin'
            ? ['Liste utilisateurs', 'Tiers', 'Notifications admin']
            : ['Générer facture PDF', 'Mes commandes', 'Mes notifications'];
        }
      } else {
        response =
          `⚠️ **Contrats expirés** : ${expiredContrats.length}\n` +
          `🔔 **Expirent dans 30 jours** : ${expiringContrats.length}`;

        const allRows = [
          ...expiredContrats.map(c => [
            c.numeroContrat,
            new Date(c.dateFin).toLocaleDateString('fr-FR'),
            `${c.montantTotal?.toFixed(0) || '0'} TND`,
            '🔴 Expiré'
          ]),
          ...expiringContrats.map(c => [
            c.numeroContrat,
            new Date(c.dateFin).toLocaleDateString('fr-FR'),
            `${c.montantTotal?.toFixed(0) || '0'} TND`,
            '🟡 Bientôt'
          ])
        ];
        action = {
          type: 'table',
          title: 'Contrats — Échéances',
          columns: ['N° Contrat', 'Date fin', 'Montant', 'État'],
          rows: allRows
        };
        suggestions = role === 'Admin'
          ? ['Liste utilisateurs', 'Tiers', 'Notifications admin']
          : ['Générer facture PDF', 'Mes commandes en attente', 'Mes notifications'];
      }

    } else if (role !== 'Admin' && /commande|facture|panier|mes achat/.test(lowerMsg)) {
      let commandes = await Commande.find({ client: userId })
        .sort({ dateCommande: -1, createdAt: -1 }).limit(20).lean();

      if (commandes.length === 0) {
        commandes = await Commande.find({})
          .sort({ dateCommande: -1, createdAt: -1 }).limit(20).lean();
      }

      if (commandes.length === 0) {
        response = '📭 Aucune commande dans la base de données.';
        suggestions = ['Passer une commande', 'Catalogue produits', 'Aide'];
      } else {
        const total = commandes.reduce((s, c) => s + (c.montantTotal || 0), 0);
        response = `📦 **${commandes.length} commande(s) trouvée(s)** — Total : ${total.toFixed(2)} TND\n\n✅ Dites "Générer facture PDF" pour télécharger la facture.`;
        action = {
          type: 'table',
          title: 'Toutes les Commandes',
          columns: ['N° Commande', 'Date', 'Statut', 'Montant'],
          rows: commandes.map(c => [
            c.numeroCommande || `#${String(c._id).slice(-6)}`,
            c.dateCommande
              ? new Date(c.dateCommande).toLocaleDateString('fr-FR')
              : (c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—'),
            c.statut || '—',
            `${(c.montantTotal || 0).toFixed(2)} TND`
          ])
        };
        suggestions = ['Générer facture PDF', 'Contrats expirés', 'Mes notifications'];
      }

    } else if (role !== 'Admin' && /genere|creer|faire|etablir|preparer|telecharger/.test(lowerMsg) && /facture|invoice|pdf/.test(lowerMsg)) {
      const statusFilter = ['En attente', 'Confirmée', 'En préparation', 'Expédiée'];
      const commandes = await Commande.find({ client: userId, statut: { $in: statusFilter } })
        .sort({ dateCommande: -1 }).limit(30).lean();

      if (commandes.length === 0) {
        response = '⚠️ Aucune commande trouvée pour générer une facture.';
        suggestions = ['Mes commandes', 'Passer une commande'];
      } else {
        const pdfBuffer = await buildFacturePDF(commandes, name);
        const total = commandes.reduce((s, c) => s + (c.montantTotal || 0), 0);
        response = `✅ **Facture générée** — ${commandes.length} commande(s)\nTotal HT : ${total.toFixed(2)} TND\nTotal TTC (19%) : ${(total * 1.19).toFixed(2)} TND\n\n📥 Appuyez sur le bouton pour sauvegarder le PDF.`;
        action = { type: 'pdf', base64: pdfBuffer.toString('base64'), filename: `facture_${Date.now()}.pdf` };
        suggestions = ['Mes commandes', 'Contrats expirés'];
      }

    } else {
      const helpByRole = {
        Admin: ['Tiers', 'Liste utilisateurs', 'Notifications admin', 'Contrats expirés'],
        Commercial: ['Mes commandes en attente', 'Contrats bientôt expirés', 'Générer facture PDF', 'Mes notifications'],
        Client: ['Mes commandes en attente', 'Contrats expirés', 'Générer facture PDF', 'Mes notifications'],
        Transporteur: ['Mes notifications livraison', 'Contrats bientôt expirés', 'Aller à historique', 'Aide'],
        Fournisseur: ['Mes commandes en attente', 'Contrats expirés', 'Générer facture PDF', 'Mes notifications']
      };
      const helpAdmin = '• "Tiers" — tableau clients/fournisseurs\n• "Liste utilisateurs"\n• "Notifications admin"\n• "Contrats expirés"';
      const helpTransporteur = '• "Mes notifications livraison"\n• "Contrats bientôt expirés"\n• "Aller à historique"';
      const helpDefault = '• "Mes commandes en attente"\n• "Contrats expirés"\n• "Générer facture PDF"\n• "Mes notifications"';
      const helpText = role === 'Admin' ? helpAdmin : role === 'Transporteur' ? helpTransporteur : helpDefault;

      if (role === 'Admin' && /commande|facture|livraison|panier|achat/.test(lowerMsg)) {
        response = '⛔ Cette fonctionnalité n\'est pas disponible pour l\'Admin.\n\nEssayez :\n• "Tiers"\n• "Liste utilisateurs"\n• "Notifications admin"\n• "Contrats expirés"';
        suggestions = ['Tiers', 'Liste utilisateurs', 'Notifications admin', 'Contrats expirés'];
      } else {
        response = `Je ne comprends pas. Essayez :\n${helpText}`;
        suggestions = helpByRole[role] || helpByRole.Client;
      }
    }

    res.json({ success: true, response, action, suggestions });
  } catch (err) {
    console.error('Erreur chatbot/action:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/chat/session ───────────────────────────────────────
exports.createSession = async (req, res) => {
  try {
    const sessionId = `session_${req.user._id}_${Date.now()}`;
    const session = await ChatSession.create({
      userId: req.user._id,
      sessionId,
      messages: []
    });
    res.json({ success: true, sessionId: session.sessionId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/chat/sessions ───────────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('sessionId updatedAt');
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/chat/session/:sessionId ────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id
    });
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    res.json({ success: true, data: session.messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/chat/message ───────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ message: 'Message et sessionId requis' });
    }

    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      session = await ChatSession.create({
        userId: req.user._id,
        sessionId,
        messages: []
      });
    }

    session.messages.push({ role: 'user', content: message, timestamp: new Date() });

    let botResponse = '';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut')) {
      botResponse = `Bonjour ${req.user.raisonSociale || req.user.nom} ! Comment puis-je vous aider aujourd'hui ?`;
    } else if (lowerMessage.includes('contrat') || lowerMessage.includes('commande')) {
      const contrats = await ContratVente.find({ client: req.user._id }).limit(3);
      if (contrats.length > 0) {
        botResponse = `Vous avez ${contrats.length} contrat(s) en cours. Voulez-vous voir les détails ?`;
      } else {
        botResponse = "Vous n'avez aucun contrat actif. Souhaitez-vous créer une nouvelle commande ?";
      }
    } else if (lowerMessage.includes('stock') || lowerMessage.includes('produit')) {
      const stockAlert = await Stock.find({
        $expr: { $lte: ['$quantity', '$seuilMin'] }
      }).populate('product').limit(3);
      if (stockAlert.length > 0) {
        botResponse = `Attention : ${stockAlert.length} produit(s) sont en stock critique. Voulez-vous consulter les détails ?`;
      } else {
        botResponse = "Les niveaux de stock sont normaux. Souhaitez-vous consulter l'inventaire complet ?";
      }
    } else if (lowerMessage.includes('facture') || lowerMessage.includes('paiement')) {
      const factures = await Facture.find({ client: req.user._id, statut: 'En attente' }).limit(3);
      if (factures.length > 0) {
        botResponse = `Vous avez ${factures.length} facture(s) en attente de paiement. Souhaitez-les consulter ?`;
      } else {
        botResponse = "Toutes vos factures sont à jour. Avez-vous besoin d'aide pour autre chose ?";
      }
    } else if (lowerMessage.includes('notification')) {
      const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        $or: [{ read: false }, { isRead: false }]
      });
      botResponse = `Vous avez ${unreadCount} notification(s) non lues. Voulez-vous les voir ?`;
    } else if (lowerMessage.includes('penalite') || lowerMessage.includes('amende')) {
      const penalties = await Penalty.find({ userId: req.user._id, statut: 'en_attente' });
      if (penalties.length > 0) {
        const total = penalties.reduce((sum, p) => sum + p.montant, 0);
        botResponse = `Vous avez ${penalties.length} pénalité(s) en attente pour un total de ${total} TND.`;
      } else {
        botResponse = "Vous n'avez aucune pénalité en attente.";
      }
    } else if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
      botResponse = `Je peux vous aider avec :
- Consultation des contrats et commandes
- Suivi des stocks et alertes
- Gestion des factures et paiements
- Informations sur les produits
- Notifications et alertes
- Pénalités et amendes
- Assistance pour vos livraisons

Que souhaitez-vous faire ?`;
    } else if (lowerMessage.includes('livraison') || lowerMessage.includes('expedition')) {
      const livraisons = await Livraison.find({ commande: { $exists: true } }).limit(3);
      if (livraisons.length > 0) {
        botResponse = `${livraisons.length} livraison(s) sont en cours de traitement. Voulez-vous suivre votre colis ?`;
      } else {
        botResponse = "Aucune livraison en cours. Souhaitez-vous créer une nouvelle demande ?";
      }
    } else if (lowerMessage.includes('merci') || lowerMessage.includes('thanks')) {
      botResponse = "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.";
    } else {
      botResponse = `Je comprends votre question sur "${message}". Pourriez-vous être plus précis ? Je peux vous aider avec les contrats, stocks, factures, notifications, pénalités ou livraisons.`;
    }

    session.messages.push({ role: 'assistant', content: botResponse, timestamp: new Date() });
    session.updatedAt = new Date();
    await session.save();

    res.json({ success: true, response: botResponse, sessionId: session.sessionId });
  } catch (err) {
    console.error('Erreur chat:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/chat/session/:sessionId ─────────────────────────
exports.deleteSession = async (req, res) => {
  try {
    const result = await ChatSession.deleteOne({
      sessionId: req.params.sessionId,
      userId: req.user._id
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    res.json({ success: true, message: 'Session supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};