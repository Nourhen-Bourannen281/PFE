// backend/src/services/notification.service.js
const Notification = require("../models/Notification");

let connectedUsers = new Map();

const setConnectedUsers = (map) => {
  if (map) {
    connectedUsers = map;
  }
};

const sendRealtimeNotification = async (io, userId, notification) => {
  const socketId = connectedUsers.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit('new_notification', notification);
    console.log(`📨 Notification envoyée à ${userId}`);
    return true;
  }
  return false;
};

const createAndSendNotification = async (io, userId, title, message, type = 'info', data = null) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data
    });

    await sendRealtimeNotification(io, userId, notification);
    return notification;
  } catch (err) {
    console.error('Erreur création notification:', err);
    return null;
  }
};

module.exports = { setConnectedUsers, sendRealtimeNotification, createAndSendNotification };