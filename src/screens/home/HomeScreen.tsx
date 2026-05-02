import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  StatusBar,
  Platform,
  Modal,
  Animated,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HomeStackParamList, MainTabParamList, Movie } from '../../types';
import { recommendationsApi } from '../../api/recommendations';
import { tmdbApi } from '../../api/tmdb';
import { userApi } from '../../api/user';

import { MovieCard, ShimmerCard } from '../../components';
import { useInterstitialAd } from '../../hooks/useInterstitialAd';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import FishCoinIcon from '../../components/icons/FishCoinIcon';
import TheaterIcon from '../../components/icons/TheaterIcon';
import { TabuIcon } from '../../components/icons/TabuIcon';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { getAllLocks, unlockActivity, ActivityKey } from '../../services/activityLockService';
import { tr } from '../../locales/tr';
import { useAuth } from '../../contexts/AuthContext';
import { filterLatinMovies } from '../../utils/textFilters';
const DebugScreen = __DEV__ ? require('../DebugScreen').DebugScreen : null;

type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'HomeScreen'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { showAd, showAdNow } = useInterstitialAd();
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [turkishContent, setTurkishContent] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [netflixMovies, setNetflixMovies] = useState<Movie[]>([]);
  const [netflixTV, setNetflixTV] = useState<Movie[]>([]);
  const [primeMovies, setPrimeMovies] = useState<Movie[]>([]);
  const [primeTV, setPrimeTV] = useState<Movie[]>([]);
  const [disneyMovies, setDisneyMovies] = useState<Movie[]>([]);
  const [disneyTV, setDisneyTV] = useState<Movie[]>([]);
  const [hboMovies, setHboMovies] = useState<Movie[]>([]);
  const [hboTV, setHboTV] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [locks, setLocks] = useState<Record<ActivityKey, boolean>>({
    ifi: false, ifishing: false, tabu: false, silentcinema: false,
  });
  const { showRewardedAd } = useRewardedAd();
  const unlockAnim = useRef(new Animated.Value(0)).current;
  const unlockScale = useRef(new Animated.Value(0.8)).current;
  const pullProgress = useRef(new Animated.Value(0)).current;
  const isPulling = useRef(false);
  const pullStartY = useRef(0);
  const PULL_THRESHOLD = 80;
  const headerScrollY = useRef(new Animated.Value(0)).current;
  const [fishCoins, setFishCoins] = useState(0);
  const [showDebugScreen, setShowDebugScreen] = useState(false);
  const dataLoadedRef = React.useRef(false);
  const refreshLocks = useCallback(async () => {
    const current = await getAllLocks();
    setLocks(current);
  }, []);
  useFocusEffect(
    useCallback(() => {
      refreshLocks();
      userApi.getWatchlist().then((res) => {
        const watchlistMovies = (res ?? []).map((item: any) => ({
          id: item?.movieId,
          title: item?.title,
          name: item?.title,
          poster_path: item?.posterPath,
          vote_average: item?.voteAverage ?? item?.rating ?? 0,
          media_type: item?.type ?? 'movie',
        }));
        setWatchlist(watchlistMovies);
      }).catch(() => {});

      if (dataLoadedRef.current) return;
      loadData();
    }, [refreshLocks])
  );

  const loadData = async (forceRefreshTrailers = false) => {
    try {
      const CACHE_VERSION = 'v6_prime_filtered_3pages';
      const CACHE_KEY = `home_recommendations_cache_${CACHE_VERSION}`;
      const CACHE_DURATION = 10 * 60 * 1000;
      const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);

      if (cachedRaw && !forceRefreshTrailers) {
        try {
          const cached = JSON.parse(cachedRaw);
          const cacheAge = Date.now() - (cached._ts ?? 0);

          if (cacheAge < CACHE_DURATION) {
            const cachedRecs = (cached.recommendations ?? []).slice(0, 15);
            if (cachedRecs.length > 0) {
              setRecommendations(cachedRecs);
            }
            setWatchlist(cached.watchlist ?? []);
            setPopularMovies(cached.popularMovies ?? []);
            setPopularTV(cached.popularTV ?? []);
            setTurkishContent(cached.turkishContent ?? []);
            setNowPlaying(cached.nowPlaying ?? []);
            setNetflixMovies(cached.netflixMovies ?? []);
            setNetflixTV(cached.netflixTV ?? []);
            setPrimeMovies(cached.primeMovies ?? []);
            setPrimeTV(cached.primeTV ?? []);
            setDisneyMovies(cached.disneyMovies ?? []);
            setDisneyTV(cached.disneyTV ?? []);
            setHboMovies(cached.hboMovies ?? []);
            setHboTV(cached.hboTV ?? []);
            setLoading(false);
            setRefreshing(false);
            dataLoadedRef.current = true;
            return;
          }
        } catch {
        }
      }
      const randomMoviesPage = Math.floor(Math.random() * 5) + 1;
      const randomTVPage = Math.floor(Math.random() * 5) + 1;
      const randomNowPlayingPage = Math.floor(Math.random() * 3) + 1;
      const randomNetflixPage = Math.floor(Math.random() * 5) + 1;
      const randomPrimePage = Math.floor(Math.random() * 3) + 1;
      const randomDisneyPage = Math.floor(Math.random() * 5) + 1;
      const randomHboPage = Math.floor(Math.random() * 5) + 1;
      const [watchlistRes, moviesRes, tvRes, currentMood] = await Promise.all([
        userApi.getWatchlist().catch(() => []),
        tmdbApi.getPopularMovies(randomMoviesPage).catch(() => ({ results: [] })),
        tmdbApi.getPopularTV(randomTVPage).catch(() => ({ results: [] })),
        userApi.getCurrentMood().catch(() => null),
      ]);
      let earlyRecs: any[] = [];
      if (currentMood) {
        try {
          earlyRecs = await recommendationsApi.getRecommendations(
            currentMood?.mood,
            currentMood?.contentType === 'either' ? '' : currentMood?.contentType,
            currentMood?.genre
          );
        } catch {}
      }
      const watchlistMovies = (watchlistRes ?? []).map((item: any) => ({
        id: item?.movieId,
        title: item?.title,
        name: item?.title,
        poster_path: item?.posterPath,
        vote_average: item?.voteAverage ?? item?.rating ?? 0,
        media_type: item?.type ?? 'movie',
      }));
      setWatchlist(watchlistMovies);
      setPopularMovies(filterLatinMovies(moviesRes?.results ?? []));
      setPopularTV(filterLatinMovies(tvRes?.results ?? []));
      if (earlyRecs.length > 0) {
        setRecommendations(filterLatinMovies(earlyRecs).slice(0, 15));
      }
      setLoading(false);
      const [recsRes, turkishRes, nowPlayingRes, netflixRes, netflixTVRes, primeRes1, primeRes2, primeRes3, primeTVRes1, primeTVRes2, primeTVRes3, disneyRes, disneyTVRes, hboRes, hboTVRes] = await Promise.all([
        Promise.resolve(earlyRecs),
        tmdbApi.getTurkishContent(1).catch(() => ({ results: [] })),
        tmdbApi.getNowPlayingMovies(randomNowPlayingPage).catch(() => ({ results: [] })),
        tmdbApi.getNetflixContent(randomNetflixPage).catch(() => ({ results: [] })),
        tmdbApi.getNetflixTVShows(randomNetflixPage).catch(() => ({ results: [] })),
        tmdbApi.getPrimeVideoContent(randomPrimePage).catch(() => ({ results: [] })),
        tmdbApi.getPrimeVideoContent(randomPrimePage + 1).catch(() => ({ results: [] })),
        tmdbApi.getPrimeVideoContent(randomPrimePage + 2).catch(() => ({ results: [] })),
        tmdbApi.getPrimeTVShows(randomPrimePage).catch(() => ({ results: [] })),
        tmdbApi.getPrimeTVShows(randomPrimePage + 1).catch(() => ({ results: [] })),
        tmdbApi.getPrimeTVShows(randomPrimePage + 2).catch(() => ({ results: [] })),
        tmdbApi.getDisneyPlusContent(randomDisneyPage).catch(() => ({ results: [] })),
        tmdbApi.getDisneyTVShows(randomDisneyPage).catch(() => ({ results: [] })),
        tmdbApi.getByProvider(384, 'movie', randomHboPage).catch(() => ({ results: [] })),
        tmdbApi.getByProvider(384, 'tv', randomHboPage).catch(() => ({ results: [] })),
      ]);
      setRecommendations(filterLatinMovies(recsRes ?? []).slice(0, 15));
      setTurkishContent(turkishRes?.results ?? []);
      setNowPlaying(filterLatinMovies(nowPlayingRes?.results ?? []));
      setNetflixMovies(filterLatinMovies(netflixRes?.results ?? []));
      setNetflixTV(filterLatinMovies(netflixTVRes?.results ?? []));
      const allPrimeMovies = [
        ...(primeRes1?.results ?? []),
        ...(primeRes2?.results ?? []),
        ...(primeRes3?.results ?? []),
      ];
      const allPrimeTV = [
        ...(primeTVRes1?.results ?? []),
        ...(primeTVRes2?.results ?? []),
        ...(primeTVRes3?.results ?? []),
      ];
      setPrimeMovies(filterLatinMovies(allPrimeMovies).slice(0, 20));
      setPrimeTV(filterLatinMovies(allPrimeTV).slice(0, 20));
      
      setDisneyMovies(filterLatinMovies(disneyRes?.results ?? []));
      setDisneyTV(filterLatinMovies(disneyTVRes?.results ?? []));
      setHboMovies(filterLatinMovies(hboRes?.results ?? []));
      setHboTV(filterLatinMovies(hboTVRes?.results ?? []));
      const cacheData = {
        _ts: Date.now(),
        recommendations: filterLatinMovies(recsRes ?? []).slice(0, 15),
        watchlist: watchlistMovies,
        popularMovies: filterLatinMovies(moviesRes?.results ?? []),
        popularTV: filterLatinMovies(tvRes?.results ?? []),
        turkishContent: turkishRes?.results ?? [],
        nowPlaying: filterLatinMovies(nowPlayingRes?.results ?? []),
        netflixMovies: filterLatinMovies(netflixRes?.results ?? []),
        netflixTV: filterLatinMovies(netflixTVRes?.results ?? []),
        primeMovies: filterLatinMovies(allPrimeMovies).slice(0, 20),
        primeTV: filterLatinMovies(allPrimeTV).slice(0, 20),
        disneyMovies: filterLatinMovies(disneyRes?.results ?? []),
        disneyTV: filterLatinMovies(disneyTVRes?.results ?? []),
        hboMovies: filterLatinMovies(hboRes?.results ?? []),
        hboTV: filterLatinMovies(hboTVRes?.results ?? []),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      dataLoadedRef.current = true;
    } catch (error) {
      if (__DEV__) console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      pullProgress.setValue(0);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    dataLoadedRef.current = false;
    const CACHE_KEY = 'home_recommendations_cache_v6_prime_filtered_3pages';
    await AsyncStorage.removeItem(CACHE_KEY);
    loadData(true);
    Animated.timing(pullProgress, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  };

  const handleMoviePress = useCallback(async (id?: number, type: 'movie' | 'tv' = 'movie') => {
    if (id) {
      await showAd();
      navigation?.navigate?.('Detail', { id, type });
    }
  }, [showAd, navigation]);

  const handleIFiPress = useCallback(() => {
    navigation?.navigate?.('Chat');
  }, [navigation]);
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!text?.trim()) { setSearchResults([]); setSearchVisible(false); return; }
    setSearchVisible(true);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await tmdbApi.search(text.trim());
        setSearchResults(res?.results ?? []);
      } catch {}
      finally { setSearchLoading(false); }
    }, 400);
  };

  const handleSearchItemPress = (item: any) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchVisible(false);
    if (item?.media_type === 'person') {
      navigation?.navigate?.('PersonDetail', {
        personId: item.id,
        personName: item.name,
        personPhoto: item.profile_path
          ? `https:
          : undefined,
      });
    } else {
      const type = item?.media_type === 'tv' ? 'tv' : 'movie';
      navigation?.navigate?.('Detail', { id: item.id, type });
    }
  };

  const handleUnlockAndNavigate = useCallback((key: ActivityKey, navigateFn: () => void) => {
    showRewardedAd(async () => {
      await unlockActivity(key);
      setLocks(prev => ({ ...prev, [key]: false }));
      navigateFn();
    });
  }, [showRewardedAd]);
  const renderLockedRecommendations = useCallback(() => {
    if (loading) return null;
    const fakePosterColors = [
      '#1a1a2e', '#16213e', '#0f3460', '#533483',
      '#2d132c', '#1b1b2f', '#252525', '#1a1a1a',
    ];

    return (
      <View style={styles.section}>
        
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{tr.home.basedOnMood}</Text>
          <TouchableOpacity
            style={styles.iFishingBadge}
            onPress={() => navigation?.navigate?.('MoodSelection')}
            activeOpacity={0.8}
          >
            <Text style={styles.fishIcon}></Text>
            <Text style={styles.iFishingText}>iFishing</Text>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => navigation?.navigate?.('MoodSelection')}
          style={styles.lockedContainer}
        >
          
          <ScrollView
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={styles.list}
          >
            {fakePosterColors.map((color, i) => (
              <View
                key={i}
                style={[styles.lockedFakePoster, { backgroundColor: color }]}
              />
            ))}
          </ScrollView>

          
          <BlurView
            intensity={55}
            tint="dark"
            style={styles.lockedBlur}
          />

          
          <View style={styles.lockedContent}>
            
            <View style={styles.lockedIconWrapper}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                style={styles.lockedIconGradient}
              >
                <Ionicons name="lock-closed" size={28} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.lockedTitle}>Sana Özel Filmler Kilitli</Text>
            <Text style={styles.lockedSubtitle}>
              iFishing yaparak ruh haline göre{'\n'}kişisel film önerilerini aç
            </Text>

            
            <LinearGradient
              colors={['#9D4EDD', '#7B2FBE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.lockedButton}
            >
              <Text style={styles.fishIcon}></Text>
              <Text style={styles.lockedButtonText}>iFishing'e Başla</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [loading, navigation]);

  const renderSection = useCallback((title: string, items: Movie[], type?: 'movie' | 'tv', logo?: any, showiFishingBadge?: boolean, logoStyle?: any) => {
    if (loading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            {logo && <Image source={logo} style={[styles.sectionLogo, logoStyle]} resizeMode="contain" />}
            <Text style={styles.sectionTitle}>{title}</Text>
            {showiFishingBadge && (
              <TouchableOpacity 
                style={styles.iFishingBadge}
                onPress={() => navigation?.navigate?.('MoodSelection')}
                activeOpacity={0.8}
              >
                <Text style={styles.fishIcon}></Text>
                <Text style={styles.iFishingText}>iFishing</Text>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list} removeClippedSubviews={true}>
            {[1, 2, 3, 4].map((i) => (
              <ShimmerCard key={i} />
            ))}
          </ScrollView>
        </View>
      );
    }

    if (!items || items.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          {logo && <Image source={logo} style={[styles.sectionLogo, logoStyle]} resizeMode="contain" />}
          <Text style={styles.sectionTitle}>{title}</Text>
          {showiFishingBadge && (
            <TouchableOpacity 
              style={styles.iFishingBadge}
              onPress={() => navigation?.navigate?.('MoodSelection')}
              activeOpacity={0.8}
            >
              <Text style={styles.fishIcon}></Text>
              <Text style={styles.iFishingText}>iFishing</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list} removeClippedSubviews={true}>
          {items.map((item) => {
            const itemType = type ?? (item?.title ? 'movie' : 'tv');
            return (
              <MovieCard
                key={item?.id}
                movie={item}
                onPress={() => handleMoviePress(item?.id, itemType)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  }, [loading, handleMoviePress, navigation]);

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000"
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        
        <Animated.View style={[
          styles.header,
          {
            backgroundColor: headerScrollY.interpolate({
              inputRange: [0, 60],
              outputRange: ['transparent', 'rgba(10,10,15,0.92)'],
              extrapolate: 'clamp',
            }),
          }
        ]}>
          
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={40}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
          )}

          
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/ifilmlik-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <MaskedView
              maskElement={
                <Text style={styles.logoText}>iFilmlik</Text>
              }
            >
              <LinearGradient
                colors={['#E61806', '#8f0083']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientTextMask}
              />
            </MaskedView>
          </View>

          
          <View style={styles.headerRight}>
            {__DEV__ && (
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => setShowDebugScreen(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="bug" size={20} color="#FFD700" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.profileContainer}
              onPress={() => navigation?.navigate?.('ProfileScreen')}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.greetingText}>Merhaba </Text>
                <Text style={styles.username}>{user?.username ?? 'Kullanıcı'}</Text>
              </View>
              
              <LinearGradient
                colors={['#E61806', '#8f0083']}
                style={styles.avatarCircle}
              >
                <Text style={styles.avatarLetter}>
                  {(user?.username ?? 'U')[0].toUpperCase()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        
        {!refreshing && (
          <Animated.View
            style={{
              height: 3,
              zIndex: 998,
              opacity: pullProgress,
              backgroundColor: 'transparent',
            }}
            pointerEvents="none"
          >
            <Animated.View
              style={{
                height: 3,
                backgroundColor: colors.primary,
                width: pullProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                borderRadius: 2,
              }}
            />
          </Animated.View>
        )}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          headerScrollY.setValue(Math.max(0, y));
          if (y <= 0 && !refreshing) {
            const pull = Math.min(Math.abs(y) / PULL_THRESHOLD, 1);
            pullProgress.setValue(pull);
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="transparent"
            colors={['transparent']}
            style={{ backgroundColor: 'transparent' }}
          />
        }
      >
        <View style={styles.moodContainer}>
          
          <View style={styles.topRow}>
            
            <View style={styles.homeSearchWrapper}>
              <View style={styles.homeSearchBar}>
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.45)" />
                <TextInput
                  style={styles.homeSearchInput}
                  placeholder="Film, dizi, oyuncu ara..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setSearchVisible(false); }}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>

              
              {searchVisible && (
                <View style={styles.homeSearchDropdown}>
                  {searchLoading ? (
                    <View style={styles.homeSearchLoadingRow}>
                      <Ionicons name="hourglass-outline" size={16} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.homeSearchLoadingText}>Aranıyor...</Text>
                    </View>
                  ) : searchResults.length === 0 ? (
                    <View style={styles.homeSearchLoadingRow}>
                      <Ionicons name="film-outline" size={16} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.homeSearchLoadingText}>Sonuç bulunamadı</Text>
                    </View>
                  ) : (
                    searchResults.slice(0, 6).map((item: any) => {
                      const isPerson = item?.media_type === 'person';
                      const title = item?.title || item?.name || '';
                      const posterPath = isPerson ? item?.profile_path : item?.poster_path;
                      const sub = isPerson
                        ? (item?.known_for_department === 'Acting' ? 'Oyuncu' : item?.known_for_department || 'Kişi')
                        : (item?.media_type === 'tv' ? 'Dizi' : 'Film');
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.homeSearchResultRow}
                          onPress={() => handleSearchItemPress(item)}
                          activeOpacity={0.75}
                        >
                          {posterPath ? (
                            <Image
                              source={{ uri: `https:
                              style={[
                                styles.homeSearchThumb,
                                isPerson && styles.homeSearchThumbPerson,
                              ]}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.homeSearchThumb, styles.homeSearchThumbEmpty, isPerson && styles.homeSearchThumbPerson]}>
                              <Ionicons name={isPerson ? "person" : "film-outline"} size={16} color="rgba(255,255,255,0.3)" />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.homeSearchResultTitle} numberOfLines={1}>{title}</Text>
                            <Text style={styles.homeSearchResultSub}>{sub}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            
            <TouchableOpacity
              style={styles.chatButtonContainer}
              onPress={locks.ifi
                ? () => handleUnlockAndNavigate('ifi', () => navigation?.navigate?.('Chat'))
                : handleIFiPress
              }
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={locks.ifi
                  ? ['rgba(40,20,60,0.95)', 'rgba(30,15,45,0.98)']
                  : ['rgba(60,0,120,0.85)', 'rgba(100,0,180,0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chatButton}
              >
                
                <View style={styles.glassOverlay} />
                {locks.ifi ? (
                  <View style={styles.lockedBtnContent}>
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={13} color="#FFD700" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lockedBtnTitle}>Asistan iFi</Text>
                      <Text style={styles.lockedBtnSubtitle}>Reklam izle, kilidi aç</Text>
                    </View>
                    <Ionicons name="play-circle-outline" size={22} color="rgba(255,215,0,0.6)" />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Ionicons name="sparkles" size={22} color="#FFD700" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chatButtonText}>Asistan iFi</Text>
                      <Text style={[styles.chatButtonSub, { color: 'rgba(255,255,255,0.80)' }]}>Film & Dizi Asistanın</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>


          </View>


        </View>

        

        
        {recommendations && recommendations.length > 0
          ? renderSection(tr.home.basedOnMood, recommendations, undefined, undefined, true)
          : renderLockedRecommendations()
        }
        
        
        {watchlist && watchlist.length > 0 && renderSection(' İzleme Listem', watchlist)}
        
        
        {turkishContent && turkishContent.length > 0 && renderSection(' Türk Yapımları', turkishContent, 'movie')}
        
        
        {renderSection(' Popüler Filmler', popularMovies, 'movie')}
        
        
        {renderSection(' Popüler Diziler', popularTV, 'tv')}
        
        
        {netflixMovies && netflixMovies.length > 0 && renderSection('| Popüler Filmler', netflixMovies, 'movie', require('../../../assets/netflix-logo.png'))}
        {netflixTV && netflixTV.length > 0 && renderSection('| Popüler Diziler', netflixTV, 'tv', require('../../../assets/netflix-logo.png'))}
        
        
        {primeMovies && primeMovies.length > 0 && renderSection('| Popüler Filmler', primeMovies, 'movie', require('../../../assets/prime-logo.png'))}
        {primeTV && primeTV.length > 0 && renderSection('| Popüler Diziler', primeTV, 'tv', require('../../../assets/prime-logo.png'))}
        
        
        {disneyMovies && disneyMovies.length > 0 && renderSection('| Popüler Filmler', disneyMovies, 'movie', require('../../../assets/disney-logo.png'))}
        {disneyTV && disneyTV.length > 0 && renderSection('| Popüler Diziler', disneyTV, 'tv', require('../../../assets/disney-logo.png'))}
        {hboMovies && hboMovies.length > 0 && renderSection('| Popüler Filmler', hboMovies, 'movie', require('../../../assets/hbo-logo.png'))}
        {hboTV && hboTV.length > 0 && renderSection('| Popüler Diziler', hboTV, 'tv', require('../../../assets/hbo-logo.png'))}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>

    
    <Modal
      visible={showDebugScreen}
      animationType="slide"
      onRequestClose={() => setShowDebugScreen(false)}
    >
      <DebugScreen onClose={() => setShowDebugScreen(false)} />
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    zIndex: 100,
    overflow: 'hidden',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  logoText: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
    fontSize: 26,
    backgroundColor: 'transparent',
  },
  gradientTextMask: {
    height: 32,
    width: 95,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  debugButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greetingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    textAlign: 'right',
  },
  username: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'right',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E61806',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  scrollView: {
    flex: 1,
  },
  moodContainer: {
    flexDirection: 'column',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 24,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonContainer: {
    width: 165,
    height: 67,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#7a00cc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  chatButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chatButtonSub: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  fishButtonContainer: {
    width: 165,
    height: 67,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#E61806',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  fishButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  silentCinemaButtonContainer: {
    width: 165,
    height: 67,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#E61806',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  silentCinemaButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabuButtonContainer: {
    width: 165,
    height: 67,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  tabuButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  buttonImage: {
    width: 165,
    height: 67,
  },
  iconImage: {
    width: 64,
    height: 64,
  },
  iconImageSmall: {
    width: 40,
    height: 40,
  },
  iconImageMedium: {
    width: 44,
    height: 44,
  },
  emojiIcon: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  buttonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  section: {
    marginBottom: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionLogo: {
    width: 100,
    height: 30,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
  },
  iFishingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    gap: 4,
  },
  fishIcon: {
    fontSize: 16,
  },
  iFishingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  homeSearchWrapper: {
    marginHorizontal: spacing.md,
    marginBottom: 10,
    zIndex: 100,
  },
  homeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  homeSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    padding: 0,
  },
  homeSearchDropdown: {
    backgroundColor: 'rgba(18,12,30,0.98)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
  },
  homeSearchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  homeSearchLoadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  homeSearchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  homeSearchThumb: {
    width: 38,
    height: 54,
    borderRadius: 6,
    backgroundColor: '#1e1030',
  },
  homeSearchThumbPerson: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  homeSearchThumbEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeSearchResultTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  homeSearchResultSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  aiBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  aiBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pillButtonContainer: {
    flex: 1,
  },
  pillButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  pillEmoji: {
    fontSize: 22,
  },
  pillLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionAccentLine: {
    width: 3,
    height: 18,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 6,
  },
  lockBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBtnTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '700',
  },
  lockedBtnSubtitle: {
    color: 'rgba(255,215,0,0.5)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  pillLockedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  pillLockedLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  pillLockedSub: {
    color: 'rgba(255,215,0,0.45)',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  lockedBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lockIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  playIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lockedContainer: {
    height: 200,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  lockedFakePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 10,
    marginTop: 10,
    opacity: 0.6,
  },
  lockedBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lockedContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  lockedIconWrapper: {
    marginBottom: 4,
  },
  lockedIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  lockedTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  lockedSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  lockedButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    paddingLeft: spacing.md,
  },
  footer: {
    height: spacing.xl,
  },
});

export default HomeScreen;