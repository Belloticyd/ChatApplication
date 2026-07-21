


import apiClient from './client';

// Define types here to avoid import issues
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

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  sessionId: string;
  otp?: string;
}

interface SendOTPRequest {
  phoneNumber: string;
}

interface VerifyOTPRequest {
  sessionId: string;
  otp: string;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

export const authApi = {
  sendOTP: async (data: SendOTPRequest): Promise<SendOTPResponse> => {
    const response = await apiClient.post('/auth/send-otp', data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/verify-otp', data);
    return response.data;
  },

  getProfile: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<LogoutResponse> => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },
};