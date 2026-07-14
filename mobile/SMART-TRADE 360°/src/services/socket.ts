// src/services/socket.ts
import io, { Socket } from 'socket.io-client';

const DEV_PC_IP = '172.16.27.20';

const getSocketUrl = () => {
  if (__DEV__) {
    return `http://${DEV_PC_IP}:5001`;
  }
  return 'https://votre-api-production.com';
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {
  if (socket && socket.connected) {
    console.log('Socket déjà connecté');
    return socket;
  }

  console.log(`Connexion socket à ${SOCKET_URL}`);
  
  socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('✅ Socket connecté');
    socket?.emit('register-user', userId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket déconnecté');
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Erreur socket:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket déconnecté');
  }
};

export const getSocket = () => socket;

export const onNewNotification = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('new-notification', callback);
  }
};

export const offNewNotification = (callback: (data: any) => void) => {
  if (socket) {
    socket.off('new-notification', callback);
  }
};