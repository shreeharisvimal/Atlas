import apiClient from './client';

export interface TimeEntry {
  id: number;
  ticket_id: number;
  user_id: number;
  hours: number;
  description?: string;
  date: string;
  created_at: string;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface TimeEntryCreate {
  hours: number;
  description?: string;
  date: string;
}

export interface TimeEstimate {
  id: number;
  ticket_id: number;
  estimated_hours: number;
  created_by_id: number;
  created_at: string;
  updated_at?: string;
}

export interface TimeEstimateCreate {
  estimated_hours: number;
}

export interface TimeEstimateUpdate {
  estimated_hours: number;
}

export interface TimeTrackingSummary {
  ticket_id: number;
  total_hours: number;
  estimated_hours: number | null;
  remaining_hours: number | null;
  entries_count: number;
}

export const timeTrackingApi = {
  getTimeEntries: async (ticketId: number): Promise<TimeEntry[]> => {
    const response = await apiClient.get<TimeEntry[]>(`/api/v1/tickets/${ticketId}/time-entries`);
    return response.data;
  },

  createTimeEntry: async (ticketId: number, entry: TimeEntryCreate): Promise<TimeEntry> => {
    const response = await apiClient.post<TimeEntry>(`/api/v1/tickets/${ticketId}/time-entries`, entry);
    return response.data;
  },

  deleteTimeEntry: async (ticketId: number, entryId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tickets/${ticketId}/time-entries/${entryId}`);
  },

  createTimeEstimate: async (ticketId: number, estimate: TimeEstimateCreate): Promise<TimeEstimate> => {
    const response = await apiClient.post<TimeEstimate>(`/api/v1/tickets/${ticketId}/time-estimate`, estimate);
    return response.data;
  },

  getTimeSummary: async (ticketId: number): Promise<TimeTrackingSummary> => {
    const response = await apiClient.get<TimeTrackingSummary>(`/api/v1/tickets/${ticketId}/time-summary`);
    return response.data;
  },
};


