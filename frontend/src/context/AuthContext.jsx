import { createContext, useContext, useMemo, useState } from 'react';
import apiRequest from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('devflow_user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('devflow_token') || '');
  const [loading, setLoading] = useState(false);

  const login = async (payload) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('devflow_user', JSON.stringify(data.data.user));
      localStorage.setItem('devflow_token', data.data.token);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('devflow_user', JSON.stringify(data.data.user));
      localStorage.setItem('devflow_token', data.data.token);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('devflow_user');
    localStorage.removeItem('devflow_token');
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(token && user),
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
