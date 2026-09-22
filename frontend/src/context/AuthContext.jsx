/**
 * AuthContext — Global Authentication State & Token Management
 *
 * Stores JWT token in localStorage, provides login/logout/register,
 * and auto-injects Authorization header via axios interceptor.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

// Configure axios base URL and auth interceptor
axios.defaults.baseURL = API_BASE;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexify_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexify_token') || null);
  const [loading, setLoading] = useState(true);

  // Auth state + JWT injection via fetch
  useEffect(() => {
    if (token) {
      localStorage.setItem('nexify_token', token);
    } else {
      localStorage.removeItem('nexify_token');
    }
  }, [token]);

  async function apiCall(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || `HTTP ${res.status}`);
      err.response = { data, status: res.status };
      throw err;
    }
    return data;
  }

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiCall('GET', '/auth/me');
        setUser(res.data);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/v1/auth/login');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const { token: newToken, user: userData } = data.data;
            localStorage.setItem('nexify_token', newToken);
            setToken(newToken);
            setUser(userData);
            resolve(userData);
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.message || 'Login failed'));
          } catch {
            reject(new Error('Login failed'));
          }
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(JSON.stringify({ email, password }));
    });
  }, []);

  const register = useCallback(async (data) => {
    const res = await apiCall('POST', '/auth/register', data);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await apiCall('PUT', '/auth/profile', data);
    setUser(res.data);
    return res.data;
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateProfile,
    api: axios,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
