const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// GET /api/debug/users
exports.getDebugUsers = async (req, res) => {
  try {
    const col = mongoose.connection.db.collection('users');
    const users = await col.find({}, {
      projection: { email: 1, role: 1, actif: 1, isActive: 1, password: 1, nom: 1, prenom: 1, raisonSociale: 1, telephone: 1, adresse: 1 }
    }).toArray();

    res.json({
      mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pfe',
      dbName: mongoose.connection.db.databaseName,
      userCount: users.length,
      users: users.map(u => ({
        _id: u._id,                  // ✅ Inclus _id
        email: u.email,
        role: u.role,
        nom: u.nom,
        prenom: u.prenom,
        raisonSociale: u.raisonSociale,
        telephone: u.telephone,
        adresse: u.adresse,
        actif: u.actif,
        isActive: u.isActive,
        hasPassword: !!(u.password || u.motDePasse),
        passwordLength: (u.password || u.motDePasse || '').length
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/debug/fix-admin
exports.fixAdmin = async (req, res) => {
  try {
    const col = mongoose.connection.db.collection('users');
    const hashed = await bcrypt.hash('admin123', 10);
    const result = await col.updateOne(
      { email: 'admin2@etap.com' },
      { $set: { password: hashed, motDePasse: hashed, actif: true, isActive: true } },
      { upsert: true }
    );
    if (result.upsertedCount > 0) {
      await col.updateOne(
        { email: 'admin2@etap.com' },
        { $set: { nom: 'Admin', role: 'Admin', email: 'admin2@etap.com' } }
      );
    }
    res.json({
      success: true,
      message: 'Admin réinitialisé: admin2@etap.com / admin123',
      modified: result.modifiedCount,
      upserted: result.upsertedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/debug/fix-all-passwords
exports.fixAllPasswords = async (req, res) => {
  try {
    const col = mongoose.connection.db.collection('users');
    const defaults = [
      { email: 'admin2@etap.com',            password: 'admin123',   role: 'Admin',        nom: 'Admin',       prenom: 'ETAP' },
      { email: 'steg12@gmail.com',            password: 'Steg1234',   role: 'Client',       nom: 'STEG',        prenom: 'Client' },
      { email: 'nourhenbouranen02@gmail.com', password: 'nourhen123', role: 'Commercial',   nom: 'Nourhen',     prenom: 'Bouranen' },
      { email: 'fournisseur@etap.com',        password: 'fourn123',   role: 'Fournisseur',  nom: 'Fournisseur', prenom: 'ETAP' },
      { email: 'transport@etap.com',          password: 'trans123',   role: 'Transporteur', nom: 'Transport',   prenom: 'ETAP' }
    ];

    const results = [];
    for (const u of defaults) {
      const hashed = await bcrypt.hash(u.password, 10);
      const existing = await col.findOne({ email: u.email });
      if (existing) {
        await col.updateOne(
          { email: u.email },
          { $set: { password: hashed, motDePasse: hashed, actif: true, isActive: true } }
        );
        results.push(`✅ Réinitialisé: ${u.email} / ${u.password}`);
      } else {
        await col.insertOne({
          nom: u.nom, prenom: u.prenom, email: u.email,
          password: hashed, motDePasse: hashed,
          role: u.role, actif: true, isActive: true,
          createdAt: new Date(), updatedAt: new Date()
        });
        results.push(`✅ Créé: ${u.email} / ${u.password}`);
      }
    }

    const allUsers = await col.find({}).toArray();
    let extraFixed = 0;
    for (const u of allUsers) {
      if (!u.password || u.password.length < 10) {
        const hashed = await bcrypt.hash('Etap2024!', 10);
        await col.updateOne(
          { _id: u._id },
          { $set: { password: hashed, motDePasse: hashed, actif: true, isActive: true } }
        );
        extraFixed++;
      }
    }
    if (extraFixed > 0) results.push(`🔧 ${extraFixed} autres comptes réinitialisés avec mdp: Etap2024!`);

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};