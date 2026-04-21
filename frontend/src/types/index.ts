export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt?: string;
  emailVerified?: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  refreshToken: string;
  user: User;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
}

export interface ChecklistItem {
  id: string;
  cardId: string;
  text: string;
  isDone: boolean;
  position: number;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  listId: string;
  createdAt: string;
  updatedAt: string;
  labels?: Label[];
  assignees?: UserSummary[];
  checklistItems?: ChecklistItem[];
}

export interface BoardList {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: Card[];
}

export interface BoardMemberEntry {
  boardId: string;
  userId: string;
  role: number | string;
  joinedAt: string;
  user?: UserSummary;
}

export interface Board {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  lists: BoardList[];
  labels?: Label[];
  members?: BoardMemberEntry[];
}

export interface BoardMember {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  joinedAt: string;
}

export interface PresenceUser {
  userId: string;
  displayName: string;
}

export interface Activity {
  id: string;
  boardId: string;
  actorId: string;
  actorName: string;
  action: string;
  payload: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}
