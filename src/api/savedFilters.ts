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
  is_shared?: boolean;
  shared_with_user_ids?: number[] | null;
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
  is_shared?: boolean;
  shared_with_user_ids?: number[] | null;
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
  is_shared?: boolean;
  shared_with_user_ids?: number[] | null;
}

export const savedFiltersApi = {
  getSavedFilters: async (includeShared?: boolean): Promise<SavedFilter[]> => {
    const params = includeShared ? '?include_shared=true' : '';
    const response = await apiClient.get<SavedFilter[]>(`/api/v1/saved-filters${params}`);
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

  shareFilter: async (filterId: number, userIds?: number[], isPublic?: boolean): Promise<SavedFilter> => {
    const params = new URLSearchParams();
    if (isPublic) params.append('is_public', 'true');
    if (userIds && userIds.length > 0) {
      userIds.forEach(id => params.append('user_ids', id.toString()));
    }
    const response = await apiClient.post<SavedFilter>(`/api/v1/saved-filters/${filterId}/share?${params.toString()}`);
    return response.data;
  },

  unshareFilter: async (filterId: number): Promise<SavedFilter> => {
    const response = await apiClient.post<SavedFilter>(`/api/v1/saved-filters/${filterId}/unshare`);
    return response.data;
  },
};









