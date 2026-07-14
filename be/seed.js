// Script de seed — crée les utilisateurs de base pour le développement
// Usage: node seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pfe';

const USERS = [
  {
    nom: 'Admin',
    prenom: 'ETAP',
    email: 'admin2@etap.com',
    password: 'admin123',
    role: 'Admin',
    actif: true,
    isActive: true,
  },
  {
    nom: 'Ben Ali',
    prenom: 'Nourhen',
    email: 'nourhenbouranen02@gmail.com',
    password: 'nourhen123',
    role: 'Commercial',
    actif: true,
    isActive: true,
  },
  {
    nom: 'STEG',
    prenom: 'Client',
    email: 'steg12@gmail.com',
    password: 'Steg1234',
    role: 'Client',
    actif: true,
    isActive: true,
  },
  {
    nom: 'Fournisseur',
    prenom: 'Test',
    email: 'fournisseur@etap.com',
    password: 'fourn123',
    role: 'Fournisseur',
    actif: true,
    isActive: true,
  },
  {
    nom: 'Transport',
    prenom: 'Test',
    email: 'transport@etap.com',
    password: 'trans123',
    role: 'Transporteur',
    actif: true,
    isActive: true,
  },
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connecté à', MONGO_URI);

  const col = mongoose.connection.db.collection('users');

  let created = 0;
  let skipped = 0;

  for (const u of USERS) {
    const existing = await col.findOne({ email: u.email.toLowerCase() });
    if (existing) {
      console.log(`⏭️  Existe déjà : ${u.email}`);
      skipped++;
      continue;
    }

    const hashed = await bcrypt.hash(u.password, 10);
    await col.insertOne({
      ...u,
      email: u.email.toLowerCase(),
      password: hashed,
      motDePasse: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Créé : ${u.email}  [${u.role}]  mdp: ${u.password}`);
    created++;
  }

  console.log(`\n📊 Résultat : ${created} créé(s), ${skipped} ignoré(s)`);
  console.log('\n🔑 Comptes disponibles :');
  USERS.forEach(u => console.log(`   ${u.email.padEnd(35)} mdp: ${u.password}  [${u.role}]`));

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
