import apiClient from './client';
import type { Tag } from '../types';

export const tagsApi = {
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/api/v1/tags');
    return response.data;
  },

  createTag: async (tag: { name: string; color?: string }): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/api/v1/tags', tag);
    return response.data;
  },

  updateTag: async (tagId: number, tag: { name?: string; color?: string }): Promise<Tag> => {
    const response = await apiClient.patch<Tag>(`/api/v1/tags/${tagId}`, tag);
    return response.data;
  },

  deleteTag: async (tagId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tags/${tagId}`);
  },

  getTicketTags: async (ticketId: number): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>(`/api/v1/tags/tickets/${ticketId}/tags`);
    return response.data;
  },

  addTagToTicket: async (ticketId: number, tagId: number): Promise<void> => {
    await apiClient.post(`/api/v1/tags/tickets/${ticketId}/tags/${tagId}`);
  },

  removeTagFromTicket: async (ticketId: number, tagId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tags/tickets/${ticketId}/tags/${tagId}`);
  },

  getTagStatistics: async (): Promise<TagStatistics> => {
    const response = await apiClient.get<TagStatistics>('/api/v1/tags/statistics');
    return response.data;
  },
};

export interface TagStatistics {
  total_tags: number;
  total_tickets: number;
  tagged_tickets: number;
  untagged_tickets: number;
  tag_statistics: Array<{
    tag_id: number;
    tag_name: string;
    tag_color: string;
    ticket_count: number;
  }>;
}









