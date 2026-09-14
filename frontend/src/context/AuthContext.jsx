import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('darkauth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('darkauth_token');
    if (token) {
      authAPI.me()
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('darkauth_user', JSON.stringify(data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (loginData) => {
    const { data } = await authAPI.login(loginData);
    localStorage.setItem('darkauth_token', data.accessToken);
    localStorage.setItem('darkauth_refresh', data.refreshToken);
    localStorage.setItem('darkauth_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (regData) => {
    const { data } = await authAPI.register(regData);
    localStorage.setItem('darkauth_token', data.accessToken);
    localStorage.setItem('darkauth_refresh', data.refreshToken);
    localStorage.setItem('darkauth_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('darkauth_token');
    localStorage.removeItem('darkauth_refresh');
    localStorage.removeItem('darkauth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
