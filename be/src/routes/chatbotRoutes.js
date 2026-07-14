// routes/chatbotRoutes.js — Routes pour /api/chatbot/*
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatbotController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/',                            protect, ctrl.chat);
router.post('/action',                      protect, ctrl.chatAction);
router.get('/conversations',                protect, ctrl.getConversations);
router.post('/conversations',               protect, ctrl.createConversation);
router.get('/conversations/:id',            protect, ctrl.getConversation);
router.post('/conversations/:id/messages',  protect, ctrl.addMessage);
router.delete('/conversations/:id',         protect, ctrl.deleteConversation);
router.get('/intents',                      protect, ctrl.getIntents);
router.post('/intents',                     protect, ctrl.createIntent);

module.exports = router;
