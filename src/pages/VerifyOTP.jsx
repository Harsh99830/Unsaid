import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthProvider';
import { getSupabaseClient } from '../services/supabase';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasUsername, profileLoading, verifySession } = useAuth();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendTimeLeft, setResendTimeLeft] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Navigation is now handled by the routing system in main.jsx
    // No need for manual navigation here
  }, []);

  // Timer for OTP expiration (only for UI display, not blocking verification)
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Timer for resend functionality
  useEffect(() => {
    if (resendTimeLeft > 0) {
      const timer = setTimeout(() => setResendTimeLeft(resendTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimeLeft]);

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
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client not initialized');
      
      const { data, error } = await client.auth.verifyOtp({
        email: email,
        token: otpValue,
        type: 'email'
      });

      if (error) {
        console.error('OTP verification error:', error);
        
        // Don't block on expiration - let user try anyway
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          setError('OTP verification failed. Please check the OTP code and try again, or request a new OTP.');
        } else {
          setError(error.message || 'OTP verification failed. Please try again.');
        }
        return;
      }

      console.log('OTP verification successful, data:', data);
      
      // Manually check session after verification
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      
      if (sessionError) {
        console.error('Session check error:', sessionError);
        throw new Error('Verification successful but failed to get session');
      }
      
      console.log('Session after verification:', session);
      
      // CRITICAL: Verify the session is valid to prevent ghost sessions
      console.log('🔍 Verifying session after OTP...');
      const isValidSession = await verifySession(session);
      
      if (!isValidSession) {
        console.error('❌ Session verification failed - ghost session detected');
        setError('Session verification failed. Please try logging in again.');
        return;
      }
      
      console.log('✅ Session verified successfully');
      
      // Show success message
      setError('');
      
      const successDiv = document.createElement('div');
      successDiv.className = 'bg-green-50 p-4 rounded-2xl flex gap-3 items-start border border-green-100 mb-4';
      successDiv.innerHTML = `
        <svg class="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <p class="text-sm leading-relaxed text-green-600">Verification successful! Redirecting...</p>
      `;
      
      const form = document.querySelector('form');
      if (form && form.parentNode) {
        form.parentNode.insertBefore(successDiv, form);
      }
      
      // Mark this as a new signup for the auth provider
      localStorage.setItem('auth-new-signup', 'true');
      console.log('🆔 Marked as new signup in localStorage');
      
      // Wait for auth state to update and then redirect
      setTimeout(() => {
        console.log('🚀 Redirecting to root for route handling...');
        window.location.href = '/';
      }, 2000);
      
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
      
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client not initialized');
      
      const { error } = await client.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        throw error;
      }

      console.log('OTP resent to:', email);
      
      // Reset both timers and clear OTP
      setTimeLeft(600); // Reset 10 minutes
      setResendTimeLeft(120); // Reset 2 minutes
      setCanResend(false);
      setOtp(['', '', '', '', '', '', '', '']);
      setError('');
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
          <p className="text-xs text-gray-400 mt-1">
            Check your spam folder if you don't see the email
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
                disabled={isLoading || !canResend}
                className="text-[#FF5722] font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : canResend ? 'Resend OTP' : `Resend in ${Math.floor(resendTimeLeft / 60)}:${(resendTimeLeft % 60).toString().padStart(2, '0')}`}
              </button>
            </p>
            {timeLeft > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                OTP valid for {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>
            )}
            {timeLeft <= 0 && (
              <p className="text-xs text-orange-500 mt-2">
                OTP may have expired, but you can still try it
              </p>
            )}
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
