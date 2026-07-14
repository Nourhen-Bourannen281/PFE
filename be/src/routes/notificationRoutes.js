const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// ── Routes utilisées par le mobile (user connecté via token) ──────
router.get('/',            protect, notificationController.getNotifications);
router.put('/read-all',   protect, notificationController.markAllRead);
router.put('/:id/read',   protect, notificationController.markOneRead);
router.delete('/:id',     protect, notificationController.deleteNotification);

// ── Routes utilisées par le frontend web (userId en paramètre) ────
router.get('/user/:userId',              protect, notificationController.getUserNotifications);
router.put('/user/:userId/read-all',     protect, notificationController.markAllAsRead);
router.delete('/user/:userId',           protect, notificationController.deleteAllUserNotifications);

// ── Autres ───────────────────────────────────────────────────────
router.post('/',          protect, notificationController.sendNotification);
router.get('/stats',      protect, notificationController.getNotificationStats);

module.exports = router;
