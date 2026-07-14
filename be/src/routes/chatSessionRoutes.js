// routes/chatSessionRoutes.js — Routes pour /api/chat/*
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatbotController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/session',             protect, ctrl.createSession);
router.get('/sessions',             protect, ctrl.getSessions);
router.get('/session/:sessionId',   protect, ctrl.getSession);
router.post('/message',             protect, ctrl.sendMessage);
router.delete('/session/:sessionId',protect, ctrl.deleteSession);

module.exports = router;
