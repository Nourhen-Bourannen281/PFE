const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const {
  // Pays
  getPays, createPays, updatePays, deletePays,
  // Banque
  getBanques, createBanque, updateBanque, deleteBanque,
  // Navire
  getNavires, createNavire, updateNavire, deleteNavire,
  // ModePaiement
  getModePaiements, createModePaiement, updateModePaiement, deleteModePaiement,
  // TypeFacture
  getTypeFactures, createTypeFacture, updateTypeFacture, deleteTypeFacture
} = require('../controllers/referentielsController');

// === Pays ===
router.get('/pays', protect, authorizeRoles('Admin'), getPays);
router.post('/pays', protect, authorizeRoles('Admin'), createPays);
router.put('/pays/:id', protect, authorizeRoles('Admin'), updatePays);
router.delete('/pays/:id', protect, authorizeRoles('Admin'), deletePays);

// === Banque ===
router.get('/banques', protect, authorizeRoles('Admin'), getBanques);
router.post('/banques', protect, authorizeRoles('Admin'), createBanque);
router.put('/banques/:id', protect, authorizeRoles('Admin'), updateBanque);
router.delete('/banques/:id', protect, authorizeRoles('Admin'), deleteBanque);

// === Navire ===
router.get('/navires', protect, authorizeRoles('Admin'), getNavires);
router.post('/navires', protect, authorizeRoles('Admin'), createNavire);
router.put('/navires/:id', protect, authorizeRoles('Admin'), updateNavire);
router.delete('/navires/:id', protect, authorizeRoles('Admin'), deleteNavire);

// === Mode de Paiement ===
router.get('/modes-paiement', protect, authorizeRoles('Admin'), getModePaiements);
router.post('/modes-paiement', protect, authorizeRoles('Admin'), createModePaiement);
router.put('/modes-paiement/:id', protect, authorizeRoles('Admin'), updateModePaiement);
router.delete('/modes-paiement/:id', protect, authorizeRoles('Admin'), deleteModePaiement);

// === Type de Facture ===
router.get('/types-facture', protect, authorizeRoles('Admin'), getTypeFactures);
router.post('/types-facture', protect, authorizeRoles('Admin'), createTypeFacture);
router.put('/types-facture/:id', protect, authorizeRoles('Admin'), updateTypeFacture);
router.delete('/types-facture/:id', protect, authorizeRoles('Admin'), deleteTypeFacture);

module.exports = router;