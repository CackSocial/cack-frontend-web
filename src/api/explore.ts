import { get } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendSuggestedUserResponse, BackendPostResponse } from './types';

export function getSuggestedUsers(limit = 10) {
  return get<APIResponse<BackendSuggestedUserResponse[]>>(
    `/explore/suggested-users?limit=${limit}`,
  );
}

export function getPopularPosts(page = 1, limit = 20) {
  return get<PaginatedResponse<BackendPostResponse>>(
    `/explore/popular?page=${page}&limit=${limit}`,
  );
}

export function getDiscoverFeed(page = 1, limit = 20) {
  return get<PaginatedResponse<BackendPostResponse>>(
    `/explore/discover?page=${page}&limit=${limit}`,
  );
}
