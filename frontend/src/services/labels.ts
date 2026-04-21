import { api } from './api';
import type { Label } from '../types';

export const labelsService = {
  create: async (boardId: string, name: string, color: string): Promise<Label> => {
    const { data } = await api.post<Label>('/api/Labels', { boardId, name, color });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/Labels/${id}`);
  },
  attach: async (cardId: string, labelId: string): Promise<void> => {
    await api.post(`/api/Cards/${cardId}/labels/${labelId}`);
  },
  detach: async (cardId: string, labelId: string): Promise<void> => {
    await api.delete(`/api/Cards/${cardId}/labels/${labelId}`);
  },
};
