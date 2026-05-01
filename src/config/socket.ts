import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import type { JwtPayload } from '../types';
import { saveMessage, getOrCreateChatRoom } from '../services/chatService';

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

  // ── Club Chat ──────────────────────────────────────────────────────────────
  clubChat.on('connection', (socket: Socket) => {
    const authed = socket as AuthSocket;

    socket.on('chat:join', ({ roomId }: { roomId: string }) => {
      socket.join(`club:${roomId}`);
    });

    socket.on('chat:leave', ({ roomId }: { roomId: string }) => {
      socket.leave(`club:${roomId}`);
    });

    socket.on('chat:typing', ({ roomId }: { roomId: string }) => {
      socket.to(`club:${roomId}`).emit('chat:typing', {
        userId: authed.user.userId,
        name: authed.user.email,
      });
    });

    socket.on('chat:send', async (data: { roomId: string; content: string }) => {
      try {
        const room = await getOrCreateChatRoom('club', data.roomId);
        const msg = await saveMessage(room.id, authed.user.userId, data.content);
        clubChat.to(`club:${data.roomId}`).emit('chat:message', {
          id: msg.id,
          roomId: data.roomId,
          senderId: authed.user.userId,
          senderName: (msg.sender as { name: string }).name,
          content: data.content,
          timestamp: msg.created_at.toISOString(),
        });
      } catch (err) {
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });
  });

  // ── Event Chat ─────────────────────────────────────────────────────────────
  eventChat.on('connection', (socket: Socket) => {
    const authed = socket as AuthSocket;

    socket.on('chat:join', ({ roomId }: { roomId: string }) => {
      socket.join(`event:${roomId}`);
    });

    socket.on('chat:leave', ({ roomId }: { roomId: string }) => {
      socket.leave(`event:${roomId}`);
    });

    socket.on('chat:typing', ({ roomId }: { roomId: string }) => {
      socket.to(`event:${roomId}`).emit('chat:typing', {
        userId: authed.user.userId,
        name: authed.user.email,
      });
    });

    socket.on('chat:send', async (data: { roomId: string; content: string }) => {
      try {
        const room = await getOrCreateChatRoom('event', data.roomId);
        const msg = await saveMessage(room.id, authed.user.userId, data.content);
        eventChat.to(`event:${data.roomId}`).emit('chat:message', {
          id: msg.id,
          roomId: data.roomId,
          senderId: authed.user.userId,
          senderName: (msg.sender as { name: string }).name,
          content: data.content,
          timestamp: msg.created_at.toISOString(),
        });
      } catch (err) {
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });
  });

  // ── Notifications ──────────────────────────────────────────────────────────
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