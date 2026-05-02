import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius } from '../theme';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375; // iPhone SE, 5, 5s gibi küçük ekranlar
const isMediumScreen = width >= 375 && width < 414; // iPhone 6, 7, 8, X, XS
const isLargeScreen = width >= 414; // iPhone Plus, Max modeller

interface Trailer {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  overview?: string; // Synopsis için
  trailer: {
    key: string;
    name: string;
  };
}

interface TrailerStoriesProps {
  trailers: Trailer[];
  onMoviePress?: (id: number, type: 'movie' | 'tv') => void;
  onRefresh?: () => void;
  onYouTubePress?: () => void;   // YouTube linkine tıklayınca Interstitial
  onForwardAd?: () => void;      // Her 5 ileri geçişte Interstitial
}

export const TrailerStories: React.FC<TrailerStoriesProps> = ({ trailers, onMoviePress, onRefresh, onYouTubePress, onForwardAd }) => {
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [watchedTrailers, setWatchedTrailers] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(15); // 15 saniye countdown
  const [refreshCount, setRefreshCount] = useState(0); // Yenile butonu kaç kez basıldı
  const forwardCountRef = React.useRef(0); // İleri kaç kez basıldı (reklam için)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Premium Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load watched trailers from AsyncStorage
  useEffect(() => {
    loadWatchedTrailers();
  }, []);

  // 15 saniye otomatik geçiş timer
  useEffect(() => {
    if (selectedTrailer) {
      setTimeLeft(15);
      
      // Premium animasyon başlat
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 15 saniye doldu, sonraki fragmana geç
            goToNextTrailer();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      // Modal kapandığında animasyonu sıfırla
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      slideAnim.setValue(50);
    }
  }, [selectedTrailer, currentIndex]);

  const loadWatchedTrailers = async () => {
    try {
      const watched = await AsyncStorage.getItem('watched_trailers');
      if (watched) {
        setWatchedTrailers(new Set(JSON.parse(watched)));
      }
    } catch (error) {
      if (__DEV__) { console.error('Failed to load watched trailers:', error); }
    }
  };

  const markAsWatched = async (trailerId: number) => {
    try {
      const newWatched = new Set(watchedTrailers);
      newWatched.add(trailerId);
      setWatchedTrailers(newWatched);
      await AsyncStorage.setItem('watched_trailers', JSON.stringify([...newWatched]));
    } catch (error) {
      if (__DEV__) { console.error('Failed to save watched trailer:', error); }
    }
  };

  // İzlenen fragmanları sağa gönder (sıralama) - CRASH FIX: useMemo ile cache
  // refreshCount === 1 ise izlenmiş fragmanları filtrele (ilk refresh'te)
  const sortedTrailers = useMemo(() => {
    let filtered = [...trailers];
    
    // İlk refresh'te (refreshCount === 1) izlenmiş fragmanları gösterme
    if (refreshCount === 1) {
      filtered = filtered.filter(trailer => !watchedTrailers.has(trailer?.id ?? 0));
    }
    
    // Sıralama: İzlenmeyenler önce, izlenenler sonra
    return filtered.sort((a, b) => {
      const aWatched = watchedTrailers.has(a?.id ?? 0);
      const bWatched = watchedTrailers.has(b?.id ?? 0);
      
      // İzlenmeyenler önce (sol), izlenenler sonra (sağ)
      if (!aWatched && bWatched) return -1;
      if (aWatched && !bWatched) return 1;
      return 0;
    });
  }, [trailers, watchedTrailers, refreshCount]);

  const handleStoryPress = useCallback((trailer: Trailer, index: number) => {
    try {
      // Güvenlik kontrolü
      if (!trailer) {
        if (__DEV__) { console.warn('Trailer is null'); }
        return;
      }

      if (index < 0 || index >= sortedTrailers.length) {
        if (__DEV__) { console.warn('Invalid index:', index); }
        return;
      }

      setCurrentIndex(index);
      setSelectedTrailer(trailer);
      setIsPlaying(true);
      setIsLoading(true);
      setTimeLeft(15);
      // Mark as watched
      markAsWatched(trailer?.id ?? 0);
    } catch (error) {
      if (__DEV__) { console.error('Error in handleStoryPress:', error); }
    }
  }, [sortedTrailers.length]);

  const goToNextTrailer = useCallback(() => {
    try {
      if (!trailers || trailers.length === 0) {
        if (__DEV__) { console.warn('trailers is empty'); }
        return;
      }

      if (currentIndex < trailers.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextTrailer = trailers[nextIndex];

        if (!nextTrailer) {
          if (__DEV__) { console.warn('nextTrailer is null at index', nextIndex); }
          return;
        }

        // İleri sayacını artır — her 5 ileri geçişte (6. story'de) reklam göster
        forwardCountRef.current += 1;
        if (forwardCountRef.current % 5 === 0 && onForwardAd) {
          onForwardAd();
        }

        setCurrentIndex(nextIndex);
        setSelectedTrailer(nextTrailer);
        setTimeLeft(15);
        markAsWatched(nextTrailer?.id ?? 0);
      } else {
        handleClose();
      }
    } catch (error) {
      if (__DEV__) { console.error('Error in goToNextTrailer:', error); }
    }
  }, [trailers, currentIndex, onForwardAd]);

  const goToPreviousTrailer = useCallback(() => {
    try {
      // Ana sayfadaki trailers sıralamasını kullan
      if (!trailers || trailers.length === 0) {
        if (__DEV__) { console.warn('trailers is empty'); }
        return;
      }

      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        const prevTrailer = trailers[prevIndex];
        
        // Güvenlik kontrolü
        if (!prevTrailer) {
          if (__DEV__) { console.warn('prevTrailer is null at index', prevIndex); }
          return;
        }

        setCurrentIndex(prevIndex);
        setSelectedTrailer(prevTrailer);
        setTimeLeft(15);
        // Geri giderken de izlenmiş olarak işaretle
        markAsWatched(prevTrailer?.id ?? 0);
      }
    } catch (error) {
      if (__DEV__) { console.error('Error in goToPreviousTrailer:', error); }
    }
  }, [trailers, currentIndex]);

  const handleClose = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSelectedTrailer(null);
    setIsPlaying(false);
    setCurrentIndex(0);
    setTimeLeft(15);
  };

  // YouTube videoyu direkt browser'da aç (WebView hata 153 çözümü)
  const openYouTubeVideo = (key: string) => {
    // Önce interstitial reklam göster, sonra YouTube'u aç
    const openURL = () => {
      const url = `https://www.youtube.com/watch?v=${key}`;
      Linking.openURL(url).catch((err: any) => {
        if (__DEV__) { console.error('Failed to open YouTube:', err); }
        alert('YouTube videosu açılamadı. Lütfen YouTube uygulamasını kontrol edin.');
      });
    };

    if (onYouTubePress) {
      onYouTubePress();
      // Reklam callback olmadığı için küçük delay ile aç
      setTimeout(openURL, 500);
    } else {
      openURL();
    }
  };

  if (!trailers || trailers.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>🍿 PopStory</Text>
          {onRefresh && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                setRefreshCount(prev => prev + 1);
                forwardCountRef.current = 0; // Yenilemede sayacı sıfırla
                onRefresh?.();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {sortedTrailers.map((trailer, index) => {
            const isWatched = watchedTrailers.has(trailer?.id ?? 0);
            return (
              <TouchableOpacity
                key={`${trailer?.id}-${index}`}
                style={styles.storyItem}
                onPress={() => handleStoryPress(trailer, index)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isWatched ? ['#666666', '#444444', '#333333'] : ['#E91E63', '#9C27B0', '#673AB7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBorder}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w200${trailer?.poster_path}`,
                      }}
                      style={styles.storyImage as any}
                      resizeMode="cover"
                    />
                    <View style={styles.playIconContainer}>
                      <Ionicons name="play-circle" size={28} color="#fff" />
                    </View>
                  </View>
                </LinearGradient>
                <Text style={styles.storyTitle} numberOfLines={2}>
                  {trailer?.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Story Modal - Instagram Tarzı + Premium */}
      <Modal
        visible={selectedTrailer !== null}
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
        transparent
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ],
            }
          ]}
        >
            <LinearGradient
              colors={['#0a0a0a', '#1a1a1a', '#0f0f0f']}
              style={styles.modalGradient}
            >
              {/* Premium Shimmer Effect */}
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.03)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerOverlay}
              />

              {/* Timer Progress Bar (Instagram gibi) */}
              <View style={styles.timerBarContainer}>
                <Animated.View 
                  style={[
                    styles.timerBar, 
                    { 
                      width: `${(timeLeft / 15) * 100}%`,
                    }
                  ]} 
                />
              </View>

              {/* Close Button (Premium Style) */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                  style={styles.closeButtonGradient}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Scroll edilebilir içerik - Pause özelliği kaldırıldı */}
              <ScrollView 
                style={styles.contentScrollView}
                contentContainerStyle={styles.scrollContent2}
                showsVerticalScrollIndicator={false}
              >
                {/* PREMIUM LAYOUT: Üstte Poster ve Fragman */}
                <View style={styles.topSection}>
                  {/* Sol: Premium Poster Card */}
                  <View style={styles.posterContainer}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                      style={styles.posterCard}
                    >
                      <Image
                        source={{ 
                          uri: selectedTrailer?.poster_path 
                            ? `https://image.tmdb.org/t/p/w500${selectedTrailer.poster_path}`
                            : 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Poster'
                        }}
                        style={styles.modalPoster as any}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.posterGradientOverlay}
                      >
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.ratingText}>
                            {selectedTrailer?.vote_average?.toFixed(1)}
                          </Text>
                        </View>
                      </LinearGradient>
                    </LinearGradient>
                  </View>

                  {/* Sağ: Premium YouTube Card */}
                  <View style={styles.trailerContainer}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                      style={styles.trailerCard}
                    >
                      <Text style={styles.trailerTitle}>🎬 Fragman</Text>
                      
                      {/* YouTube Thumbnail Önizleme */}
                      <TouchableOpacity
                        style={styles.thumbnailContainer}
                        onPress={() => openYouTubeVideo(selectedTrailer?.trailer?.key ?? '')}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ 
                            uri: `https://img.youtube.com/vi/${selectedTrailer?.trailer?.key}/maxresdefault.jpg` 
                          }}
                          style={styles.youtubeThumbnail as any}
                          resizeMode="cover"
                        />
                        {/* Play Button Overlay */}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                          style={styles.playOverlay}
                        >
                          <View style={styles.playButton}>
                            <Ionicons name="play-circle" size={64} color="#FF0000" />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <Text style={styles.youtubeHint}>📺 Fragmanı izlemek için tıkla</Text>
                      <Text style={styles.timerText}>⏱ {timeLeft}s kaldı</Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* PREMIUM NAVIGATION BUTTONS */}
                <View style={styles.navigationContainer}>
                  {/* Sol Ok - Önceki */}
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonLeft]}
                    onPress={goToPreviousTrailer}
                    activeOpacity={0.7}
                    disabled={currentIndex === 0}
                  >
                    <LinearGradient
                      colors={currentIndex === 0 
                        ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                        : ['rgba(233,30,99,0.9)', 'rgba(156,39,176,0.9)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.navButtonGradient}
                    >
                      <Ionicons 
                        name="chevron-back" 
                        size={28} 
                        color={currentIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} 
                      />
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Sağ Ok - Sonraki */}
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonRight]}
                    onPress={goToNextTrailer}
                    activeOpacity={0.7}
                    disabled={currentIndex >= trailers.length - 1}
                  >
                    <LinearGradient
                      colors={currentIndex >= trailers.length - 1
                        ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                        : ['rgba(233,30,99,0.9)', 'rgba(156,39,176,0.9)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.navButtonGradient}
                    >
                      <Ionicons 
                        name="chevron-forward" 
                        size={28} 
                        color={currentIndex >= trailers.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} 
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* PREMIUM SYNOPSIS CARD */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                  style={styles.synopsisCard}
                >
                  <Text style={styles.movieTitle}>{selectedTrailer?.title}</Text>
                  
                  {selectedTrailer?.overview ? (
                    <>
                      <View style={styles.synopsisDivider} />
                      <Text style={styles.synopsisTitle}>📖 Konu</Text>
                      <Text style={styles.synopsisText}>
                        {selectedTrailer.overview}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.noSynopsisText}>Bu içerik için özet mevcut değil.</Text>
                  )}
                </LinearGradient>

                {/* PREMIUM DETAYLAR BUTONU */}
                <TouchableOpacity
                  style={styles.detailsButtonContainer}
                  onPress={() => {
                    handleClose();
                    onMoviePress?.(selectedTrailer?.id ?? 0, selectedTrailer?.media_type ?? 'movie');
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#E91E63', '#9C27B0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.detailsButton}
                  >
                    <Text style={styles.detailsButtonText}>Detaylar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: spacing.md,
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 90,
  },
  gradientBorder: {
    borderRadius: 50,
    padding: 3,
  },
  imageContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  storyTitle: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: 11,
  },
  
  // Modal Styles (Premium)
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: spacing.md,
    zIndex: 100,
  },
  closeButtonGradient: {
    borderRadius: 24,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  // Timer Progress Bar (Instagram gibi + Premium)
  timerBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: spacing.md,
    right: 80,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    zIndex: 100,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 3,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Content ScrollView
  contentScrollView: {
    flex: 1,
    marginTop: 70,
  },
  scrollContent2: {
    padding: isSmallScreen ? spacing.md : spacing.lg,
  },
  
  // Top Section (Poster + Fragman) - Responsive
  topSection: {
    flexDirection: isSmallScreen || isMediumScreen ? 'column' : 'row',
    gap: isSmallScreen ? spacing.md : spacing.lg,
    marginBottom: spacing.lg,
    alignItems: isSmallScreen || isMediumScreen ? 'center' : 'flex-start',
  },
  
  // Premium Poster Container (Sol) - Responsive
  posterContainer: {
    width: isSmallScreen || isMediumScreen ? '70%' : '38%',
    maxWidth: isSmallScreen || isMediumScreen ? 200 : undefined,
    position: 'relative',
  },
  posterCard: {
    borderRadius: borderRadius.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  modalPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: borderRadius.lg,
    backgroundColor: '#1a1a1a',
  },
  posterGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
  
  // Premium Trailer Container (Sağ) - Responsive
  trailerContainer: {
    flex: isSmallScreen || isMediumScreen ? undefined : 1,
    width: isSmallScreen || isMediumScreen ? '100%' : undefined,
    justifyContent: 'center',
  },
  trailerCard: {
    borderRadius: borderRadius.xl,
    padding: isSmallScreen ? spacing.md : spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  trailerTitle: {
    fontSize: isSmallScreen ? 15 : 18,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // YouTube Thumbnail Önizleme
  thumbnailContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    aspectRatio: 16 / 9,
    width: '100%',
  },
  youtubeThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    padding: spacing.sm,
  },
  youtubeHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: isSmallScreen ? 11 : 13,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  timerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: isSmallScreen ? 11 : 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Premium Synopsis Card - Responsive
  synopsisCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: isSmallScreen ? spacing.md : spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  movieTitle: {
    fontSize: isSmallScreen ? 18 : 24,
    color: colors.white,
    fontWeight: '800',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  synopsisDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: spacing.md,
  },
  synopsisTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  synopsisText: {
    fontSize: isSmallScreen ? 13 : 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: isSmallScreen ? 20 : 24,
    letterSpacing: 0.2,
  },
  noSynopsisText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  
  // Premium Details Button
  detailsButtonContainer: {
    marginBottom: spacing.xl,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  detailsButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Pause Indicator (basılı tutma)
  pauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 20,
  },
  
  // Navigation Buttons (Sol/Sağ Ok)
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  navButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  navButtonLeft: {
    marginRight: 'auto',
  },
  navButtonRight: {
    marginLeft: 'auto',
  },
  navButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
  },
  
  // Pressable Container (basılı tutma için)
  pressableContainer: {
    flex: 1,
    width: '100%',
  },
});
