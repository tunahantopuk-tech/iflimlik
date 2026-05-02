import apiClient from './client';

interface TabuCard {
  id: number;
  title: string;
  poster_path: string;
  forbidden_words: string[];
}

interface TabuCardResponse {
  success: boolean;
  card: TabuCard | null;
  error?: string;
}

export const tabuApi = {
  getRandomCard: async (excludeIds: number[] = []): Promise<TabuCardResponse> => {
    try {
      const params = excludeIds.length > 0 ? { excludeIds: excludeIds.join(',') } : {};
      const response = await apiClient.get<TabuCardResponse>('/tabu/random', { params });
      return response?.data ?? { success: false, card: null, error: 'No data' };
    } catch (error) {
      console.error('Error fetching random tabu card:', error);
      return {
        success: false,
        card: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
