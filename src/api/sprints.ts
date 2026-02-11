import apiClient from './client';
import type { Sprint, Ticket } from '../types';

export const sprintsApi = {
  getSprints: async (projectId?: number, activeOnly: boolean = false): Promise<Sprint[]> => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId.toString());
    if (activeOnly) params.append('active_only', 'true');
    const response = await apiClient.get<Sprint[]>(`/api/v1/sprints?${params.toString()}`);
    return response.data;
  },

  getActiveSprints: async (projectId?: number): Promise<Sprint[]> => {
    const params = projectId ? `?project_id=${projectId}` : '';
    const response = await apiClient.get<Sprint[]>(`/api/v1/sprints/active${params}`);
    return response.data;
  },

  getSprint: async (id: number): Promise<Sprint> => {
    const response = await apiClient.get<Sprint>(`/api/v1/sprints/${id}`);
    return response.data;
  },

  getSprintTickets: async (sprintId: number): Promise<Ticket[]> => {
    const response = await apiClient.get<Ticket[]>(`/api/v1/sprints/${sprintId}/tickets`);
    return response.data;
  },

  createSprint: async (data: {
    name: string;
    description?: string;
    project_id: number;
    start_date?: string;
    end_date?: string;
    goal?: string;
  }): Promise<Sprint> => {
    const response = await apiClient.post<Sprint>('/api/v1/sprints/', data);
    return response.data;
  },

  updateSprint: async (id: number, data: {
    name?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    goal?: string;
  }): Promise<Sprint> => {
    const response = await apiClient.patch<Sprint>(`/api/v1/sprints/${id}`, data);
    return response.data;
  },

  completeSprint: async (id: number): Promise<Sprint> => {
    const response = await apiClient.post<Sprint>(`/api/v1/sprints/${id}/complete`);
    return response.data;
  },

  addTicketToSprint: async (sprintId: number, ticketId: number): Promise<void> => {
    await apiClient.post(`/api/v1/sprints/${sprintId}/tickets/${ticketId}`);
  },

  removeTicketFromSprint: async (sprintId: number, ticketId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/sprints/${sprintId}/tickets/${ticketId}`);
  },
};











