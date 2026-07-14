// be/src/routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

// Route pour récupérer les exports
router.get('/', protect, async (req, res) => {
  try {
    // Retourner des données mockées ou vides
    res.json({ 
      success: true, 
      data: [],
      message: 'Module export en développement'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;