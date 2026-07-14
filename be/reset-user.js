// Script reset mot de passe — contourne tous les hooks Mongoose
// Usage: node reset-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pfe';

// ── MODIFIEZ ICI ─────────────────────────────────────────────
const EMAIL        = 'Steg12@gmail.com';
const NEW_PASSWORD = 'Steg1234';
// ─────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connecté à', MONGO_URI);

  // Accès direct à la collection — aucun hook Mongoose
  const col = mongoose.connection.db.collection('users');

  // Chercher l'utilisateur (insensible à la casse)
  const user = await col.findOne({ email: { $regex: new RegExp(`^${EMAIL}$`, 'i') } });

  if (!user) {
    console.log(`\n❌ Email "${EMAIL}" introuvable en base.`);
    console.log('\n📋 Tous les utilisateurs :');
    const all = await col.find({}, { projection: { email: 1, role: 1, actif: 1 } }).toArray();
    if (all.length === 0) {
      console.log('  (aucun utilisateur en base)');
    } else {
      all.forEach(u => console.log(`  - ${u.email}  [${u.role || '—'}]  actif:${u.actif}`));
    }
    await mongoose.disconnect();
    return;
  }

  console.log(`\n👤 Utilisateur trouvé :`);
  console.log(`   Email : ${user.email}`);
  console.log(`   Rôle  : ${user.role}`);
  console.log(`   Actif : ${user.actif}`);

  // Hasher le mot de passe une seule fois
  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);

  // Mettre à jour directement via updateOne (pas de hook)
  const result = await col.updateOne(
    { _id: user._id },
    {
      $set: {
        password:  hashed,
        motDePasse: hashed,
        actif:     true,
        isActive:  true
      }
    }
  );

  if (result.modifiedCount === 1) {
    console.log(`\n✅ Mot de passe réinitialisé avec succès.`);
    console.log(`   Email    : ${user.email}`);
    console.log(`   Password : ${NEW_PASSWORD}`);
  } else {
    console.log('⚠️  Aucune modification effectuée.');
  }

  await mongoose.disconnect();
  console.log('\nTerminé.');
}

run().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
