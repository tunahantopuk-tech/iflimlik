import apiClient from './client';
import { User, UserListItem, UserStats, MoodEntry } from '../types';

export const userApi = {
  // Profile
  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>('users/profile');
      return response?.data ?? {};
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch profile');
    }
  },

  updateProfile: async (username?: string, photoURL?: string): Promise<User> => {
    try {
      const response = await apiClient.put<User>('users/profile', {
        username,
        photoURL,
      });
      return response?.data ?? {};
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to update profile');
    }
  },

  getStats: async (): Promise<UserStats> => {
    try {
      const response = await apiClient.get<UserStats>('users/stats');
      return response?.data ?? {};
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch stats');
    }
  },

  // Watchlist
  getWatchlist: async (): Promise<UserListItem[]> => {
    try {
      const response = await apiClient.get<UserListItem[]>('users/watchlist');
      return response?.data ?? [];
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch watchlist');
    }
  },

  addToWatchlist: async (movieId: number, title: string, posterPath?: string, type?: 'movie' | 'tv', voteAverage?: number): Promise<void> => {
    try {
      await apiClient.post('users/watchlist', {
        movieId,
        title,
        posterPath,
        type,
        voteAverage,
      });
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to add to watchlist');
    }
  },

  removeFromWatchlist: async (movieId: number): Promise<void> => {
    try {
      await apiClient.delete(`users/watchlist/${movieId}`);
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to remove from watchlist');
    }
  },

  // Favorites
  getFavorites: async (): Promise<UserListItem[]> => {
    try {
      const response = await apiClient.get<UserListItem[]>('users/favorites');
      return response?.data ?? [];
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch favorites');
    }
  },

  addToFavorites: async (movieId: number, title: string, posterPath?: string, type?: 'movie' | 'tv', voteAverage?: number): Promise<void> => {
    try {
      await apiClient.post('users/favorites', {
        movieId,
        title,
        posterPath,
        type,
        voteAverage,
      });
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to add to favorites');
    }
  },

  removeFromFavorites: async (movieId: number): Promise<void> => {
    try {
      await apiClient.delete(`users/favorites/${movieId}`);
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to remove from favorites');
    }
  },

  // Watched
  getWatched: async (): Promise<UserListItem[]> => {
    try {
      const response = await apiClient.get<UserListItem[]>('users/watched');
      return response?.data ?? [];
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch watched');
    }
  },

  addToWatched: async (movieId: number, title: string, posterPath?: string, type?: 'movie' | 'tv', voteAverage?: number): Promise<void> => {
    try {
      await apiClient.post('users/watched', {
        movieId,
        title,
        posterPath,
        type,
        voteAverage,
      });
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to add to watched');
    }
  },

  removeFromWatched: async (movieId: number): Promise<void> => {
    try {
      await apiClient.delete(`users/watched/${movieId}`);
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to remove from watched');
    }
  },

  // Mood
  saveMood: async (mood: string, contentType: string, genre: string): Promise<void> => {
    try {
      await apiClient.post('users/mood', {
        mood,
        contentType,
        genre,
      });
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to save mood');
    }
  },

  getMoodHistory: async (): Promise<MoodEntry[]> => {
    try {
      const response = await apiClient.get<MoodEntry[]>('users/mood/history');
      return response?.data ?? [];
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch mood history');
    }
  },

  getCurrentMood: async (): Promise<MoodEntry | null> => {
    try {
      const response = await apiClient.get<MoodEntry>('users/mood/current');
      return response?.data ?? null;
    } catch (error) {
      return null;
    }
  },

  // Account deletion
  deleteAccount: async (): Promise<void> => {
    try {
      await apiClient.delete('users/account');
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to delete account');
    }
  },
};