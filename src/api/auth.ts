import apiClient from './client';
import axios from 'axios';
import type { LoginRequest, TokenResponse, User } from '../types';

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8765';

// Use plain axios for login to avoid sending Authorization header
const loginClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await loginClient.post<TokenResponse>('/api/v1/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    return response.data;
  },

  updateProfile: async (data: { full_name?: string; email?: string }): Promise<User> => {
    const response = await apiClient.put<User>('/api/v1/auth/me', data);
    return response.data;
  },

  changePassword: async (data: PasswordChangeRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/v1/auth/change-password', data);
    return response.data;
  },

  uploadProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<User>('/api/v1/auth/upload-profile-picture', formData);
    return response.data;
  },

  deleteProfilePicture: async (): Promise<User> => {
    const response = await apiClient.delete<User>('/api/v1/auth/profile-picture');
    return response.data;
  },
};

