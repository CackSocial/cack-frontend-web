import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 6000,
  warning: 6000,
};

const timeoutIds = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type, duration?) => {
    const id = crypto.randomUUID();
    const ms = duration ?? DEFAULT_DURATIONS[type];
    const toast: Toast = { id, message, type, duration: ms };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    const timeoutId = setTimeout(() => {
      timeoutIds.delete(id);
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, ms);
    timeoutIds.set(id, timeoutId);
  },

  removeToast: (id) => {
    const timeoutId = timeoutIds.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutIds.delete(id);
    }
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
