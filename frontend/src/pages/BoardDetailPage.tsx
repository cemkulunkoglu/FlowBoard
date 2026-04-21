import { useCallback, useEffect, useReducer, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { boardsService } from '../services/boards';
import { cardsService } from '../services/cards';
import { listsService } from '../services/lists';
import { labelsService } from '../services/labels';
import { useBoardHub } from '../hooks/useBoardHub';
import { useToast } from '../contexts/ToastContext';
import { useBoards } from '../contexts/BoardsContext';
import { boardReducer } from '../state/boardReducer';
import { ListColumn } from '../components/board/ListColumn';
import { CardItem } from '../components/board/CardItem';
import { CardDetailModal } from '../components/board/CardDetailModal';
import { BoardSettingsModal } from '../components/board/BoardSettingsModal';
import { ActivityDrawer } from '../components/board/ActivityDrawer';
import { activityService } from '../services/activity';
import { commentsService } from '../services/comments';
import type { Activity, Card, Comment, Label, PresenceUser } from '../types';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { patchBoardLocal } = useBoards();
  const [board, dispatch] = useReducer(boardReducer, null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    boardsService
      .get(id)
      .then((b) => dispatch({ type: 'SET_BOARD', board: b }))
      .catch(() => setLoadError('Pano yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setActivityLoading(true);
    activityService
      .list(id)
      .then(setActivities)
      .catch(() => undefined)
      .finally(() => setActivityLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedCard) {
      setComments([]);
      return;
    }
    setCommentsLoading(true);
    commentsService
      .list(selectedCard.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [selectedCard]);

  useBoardHub(id, {
    onCardCreated: (card) => dispatch({ type: 'ADD_CARD', card }),
    onCardUpdated: (card) => {
      dispatch({ type: 'UPDATE_CARD', card });
      setSelectedCard((prev) => (prev?.id === card.id ? card : prev));
    },
    onCardDeleted: ({ id, listId }) => dispatch({ type: 'DELETE_CARD', id, listId }),
    onCardMoved: (p) => dispatch({ type: 'MOVE_CARD', ...p }),
    onListCreated: (list) => dispatch({ type: 'ADD_LIST', list }),
    onListUpdated: (list) => dispatch({ type: 'UPDATE_LIST', list }),
    onListDeleted: ({ id }) => dispatch({ type: 'DELETE_LIST', id }),
    onBoardUpdated: ({ id: boardId, title }) => {
      dispatch({ type: 'UPDATE_BOARD', id: boardId, title });
      patchBoardLocal(boardId, { title });
    },
    onLabelCreated: (label) => dispatch({ type: 'ADD_LABEL', label }),
    onLabelDeleted: ({ id: labelId }) => dispatch({ type: 'DELETE_LABEL', id: labelId }),
    onCardLabelsChanged: ({ cardId, labelIds }) =>
      dispatch({ type: 'SET_CARD_LABELS', cardId, labelIds }),
    onCardAssigneesChanged: ({ cardId, assigneeIds }) =>
      dispatch({ type: 'SET_CARD_ASSIGNEES', cardId, assigneeIds }),
    onPresenceSnapshot: (users) => setPresence(users),
    onUserJoined: (user) =>
      setPresence((prev) =>
        prev.some((p) => p.userId === user.userId) ? prev : [...prev, user],
      ),
    onUserLeft: ({ userId }) =>
      setPresence((prev) => prev.filter((p) => p.userId !== userId)),
    onActivityRecorded: (activity) =>
      setActivities((prev) =>
        prev.some((a) => a.id === activity.id) ? prev : [activity, ...prev].slice(0, 50),
      ),
    onChecklistItemCreated: (item) => dispatch({ type: 'ADD_CHECKLIST_ITEM', item }),
    onChecklistItemUpdated: (item) => dispatch({ type: 'UPDATE_CHECKLIST_ITEM', item }),
    onChecklistItemDeleted: ({ id, cardId }) =>
      dispatch({ type: 'DELETE_CHECKLIST_ITEM', id, cardId }),
    onCommentAdded: (comment) =>
      setComments((prev) =>
        !selectedCard || comment.cardId !== selectedCard.id || prev.some((c) => c.id === comment.id)
          ? prev
          : [...prev, comment],
      ),
    onCommentDeleted: ({ id, cardId }) =>
      setComments((prev) =>
        !selectedCard || cardId !== selectedCard.id ? prev : prev.filter((c) => c.id !== id),
      ),
  });

  const handleCreateLabel = useCallback(
    async (name: string, color: string): Promise<Label | null> => {
      if (!id) return null;
      try {
        const label = await labelsService.create(id, name, color);
        dispatch({ type: 'ADD_LABEL', label });
        return label;
      } catch {
        toast.error('Etiket oluşturulamadı.');
        return null;
      }
    },
    [id, toast],
  );

  const handleCardLabelsChanged = useCallback((cardId: string, labelIds: string[]) => {
    dispatch({ type: 'SET_CARD_LABELS', cardId, labelIds });
  }, []);

  const handleCardAssigneesChanged = useCallback((cardId: string, assigneeIds: string[]) => {
    dispatch({ type: 'SET_CARD_ASSIGNEES', cardId, assigneeIds });
  }, []);

  const handleChecklistAdded = useCallback((item: import('../types').ChecklistItem) => {
    dispatch({ type: 'ADD_CHECKLIST_ITEM', item });
  }, []);

  const handleChecklistUpdated = useCallback((item: import('../types').ChecklistItem) => {
    dispatch({ type: 'UPDATE_CHECKLIST_ITEM', item });
  }, []);

  const handleChecklistDeleted = useCallback((id: string, cardId: string) => {
    dispatch({ type: 'DELETE_CHECKLIST_ITEM', id, cardId });
  }, []);

  const handleAddCard = useCallback(
    async (listId: string, title: string) => {
      try {
        const card = await cardsService.create(listId, title);
        dispatch({ type: 'ADD_CARD', card });
      } catch {
        toast.error('Kart eklenemedi.');
      }
    },
    [toast],
  );

  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      if (!board) return;
      const card = board.lists.flatMap((l) => l.cards).find((c) => c.id === cardId);
      if (!card) return;

      dispatch({ type: 'DELETE_CARD', id: cardId, listId: card.listId });

      let cancelled = false;
      const timer = setTimeout(async () => {
        if (cancelled) return;
        try {
          await cardsService.remove(cardId);
        } catch {
          toast.error('Kart silinemedi.');
        }
      }, 5000);

      toast.undoable(`"${card.title}" silindi`, () => {
        cancelled = true;
        clearTimeout(timer);
        dispatch({ type: 'ADD_CARD', card });
      });
    },
    [board, toast],
  );

  const handleCardUpdated = useCallback((card: Card) => {
    dispatch({ type: 'UPDATE_CARD', card });
  }, []);

  const handleAddList = useCallback(async () => {
    const trimmed = newListTitle.trim();
    if (!trimmed || !id) return;
    try {
      const list = await listsService.create(id, trimmed);
      dispatch({ type: 'ADD_LIST', list });
      setNewListTitle('');
      toast.success(`"${list.title}" listesi eklendi.`);
    } catch {
      toast.error('Liste eklenemedi.');
    }
  }, [id, newListTitle, toast]);

  const handleRenameList = useCallback(
    async (listId: string, title: string) => {
      try {
        const list = await listsService.update(listId, title);
        dispatch({ type: 'UPDATE_LIST', list });
      } catch {
        toast.error('Liste yeniden adlandırılamadı.');
      }
    },
    [toast],
  );

  const handleDeleteList = useCallback(
    async (listId: string) => {
      if (!board) return;
      const list = board.lists.find((l) => l.id === listId);
      if (!list) return;

      dispatch({ type: 'DELETE_LIST', id: listId });

      let cancelled = false;
      const timer = setTimeout(async () => {
        if (cancelled) return;
        try {
          await listsService.remove(listId);
        } catch {
          toast.error('Liste silinemedi.');
        }
      }, 5000);

      toast.undoable(`"${list.title}" listesi silindi`, () => {
        cancelled = true;
        clearTimeout(timer);
        dispatch({ type: 'ADD_LIST', list });
      });
    },
    [board, toast],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e: DragStartEvent) => {
    const card = board?.lists.flatMap((l) => l.cards).find((c) => c.id === e.active.id);
    setActiveCard(card ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = e;
    if (!over || !board) return;

    const activeCard = board.lists
      .flatMap((l) => l.cards)
      .find((c) => c.id === active.id);
    if (!activeCard) return;

    const sourceListId = activeCard.listId;
    let targetListId: string;
    let newPosition: number;

    const overId = String(over.id);
    if (overId.startsWith('list-')) {
      targetListId = overId.slice(5);
      const target = board.lists.find((l) => l.id === targetListId);
      newPosition = target ? target.cards.length : 0;
    } else {
      const overCard = board.lists.flatMap((l) => l.cards).find((c) => c.id === overId);
      if (!overCard) return;
      targetListId = overCard.listId;
      const target = board.lists.find((l) => l.id === targetListId)!;
      const sorted = [...target.cards].sort((a, b) => a.position - b.position);
      newPosition = sorted.findIndex((c) => c.id === overCard.id);
    }

    if (sourceListId === targetListId && activeCard.position === newPosition) return;

    dispatch({
      type: 'MOVE_CARD',
      cardId: activeCard.id,
      sourceListId,
      targetListId,
      newPosition,
    });

    cardsService
      .move(activeCard.id, targetListId, newPosition)
      .catch(() => toast.error('Kart taşınamadı.'));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Yükleniyor…
      </div>
    );
  }
  if (loadError && !board) {
    return (
      <div className="flex h-full items-center justify-center text-danger-500">
        {loadError}
      </div>
    );
  }
  if (!board) return null;

  const sortedLists = [...board.lists].sort((a, b) => a.position - b.position);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-6 py-2 dark:border-slate-800 dark:bg-slate-900/40">
        <PresenceStack users={presence} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActivityOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
          >
            <span>🕐</span> Aktivite
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
          >
            <span>⚙</span> Ayarlar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto px-6 py-6">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex min-h-full items-start gap-4">
            {sortedLists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                onAddCard={handleAddCard}
                onSelectCard={setSelectedCard}
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
              />
            ))}

            <div className="w-72 shrink-0 rounded-xl bg-slate-100/60 p-3">
              <input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="+ Liste ekle"
                onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm placeholder:text-slate-500 focus:border-slate-300 focus:bg-white focus:outline-none"
              />
              {newListTitle.trim() && (
                <button
                  onClick={handleAddList}
                  className="mt-2 w-full rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  Ekle
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && <CardItem card={activeCard} />}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedCard && (() => {
        const freshCard = board.lists
          .flatMap((l) => l.cards)
          .find((c) => c.id === selectedCard.id) ?? selectedCard;
        return (
          <CardDetailModal
            card={freshCard}
            boardLabels={board.labels ?? []}
            boardMembers={(board.members ?? [])
              .map((m) => m.user)
              .filter((u): u is NonNullable<typeof u> => Boolean(u))}
            comments={comments}
            commentsLoading={commentsLoading}
            onClose={() => setSelectedCard(null)}
            onSaved={handleCardUpdated}
            onDelete={handleDeleteCard}
            onCreateLabel={handleCreateLabel}
            onLabelsChanged={handleCardLabelsChanged}
            onAssigneesChanged={handleCardAssigneesChanged}
            onChecklistAdded={handleChecklistAdded}
            onChecklistUpdated={handleChecklistUpdated}
            onChecklistDeleted={handleChecklistDeleted}
            onCommentAdded={(c) => setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]))}
            onCommentDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
          />
        );
      })()}

      {settingsOpen && (
        <BoardSettingsModal board={board} onClose={() => setSettingsOpen(false)} />
      )}

      <ActivityDrawer
        open={activityOpen}
        activities={activities}
        loading={activityLoading}
        onClose={() => setActivityOpen(false)}
      />
    </div>
  );
}

function PresenceStack({ users }: { users: PresenceUser[] }) {
  const visible = users.slice(0, 5);
  const overflow = users.length - visible.length;

  if (users.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">Yalnızsın</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <div
            key={u.userId}
            title={u.displayName}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-linear-to-br from-primary-500 to-purple-500 text-[10px] font-semibold text-white dark:border-slate-900"
          >
            {u.displayName
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-600 dark:border-slate-900 dark:bg-slate-700 dark:text-slate-200">
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {users.length} online
      </span>
    </div>
  );
}
