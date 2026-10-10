/**
 * src/context/ThemeContext.jsx
 *
 * Light/dark theme state.
 *
 * - Until the user toggles explicitly, the theme follows the OS
 *   `prefers-color-scheme` setting live.
 * - Once toggled, the explicit choice is stored in localStorage under
 *   `theme-preference` and wins over the system default on later visits.
 *   (Non-sensitive UI preference — auth tokens remain in-memory only.)
 * - Applies/removes the `dark` class on <html> (Tailwind darkMode: 'class').
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'theme-preference';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null; // storage unavailable (private mode, etc.)
  }
}

function readSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  // null until the user makes an explicit choice
  const [storedTheme, setStoredTheme] = useState(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState(readSystemTheme);

  // Follow OS changes live (only takes effect while there is no stored choice)
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const theme = storedTheme ?? systemTheme;

  // Sync <html class="dark">
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setStoredTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore — preference just won't persist */
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}