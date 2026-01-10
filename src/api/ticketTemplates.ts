import apiClient from './client';
import type { IssueType, Priority } from '../types';

export interface TicketTemplate {
  id: number;
  name: string;
  description?: string;
  issue_type: IssueType;
  priority: Priority;
  default_title: string;
  default_description?: string;
  is_public: boolean;
  created_by_id: number;
  created_at: string;
  updated_at?: string;
}

export interface TicketTemplateCreate {
  name: string;
  description?: string;
  issue_type: IssueType;
  priority: Priority;
  default_title: string;
  default_description?: string;
  is_public?: boolean;
}

export interface TicketTemplateUpdate {
  name?: string;
  description?: string;
  issue_type?: IssueType;
  priority?: Priority;
  default_title?: string;
  default_description?: string;
  is_public?: boolean;
}

export const ticketTemplatesApi = {
  getTemplates: async (publicOnly?: boolean): Promise<TicketTemplate[]> => {
    const params = publicOnly ? '?public_only=true' : '';
    const response = await apiClient.get<TicketTemplate[]>(`/api/v1/ticket-templates${params}`);
    return response.data;
  },

  getTemplate: async (templateId: number): Promise<TicketTemplate> => {
    const response = await apiClient.get<TicketTemplate>(`/api/v1/ticket-templates/${templateId}`);
    return response.data;
  },

  createTemplate: async (template: TicketTemplateCreate): Promise<TicketTemplate> => {
    const response = await apiClient.post<TicketTemplate>('/api/v1/ticket-templates', template);
    return response.data;
  },

  updateTemplate: async (templateId: number, template: TicketTemplateUpdate): Promise<TicketTemplate> => {
    const response = await apiClient.patch<TicketTemplate>(`/api/v1/ticket-templates/${templateId}`, template);
    return response.data;
  },

  deleteTemplate: async (templateId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/ticket-templates/${templateId}`);
  },

  createTicketFromTemplate: async (templateId: number): Promise<any> => {
    const response = await apiClient.post(`/api/v1/ticket-templates/${templateId}/create-ticket`);
    return response.data;
  },
};




