const mongoose = require("mongoose");

const chatbotIntentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userRole: { type: String },
  message: { type: String, required: true },
  detectedIntent: { type: String, required: true, index: true },
  confidence: { type: Number, min: 0, max: 1, default: 0.8 },
  response: { type: String },
  executedAction: { type: String, default: null },
  success: { type: Boolean, default: true },
  errorMessage: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.models.ChatbotIntent ||
  mongoose.model('ChatbotIntent', chatbotIntentSchema, 'chatbot_intents');