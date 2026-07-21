


import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.displayName}!
              </h1>
              <p className="text-gray-500 mt-1">
                {user?.phoneNumber}
              </p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              Logout
            </Button>
          </div>
          
          <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
            <h2 className="text-lg font-semibold text-green-800">
              🎉 Authentication Working!
            </h2>
            <p className="text-green-700 mt-2">
              Your auth flow is complete. Next, we'll build the real-time chat interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};