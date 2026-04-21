import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoards } from '../contexts/BoardsContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const { boards } = useBoards();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return boards.slice(0, 8);
    return boards.filter((b) => b.title.toLowerCase().includes(q)).slice(0, 8);
  }, [boards, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const select = (index: number) => {
    const target = results[index];
    if (!target) return;
    onClose();
    navigate(`/boards/${target.id}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 px-4 py-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              select(activeIndex);
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
          placeholder="Pano ara…"
          className="w-full border-b border-slate-100 bg-transparent px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:border-slate-800 dark:text-slate-100"
        />

        <ul className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <li className="px-5 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              Eşleşen pano yok
            </li>
          ) : (
            results.map((board, index) => (
              <li key={board.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(index)}
                  className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm ${
                    index === activeIndex
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br from-primary-500 to-purple-500" />
                  <span className="flex-1 truncate">{board.title}</span>
                  {index === activeIndex && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">↵</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
          ↑↓ gez · ↵ aç · esc kapat
        </div>
      </div>
    </div>
  );
}
