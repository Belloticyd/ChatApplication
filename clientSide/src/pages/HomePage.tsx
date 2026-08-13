


import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);

  // Mock contacts - in real app, these come from your contacts list
  const contacts = [
    { id: 'user2', name: 'John Doe', phone: '+1234567890' },
    { id: 'user3', name: 'Jane Smith', phone: '+1987654321' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">WhatsApp</h1>
              <p className="text-sm text-gray-500">{user?.displayName}</p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="text-sm text-red-600"
            >
              Logout
            </Button>
          </div>
          <div className="mt-2 flex items-center">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="ml-2 text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Contacts List */}
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedChat({ id: contact.id, name: contact.name })}
              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                selectedChat?.id === contact.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{contact.name}</h3>
                  <p className="text-sm text-gray-500">{contact.phone}</p>
                </div>
                {onlineUsers.includes(contact.id) && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow
            recipientId={selectedChat.id}
            recipientName={selectedChat.name}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-semibold">Select a chat</h3>
              <p className="text-sm">Choose a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};