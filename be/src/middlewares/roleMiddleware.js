const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Accès refusé. Rôle requis: ${allowedRoles.join(", ")}. Votre rôle: ${userRole}`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };