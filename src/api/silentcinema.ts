import apiClient from './client';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number;
  popularity: number;
}

interface PopularMoviesResponse {
  success: boolean;
  movies: Movie[];
  error?: string;
}

interface RandomMovieResponse {
  success: boolean;
  movie: Movie | null;
  error?: string;
}

export const silentCinemaApi = {
  getPopularMovies: async (count: number = 50): Promise<PopularMoviesResponse> => {
    try {
      const response = await apiClient.get<PopularMoviesResponse>(
        `/silentcinema/movies?count=${count}`,
      );
      return response?.data ?? { success: false, movies: [], error: 'No data' };
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return {
        success: false,
        movies: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  getRandomMovie: async (): Promise<RandomMovieResponse> => {
    try {
      const response = await apiClient.get<RandomMovieResponse>('/silentcinema/random');
      return response?.data ?? { success: false, movie: null, error: 'No data' };
    } catch (error) {
      console.error('Error fetching random movie:', error);
      return {
        success: false,
        movie: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
