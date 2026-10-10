/**
 * src/components/AppLayout.jsx
 * Shared layout for every client screen (login + scan): persistent AppHeader
 * on top, the current route rendered below via <Outlet />.
 */
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
