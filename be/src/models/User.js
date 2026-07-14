const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const userSchema = new mongoose.Schema({
  raisonSociale: { type: String },
  nom: { type: String },
  prenom: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  motDePasse: { type: String },
  role: {
    type: String,
    enum: ['Admin', 'Commercial', 'Transporteur', 'Fournisseur', 'Client'],
    default: 'Commercial'
  },
  code: { type: String, unique: true, sparse: true },
  adresse: { type: String },
  telephone: { type: String },
  actif: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  resetPasswordCode: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  resetPasswordVerified: { type: Boolean },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('validate', function(next) {
  if (!this.password && this.motDePasse) this.password = this.motDePasse;
  next();
});

userSchema.pre('save', async function(next) {
  const passwordToHash = this.password || this.motDePasse;
  if (this.isModified('password') || this.isModified('motDePasse')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(passwordToHash, salt);
    this.motDePasse = this.password;
  }
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password || this.motDePasse);
};

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'etapgas2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

userSchema.methods.getPublicData = function () {
  return {
    id: this._id,
    nom: this.nom || this.raisonSociale,
    prenom: this.prenom,
    email: this.email,
    telephone: this.telephone,
    adresse: this.adresse,
    role: this.role,
    code: this.code,
    actif: this.actif,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
