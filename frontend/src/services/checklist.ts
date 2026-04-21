import { api } from './api';
import type { ChecklistItem } from '../types';

export const checklistService = {
  create: async (cardId: string, text: string): Promise<ChecklistItem> => {
    const { data } = await api.post<ChecklistItem>(`/api/cards/${cardId}/checklist`, { text });
    return data;
  },
  update: async (
    itemId: string,
    patch: { text?: string; isDone?: boolean },
  ): Promise<ChecklistItem> => {
    const { data } = await api.patch<ChecklistItem>(`/api/checklist/${itemId}`, patch);
    return data;
  },
  remove: async (itemId: string): Promise<void> => {
    await api.delete(`/api/checklist/${itemId}`);
  },
};
