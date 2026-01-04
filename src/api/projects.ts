import apiClient from './client';
import type { Project } from '../types';

export interface ProjectCreate {
  name: string;
  description?: string | null;
  key: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  key?: string;
  is_active?: boolean;
}

export const projectsApi = {
  getProjects: async (activeOnly: boolean = true): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>(`/api/v1/projects?active_only=${activeOnly}`);
    return response.data;
  },

  getProject: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/api/v1/projects/${id}`);
    return response.data;
  },

  createProject: async (data: ProjectCreate): Promise<Project> => {
    const response = await apiClient.post<Project>('/api/v1/projects', data);
    return response.data;
  },

  updateProject: async (id: number, data: ProjectUpdate): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/api/v1/projects/${id}`, data);
    return response.data;
  },
};


