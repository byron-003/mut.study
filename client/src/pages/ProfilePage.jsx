import React, { useState } from 'react';
import { useAuth } from '../utils/authContext';
import { authAPI } from '../services/api';
import { User, Mail, Book, Calendar, Edit2, Save, X, GraduationCap, School, Camera, Upload, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
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
    if (!confirm('Are you sure you want to delete your profile picture?')) {
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
    <div className="min-h-screen bg-gray-50 py-8">
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
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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

          {/* Academic Settings Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 p-6">
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
    </div>
  );
};

export default ProfilePage;
