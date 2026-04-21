import { useEffect } from 'react';
import type { Activity } from '../../types';

interface Props {
  open: boolean;
  activities: Activity[];
  loading: boolean;
  onClose: () => void;
}

function describe(a: Activity): string {
  let p: Record<string, string> = {};
  try {
    p = JSON.parse(a.payload);
  } catch {
    // ignore
  }
  switch (a.action) {
    case 'board.created':
      return `"${p.title}" panosunu oluşturdu.`;
    case 'board.renamed':
      return `panoyu "${p.from}" → "${p.to}" olarak yeniden adlandırdı.`;
    case 'list.created':
      return `"${p.title}" listesini oluşturdu.`;
    case 'list.deleted':
      return `"${p.title}" listesini sildi.`;
    case 'card.created':
      return `"${p.cardTitle}" kartını "${p.listTitle}" listesine ekledi.`;
    case 'card.moved':
      return `"${p.cardTitle}" kartını "${p.fromList}" → "${p.toList}" taşıdı.`;
    case 'card.deleted':
      return `"${p.cardTitle}" kartını sildi.`;
    case 'member.added':
      return `${p.displayName} kullanıcısını panoya ekledi.`;
    case 'member.removed':
      return `${p.displayName} kullanıcısını panodan çıkardı.`;
    default:
      return a.action;
  }
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ActivityDrawer({ open, activities, loading, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40" />
      <aside
        className="relative flex w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Aktivite
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Yükleniyor…</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Henüz aktivite yok.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-purple-500 text-[10px] font-semibold text-white"
                    title={a.actorName}
                  >
                    {initials(a.actorName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {a.actorName}
                      </span>{' '}
                      {describe(a)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
