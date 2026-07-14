// backend/middleware/logger.js
const { createHistorique } = require('../routes/historiqueRoutes');

const logAction = async (req, res, next) => {
  // Stocker les informations pour logger après la requête
  const originalJson = res.json;
  const startTime = Date.now();
  
  res.json = function(data) {
    // Logger l'action après la réponse
    const action = getActionFromMethod(req.method);
    const entityType = getEntityTypeFromUrl(req.url);
    
    if (action && entityType && req.user) {
      createHistorique({
        entityType,
        action,
        entityId: data?.data?._id || data?._id || null,
        details: `${action} de ${entityType} par ${req.user.nom || req.user.email}`,
        utilisateur: req.user._id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Erreur logging:', err));
    }
    
    originalJson.call(this, data);
  };
  
  next();
};

const getActionFromMethod = (method) => {
  switch(method) {
    case 'POST': return 'create';
    case 'PUT': return 'update';
    case 'DELETE': return 'delete';
    case 'GET': return 'read';
    default: return null;
  }
};

const getEntityTypeFromUrl = (url) => {
  if (url.includes('/products')) return 'Product';
  if (url.includes('/users')) return 'User';
  if (url.includes('/contrats-vente')) return 'Contrat';
  if (url.includes('/ventes')) return 'Vente';
  if (url.includes('/commandes')) return 'Commande';
  if (url.includes('/factures')) return 'Facture';
  if (url.includes('/livraisons')) return 'Livraison';
  return null;
};

module.exports = { logAction };