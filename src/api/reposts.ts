import { post, del } from './client';
import type { APIResponse } from './client';
import type { BackendPostResponse } from './types';

export function repost(postId: string) {
  return post<APIResponse<BackendPostResponse>>(`/posts/${postId}/repost`);
}

export function unrepost(postId: string) {
  return del<APIResponse<unknown>>(`/posts/${postId}/repost`);
}

export function quotePost(postId: string, content: string, image?: File | null) {
  const form = new FormData();
  form.append('content', content);
  if (image) form.append('image', image);
  return post<APIResponse<BackendPostResponse>>(`/posts/${postId}/quote`, form);
}
