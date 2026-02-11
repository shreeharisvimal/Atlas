import apiClient from './client';
import type { UserPreference } from '../types';

export const userPreferencesApi = {
  getPreferences: async (): Promise<UserPreference> => {
    const response = await apiClient.get<UserPreference>('/api/v1/user-preferences');
    return response.data;
  },

  updatePreferences: async (preferences: Partial<UserPreference>): Promise<UserPreference> => {
    const response = await apiClient.patch<UserPreference>('/api/v1/user-preferences', preferences);
    return response.data;
  },
};













