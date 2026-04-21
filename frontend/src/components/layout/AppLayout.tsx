import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BoardsProvider } from '../../contexts/BoardsContext';
import { CommandPalette } from '../CommandPalette';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
    setPaletteOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <BoardsProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-900/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-30 transition-transform md:static md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            onMenuClick={() => setSidebarOpen(true)}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </BoardsProvider>
  );
}
