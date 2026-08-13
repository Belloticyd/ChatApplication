


import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../api/auth.api';
import { socketService } from '../services/socket.service';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    setUser,
    setToken,
    setRefreshToken,
    setLoading,
    setAuthenticated,
    logout,
    hydrate,
  } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      if (token && !user) {
        try {
          const response = await authApi.getProfile();
          setUser(response.user);
          setAuthenticated(true);
          
          // Connect Socket.IO after authentication
          socketService.connect(token);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Connect/disconnect socket based on auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  const sendOTP = async (phoneNumber: string) => {
    try {
      setLoading(true);
      const response = await authApi.sendOTP({ phoneNumber });
      toast.success(response.message);
      return response;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to send OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (sessionId: string, otp: string) => {
    try {
      setLoading(true);
      const response = await authApi.verifyOTP({ sessionId, otp });
      
      setToken(response.token);
      setRefreshToken(response.refreshToken);
      setUser(response.user);
      setAuthenticated(true);
      
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Connect Socket.IO
      socketService.connect(response.token);
      
      toast.success('Welcome! 🎉');
      navigate('/');
      return response;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Invalid OTP. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
      socketService.disconnect();
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      socketService.disconnect();
      logout();
      navigate('/login');
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    sendOTP,
    verifyOTP,
    logout: handleLogout,
  };
};