import apiClient from './client';
import type { ActivityLog } from '../types';

export const activityApi = {
  getTicketActivityLogs: async (ticketId: number): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>(`/api/v1/activity-logs/ticket/${ticketId}`);
    return response.data;
  },
};











