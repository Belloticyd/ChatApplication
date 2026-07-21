



import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { OTPVerificationPage } from './pages/OTPVerificationPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { HomePage } from './pages/HomePage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './stores/auth.store';

const App: React.FC = () => {
  const { hydrate } = useAuthStore();
  
  React.useEffect(() => {
    hydrate();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/setup-profile" element={<ProfileSetupPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;