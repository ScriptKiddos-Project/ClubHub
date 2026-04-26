


import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { fetchChatRooms, fetchRoomHistory } from '../services/phase4Service';
import { useAuthStore } from '../store/authStore';
import type { ChatRoom, ChatMessage } from '../types/phase4';

// ── Minimal Socket interface so the file compiles without socket.io-client ───
// Remove this block once `npm install socket.io-client` has been run.
interface SocketLike {
  connected: boolean;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  disconnect(): void;
}

// Lazy-load socket.io-client so TypeScript doesn't fail at compile time if
// the package is absent (e.g. during a CI type-check before `npm install`).
type IoFunction = (url: string, opts?: Record<string, unknown>) => SocketLike;

let _ioFn: IoFunction | null = null;
const getIo = async (): Promise<IoFunction> => {
  if (_ioFn) return _ioFn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('socket.io-client' as any);
  _ioFn = (mod.io ?? mod.default) as IoFunction;
  return _ioFn;
};

// ── Socket singleton ──────────────────────────────────────────────────────────
let _socket: SocketLike | null = null;

const getSocket = async (token: string): Promise<SocketLike> => {
  if (_socket?.connected) return _socket;
  const io = await getIo();
  _socket = io(
    import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:5000',
    {
      auth: { token },
      namespace: '/club-chat',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    }
  );
  return _socket;
};

export const disconnectSocket = () => {
  _socket?.disconnect();
  _socket = null;
};

// ── useChatRooms ──────────────────────────────────────────────────────────────
export const useChatRooms = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatRooms()
      .then(setRooms)
      .catch(() => { /* silent — rooms are non-critical */ })
      .finally(() => setLoading(false));
  }, []);

  const markRoomRead = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
    );
  }, []);

  const updateLastMessage = useCallback((roomId: string, msg: ChatMessage) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              unreadCount: r.unreadCount + 1,
              lastMessage: {
                content: msg.content,
                senderName: msg.senderName,
                timestamp: msg.timestamp,
              },
            }
          : r
      )
    );
  }, []);

  return { rooms, loading, markRoomRead, updateLastMessage };
};

// ── useChatRoom ───────────────────────────────────────────────────────────────
export const useChatRoom = (roomId: string | null) => {
  const { accessToken, user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const socketRef = useRef<SocketLike | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!roomId) { setMessages([]); return; }
    setHistoryLoading(true);
    fetchRoomHistory(roomId)
      .then((history) => {
        const withOwn = history.map((m) => ({
          ...m,
          isOwn: m.senderId === user?.id,
        }));
        setMessages(withOwn);
      })
      .catch(() => toast.error('Could not load message history.'))
      .finally(() => setHistoryLoading(false));
  }, [roomId, user?.id]);

  useEffect(() => {
    if (!accessToken || !roomId) return;

    let mounted = true;

    const onConnect = () => { if (mounted) setConnected(true); };
    const onDisconnect = () => { if (mounted) setConnected(false); };

    const onMessage = (msg: unknown) => {
      if (!mounted) return;
      const typedMsg = msg as ChatMessage;
      const enriched = { ...typedMsg, isOwn: typedMsg.senderId === user?.id };
      setMessages((prev) => [...prev, enriched]);
    };

    const onTyping = (payload: unknown) => {
      if (!mounted) return;
      const { userId, name } = payload as { userId: string; name: string };
      if (userId === user?.id) return;
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
      setTimeout(() => setTypingUsers((prev) => prev.filter((n) => n !== name)), 3000);
    };

    getSocket(accessToken).then((socket) => {
      if (!mounted) return;
      socketRef.current = socket;

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('chat:message', onMessage);
      socket.on('chat:typing', onTyping);
      socket.emit('chat:join', { roomId });

      if (socket.connected) setConnected(true);
    });

    return () => {
      mounted = false;
      const socket = socketRef.current;
      if (socket) {
        socket.emit('chat:leave', { roomId });
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('chat:message', onMessage);
        socket.off('chat:typing', onTyping);
      }
    };
  }, [accessToken, roomId, user?.id]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !roomId || !socketRef.current?.connected) return;
      socketRef.current.emit('chat:send', { roomId, content });
    },
    [roomId]
  );

  const emitTyping = useCallback(() => {
    if (!roomId || !socketRef.current?.connected) return;
    socketRef.current.emit('chat:typing', { roomId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('chat:stop-typing', { roomId });
    }, 2000);
  }, [roomId]);

  return {
    messages,
    historyLoading,
    connected,
    typingUsers,
    sendMessage,
    emitTyping,
  };
};

// ── useSmartNotifications ──────────────────────────────────────────────────────
export const useSmartNotifications = () => {
  const { accessToken } = useAuthStore();
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let mounted = true;
    let notifSocket: SocketLike | null = null;

    getIo().then((io) => {
      if (!mounted) return;
      notifSocket = io(
        import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:5000',
        {
          auth: { token: accessToken },
          namespace: '/notifications',
          transports: ['websocket'],
        }
      );

      notifSocket.on('connect', () => { if (mounted) setSocketReady(true); });
      notifSocket.on('disconnect', () => { if (mounted) setSocketReady(false); });
    });

    return () => {
      mounted = false;
      notifSocket?.disconnect();
    };
  }, [accessToken]);

  return { socketReady };
};
