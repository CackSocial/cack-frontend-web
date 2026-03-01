import { get, put } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendNotificationResponse, BackendUnreadCountResponse } from './types';

export function getNotifications(page = 1, limit = 20) {
  return get<PaginatedResponse<BackendNotificationResponse>>(
    `/notifications?page=${page}&limit=${limit}`,
  );
}

export function markAsRead(id: string) {
  return put<APIResponse>(`/notifications/${encodeURIComponent(id)}/read`);
}

export function markAllAsRead() {
  return put<APIResponse>('/notifications/read-all');
}

export function getUnreadCount() {
  return get<APIResponse<BackendUnreadCountResponse>>('/notifications/unread-count');
}
