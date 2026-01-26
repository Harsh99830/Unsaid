import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
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
    
    if (otpValue.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    
    // Simulate OTP verification
    setTimeout(() => {
      console.log('Verifying OTP:', otpValue, 'for email:', email);
      // Navigate to home page after successful verification
      navigate('/');
      setIsLoading(false);
    }, 1500);
  };

  const handleResend = () => {
    console.log('Resending OTP to:', email);
    // Implement resend logic
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
          <h1 className="text-3xl font-extrabold tracking-tight text-[#181311]">Verify Email</h1>
          <p className="text-gray-500 font-medium">
            We sent a 6-digit code to<br />
            <span className="text-[#FF5722] font-semibold">{email}</span>
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerify} className="w-full space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 ml-1">
              Enter Verification Code
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
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#FF5722] focus:outline-none focus:ring-1 focus:ring-[#FF5722] transition-all duration-200"
                  required
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#FF5722]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={otp.join('').length !== 6 || isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              <>
                Verify Email
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
                className="text-[#FF5722] font-semibold hover:underline"
              >
                Resend OTP
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
