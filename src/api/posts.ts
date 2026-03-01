import { get, post, del } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendPostResponse } from './types';

export function getTimeline(page = 1, limit = 20) {
  return get<PaginatedResponse<BackendPostResponse>>(`/timeline?page=${page}&limit=${limit}`);
}

export function getPost(id: string) {
  return get<APIResponse<BackendPostResponse>>(`/posts/${id}`);
}

export function getUserPosts(username: string, page = 1, limit = 20) {
  return get<PaginatedResponse<BackendPostResponse>>(
    `/users/${encodeURIComponent(username)}/posts?page=${page}&limit=${limit}`,
  );
}

export function createPost(content: string, image?: File | null) {
  const form = new FormData();
  form.append('content', content);
  if (image) form.append('image', image);
  return post<APIResponse<BackendPostResponse>>('/posts', form);
}

export function deletePost(id: string) {
  return del<APIResponse<unknown>>(`/posts/${id}`);
}
