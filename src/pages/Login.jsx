import React, { useState } from 'react';
import { School, ArrowRight, Mail, Shield, ExternalLink, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthProvider';

const Login = () => {
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Set new user flag - this will be cleared after successful profile creation
      localStorage.setItem('auth-new-user', 'true');
      
      await signInWithEmail(email);
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      console.error('Login error:', err);
      if (err.message.includes('500')) {
        setError('Server configuration error. Please check Supabase email settings.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <div className="bg-white text-[#181311] antialiased min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-8 w-full max-w-md mx-auto relative">
        {/* Logo and Title */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <div className="bg-[#FF5722]/10 p-4 rounded-2xl mb-2">
            <School size={40} className="text-[#FF5722]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#181311]">Unsaid</h1>
          <p className="text-gray-500 font-medium">Connect anonymously</p>
        </div>

        {/* Login Form */}
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 ml-1" htmlFor="email">
              University Email
            </label>
            <div className="relative">
              <Mail 
                size={20} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
              />
              <input
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-[#181311] placeholder:text-gray-400 focus:bg-white focus:border-[#FF5722] focus:outline-none focus:ring-1 focus:ring-[#FF5722] transition-all duration-200"
                id="email"
                type="email"
                placeholder="yourname@university.edu"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!email}
            onClick={handleSubmit}
            className="w-full"
          >
            Send OTP
            <ArrowRight size={20} />
          </Button>

          {error && (
            <div className="bg-red-50 p-4 rounded-2xl flex gap-3 items-start border border-red-100">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <p className="text-sm leading-relaxed text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-2xl flex gap-3 items-start border border-gray-100">
            <Shield size={20} className="text-[#FF5722] shrink-0" />
            <p className="text-sm leading-relaxed text-gray-600">
              Your identity is always private. We only use your email to verify you are a student.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-8 w-full max-w-md mx-auto text-center mt-auto">
        <div className="flex flex-col items-center gap-4">
          <a 
            href="#" 
            className="text-sm font-medium text-gray-400 hover:text-[#FF5722] transition-colors flex items-center gap-1"
          >
            Community Guidelines
            <ExternalLink size={16} />
          </a>
          <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">Secure Access</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;