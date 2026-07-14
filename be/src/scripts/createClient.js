const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/pfe-num2')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Définir le modèle User
    const userSchema = new mongoose.Schema({
      nom: String,
      prenom: String,
      email: String,
      motDePasse: String,
      telephone: String,
      role: String,
      actif: Boolean,
      dateCreation: Date
    });
    const User = mongoose.model('User', userSchema);
    
    // Hash du mot de passe "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Hashed password for "admin123":', hashedPassword);
    
    // Créer ou mettre à jour l'admin
    const admin = await User.findOneAndUpdate(
      { email: 'admin@etap.com' },
      {
        nom: 'Admin',
        prenom: 'System',
        email: 'admin@etap.com',
        motDePasse: hashedPassword,
        telephone: '123456789',
        role: 'Admin',
        actif: true,
        dateCreation: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('Admin created/updated:', admin.email);
    console.log('Password: admin123');
    
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });