import apiClient from './client';
import type { TicketHistory } from '../types';

export const ticketHistoryApi = {
  getTicketHistory: async (ticketId: number): Promise<TicketHistory[]> => {
    const response = await apiClient.get<TicketHistory[]>(`/api/v1/tickets/${ticketId}/history`);
    return response.data;
  },
};










