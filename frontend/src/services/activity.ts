import { api } from './api';
import type { Activity } from '../types';

export const activityService = {
  list: async (boardId: string, take = 50): Promise<Activity[]> => {
    const { data } = await api.get<Activity[]>(
      `/api/boards/${boardId}/activity?take=${take}`,
    );
    return data;
  },
};
