import { create } from 'zustand';
import type { Notification } from '../types';
import * as notificationsAPI from '../api/notifications';
import { mapNotification } from '../api/mappers';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  fetchNotifications: (page?: number, limit?: number, append?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,

  fetchNotifications: async (page = 1, limit = 20, append = false) => {
    set({ isLoading: true });
    try {
      const res = await notificationsAPI.getNotifications(page, limit);
      const mapped = res.data.map(mapNotification);
      set((state) => ({
        notifications: append ? [...state.notifications, ...mapped] : mapped,
        isLoading: false,
        hasMore: mapped.length >= limit,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0)),
    }));
    try {
      await notificationsAPI.markAsRead(id);
    } catch {
      // Revert on error
      get().fetchNotifications();
      get().fetchUnreadCount();
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await notificationsAPI.markAllAsRead();
    } catch {
      get().fetchNotifications();
      get().fetchUnreadCount();
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      set({ unreadCount: res.data?.count ?? 0 });
    } catch {
      // ignore
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
