import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { boardsService } from '../services/boards';
import { useAuth } from './AuthContext';
import type { Board } from '../types';

interface BoardsContextValue {
  boards: Board[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createBoard: (title: string) => Promise<Board>;
  updateBoard: (id: string, title: string) => Promise<Board>;
  removeBoard: (id: string) => Promise<void>;
  patchBoardLocal: (id: string, patch: Partial<Board>) => void;
  removeBoardLocal: (id: string) => void;
  addBoardLocal: (board: Board) => void;
}

const BoardsContext = createContext<BoardsContextValue | undefined>(undefined);

export function BoardsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setBoards(await boardsService.list());
      setError(null);
    } catch {
      setError('Panolar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setBoards([]);
      setLoading(false);
      return;
    }
    refresh();
  }, [token, refresh]);

  const createBoard = useCallback(async (title: string) => {
    const board = await boardsService.create(title);
    setBoards((prev) => [board, ...prev]);
    return board;
  }, []);

  const updateBoard = useCallback(async (id: string, title: string) => {
    const board = await boardsService.update(id, title);
    setBoards((prev) => prev.map((b) => (b.id === id ? board : b)));
    return board;
  }, []);

  const removeBoard = useCallback(async (id: string) => {
    await boardsService.remove(id);
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const patchBoardLocal = useCallback((id: string, patch: Partial<Board>) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const removeBoardLocal = useCallback((id: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addBoardLocal = useCallback((board: Board) => {
    setBoards((prev) => (prev.some((b) => b.id === board.id) ? prev : [board, ...prev]));
  }, []);

  return (
    <BoardsContext.Provider
      value={{
        boards,
        loading,
        error,
        refresh,
        createBoard,
        updateBoard,
        removeBoard,
        patchBoardLocal,
        removeBoardLocal,
        addBoardLocal,
      }}
    >
      {children}
    </BoardsContext.Provider>
  );
}

export function useBoards() {
  const ctx = useContext(BoardsContext);
  if (!ctx) throw new Error('useBoards BoardsProvider içinde kullanılmalı.');
  return ctx;
}
