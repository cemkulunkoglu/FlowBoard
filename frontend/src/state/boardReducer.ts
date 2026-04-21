import type { Board, BoardList, Card, ChecklistItem, Label } from '../types';

export type BoardAction =
  | { type: 'SET_BOARD'; board: Board }
  | { type: 'UPDATE_BOARD'; id: string; title: string }
  | { type: 'ADD_CARD'; card: Card }
  | { type: 'UPDATE_CARD'; card: Card }
  | { type: 'DELETE_CARD'; id: string; listId: string }
  | {
      type: 'MOVE_CARD';
      cardId: string;
      sourceListId: string;
      targetListId: string;
      newPosition: number;
    }
  | { type: 'ADD_LIST'; list: BoardList }
  | { type: 'UPDATE_LIST'; list: BoardList }
  | { type: 'DELETE_LIST'; id: string }
  | { type: 'ADD_LABEL'; label: Label }
  | { type: 'DELETE_LABEL'; id: string }
  | { type: 'SET_CARD_LABELS'; cardId: string; labelIds: string[] }
  | { type: 'SET_CARD_ASSIGNEES'; cardId: string; assigneeIds: string[] }
  | { type: 'ADD_CHECKLIST_ITEM'; item: ChecklistItem }
  | { type: 'UPDATE_CHECKLIST_ITEM'; item: ChecklistItem }
  | { type: 'DELETE_CHECKLIST_ITEM'; id: string; cardId: string };

export function boardReducer(state: Board | null, action: BoardAction): Board | null {
  if (action.type === 'SET_BOARD') return action.board;
  if (!state) return state;

  switch (action.type) {
    case 'UPDATE_BOARD':
      return state.id === action.id ? { ...state, title: action.title } : state;

    case 'ADD_CARD': {
      const exists = state.lists.some((l) => l.cards.some((c) => c.id === action.card.id));
      if (exists) return state;
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.card.listId ? { ...l, cards: [...l.cards, action.card] } : l,
        ),
      };
    }
    case 'UPDATE_CARD':
      return {
        ...state,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) => (c.id === action.card.id ? action.card : c)),
        })),
      };
    case 'DELETE_CARD':
      return {
        ...state,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.filter((c) => c.id !== action.id),
        })),
      };
    case 'MOVE_CARD': {
      const card = state.lists
        .flatMap((l) => l.cards)
        .find((c) => c.id === action.cardId);
      if (!card) return state;

      const withoutCard = state.lists.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== action.cardId),
      }));

      return {
        ...state,
        lists: withoutCard.map((l) => {
          if (l.id !== action.targetListId) return l;
          const next = [...l.cards];
          const updated: Card = {
            ...card,
            listId: action.targetListId,
            position: action.newPosition,
          };
          next.splice(Math.max(0, Math.min(action.newPosition, next.length)), 0, updated);
          return { ...l, cards: next.map((c, i) => ({ ...c, position: i })) };
        }),
      };
    }
    case 'ADD_LIST': {
      const exists = state.lists.some((l) => l.id === action.list.id);
      if (exists) return state;
      return {
        ...state,
        lists: [...state.lists, { ...action.list, cards: action.list.cards ?? [] }],
      };
    }
    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.list.id ? { ...l, title: action.list.title } : l,
        ),
      };
    case 'DELETE_LIST':
      return {
        ...state,
        lists: state.lists.filter((l) => l.id !== action.id),
      };
    case 'ADD_LABEL': {
      const existing = state.labels ?? [];
      if (existing.some((l) => l.id === action.label.id)) return state;
      return { ...state, labels: [...existing, action.label] };
    }
    case 'DELETE_LABEL': {
      const labels = (state.labels ?? []).filter((l) => l.id !== action.id);
      return {
        ...state,
        labels,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) => ({
            ...c,
            labels: c.labels?.filter((lb) => lb.id !== action.id),
          })),
        })),
      };
    }
    case 'SET_CARD_LABELS': {
      const boardLabels = state.labels ?? [];
      const nextLabels = action.labelIds
        .map((id) => boardLabels.find((l) => l.id === id))
        .filter((l): l is Label => Boolean(l));
      return {
        ...state,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === action.cardId ? { ...c, labels: nextLabels } : c,
          ),
        })),
      };
    }
    case 'ADD_CHECKLIST_ITEM':
      return {
        ...state,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) => {
            if (c.id !== action.item.cardId) return c;
            const existing = c.checklistItems ?? [];
            if (existing.some((i) => i.id === action.item.id)) return c;
            return { ...c, checklistItems: [...existing, action.item] };
          }),
        })),
      };
    case 'UPDATE_CHECKLIST_ITEM':
      return {
        ...state,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === action.item.cardId
              ? {
                  ...c,
                  checklistItems: (c.checklistItems ?? []).map((i) =>
                    i.id === action.item.id ? action.item : i,
                  ),
                }
              : c,
          ),
        })),
      };
    case 'DELETE_CHECKLIST_ITEM':
      return {
        ...state,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === action.cardId
              ? {
                  ...c,
                  checklistItems: (c.checklistItems ?? []).filter((i) => i.id !== action.id),
                }
              : c,
          ),
        })),
      };
    case 'SET_CARD_ASSIGNEES': {
      const memberUsers = (state.members ?? [])
        .map((m) => m.user)
        .filter((u): u is NonNullable<typeof u> => Boolean(u));
      const nextAssignees = action.assigneeIds
        .map((id) => memberUsers.find((u) => u.id === id))
        .filter((u): u is NonNullable<typeof u> => Boolean(u));
      return {
        ...state,
        lists: state.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === action.cardId ? { ...c, assignees: nextAssignees } : c,
          ),
        })),
      };
    }
    default:
      return state;
  }
}
