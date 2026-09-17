import React, { useEffect, useState } from 'react';
import { X, Megaphone } from 'lucide-react';
import { adminPublicAPI } from '../services/api';

const AnnouncementBanner = () => {
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

  if (!banner.active || !banner.message || dismissed) {
    return null;
  }

  return (
    <div className="bg-mut-primary text-white sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-3 relative">
        <Megaphone className="w-4 h-4 flex-shrink-0" />
        <p className="text-sm font-medium text-center">{banner.message}</p>
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