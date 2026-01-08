import apiClient from './client';
import type { Priority } from '../types';

export enum SLAStatus {
  ON_TIME = 'ON_TIME',
  AT_RISK = 'AT_RISK',
  BREACHED = 'BREACHED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export interface SLA {
  id: number;
  ticket_id: number;
  priority: Priority;
  response_time_hours?: number;
  resolution_time_hours?: number;
  due_date?: string;
  status: SLAStatus;
  breached_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface SLACreate {
  priority: Priority;
  response_time_hours?: number;
  resolution_time_hours?: number;
}

export interface SLAUpdate {
  priority?: Priority;
  response_time_hours?: number;
  resolution_time_hours?: number;
}

export const slaTrackingApi = {
  getSLA: async (ticketId: number): Promise<SLA> => {
    const response = await apiClient.get<SLA>(`/api/v1/tickets/${ticketId}/sla`);
    return response.data;
  },

  createSLA: async (ticketId: number, sla: SLACreate): Promise<SLA> => {
    const response = await apiClient.post<SLA>(`/api/v1/tickets/${ticketId}/sla`, sla);
    return response.data;
  },

  updateSLA: async (ticketId: number, sla: SLAUpdate): Promise<SLA> => {
    const response = await apiClient.patch<SLA>(`/api/v1/tickets/${ticketId}/sla`, sla);
    return response.data;
  },
};


