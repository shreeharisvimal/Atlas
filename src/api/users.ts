import apiClient from './client';
import type { User } from '../types';

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/v1/users/');
    const data = response.data;
    // Ensure we always return an array, even if API returns unexpected structure
    if (Array.isArray(data)) {
      return data;
    }
    // Handle cases where API might return { data: [...] } or { users: [...] }
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



