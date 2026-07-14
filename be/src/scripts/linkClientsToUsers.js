const mongoose = require('mongoose');
const Tiers = require('../models/Tiers');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pfe-num2')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Récupérer tous les clients
    const clients = await Tiers.find({ type: 0 });
    
    for (const client of clients) {
      // Chercher un utilisateur avec le même email
      const user = await User.findOne({ email: client.email });
      
      if (user) {
        client.user = user._id;
        await client.save();
        console.log(`Lien créé: ${client.raisonSociale} -> ${user.email}`);
      } else {
        console.log(`Aucun utilisateur trouvé pour ${client.email}`);
      }
    }
    
    console.log('Script terminé');
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });