// src/services/conformiteService.js
const Conformite = require('../models/Conformite');

const checkConformiteAuto = async (document) => {
  let statut = 'Conforme';
  let commentaire = 'Vérification automatique réussie';

  // Contrôles automatiques (tu peux en ajouter d'autres)
  if (!document.filePath) {
    statut = 'Non conforme';
    commentaire = 'Fichier PDF du document manquant';
  }

  if (document.type === 'export' && !document.devise) {
    statut = 'Non conforme';
    commentaire = 'Devise manquante pour une facture d\'export';
  }

  if (document.type === 'locale' && document.devise !== 'TND') {
    statut = 'Non conforme';
    commentaire = 'Facture locale doit être en TND';
  }

  const conformite = await Conformite.create({
    document: document._id,
    typeControle: 'Douane',
    statut,
    commentaire,
    verifiePar: null   // null = vérifié par le système
  });

  return conformite;
};

module.exports = { checkConformiteAuto };