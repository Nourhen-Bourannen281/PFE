const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const cargaisonController = require('../controllers/cargaisonController');

router.post('/:livraisonId/demarrer', protect, authorizeRoles('Transporteur'), cargaisonController.demarrerTransport);
router.post('/:livraisonId/terminer', protect, authorizeRoles('Transporteur'), cargaisonController.terminerTransport);

module.exports = router;