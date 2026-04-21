import { api } from './api';
import type { Card } from '../types';

export const cardsService = {
  create: async (listId: string, title: string): Promise<Card> => {
    const { data } = await api.post<Card>('/api/Cards', { listId, title });
    return data;
  },
  update: async (
    id: string,
    patch: { title?: string; description?: string; dueDate?: string | null },
  ): Promise<Card> => {
    const { data } = await api.patch<Card>(`/api/Cards/${id}`, patch);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/Cards/${id}`);
  },
  move: async (
    id: string,
    targetListId: string,
    newPosition: number,
  ): Promise<void> => {
    await api.post(`/api/Cards/${id}/move`, { targetListId, newPosition });
  },
  attachAssignee: async (cardId: string, userId: string): Promise<void> => {
    await api.post(`/api/Cards/${cardId}/assignees/${userId}`);
  },
  detachAssignee: async (cardId: string, userId: string): Promise<void> => {
    await api.delete(`/api/Cards/${cardId}/assignees/${userId}`);
  },
};
