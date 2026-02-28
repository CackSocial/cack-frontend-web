import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import * as messagesAPI from '../api/messages';
import { mapConversation, mapMessage } from '../api/mappers';
import { WSClient, type WSIncomingMessage } from '../api/ws';

interface MessagesState {
  conversations: Conversation[];
  messages: Record<string, Message[]>; // keyed by partner username
  activeConversationId: string | null;
  wsClient: WSClient | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  // Actions
  initWS: (token: string) => void;
  disconnectWS: () => void;
  fetchConversations: () => Promise<void>;
  fetchConversation: (username: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string, image?: File | null) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  getUnreadTotal: () => number;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  wsClient: null,
  isLoadingConversations: false,
  isLoadingMessages: false,

  initWS: (token: string) => {
    const existing = get().wsClient;
    if (existing) return;
    const client = new WSClient(token);
    client.connect();
    client.onMessage((msg: WSIncomingMessage) => {
      const message = mapMessage({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        content: msg.content,
        image_url: msg.image_url,
        read_at: null,
        created_at: msg.created_at,
      });
      // Determine which conversation this belongs to
      // For the current user, partner is the other side
      const conversationKey =
        get().activeConversationId ?? msg.sender_id;
      set((state) => {
        const existing = state.messages[conversationKey] ?? [];
        // Avoid duplicate (we echo back too)
        if (existing.some((m) => m.id === message.id)) return state;
        return {
          messages: {
            ...state.messages,
            [conversationKey]: [...existing, message],
          },
        };
      });
    });
    set({ wsClient: client });
  },

  disconnectWS: () => {
    get().wsClient?.disconnect();
    set({ wsClient: null });
  },

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const res = await messagesAPI.getConversations();
      const conversations = res.data.map(mapConversation);
      set({ conversations, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  fetchConversation: async (username: string) => {
    set({ isLoadingMessages: true });
    try {
      const res = await messagesAPI.getConversation(username);
      const msgs = res.data.map(mapMessage);
      set((state) => ({
        messages: { ...state.messages, [username]: msgs },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  setActiveConversation: (id: string | null) => {
    set({ activeConversationId: id });
    if (id) get().markAsRead(id);
  },

  sendMessage: async (conversationId: string, content: string, image?: File | null) => {
    try {
      const res = await messagesAPI.sendMessage(conversationId, content, image);
      const msg = mapMessage(res.data!);
      set((state) => {
        const existing = state.messages[conversationId] ?? [];
        const conversations = state.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
            : c,
        );
        return {
          messages: { ...state.messages, [conversationId]: [...existing, msg] },
          conversations,
        };
      });
    } catch {
      // ignore send errors silently; could surface via toast
    }
  },

  markAsRead: (conversationId: string) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
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

