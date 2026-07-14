// services/telegramService.js
// Envoie des alertes à l'admin via un bot Telegram.
//
// Configuration (.env) :
//   TELEGRAM_BOT_TOKEN   = token donné par @BotFather
//   TELEGRAM_ADMIN_CHAT_ID = ID du chat / groupe admin (obtenez-le via @userinfobot)

const axios = require('axios');

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

/**
 * Envoie un message HTML à l'admin Telegram.
 * @param {string} message — Texte HTML (balises <b>, <i>, <code> supportées)
 */
const sendTelegramMessage = async (message) => {
  if (!TOKEN || !CHAT_ID) {
    // Non configuré — silencieux (ne bloque jamais l'API)
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        chat_id:    CHAT_ID,
        text:       message,
        parse_mode: 'HTML',
      },
      { timeout: 6000 }
    );
  } catch (err) {
    // Non bloquant : on log l'erreur mais on continue
    console.error('⚠️ Telegram send error:', err.message);
  }
};

module.exports = { sendTelegramMessage };
