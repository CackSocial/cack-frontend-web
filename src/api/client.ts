import { useToastStore } from '../stores/toastStore';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('sc-token');
}

/** Read the CSRF token from the non-HttpOnly sc-csrf cookie */
function getCSRFToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith('sc-csrf='))
    ?.split('=')[1];
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export class APIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  // Fallback Authorization header for migration period
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Attach CSRF token for state-changing requests
  const method = (options.method ?? 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    const csrf = getCSRFToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }
  // Don't set Content-Type for FormData; browser sets it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  let body: APIResponse<T> | PaginatedResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new APIError(res.status, 'Invalid response from server');
  }

  if (!res.ok) {
    const msg = (body as APIResponse<T>).message ?? 'Request failed';
    if (res.status === 401) {
      // Expired or invalid token — clear auth state and redirect to login
      localStorage.removeItem('sc-token');
      localStorage.removeItem('sc-user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    } else {
      useToastStore.getState().addToast(msg, 'error');
    }
    throw new APIError(res.status, msg);
  }

  return body as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function del<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  });
}
