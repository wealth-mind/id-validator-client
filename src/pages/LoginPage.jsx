/**
 * src/pages/LoginPage.jsx
 *
 * Staff login form.
 *
 * • Email + password fields (password has show/hide toggle)
 * • Calls AuthContext.login() which internally POSTs to /api/auth/login
 * • On success: redirects to /scan
 * • On failure: shows inline error ("Invalid credentials") without leaking
 *   whether the email exists.
 * • Already-authenticated staff are redirected away from this page.
 */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in — bounce to scanner
  if (isAuthenticated) return <Navigate to="/scan" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/scan', { replace: true });
    } catch (err) {
      // Always show the same generic message — no user enumeration
      const serverMsg = err?.response?.data?.message;
      setError(serverMsg || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* Brand header */}
      <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
        <img
          src="/logo.png"
          alt="University Logo"
          className="w-20 h-20 object-contain drop-shadow-lg"
        />
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">ID Scanner</h1>
          <p className="text-sm text-slate-500 dark:text-white/45 mt-1">Student ID Validation System</p>
        </div>
      </div>

      {/* Login card */}
      <div className="glass-card w-full max-w-sm sm:max-w-md p-5 sm:p-8 animate-slide-up">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Staff Sign In</h2>
        <p className="text-xs text-slate-500 dark:text-white/40 mb-6">Authorised personnel only</p>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl bg-red-500/15 border border-red-500/30
                       text-red-700 dark:text-red-300 text-sm px-4 py-3 mb-5 animate-fade-in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="w-4 h-4 flex-shrink-0" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-white/50 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@fupre.com"
              className="input-field"
              disabled={loading}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-white/50 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pr-12"
                disabled={loading}
              />
              <button
                type="button"
                id="toggle-password-btn"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center px-3 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.08a.75.75 0 10-1.004-1.114l-2.5 2.571.002.002a.75.75 0 000 1.11l-.001.001 2.5 2.572a.75.75 0 101.004-1.114l-1.048-1.08H18.25A.75.75 0 0019 10z" clipRule="evenodd" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs text-slate-400 dark:text-white/20 text-center">
        For account issues, contact the registrar's office.
      </p>
    </div>
  );
}
