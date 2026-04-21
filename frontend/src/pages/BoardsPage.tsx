import { Link } from 'react-router-dom';
import { boardsService } from '../services/boards';
import { useBoards } from '../contexts/BoardsContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export function BoardsPage() {
  const { boards, loading, error, removeBoardLocal, addBoardLocal } = useBoards();
  const toast = useToast();
  const confirm = useConfirm();

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'Panoyu sil',
      message: `"${title}" panosu ve içindeki her şey silinsin mi?`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;

    const board = boards.find((b) => b.id === id);
    if (!board) return;

    removeBoardLocal(id);

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        await boardsService.remove(id);
      } catch {
        toast.error('Pano silinemedi.');
      }
    }, 5000);

    toast.undoable(`"${title}" silindi`, () => {
      cancelled = true;
      clearTimeout(timer);
      addBoardLocal(board);
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {error && (
        <div className="mb-4 rounded-md border border-danger-200 bg-danger-50 px-4 py-2 text-sm text-danger-700 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-300">
          {error}
        </div>
      )}

      {boards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Henüz pano yok. Sol menüden yeni bir pano oluştur.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <div
              key={b.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => handleDelete(b.id, b.title)}
                className="absolute right-3 top-3 text-xs text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-danger-500"
                aria-label="Panoyu sil"
              >
                ✕
              </button>
              <Link to={`/boards/${b.id}`} className="block">
                <div className="mb-3 h-2 w-12 rounded-full bg-linear-to-r from-primary-500 to-purple-500" />
                <h2 className="text-lg font-medium text-slate-900 group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400">
                  {b.title}
                </h2>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(b.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
