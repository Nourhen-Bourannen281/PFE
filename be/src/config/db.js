// backend/src/config/db.js
const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  // ✅ CORRECTION : Ajoutez le nom de la base de données à la fin
  const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://pfe_user:123456!@cluster0.j9gyxdb.mongodb.net/pfe";
  //                                                                                              

  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
  };

  try {
    await mongoose.connect(MONGO_URI, options);
    console.log("✅ MongoDB Atlas connecté");
    console.log("📊 Base de données:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ Erreur MongoDB:", err.message);
    throw err;
  }
};

module.exports = connectDB;