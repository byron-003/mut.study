import React, { useEffect, useState } from 'react';
import { X, Megaphone, Wrench } from 'lucide-react';
import { adminPublicAPI } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const AnnouncementBanner = () => {
  const { settings } = useSettings();
  const [banner, setBanner] = useState({ active: false, message: '', updated_at: null });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('announcement_dismissed') === 'true') {
      setDismissed(true);
      return;
    }

    const loadBanner = async () => {
      try {
        const response = await adminPublicAPI.getBanner();
        setBanner(response.data?.data || { active: false, message: '' });
      } catch (error) {
        console.error('Failed to load announcement banner:', error);
      }
    };

    loadBanner();
  }, []);

  const maintenance = settings.maintenance_mode === true;
  const showMaintenance = maintenance && !dismissed;
  const showAnnouncement = !maintenance && banner.active && banner.message && !dismissed;

  if (!showMaintenance && !showAnnouncement) {
    return null;
  }

  const message = showMaintenance
    ? 'The platform is temporarily under maintenance. Some features may be unavailable.'
    : banner.message;

  return (
    <div
      className={`${showMaintenance ? 'bg-amber-500' : 'bg-mut-primary'} text-white sticky top-16 z-40`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-3 relative">
        {showMaintenance ? (
          <Wrench className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Megaphone className="w-4 h-4 flex-shrink-0" />
        )}
        <p className="text-sm font-medium text-center">{message}</p>
        <button
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem('announcement_dismissed', 'true');
          }}
          className="absolute right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
