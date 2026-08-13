

// clientSide/src/api/users.api.ts
import apiClient from './client';

export interface User {
  uid: string;
  phoneNumber: string;
  displayName: string;
  photoURL?: string;
  status?: string;
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const usersApi = {
  // Get all users except yourself
  getAllUsers: async (): Promise<{ success: boolean; users: User[] }> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Search users by phone number or name
  searchUsers: async (query: string): Promise<{ success: boolean; users: User[] }> => {
    const response = await apiClient.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
};