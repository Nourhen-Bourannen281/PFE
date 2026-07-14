const express = require('express');
const router = express.Router();
const { getAllTransporteurs, createTransporteur } = require('../controllers/transporteurController');
const { protect } = require('../middlewares/authMiddleware'); // ← import correct

// Appliquer l'authentification à toutes les routes
router.get('/', protect, getAllTransporteurs);
router.post('/', protect, createTransporteur);

module.exports = router;