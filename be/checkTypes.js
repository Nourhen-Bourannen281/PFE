const mongoose = require('mongoose');
const TypeFacture = require('./src/models/TypeFacture');

mongoose.connect('mongodb://127.0.0.1:27017/pfe-num2');

async function check() {
  try {
    const types = await TypeFacture.find();
    console.log('Types de facture dans la base:');
    types.forEach(t => {
      console.log(`   - ${t.nom}: devise = ${t.devise || 'NON DÉFINIE'}`);
    });
    process.exit();
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

check();