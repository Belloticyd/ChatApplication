


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OTPInput from 'react-otp-input';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';

export const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const { verifyOTP, sendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get sessionId from location state or sessionStorage
  const sessionId = location.state?.sessionId || sessionStorage.getItem('sessionId');
  const phoneNumber = location.state?.phoneNumber || sessionStorage.getItem('phoneNumber');

  useEffect(() => {
    if (!sessionId) {
      navigate('/login');
      return;
    }

    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, timeLeft, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      await verifyOTP(sessionId!, otp);
      // navigate to home is handled in the hook
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!phoneNumber) {
      toast.error('Phone number not found. Please start over.');
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendOTP(phoneNumber);
      
      // Update sessionId
      sessionStorage.setItem('sessionId', response.sessionId);
      setTimeLeft(60);
      toast.success('OTP resent successfully');
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Number</h2>
            <p className="text-gray-500 mt-2">
              Enter the 6-digit code sent to <span className="font-semibold">{phoneNumber}</span>
            </p>
          </div>

          <form onSubmit={handleVerify}>
            <div className="mb-6 flex justify-center">
              <OTPInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                renderInput={(props) => (
                  <input
                    {...props}
                    className="w-12 h-14 mx-1 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
                containerStyle="flex justify-center gap-2"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-500">
                Resend code in <span className="font-semibold">{timeLeft}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-sm text-green-600 hover:text-green-700 font-semibold"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};