import apiClient from './client';
import type { Ticket, TicketCreate, TicketUpdate, TicketStatusUpdate } from '../types';

export interface TicketFilters {
  status?: string;
  priority?: string;
  issue_type?: string;
  assigned_to_id?: number;
  project_id?: number;
  tag_id?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface TicketsResponse {
  items: Ticket[];
  total: number;
  skip: number;
  limit: number;
}

export const ticketsApi = {
  getTickets: async (filters: TicketFilters = {}): Promise<TicketsResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.issue_type) params.append('issue_type', filters.issue_type);
    if (filters.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id.toString());
    if (filters.project_id) params.append('project_id', filters.project_id.toString());
    if (filters.tag_id) params.append('tag_id', filters.tag_id.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<TicketsResponse>(`/api/v1/tickets?${params.toString()}`);
    return response.data;
  },

  getTicket: async (id: number): Promise<Ticket> => {
    const response = await apiClient.get<Ticket>(`/api/v1/tickets/${id}`);
    return response.data;
  },

  createTicket: async (data: TicketCreate): Promise<Ticket> => {
    const response = await apiClient.post<Ticket>('/api/v1/tickets', data);
    return response.data;
  },

  updateTicket: async (id: number, data: TicketUpdate): Promise<Ticket> => {
    const response = await apiClient.patch<Ticket>(`/api/v1/tickets/${id}`, data);
    return response.data;
  },

  updateTicketStatus: async (id: number, data: TicketStatusUpdate): Promise<Ticket> => {
    const response = await apiClient.patch<Ticket>(`/api/v1/tickets/${id}/status`, data);
    return response.data;
  },

  getStatuses: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/v1/tickets/dropdown/statuses');
    return response.data;
  },

  getPriorities: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/v1/tickets/dropdown/priorities');
    return response.data;
  },

  getIssueTypes: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/v1/tickets/dropdown/issue_types');
    return response.data;
  },

  deleteTicket: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tickets/${id}`);
  },

  cloneTicket: async (id: number): Promise<Ticket> => {
    const response = await apiClient.post<Ticket>(`/api/v1/tickets/${id}/clone`);
    return response.data;
  },
};

