import { create } from 'zustand';
import type { User } from '../types';
import * as authAPI from '../api/auth';
import * as usersAPI from '../api/users';
import { mapUser } from '../api/mappers';
import { APIError } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: { displayName?: string; bio?: string }) => Promise<void>;
  clearError: () => void;
}

const getStoredUser = (): User | null => {
  const stored = localStorage.getItem('sc-user');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  isAuthenticated: !!getStoredUser(),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login(username, password);
      const user = mapUser(res.data!.user);
      localStorage.setItem('sc-token', res.data!.token);
      localStorage.setItem('sc-user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const msg = err instanceof APIError ? err.message : 'Login failed';
      set({ isLoading: false, error: msg });
    }
  },

  register: async (username: string, displayName: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.register(username, password, displayName);
      const user = mapUser(res.data!.user);
      localStorage.setItem('sc-token', res.data!.token);
      localStorage.setItem('sc-user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const msg = err instanceof APIError ? err.message : 'Registration failed';
      set({ isLoading: false, error: msg });
    }
  },

  logout: () => {
    localStorage.removeItem('sc-token');
    localStorage.removeItem('sc-user');
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateProfile: async ({ displayName, bio }: { displayName?: string; bio?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await usersAPI.updateProfile(displayName ?? '', bio ?? '');
      const user = mapUser(res.data!);
      localStorage.setItem('sc-user', JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (err) {
      const msg = err instanceof APIError ? err.message : 'Update failed';
      set({ isLoading: false, error: msg });
    }
  },

  clearError: () => set({ error: null }),
}));
