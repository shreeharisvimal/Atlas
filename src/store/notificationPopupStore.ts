import { create } from 'zustand';

export interface NotificationPopup {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  ticket_id?: number;
  is_read: boolean;
  created_at: string;
  timestamp: number; // For sorting and auto-dismiss
}

interface NotificationPopupState {
  notifications: NotificationPopup[];
  addNotification: (notification: NotificationPopup) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationPopupStore = create<NotificationPopupState>((set) => ({
  notifications: [],
  
  addNotification: (notification: NotificationPopup) => {
    set((state) => {
      // Deduplication: Remove any existing notification for the same ticket with same type within last 2 seconds
      const now = Date.now();
      const deduplicated = state.notifications.filter(n => {
        // Keep notification if it's for a different ticket, different type, or older than 2 seconds
        if (n.ticket_id !== notification.ticket_id) return true;
        if (n.notification_type !== notification.notification_type) return true;
        // If same ticket and type, only keep if it's older than 2 seconds
        return (now - n.timestamp) > 2000;
      });
      
      return {
        notifications: [...deduplicated, notification],
      };
    });
  },
  
  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  },
}));

