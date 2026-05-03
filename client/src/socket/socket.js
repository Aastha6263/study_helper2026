import { io } from 'socket.io-client';

let socket = null;

// ── Create and connect socket with JWT ────────────────────────────────────────
export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth:              { token },
    withCredentials:   true,
    transports:        ['websocket', 'polling'],
    reconnection:      true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default socket;