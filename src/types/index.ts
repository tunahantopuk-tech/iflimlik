import { NavigatorScreenParams } from '@react-navigation/native';
import type { SilentCinemaStackParamList } from '../navigation/SilentCinemaNavigator';
import type { TabuStackParamList } from '../navigation/TabuNavigator';

// Auth types
export interface User {
  id?: string;
  email?: string;
  username?: string;
  photoURL?: string;
}

export interface AuthResponse {
  token?: string;
  user?: User;
}

// Movie/TV types
export interface Movie {
  id?: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genres?: Genre[];
  runtime?: number;
  media_type?: 'movie' | 'tv';
}

export interface Genre {
  id?: number;
  name?: string;
}

export interface Cast {
  id?: number;
  name?: string;
  character?: string;
  profile_path?: string;
}

export interface Credits {
  cast?: Cast[];
}

// User list types
export interface UserListItem {
  movieId?: number;
  title?: string;
  posterPath?: string;
  type?: 'movie' | 'tv';
  addedAt?: string;
  voteAverage?: number;
}

// Mood types
export interface MoodEntry {
  mood?: string;
  contentType?: string;
  genre?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface UserStats {
  watchlistCount?: number;
  favoritesCount?: number;
  watchedCount?: number;
}

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: { email?: string; password?: string; username?: string } | undefined;
  ForgotPassword: undefined;
  EmailVerification: { email: string; password: string; username: string };
};

export type MainTabParamList = {
  Home: undefined;
  Ratings: undefined;
  Lists: undefined;
  Profile: undefined;
};

export type CompareStackParamList = {
  CompareType: undefined;
  CompareGenre: { type: 'movie' | 'tv' };
  CompareGame: { type: 'movie' | 'tv'; genre: string };
  CompareResult: { winner: any };
  Detail: { id: number; type: 'movie' | 'tv' };
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  Detail: { id: number; type: 'movie' | 'tv' };
  PersonDetail: { personId: number; personName: string; personPhoto?: string };
  Stats: undefined;
  MoodSelection: undefined;
  MoodRecommendations: { mood: string; type: string; genre: string };
  iFishingCompletion: undefined;
  Chat: { conversationId?: string } | undefined;
  ChatHistory: undefined;
  ProfileScreen: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
  Compare: NavigatorScreenParams<CompareStackParamList>;
  SilentCinema: NavigatorScreenParams<SilentCinemaStackParamList>;
  Tabu: NavigatorScreenParams<TabuStackParamList>;
};

export type SearchStackParamList = {
  SearchScreen: undefined;
  Detail: { id: number; type: 'movie' | 'tv' };
};

export type RatingsStackParamList = {
  RatingsMain: undefined;
  DiscoverDetail: { title: string; imageUrl: string; accentColor: string; params: any };
  Details: { id: number; type: 'movie' | 'tv' };
};

export type ListsStackParamList = {
  ListsScreen: undefined;
  Detail: { id: number; type: 'movie' | 'tv' };
};

export type ProfileStackParamList = {
  ChatHistory: undefined;
};