import apiClient from './client';

export interface DashboardAnalytics {
  total_tickets: number;
  open_tickets: number;
  done_tickets: number;
  recent_tickets: number;
  tickets_this_month: number;
  my_tickets: number;
  avg_resolution_days: number;
  status_counts: Record<string, number>;
  priority_counts: Record<string, number>;
  my_status_counts: Record<string, number>;
}

export interface TicketTrend {
  date: string;
  count: number;
}

export const analyticsApi = {
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const response = await apiClient.get<DashboardAnalytics>('/api/v1/analytics/dashboard');
    return response.data;
  },

  getTicketTrends: async (days: number = 30): Promise<TicketTrend[]> => {
    const response = await apiClient.get<TicketTrend[]>(`/api/v1/analytics/tickets/trend?days=${days}`);
    return response.data;
  },
};












