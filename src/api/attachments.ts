import apiClient from './client';
import type { Attachment } from '../types';

export const attachmentsApi = {
  getTicketAttachments: async (ticketId: number): Promise<Attachment[]> => {
    const response = await apiClient.get<Attachment[]>(`/api/v1/tickets/${ticketId}/attachments`);
    return response.data;
  },

  uploadAttachment: async (ticketId: number, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Content-Type will be set automatically by the interceptor for FormData
    const response = await apiClient.post<Attachment>(
      `/api/v1/tickets/${ticketId}/attachments`,
      formData
    );
    return response.data;
  },

  downloadAttachment: async (attachmentId: number): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/tickets/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteAttachment: async (attachmentId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tickets/attachments/${attachmentId}`);
  },
};




