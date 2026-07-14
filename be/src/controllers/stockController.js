// backend/src/controllers/stockController.js - Version complète et unifiée
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const User = require('../models/User');
const { createAndSendNotification } = require("../config/socket");

// ==================== RÉCUPÉRATION DU STOCK ====================

// @desc    Obtenir tout le stock
// @route   GET /api/stock
exports.getStock = async (req, res) => {
  try {
    console.log('📦 Récupération du stock...');
    
    // Récupérer tous les stocks
    const stocks = await Stock.find().sort({ createdAt: -1 });
    
    // Récupérer les produits associés séparément (sans populate)
    const enrichedStock = [];
    
    for (const stock of stocks) {
      const product = await Product.findById(stock.product).lean();
      
      enrichedStock.push({
        ...stock.toObject(),
        product: product || null
      });
    }
    
    console.log(`✅ Stock trouvé: ${enrichedStock.length} éléments`);
    res.status(200).json({
      success: true,
      data: enrichedStock,
      count: enrichedStock.length
    });
  } catch (error) {
    console.error('❌ Erreur getStock:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Obtenir un stock par ID
// @route   GET /api/stock/:id
exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id).lean();
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }
    
    const product = await Product.findById(stock.product).lean();
    
    res.status(200).json({
      success: true,
      data: {
        ...stock,
        product: product || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur getStockById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Obtenir le stock par produit
// @route   GET /api/stock/product/:productId
exports.getStockByProduct = async (req, res) => {
  try {
    const stock = await Stock.findOne({ product: req.params.productId }).lean();
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé pour ce produit' });
    }
    
    const product = await Product.findById(stock.product).lean();
    
    res.status(200).json({
      success: true,
      data: {
        ...stock,
        product: product || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur getStockByProduct:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Obtenir les alertes de stock critique
// @route   GET /api/stock/alert
exports.getStockAlerts = async (req, res) => {
  try {
    const stockAlerte = await Stock.find({
      alerteActive: true,
      $expr: { $lte: ['$quantity', '$seuilMin'] }
    }).populate('product');
    
    res.json({ 
      success: true, 
      data: stockAlerte,
      count: stockAlerte.length
    });
  } catch (err) {
    console.error('❌ Erreur getStockAlerts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Obtenir les stocks bas (alias de getStockAlerts)
// @route   GET /api/stock/bas
exports.getStockBas = async (req, res) => {
  try {
    const stocksBas = await Stock.find({
      $expr: { $lt: ['$quantity', '$seuilMin'] }
    });
    
    const enrichedStock = [];
    
    for (const stock of stocksBas) {
      const product = await Product.findById(stock.product).lean();
      
      enrichedStock.push({
        ...stock.toObject(),
        product: product || null
      });
    }
    
    res.status(200).json({
      success: true,
      data: enrichedStock,
      count: enrichedStock.length
    });
  } catch (error) {
    console.error('❌ Erreur getStockBas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CRÉATION DE STOCK ====================

// @desc    Créer une entrée de stock (Admin seulement)
// @route   POST /api/stock
exports.createStock = async (req, res) => {
  try {
    const { product, quantity, seuilMin, alerteActive } = req.body;
    
    console.log('📦 Création stock:', { product, quantity, seuilMin, alerteActive });
    
    // Validation
    if (!product) {
      return res.status(400).json({ success: false, message: 'L\'ID du produit est requis' });
    }
    
    // Vérifier si le produit existe
    const productExists = await Product.findById(product).lean();
    if (!productExists) {
      console.log('❌ Produit non trouvé:', product);
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    
    // Vérifier si le stock existe déjà pour ce produit
    const existingStock = await Stock.findOne({ product });
    if (existingStock) {
      return res.status(400).json({ 
        success: false,
        message: 'Un stock existe déjà pour ce produit. Utilisez la mise à jour.' 
      });
    }
    
    const stock = new Stock({
      product,
      quantity: quantity !== undefined ? quantity : 0,
      seuilMin: seuilMin || productExists.seuilMin || 1000,
      alerteActive: alerteActive !== undefined ? alerteActive : true
    });
    
    const savedStock = await stock.save();
    console.log('✅ Stock créé:', savedStock._id);
    
    res.status(201).json({
      success: true,
      data: {
        ...savedStock.toObject(),
        product: productExists
      }
    });
  } catch (error) {
    console.error('❌ Erreur createStock:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== MISE À JOUR DU STOCK ====================

// @desc    Mettre à jour la quantité du stock (avec notifications)
// @route   PUT /api/stock/:id/quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'La quantité est requise' });
    }
    
    const stock = await Stock.findById(req.params.id).populate('product');
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }

    const oldQuantity = stock.quantity;
    stock.quantity = quantity;
    stock.dateDerniereMiseAJour = Date.now();
    await stock.save();

    // Vérifier si le stock est critique
    if (quantity <= stock.seuilMin && stock.alerteActive) {
      // Notifier l'utilisateur qui a fait la mise à jour
      if (req.user && req.user._id) {
        await createAndSendNotification(
          req.user._id,
          'Stock critique',
          `Le stock de ${stock.product.nom} est à ${quantity} (seuil: ${stock.seuilMin})`,
          'warning',
          { stockId: stock._id }
        );
      }

      // Notifier tous les administrateurs
      const admins = await User.find({ role: 'Admin' });
      for (const admin of admins) {
        await createAndSendNotification(
          admin._id,
          `⚠️ Stock critique: ${stock.product.nom}`,
          `Le stock est à ${quantity} unités (seuil: ${stock.seuilMin})`,
          'warning',
          { stockId: stock._id, productId: stock.product._id }
        );
      }
    }

    res.json({ 
      success: true, 
      data: stock,
      message: oldQuantity !== quantity ? 'Quantité mise à jour' : 'Quantité inchangée'
    });
  } catch (err) {
    console.error('❌ Erreur updateQuantity:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Mettre à jour la quantité avec opération (add/subtract)
// @route   PUT /api/stock/:id/quantity/operation
exports.updateStockQuantity = async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'La quantité est requise' });
    }
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }
    
    let newQuantity = stock.quantity;
    
    if (operation === 'add') {
      newQuantity = stock.quantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = stock.quantity - quantity;
    } else {
      newQuantity = quantity;
    }
    
    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'La quantité ne peut pas être négative' });
    }
    
    stock.quantity = newQuantity;
    stock.dateDerniereMiseAJour = Date.now();
    
    const updatedStock = await stock.save();
    
    const product = await Product.findById(updatedStock.product).lean();
    
    res.status(200).json({
      success: true,
      data: {
        ...updatedStock.toObject(),
        product: product || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur updateStockQuantity:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Mettre à jour le stock complet (seuil, alerte, etc.)
// @route   PUT /api/stock/:id
exports.updateStock = async (req, res) => {
  try {
    const { quantity, seuilMin, alerteActive } = req.body;
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }
    
    if (quantity !== undefined) stock.quantity = quantity;
    if (seuilMin !== undefined) stock.seuilMin = seuilMin;
    if (alerteActive !== undefined) stock.alerteActive = alerteActive;
    stock.dateDerniereMiseAJour = Date.now();
    
    const updatedStock = await stock.save();
    
    const product = await Product.findById(updatedStock.product).lean();
    
    res.status(200).json({
      success: true,
      data: {
        ...updatedStock.toObject(),
        product: product || null
      }
    });
  } catch (error) {
    console.error('❌ Erreur updateStock:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Mettre à jour le seuil d'alerte
// @route   PATCH /api/stock/:id/seuil
exports.updateSeuil = async (req, res) => {
  try {
    const { seuilMin } = req.body;
    
    if (seuilMin === undefined) {
      return res.status(400).json({ success: false, message: 'Le seuil est requis' });
    }
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }
    
    stock.seuilMin = seuilMin;
    stock.dateDerniereMiseAJour = Date.now();
    await stock.save();
    
    res.json({ 
      success: true, 
      data: stock,
      message: 'Seuil d\'alerte mis à jour'
    });
  } catch (err) {
    console.error('❌ Erreur updateSeuil:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Activer/désactiver les alertes
// @route   PATCH /api/stock/:id/alerte
exports.toggleAlerte = async (req, res) => {
  try {
    const { alerteActive } = req.body;
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }
    
    stock.alerteActive = alerteActive !== undefined ? alerteActive : !stock.alerteActive;
    stock.dateDerniereMiseAJour = Date.now();
    await stock.save();
    
    res.json({ 
      success: true, 
      data: stock,
      message: `Alertes ${stock.alerteActive ? 'activées' : 'désactivées'}`
    });
  } catch (err) {
    console.error('❌ Erreur toggleAlerte:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== SUPPRESSION ====================

// @desc    Supprimer une entrée de stock
// @route   DELETE /api/stock/:id
exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock non trouvé' });
    }
    
    await stock.deleteOne();
    res.status(200).json({ 
      success: true, 
      message: 'Stock supprimé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur deleteStock:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== STATISTIQUES ====================

// @desc    Obtenir les statistiques du stock
// @route   GET /api/stock/stats
exports.getStockStats = async (req, res) => {
  try {
    const totalProducts = await Stock.countDocuments();
    const totalQuantity = await Stock.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    
    const alertCount = await Stock.countDocuments({
      alerteActive: true,
      $expr: { $lte: ['$quantity', '$seuilMin'] }
    });
    
    const byProductType = await Stock.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalProducts,
        totalQuantity: totalQuantity[0]?.total || 0,
        alertCount,
        byProductType
      }
    });
  } catch (err) {
    console.error('❌ Erreur getStockStats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};