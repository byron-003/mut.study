import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Megaphone, Send, Trash2, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { useAlert } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';

const MAX_LENGTH = 300;

const BannerPage = () => {
  const [message, setMessage] = useState('');
  const [currentBanner, setCurrentBanner] = useState({ active: false, message: '', updated_at: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { alertState, showAlert, closeAlert } = useAlert();

  const loadBanner = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getBanner();
      const data = response.data?.data || { active: false, message: '' };
      setCurrentBanner(data);
      setMessage(data.message || '');
    } catch (error) {
      console.error('Error loading banner:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to load the current banner.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanner();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      showAlert('Warning', 'Please type a message to display in the banner.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await adminAPI.setBanner(message.trim());
      const data = response.data?.data || { active: true, message: message.trim() };
      setCurrentBanner(data);
      showAlert('Posted', 'The announcement banner is now visible to all users on the site.', 'success');
    } catch (error) {
      console.error('Error posting banner:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to post the banner. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await adminAPI.clearBanner();
      setCurrentBanner({ active: false, message: '', updated_at: null });
      setMessage('');
      showAlert('Cleared', 'The announcement banner has been removed from the site.', 'success');
    } catch (error) {
      console.error('Error clearing banner:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to clear the banner. Please try again.', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-admin-primary" />
          Announcement Banner
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Post a message to display at the top of every page for all users. Leave it empty to keep the banner hidden.
        </p>
      </div>

      {/* Current Status */}
      <div className={`rounded-lg border p-4 ${currentBanner.active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${currentBanner.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          <p className={`font-medium ${currentBanner.active ? 'text-green-800' : 'text-gray-600 dark:text-gray-300'}`}>
            {loading
              ? 'Checking current banner...'
              : currentBanner.active
                ? 'A banner is currently live on the site'
                : 'No banner is currently shown'}
          </p>
          <button
            onClick={loadBanner}
            className="ml-auto flex items-center gap-2 text-sm text-admin-primary hover:underline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {currentBanner.active && currentBanner.updated_at && (
          <p className="text-xs text-green-700 mt-2 ml-5">
            Last updated: {new Date(currentBanner.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Post Info</h2>

          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banner Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                rows="4"
                placeholder="e.g. Semester 2 past papers are now available. Upload yours today!"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {message.length}/{MAX_LENGTH}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving || !message.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-admin-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {currentBanner.active ? 'Update Banner' : 'Post Banner'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={clearing || !currentBanner.active}
                className="flex items-center gap-2 px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear Banner
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                The banner appears below the header on the user site. Users can dismiss it, and it will be hidden for
                their session.
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </h2>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Fake site header */}
            <div className="bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-500"></div>
              <span className="font-semibold text-gray-800 dark:text-white text-sm">MUT Study Hub</span>
            </div>

            {/* Banner preview */}
            {message.trim() ? (
              <div className="bg-admin-primary text-white px-4 py-2.5 flex items-center justify-center gap-2">
                <Megaphone className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium text-center">{message}</p>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-400 px-4 py-2.5 text-center text-sm">
                Banner hidden (no message)
              </div>
            )}

            {/* Fake page body */}
            <div className="p-4 space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>

      <CustomAlert {...alertState} onClose={closeAlert} />
    </div>
  );
};

export default BannerPage;