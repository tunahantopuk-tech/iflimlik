import apiClient from './client';

export interface CustomList {
  id: string;
  name: string;
  description?: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
  shareToken?: string | null;
}

export interface CreateListDto {
  name: string;
  description?: string;
}

export interface AddToListDto {
  movieId: number;
  title: string;
  posterPath?: string;
  type: string;
  voteAverage?: number;
}

export interface ShareListResponse {
  message: string;
  shareUrl: string;
  shareToken: string;
}

export interface SharedListResponse {
  type: string;
  name: string;
  description?: string;
  items: any[];
  owner: string;
}

export const listsApi = {
  // Custom Lists
  createList: async (data: CreateListDto): Promise<{ message: string; list: CustomList }> => {
    const response = await apiClient.post('users/lists', data);
    return response.data;
  },

  getLists: async (): Promise<CustomList[]> => {
    const response = await apiClient.get('users/lists');
    return response.data;
  },

  getList: async (listId: string): Promise<CustomList> => {
    const response = await apiClient.get(`users/lists/${listId}`);
    return response.data;
  },

  updateList: async (listId: string, data: CreateListDto): Promise<{ message: string; list: CustomList }> => {
    const response = await apiClient.put(`users/lists/${listId}`, data);
    return response.data;
  },

  deleteList: async (listId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`users/lists/${listId}`);
    return response.data;
  },

  addToList: async (listId: string, item: AddToListDto): Promise<{ message: string; item: any }> => {
    const response = await apiClient.post(`users/lists/${listId}/items`, item);
    return response.data;
  },

  removeFromList: async (listId: string, movieId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`users/lists/${listId}/items/${movieId}`);
    return response.data;
  },

  // Share Lists
  shareList: async (listId: string, listType: 'watchlist' | 'favorites' | 'watched' | 'custom'): Promise<ShareListResponse> => {
    const response = await apiClient.post(`users/lists/${listId}/share`, { listType });
    return response.data;
  },

  getSharedList: async (shareToken: string): Promise<SharedListResponse> => {
    const response = await apiClient.get(`shared/${shareToken}`);
    return response.data;
  },
};
