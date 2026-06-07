import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from './config/env.js';

let io = null;

// Map of userId -> Set of socket ids (a user may have several tabs/devices)
const userRooms = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true },
  });

  // Authenticate sockets with the same JWT used by the REST API
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(); // allow anonymous (public feed) connections
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.userId = payload.id;
    } catch {
      // invalid token -> treat as anonymous
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      const set = userRooms.get(socket.userId) || new Set();
      set.add(socket.id);
      userRooms.set(socket.userId, set);
    }

    socket.on('disconnect', () => {
      if (socket.userId) {
        const set = userRooms.get(socket.userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) userRooms.delete(socket.userId);
        }
      }
    });
  });

  return io;
}

// Emit a real-time event to a specific user
export function emitToUser(userId, eventName, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(eventName, payload);
}

export function getIO() {
  return io;
}
