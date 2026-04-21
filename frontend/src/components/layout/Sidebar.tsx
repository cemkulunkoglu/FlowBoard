import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBoards } from '../../contexts/BoardsContext';
import { useToast } from '../../contexts/ToastContext';
import type { Board } from '../../types';

export function Sidebar() {
  const { user, logout } = useAuth();
  const { boards, createBoard, updateBoard } = useBoards();
  const toast = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const board = await createBoard(trimmed);
      setTitle('');
      setAdding(false);
      toast.success(`"${board.title}" panosu oluşturuldu.`);
      navigate(`/boards/${board.id}`);
    } catch {
      toast.error('Pano oluşturulamadı.');
    }
  };

  const startEditing = (board: Board) => {
    setEditingId(board.id);
    setTitleDraft(board.title);
  };

  const commitEdit = async (board: Board) => {
    const trimmed = titleDraft.trim();
    setEditingId(null);
    if (!trimmed || trimmed === board.title) return;
    try {
      await updateBoard(board.id, trimmed);
    } catch {
      toast.error('Pano yeniden adlandırılamadı.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = (user?.displayName ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary-500 to-purple-500" />
        <span className="text-base font-semibold text-slate-900 dark:text-slate-100">FlowBoard</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`
          }
        >
          <span className="text-base">⌂</span> Panolar
        </NavLink>

        <div className="mt-5 px-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Panolarım
            </span>
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="text-sm text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400"
              aria-label="Pano ekle"
            >
              +
            </button>
          </div>

          {adding && (
            <form onSubmit={handleCreate} className="mb-2 flex flex-col gap-1.5">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pano adı"
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </form>
          )}

          <div className="flex flex-col gap-0.5">
            {boards.map((b) =>
              editingId === b.id ? (
                <input
                  key={b.id}
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => commitEdit(b)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(b);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-full rounded-md border border-primary-300 bg-white px-3 py-1.5 text-sm focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                />
              ) : (
                <NavLink
                  key={b.id}
                  to={`/boards/${b.id}`}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    startEditing(b);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2 truncate rounded-md px-3 py-1.5 text-sm transition ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`
                  }
                  title="Çift tıkla: yeniden adlandır"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br from-primary-500 to-purple-500" />
                  <span className="truncate">{b.title}</span>
                </NavLink>
              ),
            )}
            {boards.length === 0 && !adding && (
              <p className="px-3 py-1 text-xs text-slate-400 dark:text-slate-500">Henüz pano yok</p>
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-purple-500 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {user?.displayName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="Çıkış"
            aria-label="Çıkış"
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
