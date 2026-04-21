import { api } from './api';
import type { Comment } from '../types';

export const commentsService = {
  list: async (cardId: string): Promise<Comment[]> => {
    const { data } = await api.get<Comment[]>(`/api/cards/${cardId}/comments`);
    return data;
  },
  create: async (cardId: string, text: string): Promise<Comment> => {
    const { data } = await api.post<Comment>(`/api/cards/${cardId}/comments`, { text });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/comments/${id}`);
  },
};
