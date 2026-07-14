// backend/src/routes/factureRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const factureController = require('../controllers/factureController');

// Admin & Commercial routes
router.get('/', protect, authorizeRoles('Admin', 'Commercial'), factureController.getFactures);
router.get('/stats', protect, authorizeRoles('Admin', 'Commercial'), factureController.getFacturesStats);
router.get('/:id', protect, authorizeRoles('Admin', 'Commercial', 'Client'), factureController.getFactureById);
router.get('/commande/:commandeId', protect, authorizeRoles('Admin', 'Commercial'), factureController.getFactureByCommande);
router.post('/:id/paiement', protect, authorizeRoles('Admin', 'Commercial'), factureController.ajouterPaiement);
router.get('/:id/pdf', protect, authorizeRoles('Admin', 'Commercial'), factureController.exportFacturePDF);

// Client routes
router.get('/client/mes-factures', protect, authorizeRoles('Client'), factureController.getMesFactures);

module.exports = router;