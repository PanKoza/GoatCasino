import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

let socket = null;

export function getSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
