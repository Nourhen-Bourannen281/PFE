// Diagnostic + fix automatique — node check-db.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pfe';

async function run() {
  console.log('\n🔍 Connexion à:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (e) {
    console.error('\n❌ IMPOSSIBLE DE SE CONNECTER À MONGODB');
    if (MONGO_URI.includes('localhost')) {
      console.error('   → MongoDB local n\'est pas démarré.');
      console.error('   → Lancez: net start MongoDB');
      console.error('     (ou démarrez MongoDB depuis les Services Windows)');
    } else {
      console.error('   → Problème réseau Atlas. Vérifiez votre connexion et la whitelist IP.');
    }
    process.exit(1);
  }

  console.log('✅ MongoDB connecté\n');
  const col = mongoose.connection.db.collection('users');

  // Compter les users
  const total = await col.countDocuments();
  console.log(`👥 Utilisateurs en base: ${total}`);

  if (total > 0) {
    const all = await col.find({}, { projection: { email: 1, role: 1, actif: 1 } }).toArray();
    all.forEach(u => console.log(`   - ${u.email}  [${u.role}]  actif:${u.actif}`));
  }

  // Chercher admin2@etap.com
  const admin = await col.findOne({ email: 'admin2@etap.com' });

  if (!admin) {
    console.log('\n⚠️  admin2@etap.com introuvable → création automatique...');
    const hashed = await bcrypt.hash('admin123', 10);
    await col.insertOne({
      nom: 'Admin', prenom: 'ETAP',
      email: 'admin2@etap.com',
      password: hashed, motDePasse: hashed,
      role: 'Admin', actif: true, isActive: true,
      createdAt: new Date(), updatedAt: new Date(),
    });
    console.log('✅ Admin créé: admin2@etap.com / admin123');
  } else {
    // Tester le mot de passe
    const hash = admin.password || admin.motDePasse;
    const ok = hash ? await bcrypt.compare('admin123', hash) : false;
    if (ok) {
      console.log('\n✅ admin2@etap.com OK — mot de passe "admin123" valide');
    } else {
      console.log('\n⚠️  Mot de passe invalide → réinitialisation...');
      const hashed = await bcrypt.hash('admin123', 10);
      await col.updateOne(
        { _id: admin._id },
        { $set: { password: hashed, motDePasse: hashed, actif: true, isActive: true } }
      );
      console.log('✅ Mot de passe réinitialisé: admin123');
    }
  }

  // Créer les autres comptes si absents
  const others = [
    { email: 'steg12@gmail.com',              password: 'Steg1234',   role: 'Client',      nom: 'STEG' },
    { email: 'nourhenbouranen02@gmail.com',    password: 'nourhen123', role: 'Commercial',  nom: 'Nourhen' },
    { email: 'fournisseur@etap.com',           password: 'fourn123',   role: 'Fournisseur', nom: 'Fournisseur' },
    { email: 'transport@etap.com',             password: 'trans123',   role: 'Transporteur',nom: 'Transport' },
  ];

  for (const u of others) {
    const exists = await col.findOne({ email: u.email });
    if (!exists) {
      const hashed = await bcrypt.hash(u.password, 10);
      await col.insertOne({
        nom: u.nom, prenom: 'Test', email: u.email,
        password: hashed, motDePasse: hashed,
        role: u.role, actif: true, isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      });
      console.log(`✅ Créé: ${u.email} / ${u.password}`);
    }
  }

  console.log('\n🔑 Comptes disponibles:');
  console.log('   admin2@etap.com                    mdp: admin123    [Admin]');
  console.log('   steg12@gmail.com                   mdp: Steg1234    [Client]');
  console.log('   nourhenbouranen02@gmail.com         mdp: nourhen123  [Commercial]');
  console.log('   fournisseur@etap.com               mdp: fourn123    [Fournisseur]');
  console.log('   transport@etap.com                 mdp: trans123    [Transporteur]');
  console.log('\n✅ Base de données prête.\n');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('\n❌ Erreur:', err.message);
  process.exit(1);
});
