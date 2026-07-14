/**
 * Script one-shot : supprime l'index obsolète "code_1" de la collection products.
 * Exécuter une seule fois : node drop-old-index.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collection = db.collection('products');

  const indexes = await collection.indexes();
  console.log('Index existants :', indexes.map(i => i.name));

  const hasOldIndex = indexes.some(i => i.name === 'code_1');
  if (hasOldIndex) {
    await collection.dropIndex('code_1');
    console.log('✅ Index "code_1" supprimé.');
  } else {
    console.log('ℹ️  Index "code_1" introuvable — rien à faire.');
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
