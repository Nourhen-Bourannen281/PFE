const Pays = require("../models/Pays");
const TypeProduit = require("../models/TypeProduit");
const Product = require("../models/Product");
const Stock = require("../models/Stock");
const User = require("../models/User");

// POST /api/init-data
exports.initData = async (req, res) => {
  try {
    if ((await Pays.countDocuments()) === 0) {
      await Pays.insertMany([
        { nom: 'France',    code: 'FR', continent: 'Europe' },
        { nom: 'Italie',    code: 'IT', continent: 'Europe' },
        { nom: 'Algérie',   code: 'DZ', continent: 'Afrique' },
        { nom: 'Tunisie',   code: 'TN', continent: 'Afrique' },
        { nom: 'Allemagne', code: 'DE', continent: 'Europe' },
        { nom: 'Espagne',   code: 'ES', continent: 'Europe' },
        { nom: 'Maroc',     code: 'MA', continent: 'Afrique' },
        { nom: 'Libye',     code: 'LY', continent: 'Afrique' },
        { nom: 'Turquie',   code: 'TR', continent: 'Asie' },
        { nom: 'Chine',     code: 'CN', continent: 'Asie' }
      ]);
      console.log('✅ Pays créés');
    }

    if ((await TypeProduit.countDocuments()) === 0) {
      await TypeProduit.insertMany([
        { nom: 'Carburant',   description: 'Produits pétroliers' },
        { nom: 'Gaz',         description: 'Gaz naturels et GPL' },
        { nom: 'Lubrifiants', description: 'Huiles et graisses' }
      ]);
      console.log('✅ Types produits créés');
    }

    if ((await Product.countDocuments()) === 0) {
      const carburantType = await TypeProduit.findOne({ nom: 'Carburant' });
      const gazType = await TypeProduit.findOne({ nom: 'Gaz' });
      await Product.insertMany([
        { nom: 'Essence Sans Plomb', type: 'STEG', prixUnitaire: 1.85,  unite: 'Litres', description: 'Carburant essence',       stockInitial: 10000, codeProduit: 'ESP001', category: 'Carburant', typeProduit: carburantType?._id },
        { nom: 'Gas-oil (Diesel)',   type: 'STEG', prixUnitaire: 1.75,  unite: 'Litres', description: 'Carburant diesel',        stockInitial: 10000, codeProduit: 'GOD002', category: 'Carburant', typeProduit: carburantType?._id },
        { nom: 'Kérosène',          type: 'STEG', prixUnitaire: 1.65,  unite: 'Litres', description: 'Carburant kérosène',      stockInitial: 10000, codeProduit: 'KER003', category: 'Carburant', typeProduit: carburantType?._id },
        { nom: 'Pétrole Brut',      type: 'STIR', prixUnitaire: 75.50, unite: 'Barils', description: 'Pétrole brut',            stockInitial: 10000, codeProduit: 'PEB004', category: 'Carburant', typeProduit: carburantType?._id },
        { nom: 'Gaz Naturel',       type: 'STEG', prixUnitaire: 0.45,  unite: 'm³',    description: 'Gaz naturel',             stockInitial: 10000, codeProduit: 'GAN005', category: 'Gaz',       typeProduit: gazType?._id },
        { nom: 'GPL',               type: 'STEG', prixUnitaire: 0.95,  unite: 'Litres', description: 'Gaz de pétrole liquéfié', stockInitial: 10000, codeProduit: 'GPL006', category: 'Gaz',       typeProduit: gazType?._id }
      ]);
      console.log('✅ Produits créés');
    }

    if ((await Stock.countDocuments()) === 0) {
      const products = await Product.find();
      await Stock.insertMany(products.map(product => ({
        product: product._id,
        quantity: 10000,
        seuilMin: 5000,
        alerteActive: true
      })));
      console.log('✅ Stocks créés');
    }

    if ((await User.countDocuments()) === 0) {
      await User.create([
        { raisonSociale: 'Administrateur',     email: 'admin2@etap.com',            password: 'admin123', role: 'Admin',        code: 'ADMIN001',  adresse: 'Tunis', actif: true, isActive: true },
        { raisonSociale: 'Société Pétrolière', email: 'fournisseur@etap.com',       password: '123456',   role: 'Fournisseur',  code: 'FOUR001',              actif: true, isActive: true },
        { raisonSociale: 'Transport Maritime', email: 'transporteur@etap.com',      password: '123456',   role: 'Transporteur', code: 'TRANS001',             actif: true, isActive: true },
        { raisonSociale: 'Commercial Oil',     email: 'nourhenbouranen02@gmail.com',password: '123456',   role: 'Commercial',   code: 'COMM001',              actif: true, isActive: true },
        { raisonSociale: 'Client Particulier', email: 'steg12@gmail.com',           password: '123456',   role: 'Client',       code: 'CLT001',               actif: true, isActive: true }
      ]);
      console.log('✅ Utilisateurs créés');
    }

    res.json({ success: true, message: 'Base de données initialisée avec succès' });
  } catch (err) {
    console.error('Erreur initialisation:', err);
    res.status(500).json({ message: err.message });
  }
};