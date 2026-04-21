import { api } from './api';
import type { BoardMember } from '../types';

export const boardMembersService = {
  list: async (boardId: string): Promise<BoardMember[]> => {
    const { data } = await api.get<BoardMember[]>(`/api/boards/${boardId}/members`);
    return data;
  },
  invite: async (boardId: string, email: string): Promise<BoardMember> => {
    const { data } = await api.post<BoardMember>(`/api/boards/${boardId}/members`, { email });
    return data;
  },
  remove: async (boardId: string, userId: string): Promise<void> => {
    await api.delete(`/api/boards/${boardId}/members/${userId}`);
  },
};
