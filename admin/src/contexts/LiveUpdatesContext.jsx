import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import { adminAPI } from '../services/api';
import { useAuth } from './AuthContext';

const LiveUpdatesContext = createContext(null);

const EMPTY_BADGES = {
  pendingResources: 0,
  unreadMessages: 0,
  newFeedback: 0,
  totalActionable: 0,
};

/**
 * Provides live badge counts + a refreshVersion that pages can watch
 * to silently reload without a full browser refresh.
 */
export const LiveUpdatesProvider = ({ children }) => {
  const { isAuthenticated, isAdmin, isClassRep } = useAuth();
  const [badges, setBadges] = useState(EMPTY_BADGES);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const mountedRef = useRef(true);

  const bumpRefresh = useCallback(() => {
    setRefreshVersion((v) => v + 1);
  }, []);

  const fetchBadges = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      const response = await adminAPI.getBadges();
      const data = response.data?.data || EMPTY_BADGES;
      if (mountedRef.current) {
        setBadges({
          pendingResources: data.pendingResources || 0,
          unreadMessages: isAdmin ? (data.unreadMessages || 0) : 0,
          newFeedback: isAdmin ? (data.newFeedback || 0) : 0,
          totalActionable:
            (data.pendingResources || 0) +
            (isAdmin ? (data.unreadMessages || 0) + (data.newFeedback || 0) : 0),
        });
      }
      return data;
    } catch (error) {
      console.error('Error fetching admin badges:', error);
      return null;
    }
  }, [isAuthenticated, isAdmin]);

  const refreshAll = useCallback(async () => {
    await fetchBadges();
    bumpRefresh();
  }, [fetchBadges, bumpRefresh]);

  // Poll badges + refresh pages on an interval and when tab becomes visible
  useEffect(() => {
    mountedRef.current = true;
    if (!isAuthenticated) {
      setBadges(EMPTY_BADGES);
      return undefined;
    }

    fetchBadges();

    const intervalId = setInterval(() => {
      fetchBadges().then(() => bumpRefresh());
    }, 30000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    };
    const onFocus = () => refreshAll();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, fetchBadges, bumpRefresh, refreshAll]);

  // Socket connection for instant updates
  useEffect(() => {
    if (!isAuthenticated || (!isAdmin && !isClassRep)) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
      }
      return undefined;
    }

    const token = localStorage.getItem('admin_token');
    if (!token) return undefined;

    const API_URL = import.meta.env.VITE_API_URL || 'https://mut-study.onrender.com/api';
    const serverUrl = API_URL.replace(/\/api\/?$/, '');

    const socket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 8,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    const handleLiveEvent = () => {
      fetchBadges();
      bumpRefresh();
    };

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));

    socket.on('admin:badges', handleLiveEvent);
    socket.on('admin:feedback', handleLiveEvent);
    socket.on('admin:message', handleLiveEvent);
    socket.on('resource:pending', handleLiveEvent);
    socket.on('resource:approved', handleLiveEvent);
    socket.on('resource:rejected', handleLiveEvent);

    return () => {
      socket.off('admin:badges', handleLiveEvent);
      socket.off('admin:feedback', handleLiveEvent);
      socket.off('admin:message', handleLiveEvent);
      socket.off('resource:pending', handleLiveEvent);
      socket.off('resource:approved', handleLiveEvent);
      socket.off('resource:rejected', handleLiveEvent);
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [isAuthenticated, isAdmin, isClassRep, fetchBadges, bumpRefresh]);

  const value = useMemo(
    () => ({
      badges,
      refreshVersion,
      socketConnected,
      refreshBadges: fetchBadges,
      refreshAll,
    }),
    [badges, refreshVersion, socketConnected, fetchBadges, refreshAll]
  );

  return (
    <LiveUpdatesContext.Provider value={value}>
      {children}
    </LiveUpdatesContext.Provider>
  );
};

export const useLiveUpdates = () => {
  const context = useContext(LiveUpdatesContext);
  if (!context) {
    throw new Error('useLiveUpdates must be used within a LiveUpdatesProvider');
  }
  return context;
};

/**
 * Call a fetch function whenever live updates bump (silent — no loading spinner).
 */
export const useLiveRefresh = (fetcher, deps = []) => {
  const { refreshVersion } = useLiveUpdates();
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (refreshVersion === 0) return;
    fetcherRef.current?.(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshVersion, ...deps]);
};
