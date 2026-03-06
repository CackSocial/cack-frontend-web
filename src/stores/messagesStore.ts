import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import * as messagesAPI from '../api/messages';
import { mapConversation, mapMessage } from '../api/mappers';
import { WSClient, type WSIncomingMessage } from '../api/ws';
import { useToastStore } from './toastStore';

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
      if (msg.type !== 'message') return;
      const message = mapMessage({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        content: msg.content,
        image_url: msg.image_url,
        read_at: null,
        created_at: msg.created_at,
      });

      // Resolve the conversation key (partner's username).
      // When the user is in the conversation, use activeConversationId (username).
      // Otherwise, look up the partner from existing conversations by their ID.
      const state = get();
      let conversationKey = state.activeConversationId;
      if (!conversationKey) {
        const partner = state.conversations.find(
          (c) => c.participant.id === msg.sender_id || c.participant.id === msg.receiver_id,
        );
        conversationKey = partner?.participant.username ?? msg.sender_id;
      }

      set((prev) => {
        const existing = prev.messages[conversationKey] ?? [];
        // Avoid duplicates (sender also receives WS echo after REST send)
        if (existing.some((m) => m.id === message.id)) return prev;

        // Update the conversation preview for non-active conversations
        const updatedConversations = prev.conversations.map((c) => {
          if (c.participant.id === msg.sender_id) {
            return {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount: prev.activeConversationId ? c.unreadCount : c.unreadCount + 1,
            };
          }
          return c;
        });

        return {
          messages: {
            ...prev.messages,
            [conversationKey]: [...existing, message],
          },
          conversations: updatedConversations,
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
        // Avoid duplicate if WS echo arrived before REST response
        if (existing.some((m) => m.id === msg.id)) {
          return { conversations };
        }
        return {
          messages: { ...state.messages, [conversationId]: [...existing, msg] },
          conversations,
        };
      });
    } catch {
      useToastStore.getState().addToast('Failed to send message', 'error');
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

