const socketIO = require("socket.io");
const Notification = require("../models/Notification");

const connectedUsers = new Map();
let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Nouvelle connexion socket:', socket.id);

    socket.on('register', (userId) => {
      if (userId) {
        connectedUsers.set(userId, socket.id);
        console.log(`✅ Utilisateur ${userId} enregistré`);
      }
    });

    socket.on('register-user', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        connectedUsers.set(userId, socket.id);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`❌ Utilisateur ${userId} déconnecté`);
          break;
        }
      }
    });
  });

  return io;
};

const sendRealtimeNotification = async (userId, notification) => {
  const socketId = connectedUsers.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit('new_notification', notification);
    return true;
  }
  return false;
};

const createAndSendNotification = async (userId, title, message, type = 'info', data = null) => {
  try {
    const notification = await Notification.create({
      userId, title, message, type, data
    });
    await sendRealtimeNotification(userId, notification);
    return notification;
  } catch (err) {
    console.error('Erreur création notification:', err);
    return null;
  }
};

const getIO = () => io;

module.exports = {
  initSocket,
  sendRealtimeNotification,
  createAndSendNotification,
  getIO,
  connectedUsers
};