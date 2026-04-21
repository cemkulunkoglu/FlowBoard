import { useEffect, useState } from 'react';
import axios from 'axios';
import { boardMembersService } from '../../services/boardMembers';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Board, BoardMember } from '../../types';

interface Props {
  board: Board;
  onClose: () => void;
}

export function BoardSettingsModal({ board, onClose }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const isOwner = user?.id === board.ownerId;

  useEffect(() => {
    boardMembersService
      .list(board.id)
      .then(setMembers)
      .catch(() => toast.error('Üyeler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [board.id, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      const member = await boardMembersService.invite(board.id, email.trim());
      setMembers((prev) => [...prev, member]);
      setEmail('');
      toast.success(`${member.displayName} panoya eklendi.`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        toast.error(String(err.response.data));
      } else {
        toast.error('Davet gönderilemedi.');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, displayName: string) => {
    const ok = await confirm({
      title: 'Üyeyi çıkar',
      message: `${displayName} panodan çıkarılsın mı?`,
      confirmText: 'Çıkar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await boardMembersService.remove(board.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {
      toast.error('Üye çıkarılamadı.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 px-4 py-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Pano ayarları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{board.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          {isOwner && (
            <form onSubmit={handleInvite} className="mb-4 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Üye e-postası"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={inviting || !email.trim()}
                className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {inviting ? 'Ekleniyor…' : 'Davet'}
              </button>
            </form>
          )}

          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Üyeler ({members.length})
          </div>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Yükleniyor…</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-purple-500 text-xs font-semibold text-white">
                    {m.displayName
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-900 dark:text-slate-100">
                      {m.displayName}{' '}
                      {m.role === 'Owner' && (
                        <span className="ml-1 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                          Sahip
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {m.email}
                    </p>
                  </div>
                  {isOwner && m.userId !== board.ownerId && (
                    <button
                      onClick={() => handleRemove(m.userId, m.displayName)}
                      className="text-xs text-danger-600 hover:text-danger-700 dark:text-danger-400"
                    >
                      Çıkar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
