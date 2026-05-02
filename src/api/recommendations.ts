import apiClient from './client';
import { Movie } from '../types';

// Shuffle array function
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const recommendationsApi = {
  getRecommendations: async (mood?: string, contentType?: string, genre?: string, page?: number): Promise<Movie[]> => {
    try {
      // Use provided page or generate random page number between 1-10 to get variety
      const targetPage = page || Math.floor(Math.random() * 10) + 1;
      
      console.log('📡 Fetching recommendations:', { mood, contentType, genre, page: targetPage });
      
      const response = await apiClient.get<{ results?: Movie[], movies?: Movie[], tvShows?: Movie[] }>('recommendations', {
        params: { mood, contentType, genre, page: targetPage },
      });
      
      // Backend returns different formats based on content type
      const data = response?.data;
      let results: Movie[] = [];
      
      if (data?.results) {
        results = data.results;
      } else if (data?.movies && data?.tvShows) {
        // Combine movies and tv shows
        results = [...(data.movies ?? []), ...(data.tvShows ?? [])];
      }
      
      console.log('✅ Received movies:', results?.length);
      
      // Shuffle results to add more variety
      return shuffleArray(results);
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  },
};