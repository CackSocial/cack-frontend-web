import { get } from './client';
import type { APIResponse, PaginatedResponse } from './client';
import type { BackendTagResponse, BackendPostResponse } from './types';

export function getTrendingTags() {
  return get<APIResponse<BackendTagResponse[]>>('/tags/trending');
}

export function getPostsByTag(tagName: string, page = 1, limit = 20) {
  return get<PaginatedResponse<BackendPostResponse>>(
    `/tags/${encodeURIComponent(tagName)}/posts?page=${page}&limit=${limit}`,
  );
}
