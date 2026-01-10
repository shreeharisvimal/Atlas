import apiClient from './client';
import type { Comment, CommentCreate } from '../types';

export const commentsApi = {
  getTicketComments: async (ticketId: number): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/api/v1/comments/ticket/${ticketId}`);
    return response.data;
  },

  createComment: async (data: CommentCreate): Promise<Comment> => {
    const response = await apiClient.post<Comment>('/api/v1/comments', data);
    return response.data;
  },
};












