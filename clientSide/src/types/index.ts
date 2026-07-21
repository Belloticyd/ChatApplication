


// User related types
export interface User {
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

// Auth related types
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  sessionId: string;
  otp?: string;
}

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface VerifyOTPRequest {
  sessionId: string;
  otp: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}


