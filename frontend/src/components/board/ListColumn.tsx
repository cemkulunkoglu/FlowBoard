import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useConfirm } from '../../contexts/ConfirmContext';
import type { BoardList, Card } from '../../types';
import { CardItem } from './CardItem';

interface Props {
  list: BoardList;
  onAddCard: (listId: string, title: string) => void;
  onSelectCard: (card: Card) => void;
  onRenameList: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
}

export function ListColumn({
  list,
  onAddCard,
  onSelectCard,
  onRenameList,
  onDeleteList,
}: Props) {
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: 'list', listId: list.id },
  });

  const sortedCards = [...list.cards].sort((a, b) => a.position - b.position);
  const cardIds = sortedCards.map((c) => c.id);

  const handleSubmitCard = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = cardTitle.trim();
    if (!trimmed) return;
    onAddCard(list.id, trimmed);
    setCardTitle('');
    setAdding(false);
  };

  const commitRename = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== list.title) onRenameList(list.id, trimmed);
    else setTitleDraft(list.title);
    setEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex h-fit w-72 shrink-0 flex-col rounded-xl bg-slate-100 p-3 transition dark:bg-slate-800/70 ${
        isOver ? 'ring-2 ring-primary-400' : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setTitleDraft(list.title);
                setEditingTitle(false);
              }
            }}
            className="flex-1 rounded-md border border-primary-300 bg-white px-2 py-0.5 text-sm font-semibold focus:outline-none dark:bg-slate-700 dark:text-slate-100"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleDraft(list.title);
              setEditingTitle(true);
            }}
            className="flex-1 text-left text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100"
          >
            {list.title}
          </button>
        )}
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {sortedCards.length}
        </span>
        <button
          type="button"
          onClick={async () => {
            const ok = await confirm({
              title: 'Listeyi sil',
              message: `"${list.title}" listesi ve içindeki tüm kartlar silinsin mi?`,
              confirmText: 'Sil',
              variant: 'danger',
            });
            if (ok) onDeleteList(list.id);
          }}
          className="text-slate-400 hover:text-danger-500 dark:text-slate-500"
          aria-label="Listeyi sil"
          title="Listeyi sil"
        >
          ✕
        </button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-1 flex-col gap-2">
          {sortedCards.map((card) => (
            <CardItem key={card.id} card={card} onSelect={onSelectCard} />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <form onSubmit={handleSubmitCard} className="mt-2 flex flex-col gap-2">
          <textarea
            autoFocus
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="Kart başlığı..."
            className="rounded-lg border border-slate-300 bg-white p-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setCardTitle('');
              }}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              İptal
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          + Kart ekle
        </button>
      )}
    </div>
  );
}
