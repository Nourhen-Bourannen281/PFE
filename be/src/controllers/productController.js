// pfe/be/src/controllers/productController.js
const Product = require('../models/Product');

// Obtenir tous les produits
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      data: products 
    });
  } catch (error) {
    console.error('Erreur getProducts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Obtenir un produit par ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Produit non trouvé' 
      });
    }
    res.status(200).json({ 
      success: true, 
      data: product 
    });
  } catch (error) {
    console.error('Erreur getProductById:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Créer un produit
// backend/controllers/productController.js (ou routes)


// Créer un produit
exports.createProduct = async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    
    // Validation supplémentaire
    const { nom, type, prixUnitaire } = req.body;
    if (!nom || !type || prixUnitaire === undefined) {
      return res.status(400).json({ 
        message: 'Champs obligatoires manquants: nom, type, prixUnitaire' 
      });
    }

    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({ 
      success: true, 
      data: product,
      message: 'Produit créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création produit:', error);
    
    // Gestion des erreurs de duplication
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Ce code produit existe déjà' 
      });
    }
    
    // Gestion des erreurs de validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: messages.join(', ') 
      });
    }
    
    res.status(400).json({ 
      message: error.message || 'Erreur lors de la création' 
    });
  }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Produit non trouvé' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: product,
      message: 'Produit modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur updateProduct:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Produit non trouvé' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Produit supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur deleteProduct:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};