import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useSocket = (namespace: string) => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${BASE_URL}${namespace}`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [namespace, accessToken]);

  return socketRef;
};