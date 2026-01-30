import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../services/supabase';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Navigation is now handled by the routing system in main.jsx
    // No need for manual navigation here
  }, []);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 7) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 8) {
      setError('Please enter all 8 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('Verifying OTP for email:', email, 'with token:', otpValue);
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpValue,
        type: 'email'
      });

      if (error) {
        console.error('OTP verification error:', error);
        throw error;
      }

      console.log('OTP verification successful, data:', data);
      
      // Manually check session after verification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session check error:', sessionError);
        throw new Error('Verification successful but failed to get session');
      }
      
      console.log('Session after verification:', session);
      
      // If verification successful, the auth state change will handle navigation
      // But we can add a small delay and manual check
      setTimeout(() => {
        if (session?.user) {
          console.log('User is authenticated, navigation will happen automatically');
        } else {
          setError('Verification successful but authentication failed. Please try again.');
        }
      }, 1000);
      
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        throw error;
      }

      console.log('OTP resent to:', email);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white text-[#181311] antialiased min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-8 w-full max-w-md mx-auto relative">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#181311] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <div className="bg-[#FF5722]/10 p-4 rounded-2xl mb-2">
            <div className="w-12 h-12 bg-[#FF5722] rounded-full flex items-center justify-center text-white font-bold text-xl">
              ✓
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#181311]">Enter OTP Code</h1>
          <p className="text-gray-500 font-medium">
            We sent an 8-digit code to<br />
            <span className="text-[#FF5722] font-semibold">{email}</span>
          </p>
          <p className="text-sm text-gray-400">
            Enter the code from your email to sign in
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerify} className="w-full space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 ml-1">
              Enter 8-Digit Verification Code
            </label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-[#FF5722] focus:outline-none focus:ring-1 focus:ring-[#FF5722] transition-all duration-200"
                  required
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-2xl flex gap-3 items-start border border-red-100">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <p className="text-sm leading-relaxed text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#FF5722]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={otp.join('').length !== 8 || isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              <>
                Verify Code
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-[#FF5722] font-semibold hover:underline disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Resend OTP'}
              </button>
            </p>
          </div>
        </form>
      </main>

      <footer className="p-8 w-full max-w-md mx-auto text-center mt-auto">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">Secure Verification</p>
        </div>
      </footer>
    </div>
  );
};

export default VerifyOTP;
