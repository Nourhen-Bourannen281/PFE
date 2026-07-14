const mongoose = require('mongoose');
const path = require('path');
const TypeFacture = require(path.join(__dirname, 'src', 'models', 'TypeFacture'));

mongoose.connect('mongodb://127.0.0.1:27017/pfe-num2');

const typesFacture = [
  { nom: 'Locale TN', devise: 'TND' },
  { nom: 'Export USD', devise: 'USD' },
  { nom: 'Proforma', devise: 'TND' },
  { nom: 'Avoir', devise: 'TND' }
];

async function seed() {
  try {
    await TypeFacture.deleteMany({});
    console.log('✅ Anciens types supprimés');
    
    await TypeFacture.insertMany(typesFacture);
    console.log('✅ Types de facture ajoutés:');
    typesFacture.forEach(t => console.log(`   - ${t.nom} (${t.devise})`));
    
    process.exit();
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

seed();