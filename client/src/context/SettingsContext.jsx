import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { adminPublicAPI } from '../services/api';

export const DEFAULT_SETTINGS = {
  site_name: 'MUT Study Hub',
  site_description:
    'Your comprehensive platform for academic resources, collaboration, and success at Muranga University of Technology.',
  contact_email: 'support@mutstudy.ac.za',
  max_file_size: 52428800,
  allowed_file_types:
    '.pdf,.doc,.docx,.txt,.html,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.csv,.ods,.zip,.rar,.7z,.tar,.gz,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac',
  downloads_enabled: true,
  registration_enabled: true,
  maintenance_mode: false,
  allow_student_uploads: true,
  password_min_length: 8,
  require_strong_password: true,
};

const REFRESH_INTERVAL = 15000;

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await adminPublicAPI.getSettings();
      const data = response.data?.data;
      if (mountedRef.current && data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      // Keep the last known (or default) settings on failure
      console.error('Failed to load system settings:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshSettings();

    const intervalId = setInterval(refreshSettings, REFRESH_INTERVAL);

    const handleFocus = () => refreshSettings();
    const handleVisibility = () => {
      if (!document.hidden) refreshSettings();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshSettings]);

  // Apply branding to the document as soon as settings change
  useEffect(() => {
    if (settings.site_name) {
      document.title = settings.site_name;
    }

    if (settings.site_description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', settings.site_description);
    }
  }, [settings.site_name, settings.site_description]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

export default SettingsContext;
