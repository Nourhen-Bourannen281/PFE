// backend/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middlewares/authMiddleware');

// GET tous les produits
router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find().sort({ type: 1, nom: 1 });
    res.json({ 
      success: true, 
      data: products,
      count: products.length 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET produit par ID
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST créer un produit
router.post('/', protect, authorize('Admin', 'Commercial'), async (req, res) => {
  try {
    // Validation des données
    const { nom, type, prixUnitaire } = req.body;
    
    if (!nom || !nom.trim()) {
      return res.status(400).json({ message: 'Le nom du produit est requis' });
    }
    
    if (!type || !['STEG', 'STIR'].includes(type)) {
      return res.status(400).json({ message: 'Le type doit être STEG ou STIR' });
    }
    
    if (!prixUnitaire || isNaN(prixUnitaire) || prixUnitaire <= 0) {
      return res.status(400).json({ message: 'Le prix unitaire doit être un nombre positif' });
    }
    
    // Générer un codeProduit garanti unique (timestamp base36 + random)
    const prefix   = type === 'STEG' ? 'STEG' : 'STIR';
    const cleanNom = nom.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() || 'PROD';
    const uniquePart = Date.now().toString(36).toUpperCase()
                     + Math.random().toString(36).substring(2, 7).toUpperCase();
    const codeProduit = `${prefix}-${cleanNom}-${uniquePart}`;

    const product = new Product({
      ...req.body,
      nom: nom.trim(),
      prixUnitaire: parseFloat(prixUnitaire),
      stockInitial: parseInt(req.body.stockInitial) || 0,
      codeProduit,
    });
    const savedProduct = await product.save();

    console.log('✅ Produit créé:', savedProduct.codeProduit);
    res.status(201).json({
      success: true,
      data: savedProduct,
      message: 'Produit créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création:', error);

    res.status(400).json({
      message: error.message || 'Erreur lors de la création du produit'
    });
  }
});

// PUT modifier un produit
router.put('/:id', protect, authorize('Admin', 'Commercial'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Mise à jour
    Object.assign(product, req.body);
    await product.save();
    
    res.json({ 
      success: true, 
      data: product,
      message: 'Produit modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur modification:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE supprimer un produit
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json({ success: true, message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;