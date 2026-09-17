import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../utils/authContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for rate limit info in sessionStorage
    const storedRateLimit = sessionStorage.getItem('loginRateLimit');
    if (storedRateLimit) {
      const { resetTime, attempts } = JSON.parse(storedRateLimit);
      if (Date.now() < resetTime) {
        setRateLimitInfo({ resetTime, attempts });
      } else {
        sessionStorage.removeItem('loginRateLimit');
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAttemptsRemaining(null);

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful! Redirecting...', {
        icon: '✅',
      });
      
      // Clear any rate limit info on successful login
      sessionStorage.removeItem('loginRateLimit');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 429) {
        // Rate limit exceeded
        const retryAfter = err.response?.data?.retryAfter || 300; // Default 5 minutes
        const resetTime = Date.now() + (retryAfter * 1000);
        
        setRateLimitInfo({ resetTime, attempts: 5 });
        sessionStorage.setItem('loginRateLimit', JSON.stringify({ resetTime, attempts: 5 }));
        
        toast.error(`Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`, {
          icon: '🔒',
          duration: 6000,
        });
      } else if (err.response?.status === 401) {
        // Invalid credentials - estimate attempts
        const currentAttempts = (rateLimitInfo?.attempts || 0) + 1;
        const remaining = Math.max(0, 5 - currentAttempts);
        
        if (remaining > 0) {
          setAttemptsRemaining(remaining);
          toast.error(`Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, {
            icon: '❌',
            duration: 5000,
          });
          
          // Store attempt count
          setRateLimitInfo({ ...rateLimitInfo, attempts: currentAttempts });
        } else {
          toast.error('Invalid email or password.', {
            icon: '❌',
          });
        }
      } else if (err.response?.status === 403) {
        toast.error('Your account is inactive. Please contact support.', {
          icon: '🚫',
          duration: 6000,
        });
      } else {
        toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Login failed. Please try again.', {
          icon: '❌',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <img 
              src="/mut-logo.png" 
              alt="MUT Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 ">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 ">
            Or{' '}
            <Link to="/register" className="font-medium text-mut-primary hover:text-green-700 ">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Rate Limit Warning */}
          {rateLimitInfo && Date.now() < rateLimitInfo.resetTime && (
            <div className="rounded-md bg-amber-50  border border-amber-200  p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800 ">
                    ⚠️ Account temporarily locked due to multiple failed attempts. Please wait before trying again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attempts Remaining Indicator */}
          {attemptsRemaining !== null && attemptsRemaining > 0 && (
            <div className="rounded-md bg-yellow-50  border border-yellow-200  p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-800  font-medium">
                  Attempts remaining: {attemptsRemaining} / 5
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < attemptsRemaining 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700  mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={rateLimitInfo && Date.now() < rateLimitInfo.resetTime}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 ">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-mut-primary hover:text-mut-secondary transition-colors "
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={rateLimitInfo && Date.now() < rateLimitInfo.resetTime}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (rateLimitInfo && Date.now() < rateLimitInfo.resetTime)}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Security Info */}
          <div className="text-center text-xs text-gray-500  pt-2">
            <p>🔒 For security: 5 login attempts per 5 minutes</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
