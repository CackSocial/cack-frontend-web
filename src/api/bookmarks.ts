import { get, post, del } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendPostResponse } from './types';

export function bookmarkPost(postId: string) {
  return post<APIResponse<unknown>>(`/posts/${postId}/bookmark`);
}

export function unbookmarkPost(postId: string) {
  return del<APIResponse<unknown>>(`/posts/${postId}/bookmark`);
}

export function getBookmarks(page = 1, limit = 20) {
  return get<PaginatedResponse<BackendPostResponse>>(`/bookmarks?page=${page}&limit=${limit}`);
}
