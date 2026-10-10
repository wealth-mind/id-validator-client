/**
 * src/api/axiosClient.js
 *
 * Single configured Axios instance used by every API call in the app.
 *
 * Request interceptor  — attaches Authorization: Bearer <accessToken>
 * Response interceptor — on 401:
 *   1. Attempts one silent POST /api/auth/refresh
 *   2. On success: stores the new access token and retries the original request
 *   3. On failure: calls logout() and hard-redirects to /login
 *
 * Because AuthContext is a React module and axiosClient is a plain JS module,
 * we use a "late binding" pattern: AuthContext calls setAuthContext(ctx)
 * once inside its provider, giving this module access to the live refs
 * without creating a circular dependency.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Create instance ──────────────────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Auth context reference (populated by AuthContext via setAuthContext) ─────
let _authCtx = null;

/** Called once by AuthProvider on mount to wire up the live auth refs. */
export function setAuthContext(ctx) {
  _authCtx = ctx;
}

// ─── Flag to prevent recursive refresh loops ──────────────────────────────────
let isRefreshing = false;
let failedQueue  = []; // pending requests that arrived during a refresh

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else       resolve(token);
  });
  failedQueue = [];
}

// ─── Request interceptor ─────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = _authCtx?.accessTokenRef?.current;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ────────────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt a refresh on 401, and only once per request (_retry flag).
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Mark so we don't loop
    originalRequest._retry = true;

    if (isRefreshing) {
      // Queue this request until the ongoing refresh resolves
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const rt = _authCtx?.refreshTokenRef?.current;
      if (!rt) throw new Error('No refresh token available.');

      const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
        refreshToken: rt,
      });

      const newAccessToken = data.data.accessToken;

      // Update the in-memory token via the context
      _authCtx?.updateAccessToken(newAccessToken);

      processQueue(null, newAccessToken);

      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Silent refresh failed — log out and redirect to login
      _authCtx?.logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
