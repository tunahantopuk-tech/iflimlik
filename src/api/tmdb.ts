import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import apiClient from './client';
import { Movie, Genre, Credits } from '../types';

interface TMDBResponse {
  results?: Movie[];
  page?: number;
  total_pages?: number;
}

// Latince olmayan karakterleri kontrol et (Japonca, Hintçe, Rusça, Arapça, vb.)
const hasNonLatinCharacters = (text: string): boolean => {
  if (!text) return false;
  // Latin harfler: a-zA-Z (İngilizce), À-ÿ (Fransızca, İspanyolca, vb. aksanlı harfler), Ğ,ğ,İ,ı,Ş,ş,Ü,ü,Ö,ö,Ç,ç (Türkçe)
  // Sayılar: 0-9
  // İzin verilen karakterler: boşluk, noktalama, özel karakterler (!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)
  const latinRegex = /^[a-zA-ZÀ-ÿĞğİıŞşÜüÖöÇç0-9\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]*$/;
  return !latinRegex.test(text);
};

// Create dedicated TMDB client
const TMDB_API_URL = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  'https://iflimlik.abacusai.app/api/tmdb/';

const tmdbClient = axios.create({
  baseURL: TMDB_API_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [
    (data, headers) => {
      if (data && typeof data === 'object') {
        return JSON.stringify(data);
      }
      return data;
    },
  ],
});

// Add auth token to TMDB requests
tmdbClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const tmdbApi = {
  // Movies
  getPopularMovies: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/popular', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch popular movies');
    }
  },

  getTurkishContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/turkish-content', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Turkish content');
    }
  },

  getMovieDetails: async (id: number): Promise<Movie> => {
    try {
      const response = await apiClient.get<Movie>(`movies/${id}`);
      return response?.data ?? {};
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch movie details');
    }
  },

  getMovieCredits: async (id: number): Promise<Credits> => {
    try {
      const response = await apiClient.get<Credits>(`movies/${id}/credits`);
      return response?.data ?? { cast: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch movie credits');
    }
  },

  getSimilarMovies: async (id: number): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>(`movies/${id}/similar`);
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch similar movies');
    }
  },

  discoverMovies: async (genre?: number, page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/discover', {
        params: { genre, page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to discover movies');
    }
  },

  // TV Shows
  getPopularTV: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('tv/popular', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch popular TV shows');
    }
  },

  getTVDetails: async (id: number): Promise<Movie> => {
    try {
      const response = await apiClient.get<Movie>(`tv/${id}`);
      return response?.data ?? {};
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch TV details');
    }
  },

  getTVCredits: async (id: number): Promise<Credits> => {
    try {
      const response = await apiClient.get<Credits>(`tv/${id}/credits`);
      return response?.data ?? { cast: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch TV credits');
    }
  },

  getSimilarTV: async (id: number): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>(`tv/${id}/similar`);
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch similar TV shows');
    }
  },

  discoverTV: async (genre?: number, page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('tv/discover', {
        params: { genre, page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to discover TV shows');
    }
  },

  discover: async (type: 'movie' | 'tv', params?: Record<string, any>): Promise<TMDBResponse> => {
    try {
      const endpoint = type === 'movie' ? '/movies/discover' : '/tv/discover';
      const response = await tmdbClient.get<TMDBResponse>(endpoint, { params });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? `Failed to discover ${type}`);
    }
  },

  // Search
  search: async (query: string, type?: 'movie' | 'tv'): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('tmdb/search/multi', {
        params: { query, type },
      });
      
      // Latince olmayan karakterli içerikleri filtrele
      const results = (response?.data?.results ?? []).filter((item: any) => {
        const title = item?.title ?? item?.name ?? '';
        return !hasNonLatinCharacters(title);
      });
      
      return { ...response?.data, results };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error(error?.response?.data?.message ?? 'Search failed');
    }
  },

  // Genres
  getGenres: async (): Promise<Genre[]> => {
    try {
      const response = await tmdbClient.get<{ genres?: Genre[] }>('genres');
      return response?.data?.genres ?? [];
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch genres');
    }
  },

  // Videos/Trailers
  getVideos: async (type: 'movie' | 'tv', id: number): Promise<any> => {
    try {
      const typeParam = type === 'movie' ? 'movies' : 'tv';
      const response = await apiClient.get(`tmdb/${typeParam}/${id}/videos`);
      return response?.data ?? { results: [] };
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      return { results: [] };
    }
  },

  // Trending Movies & TV with Trailers (for PopStory)
  // Çok popüler içerikler: 500+ vote count, 2025+ yıl, latin alfabesi, çeşitli
  getTrendingWithTrailers: async (): Promise<any[]> => {
    try {
      // 2024, 2025, 2026 içerikleri (PopStory için)
      const minDate = '2024-01-01';

      // Tüm kaynakları TEK Promise.all ile paralel çek — önceki çoklu await zinciri kaldırıldı
      const [
        nowPlaying1, nowPlaying2,
        netflix1, prime1, disney1,
        netflixTV1, primeTV1, disneyTV1,
        tv1,
      ] = await Promise.all([
        // Vizyondaki filmler (Now Playing) - 2 sayfa
        apiClient.get<TMDBResponse>('movies/now-playing', { params: { page: 1 } }).catch(() => ({ data: { results: [] } })),
        apiClient.get<TMDBResponse>('movies/now-playing', { params: { page: 2 } }).catch(() => ({ data: { results: [] } })),
        // Netflix film
        apiClient.get<TMDBResponse>('tmdb/discover/movie', {
          params: { with_watch_providers: 8, watch_region: 'US', 'release_date.gte': minDate, 'vote_count.gte': 200, sort_by: 'popularity.desc', page: 1 },
        }).catch(() => ({ data: { results: [] } })),
        // Prime Video film
        apiClient.get<TMDBResponse>('tmdb/discover/movie', {
          params: { with_watch_providers: 9, watch_region: 'US', 'release_date.gte': minDate, 'vote_count.gte': 200, sort_by: 'popularity.desc', page: 1 },
        }).catch(() => ({ data: { results: [] } })),
        // Disney+ film
        apiClient.get<TMDBResponse>('tmdb/discover/movie', {
          params: { with_watch_providers: 337, watch_region: 'US', 'release_date.gte': minDate, 'vote_count.gte': 200, sort_by: 'popularity.desc', page: 1 },
        }).catch(() => ({ data: { results: [] } })),
        // Netflix dizi
        apiClient.get<TMDBResponse>('tmdb/discover/tv', {
          params: { with_watch_providers: 8, watch_region: 'US', 'first_air_date.gte': minDate, 'vote_count.gte': 200, sort_by: 'popularity.desc', page: 1 },
        }).catch(() => ({ data: { results: [] } })),
        // Prime dizi
        apiClient.get<TMDBResponse>('tmdb/discover/tv', {
          params: { with_watch_providers: 9, watch_region: 'US', 'first_air_date.gte': minDate, 'vote_count.gte': 200, sort_by: 'popularity.desc', page: 1 },
        }).catch(() => ({ data: { results: [] } })),
        // Disney+ dizi
        apiClient.get<TMDBResponse>('tmdb/discover/tv', {
          params: { with_watch_providers: 337, watch_region: 'US', 'first_air_date.gte': minDate, 'vote_count.gte': 200, sort_by: 'popularity.desc', page: 1 },
        }).catch(() => ({ data: { results: [] } })),
        // Popüler diziler (genel)
        apiClient.get<TMDBResponse>('tmdb/discover/tv', {
          params: { 'first_air_date.gte': minDate, 'vote_count.gte': 200, sort_by: 'popularity.desc', page: 1 },
        }).catch(() => ({ data: { results: [] } })),
      ]);
      
      // Filtre fonksiyonu - Latince ve minimum kalite
      const filterContent = (items: any[], isTV = false) =>
        (items ?? []).filter((m: any) => {
          const name = isTV ? (m?.name ?? '') : (m?.title ?? '');
          return (
            m?.vote_average > 6.0 &&
            m?.vote_count >= 200 &&
            !hasNonLatinCharacters(name) &&
            m?.poster_path // Afişi olmayan içerikleri dahil etme
          );
        });

      // Her kaynaktan en iyi 4-5 içerik al
      const nowPlayingMovies = filterContent([...(nowPlaying1?.data?.results ?? []), ...(nowPlaying2?.data?.results ?? [])]).slice(0, 5);
      const netflixMovies    = filterContent(netflix1?.data?.results ?? []).slice(0, 4);
      const primeMovies      = filterContent(prime1?.data?.results ?? []).slice(0, 4);
      const disneyMovies     = filterContent(disney1?.data?.results ?? []).slice(0, 3);
      const netflixShows     = filterContent(netflixTV1?.data?.results ?? [], true).slice(0, 3);
      const primeShows       = filterContent(primeTV1?.data?.results ?? [], true).slice(0, 3);
      const disneyShows      = filterContent(disneyTV1?.data?.results ?? [], true).slice(0, 2);
      const popularShows     = filterContent(tv1?.data?.results ?? [], true).slice(0, 4);

      // Tekrar eden ID'leri temizle
      const seen = new Set<number>();
      const unique = (arr: any[]) => arr.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      // Hepsini birleştir, tekrarları temizle, karıştır
      const allContent = unique([
        ...nowPlayingMovies,
        ...netflixMovies, ...netflixShows,
        ...primeMovies, ...primeShows,
        ...disneyMovies, ...disneyShows,
        ...popularShows,
      ]).sort(() => Math.random() - 0.5);
      
      // Her içerik için trailer bilgisini çek (max 15 içerik)
      const contentWithTrailers = await Promise.all(
        allContent.slice(0, 15).map(async (item) => {
          try {
            const isMovie = item?.title !== undefined; // movie has "title", TV has "name"
            const type = isMovie ? 'movie' : 'tv';
            const videos = await tmdbApi.getVideos(type, item?.id ?? 0);
            const trailer = videos?.results?.find(
              (v: any) => v?.type === 'Trailer' && v?.site === 'YouTube'
            );
            
            if (trailer) {
              return {
                id: item?.id,
                title: isMovie ? item?.title : item?.name,
                poster_path: item?.poster_path,
                backdrop_path: item?.backdrop_path,
                vote_average: item?.vote_average,
                release_date: item?.release_date || item?.first_air_date,
                overview: item?.overview, // Konu (Synopsis) için
                media_type: type,
                trailer: {
                  key: trailer?.key,
                  name: trailer?.name,
                },
              };
            }
            return null;
          } catch (error) {
            console.warn(`Failed to fetch trailer for content ${item?.id}`);
            return null;
          }
        })
      );
      
      // Sadece trailer'ı olan içerikleri döndür
      return contentWithTrailers.filter((c) => c !== null);
    } catch (error) {
      console.error('Failed to fetch trending with trailers:', error);
      return [];
    }
  },

  // Watch Providers (Streaming Platforms)
  getWatchProviders: async (type: 'movie' | 'tv', id: number): Promise<any> => {
    try {
      const typeParam = type === 'movie' ? 'movies' : 'tv';
      const response = await apiClient.get(`tmdb/${typeParam}/${id}/watch-providers`);
      return response?.data ?? { results: {} };
    } catch (error) {
      console.error('Failed to fetch watch providers:', error);
      return { results: {} };
    }
  },

  // Now Playing Movies (Vizyondaki Filmler)
  getNowPlayingMovies: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/now-playing', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch now playing movies');
    }
  },

  // Netflix Popular Content
  getNetflixContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/netflix', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Netflix content');
    }
  },

  getNetflixTVShows: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/netflix-tv', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Netflix TV shows');
    }
  },

  // Prime Video Popular Content
  getPrimeVideoContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/prime', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Prime Video content');
    }
  },

  getPrimeTVShows: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/prime-tv', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Prime TV shows');
    }
  },

  // Disney+ Popular Content
  getDisneyPlusContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/disney', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Disney+ content');
    }
  },

  getDisneyTVShows: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/disney-tv', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Disney TV shows');
    }
  },

  // HBO Max Popular Content
  getHBOMaxContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/hbo', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch HBO Max content');
    }
  },

  getHBOMaxTVShows: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/hbo-tv', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch HBO Max TV shows');
    }
  },

  // Gain Popular Content
  getGainContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/gain', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Gain content');
    }
  },

  // Turkcell TV+ Popular Content
  getTurkcellTVPlusContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/turkcell', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Turkcell TV+ content');
    }
  },

  // Tabii Popular Content
  getTabiiContent: async (page: number = 1): Promise<TMDBResponse> => {
    try {
      const response = await apiClient.get<TMDBResponse>('movies/tabii', {
        params: { page },
      });
      return response?.data ?? { results: [] };
    } catch (error) {
      throw new Error(error?.response?.data?.message ?? 'Failed to fetch Tabii content');
    }
  },
};

export const getPersonDetails = async (personId: number) => {
  try {
    const response = await apiClient.get(`/movies/person/${personId}`);
    return response?.data ?? null;
  } catch (error) {
    console.error('Error fetching person details:', error);
    return null;
  }
};

export const getByGenre = async (genreId: number, type: 'movie' | 'tv' = 'movie', page: number = 1) => {
  try {
    const response = await apiClient.get(`/movies/genre`, {
      params: { genreId, type, page }
    });
    return response?.data ?? { results: [] };
  } catch (error) {
    return { results: [] };
  }
};

export const getUpcoming = async (page: number = 1) => {
  try {
    const response = await apiClient.get(`/movies/upcoming`, { params: { page } });
    return response?.data ?? { results: [] };
  } catch (error) {
    return { results: [] };
  }
};

export const getByProvider = async (
  providerId: number,
  type: 'movie' | 'tv' = 'movie',
  page: number = 1,
  sortBy: 'popularity' | 'vote_average' = 'popularity',
  genreId?: number,
) => {
  try {
    const response = await apiClient.get('/movies/provider', {
      params: { providerId, type, page, sortBy, genreId }
    });
    return response?.data ?? { results: [] };
  } catch (error) {
    return { results: [] };
  }
};
