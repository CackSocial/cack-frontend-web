import { get, post, del } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendCommentResponse } from './types';

export function getComments(postId: string, page = 1, limit = 50) {
  return get<PaginatedResponse<BackendCommentResponse>>(
    `/posts/${postId}/comments?page=${page}&limit=${limit}`,
  );
}

export function createComment(postId: string, content: string) {
  return post<APIResponse<BackendCommentResponse>>(`/posts/${postId}/comments`, { content });
}

export function deleteComment(commentId: string) {
  return del<APIResponse<unknown>>(`/comments/${commentId}`);
}
