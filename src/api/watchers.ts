import apiClient from './client';
import type { TicketWatcher } from '../types';

export const watchersApi = {
  watchTicket: async (ticketId: number): Promise<TicketWatcher> => {
    const response = await apiClient.post<TicketWatcher>(`/api/v1/tickets/${ticketId}/watch`);
    return response.data;
  },

  unwatchTicket: async (ticketId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tickets/${ticketId}/watch`);
  },

  getTicketWatchers: async (ticketId: number): Promise<TicketWatcher[]> => {
    const response = await apiClient.get<TicketWatcher[]>(`/api/v1/tickets/${ticketId}/watchers`);
    return response.data;
  },

  getWatchedTickets: async (): Promise<number[]> => {
    const response = await apiClient.get<number[]>('/api/v1/tickets/watched');
    return response.data;
  },
};






