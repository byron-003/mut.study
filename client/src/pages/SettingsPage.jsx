import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import { authAPI } from '../services/api';
import { useAlert } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import { 
  Settings, Lock, Sparkles, Eye, EyeOff, 
  Save, ArrowLeft, Shield, Zap, CheckCircle, XCircle
} from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { alertState, showAlert, closeAlert } = useAlert();

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
    minLength: false
  });

  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  // Password strength checker
  useEffect(() => {
    const password = passwordData.newPassword;
    const strength = {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
      minLength: password.length >= 8
    };

    const score = Object.values(strength).filter(Boolean).length;
    setPasswordStrength({ ...strength, score });
  }, [passwordData.newPassword]);

  const fetchUserSettings = async () => {
    // Placeholder for future settings
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showAlert('Error', 'All password fields are required', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('Error', 'New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters long', 'error');
      return;
    }

    if (passwordStrength.score < 4) {
      showAlert('Warning', 'Please use a stronger password with uppercase, lowercase, numbers, and symbols', 'warning');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      showAlert('Success', 'Password changed successfully!', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-gray-300';
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score === 3) return 'bg-yellow-500';
    if (passwordStrength.score === 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score === 0) return 'No password';
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score === 3) return 'Good';
    if (passwordStrength.score === 4) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-mut-primary to-mut-secondary text-white py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-green-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-green-100 mt-1">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Password Change Section */}
          <div className="bg-white  rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Change Password</h2>
                  <p className="text-blue-100 text-sm">Keep your account secure</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 pr-12 border border-gray-300  rounded-lg focus:ring-2 focus:ring-mut-primary focus:border-transparent  "
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700  "
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 pr-12 border border-gray-300  rounded-lg focus:ring-2 focus:ring-mut-primary focus:border-transparent  "
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700  "
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 ">
                        Password Strength:
                      </span>
                      <span className={`text-sm font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600' :
                        passwordStrength.score === 3 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200  rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>

                    {/* Requirements Checklist */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={`flex items-center gap-2 ${passwordStrength.minLength ? 'text-green-600' : 'text-gray-500 '}`}>
                        {passwordStrength.minLength ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500 '}`}>
                        {passwordStrength.hasUpperCase ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500 '}`}>
                        {passwordStrength.hasLowerCase ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500 '}`}>
                        {passwordStrength.hasNumber ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center gap-2 col-span-2 ${passwordStrength.hasSymbol ? 'text-green-600' : 'text-gray-500 '}`}>
                        {passwordStrength.hasSymbol ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 pr-12 border border-gray-300  rounded-lg focus:ring-2 focus:ring-mut-primary focus:border-transparent  "
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700  "
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600  flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 ">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 border border-gray-300  text-gray-700  rounded-lg hover:bg-gray-50  transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || passwordStrength.score < 4}
                  className="flex items-center gap-2 px-6 py-2.5 bg-mut-primary text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50  border border-blue-200  rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600  flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900  mb-1">
                  Security Tips
                </h3>
                <ul className="text-sm text-blue-800  space-y-1 list-disc list-inside">
                  <li>Use a unique password you don't use on other websites</li>
                  <li>Never share your password with anyone</li>
                  <li>Change your password regularly for better security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
