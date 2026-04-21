import { useEffect, useRef } from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { tokenStorage } from '../services/api';
import type {
  Activity,
  BoardList,
  BoardMember,
  Card,
  ChecklistItem,
  Comment,
  Label,
  PresenceUser,
} from '../types';

export interface BoardHubHandlers {
  onCardCreated?: (card: Card) => void;
  onCardUpdated?: (card: Card) => void;
  onCardDeleted?: (payload: { id: string; listId: string }) => void;
  onCardMoved?: (payload: {
    cardId: string;
    sourceListId: string;
    targetListId: string;
    newPosition: number;
  }) => void;
  onListCreated?: (list: BoardList) => void;
  onListUpdated?: (list: BoardList) => void;
  onListDeleted?: (payload: { id: string; boardId: string }) => void;
  onBoardUpdated?: (payload: { id: string; title: string }) => void;
  onLabelCreated?: (label: Label) => void;
  onLabelDeleted?: (payload: { id: string; boardId: string }) => void;
  onCardLabelsChanged?: (payload: { cardId: string; labelIds: string[] }) => void;
  onCardAssigneesChanged?: (payload: { cardId: string; assigneeIds: string[] }) => void;
  onPresenceSnapshot?: (users: PresenceUser[]) => void;
  onUserJoined?: (user: PresenceUser) => void;
  onUserLeft?: (payload: { userId: string }) => void;
  onMemberAdded?: (member: BoardMember) => void;
  onMemberRemoved?: (payload: { boardId: string; userId: string }) => void;
  onActivityRecorded?: (activity: Activity) => void;
  onChecklistItemCreated?: (item: ChecklistItem) => void;
  onChecklistItemUpdated?: (item: ChecklistItem) => void;
  onChecklistItemDeleted?: (payload: { id: string; cardId: string }) => void;
  onCommentAdded?: (comment: Comment) => void;
  onCommentDeleted?: (payload: { id: string; cardId: string }) => void;
}

const HUB_URL =
  (import.meta.env.VITE_API_URL ?? 'http://localhost:5296') + '/hubs/board';

export function useBoardHub(boardId: string | undefined, handlers: BoardHubHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!boardId) return;

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => tokenStorage.get() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('CardCreated', (c: Card) => handlersRef.current.onCardCreated?.(c));
    connection.on('CardUpdated', (c: Card) => handlersRef.current.onCardUpdated?.(c));
    connection.on('CardDeleted', (p: { id: string; listId: string }) =>
      handlersRef.current.onCardDeleted?.(p),
    );
    connection.on(
      'CardMoved',
      (p: {
        cardId: string;
        sourceListId: string;
        targetListId: string;
        newPosition: number;
      }) => handlersRef.current.onCardMoved?.(p),
    );
    connection.on('ListCreated', (l: BoardList) => handlersRef.current.onListCreated?.(l));
    connection.on('ListUpdated', (l: BoardList) => handlersRef.current.onListUpdated?.(l));
    connection.on('ListDeleted', (p: { id: string; boardId: string }) =>
      handlersRef.current.onListDeleted?.(p),
    );
    connection.on('BoardUpdated', (p: { id: string; title: string }) =>
      handlersRef.current.onBoardUpdated?.(p),
    );
    connection.on('LabelCreated', (l: Label) => handlersRef.current.onLabelCreated?.(l));
    connection.on('LabelDeleted', (p: { id: string; boardId: string }) =>
      handlersRef.current.onLabelDeleted?.(p),
    );
    connection.on(
      'CardLabelsChanged',
      (p: { cardId: string; labelIds: string[] }) =>
        handlersRef.current.onCardLabelsChanged?.(p),
    );
    connection.on(
      'CardAssigneesChanged',
      (p: { cardId: string; assigneeIds: string[] }) =>
        handlersRef.current.onCardAssigneesChanged?.(p),
    );
    connection.on('PresenceSnapshot', (users: PresenceUser[]) =>
      handlersRef.current.onPresenceSnapshot?.(users),
    );
    connection.on('UserJoined', (user: PresenceUser) =>
      handlersRef.current.onUserJoined?.(user),
    );
    connection.on('UserLeft', (payload: { userId: string }) =>
      handlersRef.current.onUserLeft?.(payload),
    );
    connection.on('MemberAdded', (member: BoardMember) =>
      handlersRef.current.onMemberAdded?.(member),
    );
    connection.on('MemberRemoved', (payload: { boardId: string; userId: string }) =>
      handlersRef.current.onMemberRemoved?.(payload),
    );
    connection.on('ActivityRecorded', (activity: Activity) =>
      handlersRef.current.onActivityRecorded?.(activity),
    );
    connection.on('ChecklistItemCreated', (item: ChecklistItem) =>
      handlersRef.current.onChecklistItemCreated?.(item),
    );
    connection.on('ChecklistItemUpdated', (item: ChecklistItem) =>
      handlersRef.current.onChecklistItemUpdated?.(item),
    );
    connection.on('ChecklistItemDeleted', (p: { id: string; cardId: string }) =>
      handlersRef.current.onChecklistItemDeleted?.(p),
    );
    connection.on('CommentAdded', (c: Comment) =>
      handlersRef.current.onCommentAdded?.(c),
    );
    connection.on('CommentDeleted', (p: { id: string; cardId: string }) =>
      handlersRef.current.onCommentDeleted?.(p),
    );

    let cancelled = false;

    connection
      .start()
      .then(() => {
        if (cancelled) return;
        return connection.invoke('JoinBoard', boardId);
      })
      .catch((err) => console.error('SignalR bağlantı hatası:', err));

    return () => {
      cancelled = true;
      if (connection.state === HubConnectionState.Connected) {
        connection.invoke('LeaveBoard', boardId).catch(() => undefined);
      }
      connection.stop().catch(() => undefined);
    };
  }, [boardId]);
}
