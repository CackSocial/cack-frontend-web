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

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type, duration?) => {
    const id = crypto.randomUUID();
    const ms = duration ?? DEFAULT_DURATIONS[type];
    const toast: Toast = { id, message, type, duration: ms };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, ms);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
