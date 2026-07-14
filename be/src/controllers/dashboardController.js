const Commande = require("../models/Commande");
const ContratVente = require("../models/ContratVente");
const Notification = require("../models/Notification");
const Penalty = require("../models/Penalty");
const Tiers = require("../models/Tiers");
const User = require("../models/User");

const safe = async (fn) => {
  try { return await fn(); } catch { return 0; }
};

// GET /api/home/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    let stats = {};

    if (role === 'Admin') {
      const [totalUsers, totalTiers, clients, fournisseurs, penalites, notifs] = await Promise.all([
        safe(() => User.countDocuments()),
        safe(() => Tiers.countDocuments()),
        safe(() => Tiers.countDocuments({ type: 'Client' })),
        safe(() => Tiers.countDocuments({ type: 'Fournisseur' })),
        safe(() => Penalty.countDocuments({ statut: 'en_attente' })),
        safe(() => Notification.countDocuments({ $or: [{ read: false }, { isRead: false }] }))
      ]);
      stats = { totalUsers, totalTiers, clients, fournisseurs, penalites, notifs };

    } else if (role === 'Commercial') {
      const [contrats, commandes, penalites, notifs] = await Promise.all([
        safe(() => ContratVente.countDocuments({ statut: { $in: ['actif', 'active', 'en_cours'] } })),
        safe(() => Commande.countDocuments({ statut: { $in: ['en_attente', 'confirmée', 'en cours'] } })),
        safe(() => Penalty.countDocuments({ userId, statut: 'en_attente' })),
        safe(() => Notification.countDocuments({ userId, $or: [{ read: false }, { isRead: false }] }))
      ]);
      stats = { contrats, commandes, penalites, notifs };

    } else if (role === 'Client') {
      const [commandes, livraisons, factures, penalites, notifs] = await Promise.all([
        safe(() => Commande.countDocuments({ client: userId, statut: { $in: ['en_attente', 'confirmée', 'en cours'] } })),
        safe(() => Commande.countDocuments({ client: userId, statut: 'expédiée' })),
        safe(() => Commande.countDocuments({ client: userId, statut: { $in: ['livrée', 'delivered'] } })),
        safe(() => Penalty.countDocuments({ userId, statut: 'en_attente' })),
        safe(() => Notification.countDocuments({ userId, $or: [{ read: false }, { isRead: false }] }))
      ]);
      stats = { commandes, livraisons, factures, penalites, notifs };

    } else if (role === 'Transporteur') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [livJour, enTransit, livrees, penalites, notifs] = await Promise.all([
        safe(() => Commande.countDocuments({ statut: 'expédiée', updatedAt: { $gte: today } })),
        safe(() => Commande.countDocuments({ statut: 'expédiée' })),
        safe(() => Commande.countDocuments({ statut: { $in: ['livrée', 'delivered'] } })),
        safe(() => Penalty.countDocuments({ userId, statut: 'en_attente' })),
        safe(() => Notification.countDocuments({ userId, $or: [{ read: false }, { isRead: false }] }))
      ]);
      stats = { livJour, enTransit, livrees, penalites, notifs };

    } else if (role === 'Fournisseur') {
      const [commandesRecues, livraisons, penalites, notifs] = await Promise.all([
        safe(() => Commande.countDocuments({ statut: { $in: ['en_attente', 'confirmée'] } })),
        safe(() => Commande.countDocuments({ statut: 'expédiée' })),
        safe(() => Penalty.countDocuments({ userId, statut: 'en_attente' })),
        safe(() => Notification.countDocuments({ userId, $or: [{ read: false }, { isRead: false }] }))
      ]);
      stats = { commandesRecues, livraisons, penalites, notifs };
    }

    res.json({ success: true, role, stats });
  } catch (err) {
    console.error('Erreur home/dashboard:', err.message);
    res.json({ success: false, role: req.user.role, stats: {} });
  }
};