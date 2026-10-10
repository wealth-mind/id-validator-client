/**
 * src/App.jsx
 *
 * Router setup.
 * Routes:
 *   /login  → LoginPage (public)
 *   /scan   → ScanPage  (protected: authenticated + allowed role)
 *   *       → redirect to /scan
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import ScanPage from './pages/ScanPage';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Shared layout: persistent header (theme toggle) on every screen */}
        <Route element={<AppLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <ScanPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/scan" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
