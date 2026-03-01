import { post, del } from './client';
import type { APIResponse } from './client';

export function likePost(postId: string) {
  return post<APIResponse<unknown>>(`/posts/${postId}/like`);
}

export function unlikePost(postId: string) {
  return del<APIResponse<unknown>>(`/posts/${postId}/like`);
}
