import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { mockConversations, mockMessages } from '../data/mockData';

interface MessagesState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string, imageUrl?: string) => void;
  markAsRead: (conversationId: string) => void;
  getUnreadTotal: () => number;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [...mockConversations],
  messages: { ...mockMessages },
  activeConversationId: null,

  setActiveConversation: (id: string | null) => {
    set({ activeConversationId: id });
    if (id) get().markAsRead(id);
  },

  sendMessage: (conversationId: string, content: string, imageUrl?: string) => {
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      senderId: 'u0',
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    set((state) => {
      const convMessages = [...(state.messages[conversationId] ?? []), newMsg];
      const conversations = state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt }
          : c
      );

      return {
        messages: { ...state.messages, [conversationId]: convMessages },
        conversations,
      };
    });
  },

  markAsRead: (conversationId: string) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) => ({
          ...m,
          isRead: true,
        })),
      },
    })),

  getUnreadTotal: () =>
    get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),
}));
