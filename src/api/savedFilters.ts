import apiClient from './client';

export interface SavedFilter {
  id: number;
  user_id: number;
  name: string;
  filters: {
    status?: string;
    priority?: string;
    issue_type?: string;
    tag_id?: string;
    search?: string;
  };
  is_default: string;
  created_at: string;
  updated_at?: string;
}

export interface SavedFilterCreate {
  name: string;
  filters: {
    status?: string;
    priority?: string;
    issue_type?: string;
    tag_id?: string;
    search?: string;
  };
  is_default?: string;
}

export interface SavedFilterUpdate {
  name?: string;
  filters?: {
    status?: string;
    priority?: string;
    issue_type?: string;
    tag_id?: string;
    search?: string;
  };
  is_default?: string;
}

export const savedFiltersApi = {
  getSavedFilters: async (): Promise<SavedFilter[]> => {
    const response = await apiClient.get<SavedFilter[]>('/api/v1/saved-filters');
    return response.data;
  },

  getSavedFilter: async (id: number): Promise<SavedFilter> => {
    const response = await apiClient.get<SavedFilter>(`/api/v1/saved-filters/${id}`);
    return response.data;
  },

  createSavedFilter: async (filter: SavedFilterCreate): Promise<SavedFilter> => {
    const response = await apiClient.post<SavedFilter>('/api/v1/saved-filters', filter);
    return response.data;
  },

  updateSavedFilter: async (id: number, filter: SavedFilterUpdate): Promise<SavedFilter> => {
    const response = await apiClient.patch<SavedFilter>(`/api/v1/saved-filters/${id}`, filter);
    return response.data;
  },

  deleteSavedFilter: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/saved-filters/${id}`);
  },
};






