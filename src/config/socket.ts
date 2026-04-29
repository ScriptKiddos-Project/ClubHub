import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import type { JwtPayload } from '../types';

interface AuthSocket extends Socket {
  user: JwtPayload;
}

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyAccessToken(token);
      (socket as AuthSocket).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  };

  const clubChat = io.of('/club-chat');
  const eventChat = io.of('/event-chat');
  const notifications = io.of('/notifications');

  clubChat.use(authMiddleware);
  eventChat.use(authMiddleware);
  notifications.use(authMiddleware);

  clubChat.on('connection', (socket: Socket) => {
    const authed = socket as AuthSocket;
    socket.on('join_room', (clubId: string) => socket.join(`club:${clubId}`));
    socket.on('leave_room', (clubId: string) => socket.leave(`club:${clubId}`));
    socket.on('send_message', (data: { clubId: string; content: string }) => {
      clubChat.to(`club:${data.clubId}`).emit('new_message', {
        senderId: authed.user.userId,
        senderName: authed.user.email, // JwtPayload has no name — use email
        content: data.content,
        timestamp: new Date().toISOString(),
        clubId: data.clubId,
      });
    });
  });

  eventChat.on('connection', (socket: Socket) => {
    const authed = socket as AuthSocket;
    socket.on('join_room', (eventId: string) => socket.join(`event:${eventId}`));
    socket.on('leave_room', (eventId: string) => socket.leave(`event:${eventId}`));
    socket.on('send_message', (data: { eventId: string; content: string }) => {
      eventChat.to(`event:${data.eventId}`).emit('new_message', {
        senderId: authed.user.userId,
        senderName: authed.user.email,
        content: data.content,
        timestamp: new Date().toISOString(),
        eventId: data.eventId,
      });
    });
  });

  notifications.on('connection', (socket: Socket) => {
    const authed = socket as AuthSocket;
    socket.join(`user:${authed.user.userId}`);
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const emitNotification = (userId: string, notification: object) => {
  getIO().of('/notifications').to(`user:${userId}`).emit('notification', notification);
};