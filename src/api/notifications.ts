import apiClient from './client';
import type { Notification, NotificationStats } from '../types';

export interface NotificationFilters {
  skip?: number;
  limit?: number;
  unread_only?: boolean;
}

export const notificationsApi = {
  getNotifications: async (filters: NotificationFilters = {}): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.unread_only) params.append('unread_only', 'true');

    const response = await apiClient.get<Notification[]>(`/api/v1/notifications?${params.toString()}`);
    return response.data;
  },

  getNotificationStats: async (): Promise<NotificationStats> => {
    const response = await apiClient.get<NotificationStats>('/api/v1/notifications/stats');
    return response.data;
  },

  updateNotification: async (id: number, isRead: boolean): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(`/api/v1/notifications/${id}`, { is_read: isRead });
    return response.data;
  },

  markAllRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/v1/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/notifications/${id}`);
  },
};












