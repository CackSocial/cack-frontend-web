import { post } from './client';
import type { APIResponse } from './client';
import type { BackendLoginResponse } from './types';

export function login(username: string, password: string) {
  return post<APIResponse<BackendLoginResponse>>('/auth/login', { username, password });
}

export function register(username: string, password: string, display_name: string) {
  return post<APIResponse<BackendLoginResponse>>('/auth/register', { username, password, display_name });
}

export function logout() {
  return post<APIResponse<unknown>>('/auth/logout');
}
