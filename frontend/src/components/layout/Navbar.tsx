import { useLocation, useParams } from 'react-router-dom';
import { useBoards } from '../../contexts/BoardsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/auth';

interface Props {
  onMenuClick?: () => void;
  onOpenPalette?: () => void;
}

export function Navbar({ onMenuClick, onOpenPalette }: Props) {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { boards } = useBoards();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const handleResend = async () => {
    try {
      await authService.sendVerificationEmail();
      toast.info('Doğrulama e-postası gönderildi · dev modunda console\'a yazıldı.');
    } catch {
      toast.error('Doğrulama gönderilemedi.');
    }
  };

  let title = 'Panolar';
  let subtitle: string | null = null;

  if (location.pathname.startsWith('/boards/') && id) {
    const board = boards.find((b) => b.id === id);
    title = board?.title ?? 'Pano';
    subtitle = 'Kanban';
  } else if (location.pathname === '/') {
    subtitle = `${boards.length} pano · gerçek zamanlı`;
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Menüyü aç"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && user.emailVerified === false && (
          <button
            type="button"
            onClick={handleResend}
            className="hidden items-center gap-1.5 rounded-full border border-warning-300 bg-warning-50 px-2.5 py-1 text-[11px] font-medium text-warning-800 hover:bg-warning-100 md:flex dark:border-warning-700 dark:bg-warning-950/40 dark:text-warning-300"
            title="E-postanı doğrula"
          >
            <span>⚠</span> E-postanı doğrula
          </button>
        )}
        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 md:flex dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
          title="Komut paleti"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Ara</span>
          <kbd className="rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={toggle}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Tema değiştir"
          title="Tema değiştir"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
              <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
              <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
