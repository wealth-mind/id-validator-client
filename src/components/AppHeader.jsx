/**
 * src/components/AppHeader.jsx
 * Persistent top bar shared by the login and scan screens.
 * Always shows the theme toggle (so it works before login); the staff name and
 * Sign Out button only appear once authenticated.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function AppHeader() {
  const { staff, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-slate-900/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/logo.png"
          alt="University Logo"
          className="w-8 h-8 object-contain flex-shrink-0 drop-shadow"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-black dark:text-white leading-none">ID Scanner</p>
          {isAuthenticated && staff && (
            <p className="text-[10px] sm:text-xs text-black dark:text-white/35 leading-none mt-0.5 truncate max-w-[40vw] sm:max-w-[240px]">
              {staff.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <ThemeToggle />

        {isAuthenticated && (
          <button
            id="logout-btn"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] text-black dark:text-white/40 hover:text-black dark:hover:text-white/80 transition-colors px-3 py-2 rounded-lg hover:bg-slate-900/10 dark:hover:bg-white/10 text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.08a.75.75 0 10-1.004-1.114l-2.5 2.571.002.002a.75.75 0 000 1.11l-.001.001 2.5 2.572a.75.75 0 101.004-1.114l-1.048-1.08H18.25A.75.75 0 0019 10z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}
