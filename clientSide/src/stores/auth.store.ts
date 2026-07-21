

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define ALL types directly in this file
interface User {
  uid: string;
  phoneNumber: string;
  displayName: string;
  photoURL?: string;
  status?: string;
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
        set({ user });
      },
      
      setToken: (token) => {
        if (token) {
          localStorage.setItem('accessToken', token);
        } else {
          localStorage.removeItem('accessToken');
        }
        set({ token });
      },
      
      setRefreshToken: (refreshToken) => {
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        } else {
          localStorage.removeItem('refreshToken');
        }
        set({ refreshToken });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      hydrate: () => {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              token,
              refreshToken,
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to hydrate auth state:', error);
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);