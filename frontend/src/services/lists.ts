import { api } from './api';
import type { BoardList } from '../types';

export const listsService = {
  create: async (boardId: string, title: string): Promise<BoardList> => {
    const { data } = await api.post<BoardList>('/api/Lists', { boardId, title });
    return data;
  },
  update: async (id: string, title: string): Promise<BoardList> => {
    const { data } = await api.patch<BoardList>(`/api/Lists/${id}`, { title });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/Lists/${id}`);
  },
};
