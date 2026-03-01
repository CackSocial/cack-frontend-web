import { post, del } from './client';
import type { APIResponse } from './client';

export function follow(username: string) {
  return post<APIResponse<unknown>>(`/users/${encodeURIComponent(username)}/follow`);
}

export function unfollow(username: string) {
  return del<APIResponse<unknown>>(`/users/${encodeURIComponent(username)}/follow`);
}
