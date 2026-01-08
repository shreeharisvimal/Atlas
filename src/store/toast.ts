import { create } from 'zustand';
import type { Toast, ToastType } from '../components/Toast';

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

let toastIdCounter = 0;
// Track recent toasts to prevent duplicates
const recentToasts = new Map<string, number>();
const DUPLICATE_THRESHOLD = 2000; // 2 seconds

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message: string, type: ToastType, duration?: number) => {
    // Create a key from message and type to detect duplicates
    const toastKey = `${type}:${message}`;
    const now = Date.now();
    
    // Check if this exact toast was shown recently
    const lastShown = recentToasts.get(toastKey);
    if (lastShown && (now - lastShown) < DUPLICATE_THRESHOLD) {
      // Duplicate toast within threshold, skip it
      return;
    }
    
    // Record this toast
    recentToasts.set(toastKey, now);
    
    // Clean up old entries (older than threshold)
    for (const [key, timestamp] of recentToasts.entries()) {
      if (now - timestamp > DUPLICATE_THRESHOLD) {
        recentToasts.delete(key);
      }
    }
    
    const id = `toast-${++toastIdCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));









