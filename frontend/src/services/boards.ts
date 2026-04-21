import { api } from './api';
import type { Board } from '../types';

export const boardsService = {
  list: async (): Promise<Board[]> => {
    const { data } = await api.get<Board[]>('/api/Boards');
    return data;
  },
  get: async (id: string): Promise<Board> => {
    const { data } = await api.get<Board>(`/api/Boards/${id}`);
    return data;
  },
  create: async (title: string): Promise<Board> => {
    const { data } = await api.post<Board>('/api/Boards', { title });
    return data;
  },
  update: async (id: string, title: string): Promise<Board> => {
    const { data } = await api.put<Board>(`/api/Boards/${id}`, { title });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/Boards/${id}`);
  },
};
