



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import 'react-phone-number-input/style.css';

export const LoginPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendOTP } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendOTP(phoneNumber);
      
      sessionStorage.setItem('sessionId', response.sessionId);
      sessionStorage.setItem('phoneNumber', phoneNumber);
      
      navigate('/verify-otp', { 
        state: { 
          sessionId: response.sessionId,
          phoneNumber 
        } 
      });
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-8 m-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-4">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24   24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Chat Application Clone</h1>
            <p className="text-gray-500 mt-2">Enter your phone number to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <PhoneInput
                international
                defaultCountry="US"
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
              <p className="mt-2 text-sm text-gray-500">
                We'll send you a verification code
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !phoneNumber}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Continue'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            By continuing, you agree to our Terms of Service
          </div>
        </div>
      </div>
    </div>
  );
};