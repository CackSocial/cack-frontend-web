import { get, post } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendConversationListResponse, BackendMessageResponse } from './types';

export function getConversations(page = 1, limit = 20) {
  return get<PaginatedResponse<BackendConversationListResponse>>(
    `/messages/conversations?page=${page}&limit=${limit}`,
  );
}

export function getConversation(username: string, page = 1, limit = 50) {
  return get<PaginatedResponse<BackendMessageResponse>>(
    `/messages/${encodeURIComponent(username)}?page=${page}&limit=${limit}`,
  );
}

export function sendMessage(username: string, content: string, image?: File | null) {
  const form = new FormData();
  form.append('content', content);
  if (image) form.append('image', image);
  return post<APIResponse<BackendMessageResponse>>(
    `/messages/${encodeURIComponent(username)}`,
    form,
  );
}
