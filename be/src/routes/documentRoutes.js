// documentRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Modèle Document (si vous avez un modèle Document)
const Document = require('../models/Document');

// GET tous les documents
router.get('/', protect, authorizeRoles('Admin', 'Commercial'), async (req, res) => {
  try {
    const documents = await Document.find().select('_id type numero nom');
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;