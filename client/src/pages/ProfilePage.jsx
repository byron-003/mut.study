import React, { useState } from 'react';
import { useAuth } from '../utils/authContext';
import { authAPI } from '../services/api';
import { User, Mail, Book, Calendar, Edit2, Save, X, GraduationCap, School, Camera, Upload, Trash2, AlertCircle, Copy, CheckCircle, Share2 } from 'lucide-react';
import axios from 'axios';
import { useConfirm } from '../hooks/useAlert';
import CustomConfirm from '../components/CustomConfirm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { confirmState, showConfirm } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    currentYear: user?.currentYear || '',
    currentSemester: user?.currentSemester || ''
  });

  const referralLink = user?.id ? `${window.location.origin}/register?ref=${user.id}` : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Join me on MUT Study Hub! Share and access academic resources for Muranga University of Technology students.`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      color: '#25D366',
      path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
      href: () => `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
      href: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(shareText)}`
    },
    {
      name: 'X (Twitter)',
      color: '#000000',
      path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
      href: () => `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Telegram',
      color: '#0088cc',
      path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
      href: () => `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`
    },
    {
      name: 'Email',
      color: '#6366f1',
      path: 'M1.5 4h21c.828 0 1.5.672 1.5 1.5v13c0 .828-.672 1.5-1.5 1.5h-21C.672 20 0 19.328 0 18.5v-13C0 4.672.672 4 1.5 4zm.5 2.5v.586l10.5 7.5L23 7.086V6.5h-21zm0 2.353v9.647h21V8.853L12 16.5 2 8.853z',
      href: () => `mailto:?subject=${encodeURIComponent('Join me on MUT Study Hub')}&body=${encodeURIComponent(`${shareText}\n\n${referralLink}`)}`
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await authAPI.updateProfile({
        currentYear: formData.currentYear ? parseInt(formData.currentYear) : null,
        currentSemester: formData.currentSemester ? parseInt(formData.currentSemester) : null
      });
      
      // Update user in context
      updateUser(response.data.data);
      
      setSuccess('Academic settings updated successfully!');
      setEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      currentYear: user?.currentYear || '',
      currentSemester: user?.currentSemester || ''
    });
    setEditing(false);
    setError('');
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setUploadingPicture(true);
      setError('');
      
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post(
        `${API_URL}/auth/profile/picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update user context with new profile picture
      updateUser({ ...user, profilePicture: response.data.data.profilePicture });
      setSuccess('Profile picture updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    const confirmed = await showConfirm({
      title: 'Delete Profile Picture',
      message: 'Are you sure you want to delete your profile picture?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      setUploadingPicture(true);
      setError('');

      await axios.delete(`${API_URL}/auth/profile/picture`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update user context
      updateUser({ ...user, profilePicture: null });
      setSuccess('Profile picture deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting profile picture:', err);
      setError(err.response?.data?.message || 'Failed to delete profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50  py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <Save className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Information Card */}
          <div className="bg-white  rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-mut-primary to-mut-secondary p-6">
              <div className="flex items-center gap-6">
                {/* Profile Picture with Upload */}
                <div className="relative">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-mut-primary text-2xl font-bold shadow-lg border-4 border-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                  
                  {/* Upload Button Overlay */}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shadow-lg border-2 border-mut-primary">
                    <Camera className="w-4 h-4 text-mut-primary" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      disabled={uploadingPicture}
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-green-100 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                  
                  {user?.profilePicture && (
                    <button
                      onClick={handleDeleteProfilePicture}
                      disabled={uploadingPicture}
                      className="mt-2 flex items-center gap-2 text-sm text-white hover:text-red-200 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Photo
                    </button>
                  )}
                  
                  {uploadingPicture && (
                    <p className="text-sm text-white mt-2">Uploading...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              </div>

              {/* Read-only account info */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> To change your name or email address, please contact admin support at <strong>support@mutstudy.ac.za</strong>
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  
                  {user?.programName && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <School className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Program</p>
                        <p className="font-medium text-gray-900">{user?.programCode}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Referral & Share Card */}
          {user?.id && (
            <div className="bg-white  rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200  p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-mut-primary rounded-lg">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Referral & Share</h3>
                    <p className="text-sm text-gray-600">Invite your friends to join MUT Study Hub</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Referral Link
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mut-primary"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
                        copied
                          ? 'bg-green-500 text-white scale-105'
                          : 'bg-mut-primary text-white hover:bg-mut-secondary'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Share this link with friends — when they sign up, they'll be tracked as your referral.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Share on
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {shareOptions.map((option) => (
                      <a
                        key={option.name}
                        href={option.href()}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Share on ${option.name}`}
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:scale-110 active:scale-95"
                        style={{ backgroundColor: option.color }}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                          <path d={option.path} />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Settings Card */}
          <div className="bg-white  rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200  p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-mut-primary rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Academic Settings</h3>
                  <p className="text-sm text-gray-600">Set your current year and semester for personalized content</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Setting your current year and semester helps personalize your dashboard to show relevant courses and resources.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Year of Study
                      </label>
                      <select
                        value={formData.currentYear}
                        onChange={(e) => setFormData({ ...formData, currentYear: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                      >
                        <option value="">Not Set</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="5">Year 5</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Semester
                      </label>
                      <select
                        value={formData.currentSemester}
                        onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
                      >
                        <option value="">Not Set</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-mut-primary text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {(!user?.currentYear || !user?.currentSemester) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ Your academic settings are not complete. Please set your current year and semester for a personalized experience.
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${user?.currentYear ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Book className={`w-5 h-5 ${user?.currentYear ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Year of Study</p>
                        <p className="font-medium text-gray-900">
                          {user?.currentYear ? `Year ${user.currentYear}` : 'Not Set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${user?.currentSemester ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Calendar className={`w-5 h-5 ${user?.currentSemester ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Semester</p>
                        <p className="font-medium text-gray-900">
                          {user?.currentSemester ? `Semester ${user.currentSemester}` : 'Not Set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 text-mut-primary hover:bg-green-50 rounded-lg transition-colors mt-4"
                    >
                      <Edit2 className="w-4 h-4" />
                      Update Academic Settings
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <CustomConfirm {...confirmState} />
    </div>
  );
};

export default ProfilePage;
