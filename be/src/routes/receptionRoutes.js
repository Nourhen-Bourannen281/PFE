const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const receptionController = require('../controllers/receptionController');

router.get('/', protect, authorizeRoles('Admin', 'Commercial'), receptionController.getReceptions);
router.get('/export/csv', protect, authorizeRoles('Admin', 'Commercial'), receptionController.exportToCSV);
router.get('/:id', protect, authorizeRoles('Admin', 'Commercial'), receptionController.getReceptionById);
router.post('/', protect, authorizeRoles('Admin', 'Commercial'), receptionController.createReception);
router.put('/:id', protect, authorizeRoles('Admin', 'Commercial'), receptionController.updateReception);
router.delete('/:id', protect, authorizeRoles('Admin'), receptionController.deleteReception);
router.patch('/:id/statut', protect, authorizeRoles('Admin', 'Commercial'), receptionController.updateStatut);

module.exports = router;