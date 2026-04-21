import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cardsService } from '../../services/cards';
import { labelsService } from '../../services/labels';
import { checklistService } from '../../services/checklist';
import { commentsService } from '../../services/comments';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Card, ChecklistItem, Comment, Label, UserSummary } from '../../types';

interface Props {
  card: Card;
  boardLabels: Label[];
  boardMembers: UserSummary[];
  onClose: () => void;
  onSaved: (card: Card) => void;
  onDelete: (id: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | null>;
  onLabelsChanged: (cardId: string, labelIds: string[]) => void;
  onAssigneesChanged: (cardId: string, assigneeIds: string[]) => void;
  onChecklistAdded: (item: ChecklistItem) => void;
  onChecklistUpdated: (item: ChecklistItem) => void;
  onChecklistDeleted: (id: string, cardId: string) => void;
  comments: Comment[];
  commentsLoading: boolean;
  onCommentAdded: (comment: Comment) => void;
  onCommentDeleted: (id: string) => void;
}

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

export function CardDetailModal({
  card,
  boardLabels,
  boardMembers,
  onClose,
  onSaved,
  onDelete,
  onCreateLabel,
  onLabelsChanged,
  onAssigneesChanged,
  onChecklistAdded,
  onChecklistUpdated,
  onChecklistDeleted,
  comments,
  commentsLoading,
  onCommentAdded,
  onCommentDeleted,
}: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const activeAssigneeIds = new Set(card.assignees?.map((u) => u.id) ?? []);

  const toggleAssignee = async (user: UserSummary) => {
    const isActive = activeAssigneeIds.has(user.id);
    const nextIds = isActive
      ? [...activeAssigneeIds].filter((id) => id !== user.id)
      : [...activeAssigneeIds, user.id];
    onAssigneesChanged(card.id, nextIds);
    try {
      if (isActive) await cardsService.detachAssignee(card.id, user.id);
      else await cardsService.attachAssignee(card.id, user.id);
    } catch {
      toast.error('Atama değişikliği kaydedilemedi.');
    }
  };
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.slice(0, 10) : '',
  );
  const [saving, setSaving] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  const activeLabelIds = new Set(card.labels?.map((l) => l.id) ?? []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Başlık boş olamaz.');
      return;
    }
    setSaving(true);
    try {
      const updated = await cardsService.update(card.id, {
        title: title.trim(),
        description: description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      onSaved({ ...updated, labels: card.labels });
      onClose();
    } catch {
      toast.error('Kart güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Kartı sil',
      message: `"${card.title}" kartı silinsin mi?`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    onDelete(card.id);
    onClose();
  };

  const toggleLabel = async (label: Label) => {
    const isActive = activeLabelIds.has(label.id);
    const nextIds = isActive
      ? [...activeLabelIds].filter((id) => id !== label.id)
      : [...activeLabelIds, label.id];
    onLabelsChanged(card.id, nextIds);
    try {
      if (isActive) await labelsService.detach(card.id, label.id);
      else await labelsService.attach(card.id, label.id);
    } catch {
      toast.error('Etiket değişikliği kaydedilemedi.');
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed) return;
    const label = await onCreateLabel(trimmed, newLabelColor);
    if (label) {
      setNewLabelName('');
      await toggleLabel(label);
    }
  };

  const handleChecklistAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    try {
      const item = await checklistService.create(card.id, trimmed);
      onChecklistAdded(item);
      setNewChecklistText('');
    } catch {
      toast.error('Madde eklenemedi.');
    }
  };

  const handleChecklistToggle = async (item: ChecklistItem) => {
    const optimistic: ChecklistItem = { ...item, isDone: !item.isDone };
    onChecklistUpdated(optimistic);
    try {
      const updated = await checklistService.update(item.id, { isDone: !item.isDone });
      onChecklistUpdated(updated);
    } catch {
      onChecklistUpdated(item);
      toast.error('Madde güncellenemedi.');
    }
  };

  const handleChecklistDelete = async (item: ChecklistItem) => {
    onChecklistDeleted(item.id, item.cardId);
    try {
      await checklistService.remove(item.id);
    } catch {
      toast.error('Madde silinemedi.');
    }
  };

  const sortedChecklist = [...(card.checklistItems ?? [])].sort((a, b) => a.position - b.position);
  const doneCount = sortedChecklist.filter((i) => i.isDone).length;
  const progressPercent = sortedChecklist.length > 0
    ? Math.round((doneCount / sortedChecklist.length) * 100)
    : 0;

  const handleCommentAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    try {
      const comment = await commentsService.create(card.id, trimmed);
      onCommentAdded(comment);
      setNewCommentText('');
    } catch {
      toast.error('Yorum eklenemedi.');
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    const ok = await confirm({
      title: 'Yorumu sil',
      message: 'Bu yorum silinsin mi?',
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    onCommentDeleted(commentId);
    try {
      await commentsService.remove(commentId);
    } catch {
      toast.error('Yorum silinemedi.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out] md:py-12"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-[scaleIn_0.18s_ease-out] dark:bg-slate-900 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-lg font-semibold text-slate-900 focus:outline-none dark:text-slate-100"
            placeholder="Kart başlığı"
          />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Kapat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                Etiketler
              </label>
              <button
                type="button"
                onClick={() => setLabelPickerOpen((v) => !v)}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {labelPickerOpen ? 'Kapat' : 'Düzenle'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {card.labels && card.labels.length > 0 ? (
                card.labels.map((l) => (
                  <span
                    key={l.id}
                    className="rounded px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">Etiket yok</span>
              )}
            </div>

            {labelPickerOpen && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50" data-picker="labels">
                <div className="flex flex-wrap gap-1.5">
                  {boardLabels.map((l) => {
                    const active = activeLabelIds.has(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLabel(l)}
                        className={`rounded px-2 py-0.5 text-xs font-medium text-white transition ${
                          active ? 'ring-2 ring-offset-1 ring-slate-500 dark:ring-offset-slate-800' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: l.color }}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                  {boardLabels.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Bu panoda henüz etiket yok
                    </span>
                  )}
                </div>

                <form onSubmit={handleCreateLabel} className="mt-3 flex items-center gap-2">
                  <input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Yeni etiket"
                    className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewLabelColor(c)}
                        className={`h-5 w-5 rounded-full border-2 ${
                          newLabelColor === c ? 'border-slate-900 dark:border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Renk ${c}`}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    Ekle
                  </button>
                </form>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Atananlar
              </label>
              <button
                type="button"
                onClick={() => setAssigneePickerOpen((v) => !v)}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {assigneePickerOpen ? 'Kapat' : 'Düzenle'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {card.assignees && card.assignees.length > 0 ? (
                card.assignees.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-purple-500 text-[9px] font-semibold text-white">
                      {u.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                    {u.displayName}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">Atanan yok</span>
              )}
            </div>
            {assigneePickerOpen && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex flex-col gap-1">
                  {boardMembers.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Bu panoda henüz üye yok
                    </span>
                  )}
                  {boardMembers.map((u) => {
                    const active = activeAssigneeIds.has(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u)}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                          active
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-purple-500 text-[10px] font-semibold text-white">
                          {u.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                        <span className="flex-1 truncate">{u.displayName}</span>
                        {active && (
                          <svg className="text-primary-600 dark:text-primary-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="14" y2="17" />
                </svg>
                Açıklama
              </label>
              <button
                type="button"
                onClick={() => setEditingDesc((v) => !v)}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {editingDesc ? 'Önizle' : 'Düzenle'}
              </button>
            </div>
            {editingDesc ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="**Markdown** destekli açıklama…"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            ) : description.trim() ? (
              <div className="markdown-body rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingDesc(true)}
                className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm text-slate-400 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-500"
              >
                Açıklama eklemek için tıkla…
              </button>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Kontrol listesi
              </label>
              {sortedChecklist.length > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {doneCount}/{sortedChecklist.length} · %{progressPercent}
                </span>
              )}
            </div>

            {sortedChecklist.length > 0 && (
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full transition-all ${
                    progressPercent === 100 ? 'bg-success-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <ul className="flex flex-col gap-1">
              {sortedChecklist.map((item) => (
                <li key={item.id} className="group flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.isDone}
                    onChange={() => handleChecklistToggle(item)}
                    className="h-4 w-4 accent-primary-600"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.isDone
                        ? 'text-slate-400 line-through dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChecklistDelete(item)}
                    className="text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-danger-500"
                    aria-label="Maddeyi sil"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleChecklistAdd} className="mt-2 flex gap-2">
              <input
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Yeni madde"
                className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim()}
                className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Ekle
              </button>
            </form>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Bitiş tarihi
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:scheme-dark"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Yorumlar {comments.length > 0 && <span className="text-slate-400 dark:text-slate-500">({comments.length})</span>}
            </label>

            {commentsLoading ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Yükleniyor…</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="group flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-purple-500 text-[10px] font-semibold text-white">
                      {c.authorName
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {c.authorName}
                        </span>
                        <span className="ml-2 text-slate-400 dark:text-slate-500">
                          {new Date(c.createdAt).toLocaleString('tr-TR')}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                        {c.text}
                      </p>
                    </div>
                    {c.authorId === user?.id && (
                      <button
                        type="button"
                        onClick={() => handleCommentDelete(c.id)}
                        className="text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-danger-500"
                        aria-label="Yorumu sil"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleCommentAdd} className="mt-2 flex flex-col gap-1.5">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Yorum yaz…"
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="self-end rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Gönder
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger-600 transition hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Kartı sil
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
