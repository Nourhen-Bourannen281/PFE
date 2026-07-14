const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const commandeController = require('../controllers/commandeController');

// ================= ROUTES DE TEST =================
router.get('/test', (req, res) => {
  res.json({ message: '✅ Route commandes fonctionne!', timestamp: new Date() });
});

// ================= ROUTES POUR CLIENTS =================
router.get('/mes-commandes', protect, commandeController.getUserCommandes);
router.post('/', protect, commandeController.createCommande);

// ================= ROUTES POUR ADMIN & COMMERCIAL =================
router.get('/', protect, authorizeRoles('Admin', 'Commercial'), commandeController.getCommandes);
router.get('/stats/summary', protect, authorizeRoles('Admin', 'Commercial'), commandeController.getCommandesStats);
router.post('/verifier-stocks', protect, commandeController.verifierStocks);
router.get('/:id', protect, commandeController.getCommandeById);
router.put('/:id', protect, commandeController.updateCommande);
router.patch('/:id/statut', protect, authorizeRoles('Admin', 'Commercial'), commandeController.changeStatut);
router.patch('/:id/valider', protect, authorizeRoles('Admin', 'Commercial'), commandeController.validerCommande);
router.delete('/:id', protect, commandeController.deleteCommande);
router.get('/:id/pdf', protect, commandeController.exportCommandePDF);

module.exports = router;