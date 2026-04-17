import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.profile();
      setUser(data);
    } catch { localStorage.clear(); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const profile = await authApi.profile();
    setUser(profile.data);
    return profile.data;
  };

  const register = async (username, email, password, password2) => {
    const { data } = await authApi.register({ username, email, password, password2 });
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try { await authApi.logout(refresh); } catch {}
    localStorage.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await authApi.profile();
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
