import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../utils/authContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user, token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) {
      // Disconnect if user logs out
      if (socket) {
        console.log('🔌 Disconnecting socket (no token/user)');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const serverUrl = API_URL.replace('/api', '');

    console.log('🔌 Initializing socket connection to:', serverUrl);

    // Create socket connection with authentication
    const newSocket = io(serverUrl, {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔥 Socket reconnection error:', error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔥 Socket reconnection failed after all attempts');
      setConnectionError('Failed to reconnect to server');
    });

    setSocket(newSocket);

    // Cleanup on unmount or token change
    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [token, user]);

  // Join a room
  const joinRoom = useCallback((roomType, roomId) => {
    if (!socket || !isConnected) {
      console.warn('Cannot join room: socket not connected');
      return;
    }
    socket.emit(`join:${roomType}`, roomId);
    console.log(`📥 Joined ${roomType} room:`, roomId);
  }, [socket, isConnected]);

  // Leave a room
  const leaveRoom = useCallback((roomType, roomId) => {
    if (!socket || !isConnected) {
      console.warn('Cannot leave room: socket not connected');
      return;
    }
    socket.emit(`leave:${roomType}`, roomId);
    console.log(`📤 Left ${roomType} room:`, roomId);
  }, [socket, isConnected]);

  // Emit event
  const emit = useCallback((event, data) => {
    if (!socket || !isConnected) {
      console.warn('Cannot emit event: socket not connected');
      return;
    }
    socket.emit(event, data);
  }, [socket, isConnected]);

  // Listen to event
  const on = useCallback((event, callback) => {
    if (!socket) {
      console.warn('Cannot listen to event: socket not initialized');
      return;
    }
    socket.on(event, callback);
    
    // Return cleanup function
    return () => {
      socket.off(event, callback);
    };
  }, [socket]);

  // Remove event listener
  const off = useCallback((event, callback) => {
    if (!socket) return;
    socket.off(event, callback);
  }, [socket]);

  const value = {
    socket,
    isConnected,
    connectionError,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Custom hook for listening to socket events with automatic cleanup
 */
export const useSocketEvent = (event, callback, dependencies = []) => {
  const { on, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const cleanup = on(event, callback);
    return cleanup;
  }, [event, isConnected, ...dependencies]);
};

/**
 * Custom hook for joining/leaving rooms automatically
 */
export const useSocketRoom = (roomType, roomId) => {
  const { joinRoom, leaveRoom, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !roomId) return;

    joinRoom(roomType, roomId);

    return () => {
      leaveRoom(roomType, roomId);
    };
  }, [roomType, roomId, isConnected, joinRoom, leaveRoom]);
};
