const express = require("express");
const router = express.Router();
const devisController = require("../controllers/devisController");
const { protectRoute, authorize } = require("../middlewares/authMiddleware");

// â”€â”€ Stats (AVANT /:id pour Ã©viter la capture) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/stats', protectRoute, devisController.getStats);

// â”€â”€ CRUD de base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/',    protectRoute, devisController.getAllDevis);
router.post('/',   protectRoute, authorize('Admin', 'Commercial'), devisController.createDevis);
router.get('/:id', protectRoute, devisController.getDevisById);
router.put('/:id', protectRoute, authorize('Admin', 'Commercial'), devisController.updateDevis);
router.delete('/:id', protectRoute, authorize('Admin', 'Commercial'), devisController.deleteDevis);

// â”€â”€ Actions sur statut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.patch('/:id/statut',   protectRoute, authorize('Admin', 'Commercial'), devisController.updateStatut);
router.post('/:id/envoyer',   protectRoute, authorize('Admin', 'Commercial'), devisController.envoyerDevis);
router.post('/:id/accepter',  protectRoute, authorize('Admin', 'Commercial', 'Client'), devisController.accepterDevis);
router.post('/:id/refuser',   protectRoute, authorize('Admin', 'Commercial', 'Client'), devisController.refuserDevis);

// â”€â”€ Conversion et duplication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/:id/convertir-contrat', protectRoute, authorize('Admin', 'Commercial'), devisController.convertirEnContrat);
router.post('/:id/dupliquer',         protectRoute, authorize('Admin', 'Commercial'), devisController.dupliquerDevis);

// â”€â”€ PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/:id/pdf', protectRoute, devisController.generatePDF);

module.exports = router;
