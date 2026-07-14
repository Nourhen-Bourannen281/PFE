// src/routes/authRoutes.js - Version avec vérification de sécurité
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protectRoute, authorize } = require('../middlewares/authMiddleware');

// Fonction utilitaire pour sécuriser les routes
const safe = (handler, name) => {
  if (typeof handler === 'function') {
    return handler;
  }
  console.error(`❌ Handler manquant: ${name}`);
  return (req, res) => {
    res.status(501).json({ 
      success: false, 
      message: `Fonction '${name}' non implémentée. Contactez l'administrateur.` 
    });
  };
};

console.log('✅ Routes d\'authentification chargées');
console.log('📦 Handlers disponibles:', Object.keys(authController));

// ==================== ROUTES PUBLIQUES ====================
router.post("/login", safe(authController.login, 'login'));
router.post("/register", safe(authController.register, 'register'));
router.post("/qr-login", safe(authController.qrLogin, 'qrLogin'));

// ==================== ROUTES FORGOT PASSWORD ====================
router.post("/forgot-password", safe(authController.forgotPassword, 'forgotPassword'));
router.post("/verify-reset-code", safe(authController.verifyResetCode, 'verifyResetCode'));
router.post("/reset-password", safe(authController.resetPassword, 'resetPassword'));
router.post("/resend-reset-code", safe(authController.resendResetCode, 'resendResetCode'));

// ==================== ROUTES PROTÉGÉES ====================
router.post("/logout", protectRoute, safe(authController.logout, 'logout'));
router.get("/me", protectRoute, safe(authController.getMe, 'getMe'));
router.put("/profile", protectRoute, safe(authController.updateProfile, 'updateProfile'));
router.put("/change-password", protectRoute, safe(authController.changePassword, 'changePassword'));

// ==================== ROUTES ADMIN ====================
router.post("/create-user", protectRoute, authorize('Admin'), safe(authController.createUser, 'createUser'));
router.post("/users", protectRoute, authorize('Admin'), safe(authController.createUser, 'createUser'));
router.get("/users", protectRoute, authorize('Admin'), safe(authController.getAllUsers, 'getAllUsers'));
router.get("/users/stats", protectRoute, authorize('Admin'), safe(authController.getUserStats, 'getUserStats'));
router.get("/users/role/:role", protectRoute, authorize('Admin'), safe(authController.getUsersByRole, 'getUsersByRole'));
router.get("/users/:id", protectRoute, authorize('Admin'), safe(authController.getUserById, 'getUserById'));
router.put("/users/:id", protectRoute, authorize('Admin'), safe(authController.updateUser, 'updateUser'));
router.delete("/users/:id", protectRoute, authorize('Admin'), safe(authController.deleteUser, 'deleteUser'));
router.put("/users/:id/activate", protectRoute, authorize('Admin'), safe(authController.activateUser, 'activateUser'));
router.put("/users/:id/deactivate", protectRoute, authorize('Admin'), safe(authController.deactivateUser, 'deactivateUser'));

// ==================== ROUTES PAR RÔLE ====================
router.get("/transporteurs", protectRoute, safe(authController.getTransporteurs, 'getTransporteurs'));
router.get("/fournisseurs", protectRoute, safe(authController.getFournisseurs, 'getFournisseurs'));
router.get("/commerciaux", protectRoute, safe(authController.getCommerciaux, 'getCommerciaux'));
router.get("/clients", protectRoute, safe(authController.getClients, 'getClients'));
router.post('/admin-reset-password',  protectRoute, authorize('Admin'), authController.adminResetPassword);

// ==================== ROUTE DE TEST ====================
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Routes d'authentification fonctionnelles",
    handlers: Object.keys(authController)
  });
});

module.exports = router;