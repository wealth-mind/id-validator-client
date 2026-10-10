/**
 * src/context/AuthContext.jsx
 *
 * Holds the current staff session entirely in React memory.
 * Nothing is written to localStorage or sessionStorage — closing the tab
 * or calling logout() clears every piece of auth state.
 *
 * Exposes:
 *   staff          – { id, name, email, role } | null
 *   accessToken    – string | null  (kept in a ref too for interceptors)
 *   refreshToken   – string | null
 *   isAuthenticated – boolean
 *   login(email, password) – calls the server, updates state
 *   logout()               – clears state, optionally redirects
 *   updateAccessToken(tok) – called by the Axios interceptor on silent refresh
 */

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [staff, setStaff]               = useState(null);
  const [accessToken, setAccessToken]   = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [locationTag, setLocationTag]   = useState('');

  // Mirror accessToken & refreshToken in refs so the Axios interceptor
  // can read the latest value without stale closure issues.
  const accessTokenRef  = useRef(null);
  const refreshTokenRef = useRef(null);

  /** Called by the Axios response interceptor to silently update the access token. */
  const updateAccessToken = useCallback((newToken) => {
    accessTokenRef.current = newToken;
    setAccessToken(newToken);
  }, []);

  /**
   * login(email, password)
   * Calls POST /api/auth/login and, on success, hydrates all auth state.
   * Returns the staff object so callers can redirect.
   * Throws on failure — callers should catch and display the error.
   */
  const login = useCallback(async (email, password) => {
    const response = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const { accessToken: at, refreshToken: rt, staff: staffData } = response.data.data;

    accessTokenRef.current  = at;
    refreshTokenRef.current = rt;
    setAccessToken(at);
    setRefreshToken(rt);
    setStaff(staffData);

    return staffData;
  }, []);

  /** logout() — clears everything. The Axios interceptor also calls this on
   *  a failed refresh attempt. */
  const logout = useCallback(() => {
    accessTokenRef.current  = null;
    refreshTokenRef.current = null;
    setAccessToken(null);
    setRefreshToken(null);
    setStaff(null);
    setLocationTag('');
  }, []);

  const value = {
    staff,
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken && staff),
    locationTag,
    setLocationTag,
    // Refs exposed so axiosClient can read without stale closures
    accessTokenRef,
    refreshTokenRef,
    login,
    logout,
    updateAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Convenience hook */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
