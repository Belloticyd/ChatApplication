



// clientSide/src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import type { usersApi, User } from '../api/users.api';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAllUsers();
      setUsers(response.users);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      await loadUsers();
      return;
    }

    try {
      setIsLoading(true);
      const response = await usersApi.searchUsers(query);
      setUsers(response.users);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
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
            <span className="ml-4 text-sm text-gray-600">
              {onlineUsers.length} online
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              {searchQuery ? 'No users found' : 'No other users yet'}
            </div>
          ) : (
            filteredUsers.map((contact) => (
              <div
                key={contact.uid}
                onClick={() => setSelectedChat({ id: contact.uid, name: contact.displayName })}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedChat?.id === contact.uid ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{contact.displayName}</h3>
                    <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
                    {contact.status && (
                      <p className="text-xs text-gray-400 truncate">{contact.status}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    {onlineUsers.includes(contact.uid) && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                    <span className="text-xs text-gray-400 mt-1">
                      {onlineUsers.includes(contact.uid) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
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