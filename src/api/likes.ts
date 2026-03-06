import { get, post, del } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendPostResponse } from './types';

export function likePost(postId: string) {
  return post<APIResponse<unknown>>(`/posts/${postId}/like`);
}

export function unlikePost(postId: string) {
  return del<APIResponse<unknown>>(`/posts/${postId}/like`);
}

export function getLikedPosts(username: string, page = 1, limit = 20) {
  return get<PaginatedResponse<BackendPostResponse>>(
    `/users/${encodeURIComponent(username)}/likes?page=${page}&limit=${limit}`,
  );
}

