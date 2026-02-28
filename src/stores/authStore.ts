import { create } from 'zustand';
import type { User } from '../types';
import { currentMockUser, mockUsers } from '../data/mockData';

const DELAY = 400;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
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

  login: async (username: string, _password: string) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, DELAY));

    const found = mockUsers.find((u) => u.username === username);
    const user = found ?? { ...currentMockUser, username };

    localStorage.setItem('sc-user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (username: string, displayName: string, _password: string) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, DELAY));

    if (mockUsers.some((u) => u.username === username)) {
      set({ isLoading: false, error: 'Username already taken' });
      return;
    }

    const user: User = {
      ...currentMockUser,
      id: `u-${Date.now()}`,
      username,
      displayName,
    };

    localStorage.setItem('sc-user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('sc-user');
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateProfile: (updates: Partial<User>) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...updates };
      localStorage.setItem('sc-user', JSON.stringify(updated));
      return { user: updated };
    }),

  clearError: () => set({ error: null }),
}));
