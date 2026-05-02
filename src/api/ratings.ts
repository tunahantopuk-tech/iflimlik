import apiClient from './client';

export interface TopRatedResponse {
  page: number;
  results: any[];
  total_pages: number;
  total_results: number;
}

export const ratingsApi = {
  /**
   * Get top rated movies and TV shows
   * @param type - 'movie' or 'tv'
   * @param page - Page number
   * @param origin - 'turkish' or 'foreign'
   */
  getTopRated: async (type: string = 'movie', page: number = 1, origin?: string): Promise<TopRatedResponse> => {
    try {
      console.log(`📡 Fetching top rated: type=${type}, page=${page}, origin=${origin || 'all'}`);
      const params: any = { type, page };
      if (origin) {
        params.origin = origin;
      }
      const response = await apiClient.get('top-rated', { params });
      console.log(`✅ Top rated fetched: ${response?.data?.results?.length || 0} items`);
      return response.data;
    } catch (error) {
      console.error('❌ Get top rated failed:', error?.response?.data || error?.message);
      throw error;
    }
  },

  /**
   * Get Oscar winning movies
   * @param year - Optional year filter
   * @param category - Optional category filter
   * @param page - Page number
   */
  getOscarWinners: async (year?: number, category?: string, page: number = 1): Promise<any> => {
    try {
      console.log(`🏆 Fetching Oscar winners: year=${year || 'all'}, page=${page}`);
      const params: any = { page };
      if (year) params.year = year;
      if (category) params.category = category;
      const response = await apiClient.get('top-rated/oscar', { params });
      console.log(`✅ Oscar winners fetched`);
      return response.data;
    } catch (error) {
      console.error('❌ Get Oscar winners failed:', error?.response?.data || error?.message);
      throw error;
    }
  },
};
