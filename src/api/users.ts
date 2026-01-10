import apiClient from './client';
import type { User } from '../types';

export interface UsersResponse {
  items: User[];
  total: number;
  skip: number;
  limit: number;
  page?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<UsersResponse>('/api/v1/users/');
    const data = response.data;
    // Handle paginated response with items property
    if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)) {
      return data.items;
    }
    // Fallback: if it's already an array, return it directly
    if (Array.isArray(data)) {
      return data;
    }
    // Handle other possible structures
    if (data && typeof data === 'object') {
      const usersArray = (data as any).data || (data as any).users;
      return Array.isArray(usersArray) ? usersArray : [];
    }
    return [];
  },

  getUser: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/api/v1/users/${id}`);
    return response.data;
  },

  getSystemRoles: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/v1/users/dropdown/roles');
    return response.data;
  },

  getDesignations: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/v1/users/dropdown/designations');
    return response.data;
  },

  getUsersDropdown: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/v1/users/dropdown');
    return response.data;
  },

  updateUser: async (id: number, data: { full_name?: string; email?: string }): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/users/${id}`, data);
    return response.data;
  },
};



