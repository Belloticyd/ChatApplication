

// clientSide/src/components/chat/ChatWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: string;
  sentAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
}

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const { user } = useAuth();
  const {
    isConnected,
    isUserOnline,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    onMessageReceive,
    onMessageDelivered,
    onMessageRead,
    onTypingStart,
    onTypingStop,
  } = useSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    const handleMessageReceive = (message: Message) => {
      // Only show messages for this chat
      if (message.senderId === recipientId || message.recipientId === recipientId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const unsubscribe = onMessageReceive(handleMessageReceive);
    return unsubscribe;
  }, [recipientId, onMessageReceive]);

  // Listen for typing indicators
  useEffect(() => {
    const handleTypingStart = (data: { senderId: string }) => {
      if (data.senderId === recipientId) {
        setRecipientTyping(true);
      }
    };

    const handleTypingStop = (data: { senderId: string }) => {
      if (data.senderId === recipientId) {
        setRecipientTyping(false);
      }
    };

    const unsubscribeStart = onTypingStart(handleTypingStart);
    const unsubscribeStop = onTypingStop(handleTypingStop);

    return () => {
      unsubscribeStart();
      unsubscribeStop();
    };
  }, [recipientId, onTypingStart, onTypingStop]);

  const handleSendMessage = () => {
    if (!input.trim() || !isConnected) return;

    const message: Message = {
      id: `temp_${Date.now()}`,
      senderId: user?.uid || '',
      recipientId,
      content: input.trim(),
      type: 'text',
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, message]);
    sendMessage(recipientId, input.trim());
    setInput('');
    sendTypingStop(recipientId);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendTypingStart(recipientId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStop(recipientId);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{recipientName}</h2>
            <p className="text-sm text-gray-500">
              {isUserOnline(recipientId) ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.senderId === user?.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className="flex items-center justify-end space-x-1 mt-1">
                <span className="text-[10px] opacity-70">
                  {new Date(message.sentAt).toLocaleTimeString()}
                </span>
                {message.senderId === user?.uid && (
                  <span className="text-[10px]">
                    {message.readAt ? '✓✓' : message.deliveredAt ? '✓' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {recipientTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};