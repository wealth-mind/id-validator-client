/**
 * src/routes/ProtectedRoute.jsx
 *
 * Guards routes that require authentication and a valid scanner role.
 *
 * Behaviour:
 *   • Not authenticated  → redirect to /login
 *   • Authenticated but wrong role → render an "Access Denied" screen
 *   • Authenticated + valid role   → render children
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ALLOWED_ROLES = ['security', 'library', 'exam_invigilator', 'registrar_admin'];

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, staff } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (staff && !ALLOWED_ROLES.includes(staff.role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-card max-w-sm w-full p-8 flex flex-col items-center gap-5 text-center animate-slide-up">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-14 h-14 text-red-600 dark:text-red-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
              clipRule="evenodd"
            />
          </svg>

          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
              Your account role (<span className="font-mono text-slate-700 dark:text-white/80">{staff.role}</span>) is
              not authorised to use the scanner. Please contact your system administrator.
            </p>
          </div>

          <p className="text-xs text-slate-400 dark:text-white/30">
            Logged in as <span className="text-slate-600 dark:text-white/50">{staff.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return children;
}
