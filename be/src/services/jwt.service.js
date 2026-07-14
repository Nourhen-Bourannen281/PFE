// backend/src/services/jwt.service.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateJWTToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || 'etapgas2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { generateJWTToken, generateResetCode, generateResetToken };