import { describe, expect, it } from 'vitest';
import { boardReducer } from './boardReducer';
import type { Board, BoardList, Card, Label } from '../types';

const card = (id: string, listId: string, position = 0): Card => ({
  id,
  title: `Card ${id}`,
  description: null,
  position,
  dueDate: null,
  listId,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const list = (id: string, position = 0, cards: Card[] = []): BoardList => ({
  id,
  title: `List ${id}`,
  position,
  boardId: 'b1',
  cards,
});

const baseBoard = (): Board => ({
  id: 'b1',
  title: 'Board',
  ownerId: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  lists: [
    list('l1', 0, [card('c1', 'l1', 0), card('c2', 'l1', 1)]),
    list('l2', 1, [card('c3', 'l2', 0)]),
  ],
  labels: [],
});

describe('boardReducer', () => {
  it('returns new board on SET_BOARD', () => {
    const next = boardReducer(null, { type: 'SET_BOARD', board: baseBoard() });
    expect(next?.id).toBe('b1');
  });

  it('ADD_CARD appends to target list', () => {
    const next = boardReducer(baseBoard(), {
      type: 'ADD_CARD',
      card: card('c4', 'l1', 2),
    });
    expect(next?.lists[0].cards.map((c) => c.id)).toEqual(['c1', 'c2', 'c4']);
  });

  it('ADD_CARD is idempotent for the same card id', () => {
    const state = baseBoard();
    const next = boardReducer(state, { type: 'ADD_CARD', card: state.lists[0].cards[0] });
    expect(next?.lists[0].cards).toHaveLength(2);
  });

  it('DELETE_CARD removes the card', () => {
    const next = boardReducer(baseBoard(), {
      type: 'DELETE_CARD',
      id: 'c2',
      listId: 'l1',
    });
    expect(next?.lists[0].cards.map((c) => c.id)).toEqual(['c1']);
  });

  it('MOVE_CARD across lists puts card at new position and renormalizes', () => {
    const next = boardReducer(baseBoard(), {
      type: 'MOVE_CARD',
      cardId: 'c1',
      sourceListId: 'l1',
      targetListId: 'l2',
      newPosition: 0,
    });
    expect(next?.lists[1].cards.map((c) => c.id)).toEqual(['c1', 'c3']);
    expect(next?.lists[1].cards.map((c) => c.position)).toEqual([0, 1]);
    expect(next?.lists[0].cards.map((c) => c.id)).toEqual(['c2']);
  });

  it('UPDATE_LIST renames list without touching cards', () => {
    const next = boardReducer(baseBoard(), {
      type: 'UPDATE_LIST',
      list: { ...list('l1', 0), title: 'Renamed' },
    });
    expect(next?.lists[0].title).toBe('Renamed');
    expect(next?.lists[0].cards).toHaveLength(2);
  });

  it('DELETE_LABEL removes label from board and all cards', () => {
    const label: Label = { id: 'lb1', boardId: 'b1', name: 'Urgent', color: '#f00' };
    const withLabel: Board = {
      ...baseBoard(),
      labels: [label],
      lists: [
        list('l1', 0, [{ ...card('c1', 'l1'), labels: [label] }]),
        list('l2', 1, []),
      ],
    };

    const next = boardReducer(withLabel, { type: 'DELETE_LABEL', id: 'lb1' });
    expect(next?.labels).toHaveLength(0);
    expect(next?.lists[0].cards[0].labels).toHaveLength(0);
  });

  it('SET_CARD_LABELS resolves ids through board.labels', () => {
    const label: Label = { id: 'lb1', boardId: 'b1', name: 'Urgent', color: '#f00' };
    const withLabel: Board = { ...baseBoard(), labels: [label] };

    const next = boardReducer(withLabel, {
      type: 'SET_CARD_LABELS',
      cardId: 'c1',
      labelIds: ['lb1'],
    });
    expect(next?.lists[0].cards[0].labels).toEqual([label]);
  });
});
