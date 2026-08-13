


import { useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';
import { useAuthStore } from '../stores/auth.store';

export const useSocket = () => {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // Update connection status
    const updateStatus = () => {
      setIsConnected(socketService.isConnected());
    };

    // Listen for online users
    const handleUserOnline = (data: { userId: string }) => {
      setOnlineUsers(prev => [...prev, data.userId]);
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    };

    // Set up listeners
    socketService.on('connect', updateStatus);
    socketService.on('disconnect', updateStatus);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);

    return () => {
      socketService.off('connect', updateStatus);
      socketService.off('disconnect', updateStatus);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
    };
  }, []);

  const sendMessage = (recipientId: string, content: string, type: string = 'text') => {
    socketService.emit('message:send', { recipientId, content, type });
  };

  const sendTypingStart = (recipientId: string) => {
    socketService.emit('typing:start', { recipientId });
  };

  const sendTypingStop = (recipientId: string) => {
    socketService.emit('typing:stop', { recipientId });
  };

  const markMessageRead = (messageId: string, senderId: string) => {
    socketService.emit('message:read', { messageId, senderId });
  };

  const onMessageReceive = (callback: Function) => {
    socketService.on('message:receive', callback);
    return () => socketService.off('message:receive', callback);
  };

  const onMessageDelivered = (callback: Function) => {
    socketService.on('message:delivered', callback);
    return () => socketService.off('message:delivered', callback);
  };

  const onMessageRead = (callback: Function) => {
    socketService.on('message:read', callback);
    return () => socketService.off('message:read', callback);
  };

  const onTypingStart = (callback: Function) => {
    socketService.on('typing:start', callback);
    return () => socketService.off('typing:start', callback);
  };

  const onTypingStop = (callback: Function) => {
    socketService.on('typing:stop', callback);
    return () => socketService.off('typing:stop', callback);
  };

  const onMessageError = (callback: Function) => {
    socketService.on('message:error', callback);
    return () => socketService.off('message:error', callback);
  };

  return {
    isConnected,
    onlineUsers,
    isUserOnline: (userId: string) => onlineUsers.includes(userId),
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markMessageRead,
    onMessageReceive,
    onMessageDelivered,
    onMessageRead,
    onTypingStart,
    onTypingStop,
    onMessageError,
  };
};