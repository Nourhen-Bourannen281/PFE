const Notification = require('../models/Notification');

module.exports = (io) => {
  // Stocker l'instance io dans l'app
  io.use((socket, next) => {
    socket.request.app.set('io', io);
    next();
  });
  
  io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);
    
    socket.on('register-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Utilisateur ${userId} rejoint sa room`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
    });
  });
  
  // Exporter io pour les controllers
  return io;
};