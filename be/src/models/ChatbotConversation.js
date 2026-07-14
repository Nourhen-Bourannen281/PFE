const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: { type: String, required: true },
  intent: { type: String, default: null },
  action: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const chatbotConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: { type: String, index: true },
  userRole: {
    type: String,
    enum: ['Admin', 'Commercial', 'Transporteur', 'Fournisseur', 'Client']
  },
  sessionId: { type: String, required: true, index: true },
  title: { type: String, default: 'Nouvelle conversation' },
  messages: [chatMessageSchema],
  totalMessages: { type: Number, default: 0 },
  lastMessage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  metadata: {
    deviceType: { type: String, default: 'web' },
    userAgent: { type: String, default: '' },
    locale: { type: String, default: 'fr-TN' }
  }
}, { timestamps: true });

chatbotConversationSchema.index({ userId: 1, createdAt: -1 });
chatbotConversationSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.models.ChatbotConversation ||
  mongoose.model('ChatbotConversation', chatbotConversationSchema, 'chatbot_conversations');