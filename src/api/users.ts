import { get, put, del } from './client';
import type { APIResponse } from './client';
import type { BackendUserProfile } from './types';

export function getProfile(username: string) {
  return get<APIResponse<BackendUserProfile>>(`/users/${encodeURIComponent(username)}`);
}

export function updateProfile(displayName: string, bio: string, avatar?: File) {
  const body = new FormData();
  body.append('display_name', displayName);
  body.append('bio', bio);
  if (avatar) {
    body.append('avatar', avatar);
  }
  return put<APIResponse<BackendUserProfile>>('/users/me', body);
}

export function lookupUser(username: string) {
  return getProfile(username);
}

export function deleteAccount(password: string) {
  return del<APIResponse<unknown>>('/users/me', { password });
}
