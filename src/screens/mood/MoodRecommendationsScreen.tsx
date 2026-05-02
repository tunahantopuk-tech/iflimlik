import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, Movie } from '../../types';
import { recommendationsApi } from '../../api/recommendations';
import { userApi } from '../../api/user';
import { colors, typography, spacing } from '../../theme';
import { useInterstitialAd } from '../../hooks/useInterstitialAd';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

type MoodRecommendationsScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'MoodRecommendations'>;
type MoodRecommendationsScreenRouteProp = RouteProp<HomeStackParamList, 'MoodRecommendations'>;

interface Props {
  navigation: MoodRecommendationsScreenNavigationProp;
  route: MoodRecommendationsScreenRouteProp;
}

const MoodRecommendationsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mood, type, genre } = route?.params || {};
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Animation refs
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const posterFadeAnim = useRef(new Animated.Value(1)).current; // Afiş fade-in animasyonu
  
  // Touch tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTapTime = useRef(0);
  const hasMoved = useRef(false);

  // Reklam yönetimi
  const { showAdNow, preloadAd } = useInterstitialAd();

  // Load initial movies
  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async (page: number = 1) => {
    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      if (__DEV__) { console.log('📡 Loading movies with:', { mood, type, genre, page }); }
      if (__DEV__) { console.log('📡 Route params:', { mood, type, genre }); }
      
      const movies = await recommendationsApi.getRecommendations(
        mood || 'happy',
        type || 'movie',
        genre || 'action',
        page
      );
      
      if (__DEV__) { console.log('✅ Received movies:', movies?.length); }
      if (__DEV__) { console.log('✅ First few movies:', movies?.slice(0, 3)?.map(m => m?.title || m?.name)); }
      
      if (!movies || movies.length === 0) {
        if (isInitialLoad) {
          const contentTypeName = type === 'movie' ? 'film' : 'dizi';
          Alert.alert(
            'Üzgünüm', 
            `Bu kategori için ${contentTypeName} bulunamadı.\n\nFarklı bir tür veya ruh hali seçmeyi deneyin.`,
            [
              { text: 'Geri Dön', onPress: () => navigation?.goBack?.() }
            ]
          );
        }
        return;
      }
      
      // Filter out movies without overview (synopsis)
      const moviesWithOverview = movies.filter(m => m?.overview && m.overview.trim().length > 0);
      
      if (__DEV__) { console.log('📝 Movies with overview:', moviesWithOverview?.length, '/', movies?.length); }
      
      if (moviesWithOverview.length === 0) {
        if (isInitialLoad) {
          const contentTypeName = type === 'movie' ? 'film' : 'dizi';
          Alert.alert(
            'Üzgünüm', 
            `Açıklama içeren ${contentTypeName} bulunamadı.\n\nFarklı bir seçim yapmayı deneyin.`,
            [
              { text: 'Geri Dön', onPress: () => navigation?.goBack?.() }
            ]
          );
        }
        return;
      }
      
      if (isInitialLoad) {
        // iFishing: Sadece ve sadece 10 film göster
        const limitedMovies = moviesWithOverview.slice(0, 10);
        setAllMovies(limitedMovies);
        setCurrentMovie(limitedMovies[0]);
        setCurrentIndex(0);
        if (__DEV__) { console.log('🎣 iFishing: Limited to 15 movies'); }
        if (__DEV__) { console.log('🎬 First movie:', limitedMovies[0]?.title || limitedMovies[0]?.name); }
        
        // Oyun sonunda gösterilecek reklamı pre-load et
        preloadAd();
        if (__DEV__) { console.log('🎯 iFishing: Pre-loading exit ad'); }
      } else {
        // iFishing: Pagination'ı engelle - max 15 film
        if (__DEV__) { console.log('🚫 iFishing: Skipping pagination, max 15 movies already loaded'); }
        return;
      }
      
      setCurrentPage(page);
    } catch (error) {
      if (__DEV__) { console.error('❌ Error loading movies:', error); }
      if (isInitialLoad) {
        Alert.alert('Hata', 'Film önerisi yüklenirken bir sorun oluştu');
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadNextMovie = async () => {
    if (!allMovies || allMovies.length === 0) {
      await loadMovies(1);
      return;
    }

    const nextIndex = currentIndex + 1;
    
    if (__DEV__) { console.log('🎬 Next movie:', { nextIndex, totalMovies: allMovies.length }); }
    
    // 10 film bitti — direkt tamamlama ekranına git, popup yok
    if (nextIndex >= allMovies.length) {
      await showAdNow();
      await AsyncStorage.removeItem('home_recommendations_cache_v6_prime_filtered_3pages');
      navigation?.navigate?.('iFishingCompletion');
      return;
    }
    
    // Afiş fade-out → yeni film → fade-in (flicker önleme)
    Animated.timing(posterFadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setCurrentMovie(allMovies[nextIndex]);
      setCurrentIndex(nextIndex);
      Animated.timing(posterFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleAddToFavorites = async () => {
    if (!currentMovie) return;
    
    if (__DEV__) { console.log('❤️ ADDING TO FAVORITES:', currentMovie?.title || currentMovie?.name); }
    
    try {
      const movieType = currentMovie?.title ? 'movie' : 'tv';
      const movieTitle = currentMovie?.title || currentMovie?.name || 'Unknown';
      const posterPath = currentMovie?.poster_path;
      const voteAverage = currentMovie?.vote_average;
      
      await userApi.addToFavorites(
        currentMovie.id,
        movieTitle,
        posterPath,
        movieType,
        voteAverage
      );
      
      // Show heart animation - INSTANT!
      if (__DEV__) { console.log('✨ SHOWING HEART ANIMATION'); }
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1.3,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(500), // Hold the heart visible
          Animated.timing(heartOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (__DEV__) { console.log('✅ HEART ANIMATION COMPLETE'); }
        heartScale.setValue(0);
        heartOpacity.setValue(0);
      });
    } catch (error) {
      if (__DEV__) { console.error('❌ Error adding to favorites:', error); }
    }
  };

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
    touchStartTime.current = Date.now();
    hasMoved.current = false;
  };

  const handleTouchMove = (e: any) => {
    const currentX = e.nativeEvent.pageX;
    const currentY = e.nativeEvent.pageY;
    const diffX = Math.abs(currentX - touchStartX.current);
    const diffY = Math.abs(currentY - touchStartY.current);
    
    // If moved more than 10px, it's a swipe not a tap
    if (diffX > 10 || diffY > 10) {
      hasMoved.current = true;
    }
    
    const diff = currentX - touchStartX.current;
    swipeAnim.setValue(diff);
  };

  const handleTouchEnd = (e: any) => {
    const endX = e.nativeEvent.pageX;
    const diff = endX - touchStartX.current;
    const timeDiff = Date.now() - touchStartTime.current;
    const now = Date.now();
    
    // Check if it's a tap (not a swipe)
    if (!hasMoved.current && timeDiff < 300) {
      if (__DEV__) { console.log('👆 TAP DETECTED'); }
      
      // Check for double tap
      const timeSinceLastTap = now - lastTapTime.current;
      if (__DEV__) { console.log('⏱️ Time since last tap:', timeSinceLastTap); }
      
      if (timeSinceLastTap < 500 && timeSinceLastTap > 0) {
        if (__DEV__) { console.log('🎉 DOUBLE TAP DETECTED!'); }
        handleAddToFavorites();
        lastTapTime.current = 0; // Reset to avoid triple tap
      } else {
        if (__DEV__) { console.log('🔵 SINGLE TAP (waiting for second tap)'); }
        lastTapTime.current = now;
      }
      
      // Snap back the card
      Animated.spring(swipeAnim, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }).start();
      
      return;
    }
    
    // Swipe handling
    // Swipe right - next movie
    if (diff > SWIPE_THRESHOLD && hasMoved.current) {
      if (__DEV__) { console.log('➡️ SWIPE RIGHT - NEXT MOVIE'); }
      Animated.timing(swipeAnim, {
        toValue: SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        swipeAnim.setValue(0);
        setTimeout(() => {
          loadNextMovie();
        }, 10);
      });
    }
    // Swipe left - previous movie (go back in list)
    else if (diff < -SWIPE_THRESHOLD && hasMoved.current) {
      if (__DEV__) { console.log('⬅️ SWIPE LEFT - PREVIOUS MOVIE'); }
      
      if (currentIndex > 0) {
        Animated.timing(swipeAnim, {
          toValue: -SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          swipeAnim.setValue(0);
          setTimeout(() => {
            const prevIndex = currentIndex - 1;
            setCurrentMovie(allMovies?.[prevIndex] ?? null);
            setCurrentIndex(prevIndex);
            if (__DEV__) { console.log('⬅️ Going back to movie:', allMovies?.[prevIndex]?.title || allMovies?.[prevIndex]?.name); }
          }, 10);
        });
      } else {
        // Already at first movie - snap back
        if (__DEV__) { console.log('⬅️ Already at first movie, cannot go back'); }
        Animated.spring(swipeAnim, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    }
    // Snap back
    else {
      Animated.spring(swipeAnim, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#E61806', '#8f0083', '#3b0036']}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.loadingText}>Film yükleniyor...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!currentMovie) {
    return (
      <LinearGradient
        colors={['#E61806', '#8f0083', '#3b0036']}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="sad-outline" size={64} color={colors.white} />
            <Text style={styles.errorText}>Film bulunamadı</Text>
            <Text style={styles.errorSubtext}>Lütfen farklı bir seçim yapın</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const posterUrl = currentMovie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`
    : null;
  

  const cardRotation = swipeAnim.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const cardOpacity = swipeAnim.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <LinearGradient
      colors={['#E61806', '#8f0083', '#3b0036']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🐟 iFishing</Text>
            <Text style={styles.headerSubtitle}>
              {mood} • {type === 'movie' ? 'Film' : 'Dizi'} • {genre}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Movie Card */}
        <View style={styles.cardContainer}>
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX: swipeAnim },
                  { rotate: cardRotation },
                ],
                opacity: cardOpacity,
              },
            ]}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
              {posterUrl ? (
                <Animated.Image
                  source={{ uri: posterUrl }}
                  style={[styles.poster, { opacity: posterFadeAnim }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noPoster}>
                  <Ionicons name="film-outline" size={80} color={colors.white} />
                </View>
              )}
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.gradient}
              >
                <TouchableOpacity
                  onPress={() => {
                    const movieType = currentMovie?.title ? 'movie' : 'tv';
                    navigation?.navigate?.('Detail', { 
                      id: currentMovie?.id, 
                      type: movieType 
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.movieTitle} numberOfLines={2}>
                    {currentMovie?.title || currentMovie?.name}
                  </Text>
                </TouchableOpacity>
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text style={styles.rating}>
                    {currentMovie?.vote_average?.toFixed(1) || 'N/A'}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.year}>
                    {currentMovie?.release_date?.split('-')[0] ||
                      currentMovie?.first_air_date?.split('-')[0] ||
                      '—'}
                  </Text>
                </View>
                <Text style={styles.overview} numberOfLines={4}>
                  {currentMovie?.overview || 'Açıklama mevcut değil'}
                </Text>
              </LinearGradient>

              {/* Heart Animation - Instagram style */}
              <Animated.View
                style={[
                  styles.heartContainer,
                  {
                    opacity: heartOpacity,
                    transform: [{ scale: heartScale }],
                  },
                ]}
                pointerEvents="none"
              >
                <Ionicons name="heart" size={140} color="#FF1744" />
              </Animated.View>
            </Animated.View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionRow}>
            <Ionicons name="heart" size={22} color="#FF1744" />
            <Text style={styles.instructionText}>Çift dokun: Favorilere ekle</Text>
          </View>
          <View style={styles.instructionRow}>
            <Ionicons name="arrow-forward" size={22} color={colors.white} />
            <Text style={styles.instructionText}>Sağa kaydır: Yeni film</Text>
          </View>
          <View style={styles.instructionRow}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
            <Text style={styles.instructionText}>Sola kaydır: Önceki film</Text>
          </View>
        </View>

        {/* Movie counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {allMovies?.length || 0}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: SCREEN_WIDTH * 0.88,
    height: SCREEN_HEIGHT * 0.62,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  noPoster: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingTop: 120,
  },
  movieTitle: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.sm,
    lineHeight: 30,
    textDecorationLine: 'underline',
    textDecorationColor: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rating: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '600',
    marginLeft: 4,
  },
  dot: {
    fontSize: 15,
    color: colors.white,
    opacity: 0.6,
    marginHorizontal: 8,
  },
  year: {
    fontSize: 15,
    color: colors.white,
    opacity: 0.85,
    fontWeight: '500',
  },
  overview: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  heartContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -70,
    marginLeft: -70,
    ...Platform.select({
      ios: {
        shadowColor: '#FF1744',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  instructionsContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
    opacity: 0.9,
  },
  counterContainer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  counterText: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.7,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: 22,
    color: colors.white,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 15,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
});

export default MoodRecommendationsScreen;
