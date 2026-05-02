import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import YoutubePlayer from 'react-native-youtube-iframe';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, Movie, Cast } from '../../types';
import { tmdbApi } from '../../api/tmdb';
import { userApi } from '../../api/user';

import { CastAvatar, MovieCard } from '../../components';
import { BannerAd } from '../../components/ads';
import { useInterstitialAd } from '../../hooks/useInterstitialAd';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';
import { filterLatinMovies } from '../../utils/textFilters';


type DetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Detail'>;
type DetailScreenRouteProp = RouteProp<HomeStackParamList, 'Detail'>;

interface Props {
  navigation: DetailScreenNavigationProp;
  route: DetailScreenRouteProp;
}

const DetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id, type } = route?.params ?? {};
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [inWatched, setInWatched] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current; // Parallax için

  // Animasyon değerleri (buton tıklama feedback)
  const watchlistAnim = useRef(new Animated.Value(1)).current;
  const favoritesAnim = useRef(new Animated.Value(1)).current;
  const watchedAnim = useRef(new Animated.Value(1)).current;

  const animateButton = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const { showAd, showAdNow } = useInterstitialAd();
  const { showRewardedAd } = useRewardedAd();
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerUnlocked, setTrailerUnlocked] = useState(false);
  const [watchProviders, setWatchProviders] = useState<any[]>([]);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [id, type]);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const detailsPromise = type === 'tv' ? tmdbApi.getTVDetails(id) : tmdbApi.getMovieDetails(id);
      const creditsPromise = type === 'tv' ? tmdbApi.getTVCredits(id) : tmdbApi.getMovieCredits(id);
      const similarPromise = type === 'tv' ? tmdbApi.getSimilarTV(id) : tmdbApi.getSimilarMovies(id);
      const videosPromise = tmdbApi.getVideos(type === 'tv' ? 'tv' : 'movie', Number(id));
      const providersPromise = tmdbApi.getWatchProviders(type === 'tv' ? 'tv' : 'movie', Number(id));
      
      // User-specific data with error handling (may fail for Apple users)
      const watchlistPromise = userApi.getWatchlist().catch(() => []);
      const favoritesPromise = userApi.getFavorites().catch(() => []);
      const watchedPromise = userApi.getWatched().catch(() => []);

      const [details, credits, similarRes, videos, providers, watchlist, favorites, watched] = await Promise.all([
        detailsPromise,
        creditsPromise,
        similarPromise,
        videosPromise,
        providersPromise,
        watchlistPromise,
        favoritesPromise,
        watchedPromise,
      ]);

      setMovie(details ?? null);
      setCast(credits?.cast?.slice?.(0, 10) ?? []);
      // Latin alfabesi olmayan filmleri filtrele
      setSimilar(filterLatinMovies(similarRes?.results ?? []).slice(0, 10));

      // Find official trailer (YouTube)
      const videoResults = videos?.results ?? [];
      const trailer = videoResults?.find?.(
        (v: any) => v?.type === 'Trailer' && v?.site === 'YouTube' && v?.official === true
      ) || videoResults?.find?.(
        (v: any) => v?.type === 'Trailer' && v?.site === 'YouTube'
      );
      setTrailerKey(trailer?.key ?? null);
      if (__DEV__) { console.log('🎬 Trailer key:', trailer?.key); }

      // Parse watch providers for Turkey (TR)
      const providerData = providers?.results?.TR;
      const allProviders = [
        ...(providerData?.flatrate ?? []),
        ...(providerData?.rent ?? []),
        ...(providerData?.buy ?? []),
      ];
      // Remove duplicates by provider_id
      const uniqueProviders = allProviders?.filter?.(
        (provider, index, self) => 
          index === self?.findIndex?.((p) => p?.provider_id === provider?.provider_id)
      ) ?? [];
      setWatchProviders(uniqueProviders);
      if (__DEV__) { console.log('📺 Watch providers:', uniqueProviders?.length, uniqueProviders); }

      // Check if current movie is in lists (compare as numbers)
      setInWatchlist(watchlist?.some?.((item) => Number(item?.movieId) === Number(id)) ?? false);
      setInFavorites(favorites?.some?.((item) => Number(item?.movieId) === Number(id)) ?? false);
      setInWatched(watched?.some?.((item) => Number(item?.movieId) === Number(id)) ?? false);
    } catch (error) {
      if (__DEV__) { console.error('Error loading details:', error); }
      Alert.alert('Error', 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!movie?.id || (!movie?.title && !movie?.name)) return;
    animateButton(watchlistAnim);
    const prev = inWatchlist;
    setInWatchlist(!prev); // Optimistic update - anında işaretle
    try {
      if (prev) {
        await userApi.removeFromWatchlist(movie.id);
      } else {
        await userApi.addToWatchlist(
          movie.id,
          movie.title ?? movie.name ?? 'Unknown',
          movie.poster_path,
          type ?? 'movie',
          movie.vote_average
        );
      }
    } catch (error) {
      setInWatchlist(prev); // Hata durumunda geri al
      if (__DEV__) { console.error('Watchlist error:', error); }
    }
  };

  const handleAddToFavorites = async () => {
    if (!movie?.id || (!movie?.title && !movie?.name)) return;
    animateButton(favoritesAnim);
    const prev = inFavorites;
    setInFavorites(!prev); // Optimistic update
    try {
      if (prev) {
        await userApi.removeFromFavorites(movie.id);
      } else {
        await userApi.addToFavorites(
          movie.id,
          movie.title ?? movie.name ?? '',
          movie.poster_path,
          type,
          movie.vote_average
        );
      }
    } catch (error) {
      setInFavorites(prev); // Hata durumunda geri al
      if (__DEV__) { console.error('Favorites error:', error); }
    }
  };

  const handleMarkAsWatched = async () => {
    if (!movie?.id || (!movie?.title && !movie?.name)) return;
    animateButton(watchedAnim);
    const prev = inWatched;
    setInWatched(!prev); // Optimistic update
    try {
      if (prev) {
        await userApi.removeFromWatched(movie.id);
      } else {
        await userApi.addToWatched(
          movie.id,
          movie.title ?? movie.name ?? '',
          movie.poster_path,
          type,
          movie.vote_average
        );
      }
    } catch (error) {
      setInWatched(prev); // Hata durumunda geri al
      if (__DEV__) { console.error('Watched error:', error); }
    }
  };

  const handleWatchTrailer = () => {
    if (!trailerKey) {
      Alert.alert('Üzgünüz', 'Bu içerik için fragman bulunamadı');
      return;
    }
    if (trailerUnlocked) {
      // Kilit açık — direkt fragmanı göster
      setTrailerModalVisible(true);
    } else {
      // Kilitli — rewarded reklam izle, sonra aç
      showRewardedAd(() => {
        // Ödül kazanıldı — kilidi aç ve fragmanı göster
        setTrailerUnlocked(true);
        setTimeout(() => {
          setTrailerModalVisible(true);
        }, 200);
      });
    }
  };

  const handleOpenProvider = async (provider: any) => {
    try {
      // Generate platform-specific search URL
      const movieTitle = movie?.title || movie?.name || '';
      const year = movie?.release_date?.split?.('-')?.[0] || movie?.first_air_date?.split?.('-')?.[0] || '';
      
      let platformUrl = '';
      const providerName = provider?.provider_name?.toLowerCase?.() || '';
      
      if (providerName?.includes?.('netflix')) {
        platformUrl = `https://www.netflix.com/search?q=${encodeURIComponent(movieTitle)}`;
      } else if (providerName?.includes?.('prime') || providerName?.includes?.('amazon')) {
        platformUrl = `https://www.primevideo.com/search?phrase=${encodeURIComponent(movieTitle)}`;
      } else if (providerName?.includes?.('disney')) {
        platformUrl = `https://www.disneyplus.com/search?q=${encodeURIComponent(movieTitle)}`;
      } else if (providerName?.includes?.('apple')) {
        platformUrl = `https://tv.apple.com/search?q=${encodeURIComponent(movieTitle)}`;
      } else if (providerName?.includes?.('hbo')) {
        platformUrl = `https://www.max.com/search?q=${encodeURIComponent(movieTitle)}`;
      } else if (providerName?.includes?.('paramount')) {
        platformUrl = `https://www.paramountplus.com/search/?query=${encodeURIComponent(movieTitle)}`;
      } else if (providerName?.includes?.('youtube')) {
        platformUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + ' ' + year)}`;
      } else if (providerName?.includes?.('google play')) {
        platformUrl = `https://play.google.com/store/search?q=${encodeURIComponent(movieTitle)}&c=movies`;
      } else {
        // Fallback: TMDB watch page
        platformUrl = `https://www.themoviedb.org/${type}/${id}/watch?locale=TR`;
      }
      
      if (__DEV__) { console.log('📺 Opening platform:', providerName, platformUrl); }
      await WebBrowser.openBrowserAsync(platformUrl);
    } catch (error) {
      if (__DEV__) { console.error('Error opening provider:', error); }
      Alert.alert('Hata', 'Platform açılamadı');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  const backdropUrl = movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
    : null;
  const posterUrl = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Poster';

  const title = movie?.title ?? movie?.name ?? 'Unknown';
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const year = movie?.release_date
    ? new Date(movie.release_date).getFullYear()
    : movie?.first_air_date
    ? new Date(movie.first_air_date).getFullYear()
    : '';
  const runtime = movie?.runtime ? `${movie.runtime} min` : '';
  const genres = movie?.genres?.map?.((g) => g?.name).filter(Boolean).join(', ') ?? '';

  return (
    <View style={premiumStyles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* TAM EKRAN ARKA PLAN — Immersive Backdrop */}
      {backdropUrl ? (
        <Animated.Image
          source={{ uri: backdropUrl }}
          style={[
            premiumStyles.fullBg,
            {
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [-100, 0, 300],
                  outputRange: [-30, 0, 80],
                  extrapolate: 'clamp',
                }),
              }],
            },
          ]}
          blurRadius={0}
          resizeMode="cover"
        />
      ) : (
        <View style={[premiumStyles.fullBg, { backgroundColor: '#0a0a0f' }]} />
      )}

      {/* Koyu gradient overlay — içerik okunabilsin */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(8,8,15,0.88)', 'rgba(8,8,15,1)']}
        style={premiumStyles.fullOverlay}
        locations={[0, 0.2, 0.5, 1]}
      />

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Geri butonu */}
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={premiumStyles.backBtn}
        >
          <BlurView intensity={60} tint="dark" style={premiumStyles.backBtnBlur}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        {/* Hero bölümü — backdrop yüksekliği */}
        <View style={premiumStyles.heroSpace} />

        {/* Ana içerik kartı */}
        <View style={premiumStyles.mainCard}>

          {/* Afiş + Temel Bilgiler */}
          <View style={premiumStyles.headerRow}>
            {/* Afiş — gölgeli, köşeli */}
            <View style={premiumStyles.posterShadow}>
              <Image source={{ uri: posterUrl }} style={premiumStyles.poster} resizeMode="cover" />
            </View>

            {/* Sağ bilgi */}
            <View style={premiumStyles.headerInfo}>
              <Text style={premiumStyles.titleText} numberOfLines={3}>{title}</Text>

              {/* Puan */}
              <View style={premiumStyles.ratingRow}>
                <LinearGradient colors={['#FFD700', '#FFA500']} style={premiumStyles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#000" />
                  <Text style={premiumStyles.ratingNum}>{rating}</Text>
                </LinearGradient>
                {year ? <Text style={premiumStyles.metaText}>{year}</Text> : null}
                {runtime ? <Text style={premiumStyles.metaText}>{runtime}</Text> : null}
              </View>

              {/* Tür */}
              {genres ? <Text style={premiumStyles.genreText} numberOfLines={2}>{genres}</Text> : null}

              {/* Fragman butonu */}
              {trailerKey && (
                <TouchableOpacity
                  onPress={handleWatchTrailer}
                  style={premiumStyles.trailerBtn}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={trailerUnlocked
                      ? ['#E61806', '#9B1404']
                      : ['rgba(40,20,10,0.95)', 'rgba(30,15,8,0.98)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={premiumStyles.trailerBtnGrad}
                  >
                    {trailerUnlocked ? (
                      <>
                        <Ionicons name="play-circle" size={16} color="#fff" />
                        <Text style={premiumStyles.trailerBtnText}>Fragman</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={14} color="#FFD700" />
                        <Text style={premiumStyles.trailerBtnText}>Fragman</Text>
                        <View style={premiumStyles.trailerAdBadge}>
                          <Ionicons name="play" size={9} color="#fff" />
                          <Text style={premiumStyles.trailerAdBadgeText}>Reklam izle</Text>
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Watchlist / Favorite / Watched butonları */}
          <View style={premiumStyles.actionsRow}>
            {[
              { anim: watchlistAnim, active: inWatchlist, icon: inWatchlist ? 'bookmark' : 'bookmark-outline', label: 'Liste', onPress: handleAddToWatchlist, color: '#F97316' },
              { anim: favoritesAnim, active: inFavorites, icon: inFavorites ? 'heart' : 'heart-outline', label: 'Favori', onPress: handleAddToFavorites, color: '#E11D48' },
              { anim: watchedAnim, active: inWatched, icon: inWatched ? 'checkmark-circle' : 'checkmark-circle-outline', label: 'İzledim', onPress: handleMarkAsWatched, color: '#10B981' },
            ].map((btn, i) => (
              <Animated.View key={i} style={[premiumStyles.actionWrap, { transform: [{ scale: btn.anim }] }]}>
                <TouchableOpacity
                  onPress={btn.onPress}
                  style={[premiumStyles.actionBtn, btn.active && { backgroundColor: btn.color + '22', borderColor: btn.color }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={btn.icon as any} size={22} color={btn.active ? btn.color : 'rgba(255,255,255,0.6)'} />
                  <Text style={[premiumStyles.actionLabel, btn.active && { color: btn.color }]}>{btn.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Konu */}
          {movie?.overview ? (
            <View style={premiumStyles.section}>
              <Text style={premiumStyles.sectionTitle}>Konu</Text>
              <Text style={premiumStyles.overviewText}>{movie.overview}</Text>
            </View>
          ) : null}

          {/* İzlenecek Platformlar — Premium */}
          {watchProviders && watchProviders.length > 0 && (
            <View style={premiumStyles.section}>
              <Text style={premiumStyles.sectionTitle}>İzlenebileceği Platformlar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {watchProviders.map((provider: any) => (
                  <TouchableOpacity
                    key={provider?.provider_id}
                    onPress={() => handleOpenProvider(provider)}
                    activeOpacity={0.85}
                    style={premiumStyles.providerCard}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                      style={premiumStyles.providerCardGrad}
                    >
                      <Image
                        source={{ uri: `https://image.tmdb.org/t/p/original${provider?.logo_path}` }}
                        style={premiumStyles.providerLogo}
                        resizeMode="contain"
                      />
                      <Text style={premiumStyles.providerName} numberOfLines={1}>
                        {provider?.provider_name?.split(' ')?.[0]}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Oyuncu Kadrosu — 3D Perspektif */}
          {cast && cast.length > 0 && (
            <View style={premiumStyles.section}>
              <Text style={premiumStyles.sectionTitle}>Oyuncu Kadrosu</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {cast.map((member, idx) => {
                  const tilt = (idx % 3 - 1) * 2;
                  return (
                    <TouchableOpacity
                      key={member?.id}
                      style={[
                        premiumStyles.castCard,
                        { transform: [{ rotateZ: `${tilt}deg` }, { perspective: 800 }] },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('PersonDetail', {
                        personId: member?.id,
                        personName: member?.name,
                        personPhoto: member?.profile_path
                          ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                          : undefined,
                      })}
                    >
                      {member?.profile_path ? (
                        <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w185${member.profile_path}` }}
                          style={premiumStyles.castPhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[premiumStyles.castPhoto, { backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="person" size={28} color="#444" />
                        </View>
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        style={premiumStyles.castGrad}
                      />
                      <View style={premiumStyles.castInfo}>
                        <Text style={premiumStyles.castName} numberOfLines={1}>{member?.name}</Text>
                        <Text style={premiumStyles.castChar} numberOfLines={1}>{member?.character}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Benzer Filmler */}
            <View style={premiumStyles.section}>
              <Text style={premiumStyles.sectionTitle}>Benzer İçerikler</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {similar.map((item) => (
                  <MovieCard
                    key={item?.id}
                    movie={item}
                    onPress={async () => {
                      if (item?.id) {
                        await showAd();
                        navigation?.push?.('Detail', { id: item.id, type });
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 80 }} />
        </View>
      </Animated.ScrollView>

      {/* YouTube Trailer Modal */}
      <Modal
        visible={trailerModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTrailerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fragman</Text>
              <TouchableOpacity
                onPress={() => setTrailerModalVisible(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            {trailerKey && (
              <View style={styles.videoContainer}>
                <YoutubePlayer
                  height={220}
                  videoId={trailerKey}
                  play={true}
                  initialPlayerParams={{
                    controls: true,
                    modestbranding: true,
                    preventFullScreen: false,
                  }}
                  webViewStyle={styles.youtubeWebView}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Banner Reklam - Detay sayfasının altında */}
      <BannerAd position="bottom" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  backdropContainer: {
    height: 250,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.round,
    padding: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: -80,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundCard,
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'flex-end',
  },
  title: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  metadataText: {
    ...typography.bodySmall,
    color: colors.grayLight,
  },
  genres: {
    ...typography.bodySmall,
    color: colors.gray,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minWidth: 90,
  },
  actionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.glass,
  },
  actionText: {
    ...typography.caption,
    color: colors.white,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trailerText: {
    fontSize: 14,
    color: '#E61806',
    fontWeight: '600',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  providersContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  providersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  providersScroll: {
    flexDirection: 'row',
  },
  providerLogo: {
    width: 70,
    height: 70,
    marginRight: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  providerGradient: {
    width: '100%',
    height: '100%',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerImage: {
    width: '100%',
    height: '100%',
  },
  overview: {
    ...typography.body,
    color: colors.grayLight,
    lineHeight: 24,
  },
  footer: {
    height: spacing.xl,
  },
  // YouTube Trailer Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    backgroundColor: colors.black,
  },
  youtubeWebView: {
    backgroundColor: colors.black,
  },
});

export default DetailScreen;

// ---- Premium Detail Stilleri ----
const { width: SW, height: SH } = Dimensions.get('window');

const premiumStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080f',
  },
  // Tam ekran arka plan
  fullBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: SH * 0.65,
    width: '100%',
  },
  fullOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  // Geri butonu
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backBtnBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hero boşluk — backdrop göstersin diye
  heroSpace: {
    height: SH * 0.38,
  },
  // Ana içerik kartı
  mainCard: {
    backgroundColor: 'rgba(8,8,15,0.7)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: SH * 0.7,
  },
  // Afiş + bilgi satırı
  headerRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: -70,
    marginBottom: 20,
  },
  posterShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 20,
    borderRadius: 14,
  },
  poster: {
    width: 120,
    height: 178,
    borderRadius: 14,
  },
  headerInfo: {
    flex: 1,
    paddingTop: 70,
    gap: 8,
  },
  titleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingNum: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
  metaText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  genreText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '500',
  },
  trailerBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  trailerBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  trailerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  trailerAdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  trailerAdBadgeText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
  },
  // Aksiyon butonları
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionWrap: {
    flex: 1,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 5,
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
  },
  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  overviewText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  // Platform logoları — premium
  providerCard: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  providerCardGrad: {
    width: 90,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 8,
  },
  providerLogo: {
    width: 60,
    height: 36,
  },
  providerName: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  // 3D Oyuncu kartları
  castCard: {
    width: 90,
    height: 130,
    marginRight: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  castPhoto: {
    width: '100%',
    height: '100%',
  },
  castGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  castInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 7,
  },
  castName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  castChar: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
});