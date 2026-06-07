import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cig_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on load
  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (active) setUser(data.user);
      } catch {
        localStorage.removeItem('cig_token');
        if (active) setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  const persist = useCallback((data) => {
    localStorage.setItem('cig_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      persist(data);
      return data.user;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('cig_token');
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
