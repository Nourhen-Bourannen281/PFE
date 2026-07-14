// backend/src/socket/index.js
const { setConnectedUsers } = require("../services/notification.service");

let io = null;

const init = (server) => {
  const socketIO = require("socket.io");
  io = socketIO(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:8081', 'exp://*', 'http://*', 'https://*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });
  return io;
};

const setupEvents = (socketIo) => {
  const connectedUsers = new Map();

  socketIo.on('connection', (socket) => {
    console.log('🔌 Nouvelle connexion socket:', socket.id);

    socket.on('register', (userId) => {
      if (userId) {
        connectedUsers.set(userId, socket.id);
        console.log(`✅ Utilisateur ${userId} enregistré avec socket ${socket.id}`);
      }
    });

    socket.on('register-user', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        connectedUsers.set(userId, socket.id);
        console.log(`✅ Utilisateur ${userId} rejoint sa room et enregistré`);
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

  setConnectedUsers(connectedUsers);
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { init, setupEvents, getIO };