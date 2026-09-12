import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle, Shield, CheckCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  useEffect(() => {
    // Check for rate limit info in sessionStorage
    const storedRateLimit = sessionStorage.getItem('adminLoginRateLimit');
    if (storedRateLimit) {
      const { resetTime, attempts } = JSON.parse(storedRateLimit);
      if (Date.now() < resetTime) {
        setRateLimitInfo({ resetTime, attempts });
      } else {
        sessionStorage.removeItem('adminLoginRateLimit');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAttemptsRemaining(null);

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful! Redirecting...', {
        icon: '✅',
      });
      
      sessionStorage.removeItem('adminLoginRateLimit');
      
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retryAfter || 300;
        const resetTime = Date.now() + (retryAfter * 1000);
        
        setRateLimitInfo({ resetTime, attempts: 5 });
        sessionStorage.setItem('adminLoginRateLimit', JSON.stringify({ resetTime, attempts: 5 }));
        
        toast.error(`Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`, {
          icon: '🔒',
          duration: 6000,
        });
      } else if (err.response?.status === 401) {
        const currentAttempts = (rateLimitInfo?.attempts || 0) + 1;
        const remaining = Math.max(0, 5 - currentAttempts);
        
        if (remaining > 0) {
          setAttemptsRemaining(remaining);
          toast.error(`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, {
            icon: '❌',
            duration: 5000,
          });
          
          setRateLimitInfo({ ...rateLimitInfo, attempts: currentAttempts });
        } else {
          toast.error('Invalid credentials or insufficient permissions.', {
            icon: '❌',
          });
        }
      } else if (err.response?.status === 403) {
        toast.error('Access denied. Only administrators and class representatives can access this panel.', {
          icon: '🚫',
          duration: 6000,
        });
      } else {
        toast.error(err.response?.data?.message || err.message || 'Invalid credentials or insufficient permissions', {
          icon: '❌',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-admin-primary to-admin-secondary dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl p-8 text-center">
          <div className="w-20 h-20 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <img 
              src="/mut-logo.png" 
              alt="MUT Logo" 
              className="w-full h-full object-contain p-2"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MUT Study Hub</h1>
          <p className="text-gray-600">Admin Panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">Sign In to Continue</h2>

          {/* Rate Limit Warning */}
          {rateLimitInfo && Date.now() < rateLimitInfo.resetTime && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  ⚠️ Account temporarily locked. Please wait before trying again.
                </p>
              </div>
            </div>
          )}

          {/* Attempts Remaining Indicator */}
          {attemptsRemaining !== null && attemptsRemaining > 0 && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={rateLimitInfo && Date.now() < rateLimitInfo.resetTime}
                  required
                  placeholder="admin@mut.ac.ke"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={rateLimitInfo && Date.now() < rateLimitInfo.resetTime}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (rateLimitInfo && Date.now() < rateLimitInfo.resetTime)}
              className="w-full bg-gradient-to-r from-admin-primary to-admin-secondary text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
            <p className="text-xs text-blue-800 dark:text-blue-400 text-center">
              <strong>Note:</strong> Only administrators and class representatives can access this panel
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 text-center">
              🔒 Security: 5 login attempts per 5 minutes
            </p>
          </div>
        </div>

        <p className="text-center text-white text-sm mt-6">
          © 2026 Murang'a University of Technology
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
