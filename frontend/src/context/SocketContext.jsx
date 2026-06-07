import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, fileBase } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  const pushToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // Load existing notifications when logged in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      return;
    }
    api
      .get('/notifications')
      .then(({ data }) => {
        setNotifications(data.notifications);
        setUnread(data.unread);
      })
      .catch(() => {});
  }, [user]);

  // Real-time socket connection
  useEffect(() => {
    if (!token) return;
    const socket = io(fileBase || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnread((u) => u + 1);
      pushToast({ message: n.message, actor: n.actor, mediaId: n.mediaId });
    });

    return () => socket.disconnect();
  }, [token, pushToast]);

  const markAllRead = useCallback(async () => {
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.post('/notifications/read', {});
    } catch {
      /* ignore */
    }
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <SocketContext.Provider
      value={{ notifications, unread, markAllRead, toasts, pushToast, dismissToast }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
