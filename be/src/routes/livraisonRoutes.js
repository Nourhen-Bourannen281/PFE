// backend/src/routes/livraisonRoutes.js - Version COMPLÈTE et CORRIGÉE
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const livraisonController = require('../controllers/livraisonController');
// ROUTE DE DIAGNOSTIC URGENTE - À METTRE TOUT EN HAUT
router.get('/test-all-users', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Récupérer TOUS les utilisateurs sans aucun filtre
    const allUsers = await User.find({}).lean();
    
    // Afficher tous les utilisateurs avec leurs rôles
    const usersWithRoles = allUsers.map(u => ({
      id: u._id,
      nom: u.nom || u.raisonSociale,
      email: u.email,
      role: u.role,
      type: u.type
    }));
    
    // Compter les transporteurs
    const transporteurs = allUsers.filter(u => u.role === 'Transporteur');
    
    res.json({
      success: true,
      totalUsers: allUsers.length,
      allUsers: usersWithRoles,
      transporteursCount: transporteurs.length,
      transporteurs: transporteurs.map(t => ({
        id: t._id,
        nom: t.nom || t.raisonSociale,
        email: t.email
      })),
      note: "Si transporteursCount = 0, le champ 'role' dans la base de données n'est pas 'Transporteur'"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ================= ROUTES PRINCIPALES =================

// Obtenir toutes les livraisons
router.get('/', protect, livraisonController.getLivraisons);

// Obtenir le détail d'une livraison
router.get('/:id/detail', protect, livraisonController.getLivraisonDetail);

// Créer une livraison à partir d'une commande validée (Commercial & Admin)
router.post(
  '/from-commande/:commandeId',
  protect,
  authorizeRoles('Commercial', 'Admin'),
  livraisonController.createLivraisonFromCommande
);

// Créer une livraison simple
router.post(
  '/',
  protect,
  authorizeRoles('Commercial', 'Admin'),
  livraisonController.createLivraison
);

// Mettre à jour une livraison
router.patch(
  '/:id',
  protect,
  authorizeRoles('Commercial', 'Admin'),
  livraisonController.updateLivraison
);

// Mettre à jour l'état d'une livraison
router.patch(
  '/:id/etat',
  protect,
  authorizeRoles('Commercial', 'Admin', 'Transporteur'),
  livraisonController.updateEtatLivraison
);

// Assigner un transporteur à une livraison (Admin seulement)
router.patch(
  '/:id/assign-transporteur',
  protect,
  authorizeRoles('Admin'),
  livraisonController.assignTransporteur
);

// Obtenir la liste des transporteurs (Admin & Commercial)
router.get(
  '/transporteurs',
  protect,
  authorizeRoles('Admin', 'Commercial'),
  livraisonController.getTransporteurs
);

// Route simplifiée pour les transporteurs (alternative)
router.get(
  '/transporteurs-simple',
  protect,
  authorizeRoles('Admin', 'Commercial'),
  async (req, res) => {
    try {
      const User = require('../models/User');
      const transporteurs = await User.find({ role: 'Transporteur' })
        .select('_id nom prenom email raisonSociale code telephone adresse');
      
      console.log(`✅ ${transporteurs.length} transporteurs trouvés (route simple)`);
      
      res.json({ 
        success: true, 
        data: transporteurs, 
        count: transporteurs.length 
      });
    } catch (err) {
      console.error('Erreur route transporteurs-simple:', err);
      res.json({ success: true, data: [], count: 0 });
    }
  }
);

// Route de diagnostic pour déboguer les transporteurs (Admin seulement)
router.get(
  '/debug-transporteurs',
  protect,
  authorizeRoles('Admin'),
  async (req, res) => {
    try {
      const User = require('../models/User');
      
      const allUsers = await User.find({}).lean();
      const transporteurs = allUsers.filter(u => u.role === 'Transporteur');
      const allRoles = [...new Set(allUsers.map(u => u.role))];
      
      res.json({
        success: true,
        totalUsers: allUsers.length,
        transporteursCount: transporteurs.length,
        transporteurs: transporteurs.map(t => ({
          id: t._id,
          nom: t.nom || t.raisonSociale,
          email: t.email,
          role: t.role,
          code: t.code
        })),
        allRoles: allRoles
      });
    } catch (err) {
      console.error('Erreur debug:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Générer le PDF du bon de livraison
router.get(
  '/:id/pdf',
  protect,
  livraisonController.generateBonLivraisonPDF
);

// Supprimer une livraison (Admin seulement)
router.delete(
  '/:id',
  protect,
  authorizeRoles('Admin'),
  livraisonController.deleteLivraison
);

module.exports = router;