'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      auth: { userId: user.id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user_connected', user.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const joinConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('leave_conversation', conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: number, message: string) => {
    socketRef.current?.emit('send_message', { conversationId, message });
  }, []);

  const startTyping = useCallback((conversationId: number) => {
    socketRef.current?.emit('typing', { conversationId, userId: user?.id });
  }, [user?.id]);

  const stopTyping = useCallback((conversationId: number) => {
    socketRef.current?.emit('stop_typing', { conversationId, userId: user?.id });
  }, [user?.id]);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on('new_message', callback);
    return () => { socketRef.current?.off('new_message', callback); };
  }, []);

  const onMessagesRead = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('messages_read', callback);
    return () => { socketRef.current?.off('messages_read', callback); };
  }, []);

  const onTyping = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('user_typing', callback);
    return () => { socketRef.current?.off('user_typing', callback); };
  }, []);

  const onNotification = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('notification', callback);
    return () => { socketRef.current?.off('notification', callback); };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessagesRead,
    onTyping,
    onNotification,
  };
}
