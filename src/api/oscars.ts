import apiClient from './client';

export interface OscarCategory {
  id: string;
  name: string;
  nameTr: string;
  movies: any[];
}

export interface OscarResponse {
  year: number;
  categories: OscarCategory[];
  availableCategories: Array<{ id: string; name: string; nameTr: string }>;
}

export const oscarsApi = {
  getOscarWinners: async (year?: number, category?: string): Promise<OscarResponse> => {
    const params: any = {};
    if (year) params.year = year;
    if (category) params.category = category;

    const response = await apiClient.get('tmdb/awards/oscars', { params });
    return response.data;
  },
};
