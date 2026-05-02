// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../../theme';
import { tmdbApi } from '../../api/tmdb';
import { userApi } from '../../api/user';

type CompareStackParamList = {
  CompareType: undefined;
  CompareGenre: { type: 'movie' | 'tv' };
  CompareGame: { type: 'movie' | 'tv'; genre: string };
  CompareResult: { winner: any };
};

type CompareGameScreenNavigationProp = StackNavigationProp<CompareStackParamList, 'CompareGame'>;
type CompareGameScreenRouteProp = RouteProp<CompareStackParamList, 'CompareGame'>;

interface Props {
  navigation: CompareGameScreenNavigationProp;
  route: CompareGameScreenRouteProp;
}

interface Movie {
  id?: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_average?: number;
  overview?: string;
}

const CompareGameScreen: React.FC<Props> = ({ navigation, route }) => {
  const { type, genre } = route?.params ?? { type: 'movie', genre: '28' };
  
  const [leftMovie, setLeftMovie] = useState<Movie | null>(null);
  const [rightMovie, setRightMovie] = useState<Movie | null>(null);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [shownMovieIds, setShownMovieIds] = useState<Set<number>>(new Set());
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const leftTapCount = useRef(0);
  const leftTapTimer = useRef<NodeJS.Timeout | null>(null);
  const rightTapCount = useRef(0);
  const rightTapTimer = useRef<NodeJS.Timeout | null>(null);

  const scaleAnimLeft = useRef(new Animated.Value(1)).current;
  const scaleAnimRight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const response = await tmdbApi.discover(type, {
        genre: parseInt(genre),
        page: 1,
      });
      
      const movies = response?.results ?? [];
      // Sadece konusu olan filmleri al
      const moviesWithOverview = movies.filter((m: Movie) => m?.overview && m.overview.trim().length > 0);
      const shuffled = moviesWithOverview.sort(() => Math.random() - 0.5);
      
      setAllMovies(shuffled);
      if (shuffled.length >= 2) {
        setLeftMovie(shuffled[0]);
        setRightMovie(shuffled[1]);
        // İlk iki filmi gösterilenlere ekle
        if (shuffled[0]?.id && shuffled[1]?.id) {
          setShownMovieIds(new Set([shuffled[0].id, shuffled[1].id]));
        }
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      Alert.alert('Hata', 'Filmler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getNextMovie = (exclude: number[]) => {
    const available = allMovies.filter(
      (m) => m?.id && !exclude.includes(m.id) && !shownMovieIds.has(m.id)
    );
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleChoose = (side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftScore(leftScore + 1);
      // Sağdaki değişir, seçilmeyeni gösterilenlere ekle
      const unselectedId = rightMovie?.id;
      const next = getNextMovie([leftMovie?.id ?? 0, rightMovie?.id ?? 0]);
      if (next) {
        setRightMovie(next);
        if (next?.id) {
          setShownMovieIds(prev => new Set([...prev, next.id!]));
        }
      }
      if (unselectedId) {
        setShownMovieIds(prev => new Set([...prev, unselectedId]));
      }
    } else {
      setRightScore(rightScore + 1);
      // Soldaki değişir, seçilmeyeni gösterilenlere ekle
      const unselectedId = leftMovie?.id;
      const next = getNextMovie([leftMovie?.id ?? 0, rightMovie?.id ?? 0]);
      if (next) {
        setLeftMovie(next);
        if (next?.id) {
          setShownMovieIds(prev => new Set([...prev, next.id!]));
        }
      }
      if (unselectedId) {
        setShownMovieIds(prev => new Set([...prev, unselectedId]));
      }
    }

    // Animasyon
    Animated.sequence([
      Animated.timing(side === 'left' ? scaleAnimLeft : scaleAnimRight, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(side === 'left' ? scaleAnimLeft : scaleAnimRight, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (round >= 15) {
      // Oyun bitti
      const winner = leftScore + 1 > rightScore ? leftMovie : rightScore + 1 > leftScore ? rightMovie : null;
      navigation?.navigate?.('CompareResult', { winner });
    } else {
      setRound(round + 1);
    }
  };

  const handleTap = (side: 'left' | 'right') => {
    const movie = side === 'left' ? leftMovie : rightMovie;
    const tapCountRef = side === 'left' ? leftTapCount : rightTapCount;
    const tapTimerRef = side === 'left' ? leftTapTimer : rightTapTimer;

    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current === 1) {
      // Tek tıklama - detaya git
      tapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1 && movie?.id) {
          // Detay sayfasına git
          navigation?.navigate?.('Detail', { id: movie.id, type });
        }
        tapCountRef.current = 0;
      }, 300);
    } else if (tapCountRef.current === 2) {
      // Çift tıklama - favorilere ekle
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
      tapCountRef.current = 0;

      if (movie?.id) {
        handleAddToFavorites(movie.id);
      }
    }
  };

  const handleAddToFavorites = async (movieId: number) => {
    try {
      await userApi.addToFavorites({
        movieId,
        title: leftMovie?.id === movieId ? leftMovie?.title ?? leftMovie?.name : rightMovie?.title ?? rightMovie?.name,
        posterPath: leftMovie?.id === movieId ? leftMovie?.poster_path : rightMovie?.poster_path,
        voteAverage: leftMovie?.id === movieId ? leftMovie?.vote_average : rightMovie?.vote_average,
        type,
      });
      Alert.alert('✅', 'Favorilere eklendi!');
    } catch (error) {
      Alert.alert('Hata', error?.message ?? 'Eklenemedi');
    }
  };

  const renderPoster = (movie: Movie | null, side: 'left' | 'right', scaleAnim: Animated.Value) => {
    if (!movie) return null;

    const posterUrl = movie?.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : 'https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Poster';

    return (
      <Animated.View style={[styles.posterContainer, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => handleTap(side)}
          style={styles.posterTouchable}
        >
          <Image
            source={{ uri: posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.posterGradient}
          />

          {/* Rating Badge */}
          {movie?.vote_average && movie.vote_average > 0 ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          ) : null}

          {/* Info Container */}
          <View style={styles.infoContainer}>
            <TouchableOpacity
              onPress={() => {
                if (movie?.id) {
                  navigation?.navigate?.('Detail', { id: movie.id, type });
                }
              }}
            >
              <Text style={styles.movieTitle} numberOfLines={2}>
                {movie?.title ?? movie?.name ?? 'Unknown'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.overview} numberOfLines={4}>
              {movie?.overview ?? 'Açıklama yok'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Choose Button */}
        <TouchableOpacity
          style={styles.chooseButton}
          onPress={() => handleChoose(side)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#E61806', '#c41505']}
            style={styles.chooseGradient}
          >
            <Text style={styles.chooseText}>{side === 'left' ? 'O' : 'Bu'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a0033', '#3b0066', '#5c0099']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a0033', '#3b0066', '#5c0099']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.postersContainer}>
          <View style={styles.posterWrapper}>
            {renderPoster(leftMovie, 'left', scaleAnimLeft)}
          </View>
          <View style={styles.posterWrapper}>
            {renderPoster(rightMovie, 'right', scaleAnimRight)}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  roundText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  postersContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xl,
  },
  posterWrapper: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  posterContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  posterTouchable: {
    flex: 1,
  },
  poster: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  posterGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 4,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 55,
    left: spacing.md,
    right: spacing.md,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
    textDecorationLine: 'underline',
  },
  overview: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.grayLight,
    lineHeight: 18,
  },
  chooseButton: {
    position: 'absolute',
    bottom: 12,
    left: spacing.md,
    right: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chooseGradient: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  chooseText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
});

export default CompareGameScreen;
