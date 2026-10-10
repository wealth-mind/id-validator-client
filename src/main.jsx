/**
 * src/main.jsx
 *
 * Application entry point.
 * Wraps App in AuthProvider so every component in the tree can access
 * the auth context. Also wires the Axios client to the live auth context
 * so the interceptor can read/update tokens without stale closures.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { setAuthContext } from './api/axiosClient';
import './index.css';

/**
 * Tiny bridge component — calls setAuthContext once the AuthProvider
 * has mounted and the context is available, then renders nothing extra.
 */
function AxiosBridge({ children }) {
  const authCtx = useAuth();
  // Call synchronously on first render so interceptors are wired before
  // any network request goes out.
  setAuthContext(authCtx);
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AxiosBridge>
          <App />
        </AxiosBridge>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
