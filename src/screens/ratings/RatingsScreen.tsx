import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ratingsApi } from '../../api/ratings';
import { scaleW, scaleH, scaledFont, SCREEN_WIDTH } from '../../utils/responsive';
import { colors, spacing, borderRadius } from '../../theme';
import { RatingsStackParamList } from '../../types';

type RatingsScreenNavigationProp = StackNavigationProp<RatingsStackParamList, 'RatingsMain'>;

interface Props {
  navigation: RatingsScreenNavigationProp;
}

type ContentType = 'movie' | 'tv' | 'oscar';
type OriginType = 'turkish' | 'foreign' | 'netflix' | 'prime' | 'disney';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  overview?: string;
}

// --- 3D Film Modal (MyList'teki DVDModal ile aynı mantık) ---
const FilmModal3D: React.FC<{
  item: Movie | null;
  visible: boolean;
  onClose: () => void;
  onNavigate: (id: number, type: string) => void;
}> = ({ item, visible, onClose, onNavigate }) => {
  const rotateY = useRef(new Animated.Value(0)).current;
  const rotateX = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const lastX = useRef(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        rotateY.setValue(Math.max(-65, Math.min(65, lastY.current + g.dx * 0.4)));
        rotateX.setValue(Math.max(-30, Math.min(30, lastX.current - g.dy * 0.4)));
      },
      onPanResponderRelease: (_, g) => {
        const newY = Math.max(-65, Math.min(65, lastY.current + g.dx * 0.4));
        const newX = Math.max(-30, Math.min(30, lastX.current - g.dy * 0.4));
        if (Math.abs(newY) >= 60) {
          setIsFlipped(f => !f);
          lastY.current = 0; lastX.current = 0;
          Animated.spring(rotateY, { toValue: 0, useNativeDriver: true }).start();
          Animated.spring(rotateX, { toValue: 0, useNativeDriver: true }).start();
        } else {
          lastY.current = newY; lastX.current = newX;
          Animated.spring(rotateY, { toValue: 0, useNativeDriver: true, tension: 40, friction: 6 }).start();
          Animated.spring(rotateX, { toValue: 0, useNativeDriver: true, tension: 40, friction: 6 }).start();
          lastY.current = 0; lastX.current = 0;
        }
      },
    })
  ).current;

  const rotYInterp = rotateY.interpolate({ inputRange: [-65, 65], outputRange: ['-65deg', '65deg'] });
  const rotXInterp = rotateX.interpolate({ inputRange: [-30, 30], outputRange: ['30deg', '-30deg'] });

  const posterUrl = item?.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  const title = item?.title || item?.name || '';
  const rating = item?.vote_average || 0;
  const year = (item?.release_date || item?.first_air_date || '')?.split('-')?.[0] || '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={modal3DStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={modal3DStyles.container}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[modal3DStyles.card, {
              transform: [
                { perspective: 900 },
                { rotateY: rotYInterp },
                { rotateX: rotXInterp },
              ],
            }]}
          >
            {!isFlipped ? (
              <View style={{ flex: 1 }}>
                {posterUrl ? (
                  <Image source={{ uri: posterUrl }} style={modal3DStyles.poster} resizeMode="cover" />
                ) : (
                  <View style={[modal3DStyles.poster, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="film" size={60} color="#444" />
                  </View>
                )}
                <LinearGradient colors={['#FFD700', '#FFA500']} style={modal3DStyles.spine} />
                <View style={modal3DStyles.ratingBadge}>
                  <Ionicons name="star" size={11} color="#FFD700" />
                  <Text style={modal3DStyles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
                <View style={modal3DStyles.hint}>
                  <Ionicons name="sync-outline" size={13} color="rgba(255,255,255,0.55)" />
                  <Text style={modal3DStyles.hintText}>Döndür</Text>
                </View>
              </View>
            ) : (
              <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={{ flex: 1 }}>
                <View style={[modal3DStyles.spine, { backgroundColor: '#FFD700' }]} />
                <View style={modal3DStyles.backContent}>
                  <Ionicons name="trophy" size={30} color="#FFD700" />
                  <Text style={modal3DStyles.backTitle} numberOfLines={3}>{title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={{ color: '#FFD700', fontSize: 15, fontWeight: '800' }}>{rating.toFixed(1)} / 10</Text>
                  </View>
                  {year ? <Text style={{ color: '#888', fontSize: 13 }}>{year}</Text> : null}
                  <View style={[modal3DStyles.hint, { position: 'relative', marginTop: 12 }]}>
                    <Ionicons name="sync-outline" size={13} color="rgba(255,255,255,0.35)" />
                    <Text style={[modal3DStyles.hintText, { color: 'rgba(255,255,255,0.35)' }]}>Geri döndür</Text>
                  </View>
                </View>
              </LinearGradient>
            )}
          </Animated.View>

          <TouchableOpacity
            onPress={() => item?.id && onNavigate(item.id, item.media_type || (item.title ? 'movie' : 'tv'))}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#FFD700', '#FFA500']} style={modal3DStyles.detailBtn}>
              <Ionicons name="play-circle" size={18} color="#000" />
              <Text style={modal3DStyles.detailBtnText}>Detayları Gör</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const RatingsScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<ContentType>('movie');
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('foreign');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const contentScrollRef = useRef<ScrollView>(null); // Filtre değişince en üste scroll
  const [movies, setMovies] = useState<Movie[]>([]);
  const [oscarCategories, setOscarCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchOscar = useCallback(async (year: number, pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      console.log(`🏆 Loading Oscar winners for year ${year}, page ${pageNum}`);

      const response = await ratingsApi.getOscarWinners(year, undefined, pageNum);
      const newMovies = response?.results || [];
      
      if (pageNum === 1) {
        setMovies(newMovies);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
      }

      setHasMore(pageNum < (response?.total_pages || 1));
      setPage(pageNum);

      console.log(`✅ Loaded ${newMovies.length} Oscar winners for ${year}, page ${pageNum}/${response?.total_pages || 1}`);
    } catch (error) {
      console.error('❌ Fetch Oscar error:', error);
      Alert.alert('Hata', 'Oscar ödüllü filmler yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchTopRated = useCallback(async (contentType: ContentType, origin: OriginType, pageNum: number = 1, isRefresh: boolean = false) => {
    if (loading || (!isRefresh && pageNum > 1 && !hasMore)) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      console.log(`🌟 Loading top rated: type=${contentType}, origin=${origin}, page=${pageNum}`);

      const response = await ratingsApi.getTopRated(contentType, pageNum, origin);
      
      const newMovies = response?.results || [];
      
      if (pageNum === 1) {
        setMovies(newMovies);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
      }

      setHasMore(pageNum < (response?.total_pages || 1));
      setPage(pageNum);

      console.log(`✅ Loaded ${newMovies.length} top rated items, page ${pageNum}/${response?.total_pages || 1}`);
    } catch (error) {
      console.error('❌ Fetch top rated error:', error);
      Alert.alert('Hata', 'En iyi puanlı içerikler yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    if (selectedType === 'oscar') {
      fetchOscar(selectedYear, 1);
    } else {
      fetchTopRated(selectedType, selectedOrigin, 1);
    }
  }, [selectedType, selectedOrigin, selectedYear]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    if (selectedType === 'oscar') {
      fetchOscar(selectedYear, 1, true);
    } else {
      fetchTopRated(selectedType, selectedOrigin, 1, true);
    }
  }, [selectedType, selectedOrigin, selectedYear]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTopRated(selectedType, selectedOrigin, page + 1);
    }
  }, [loading, hasMore, selectedType, selectedOrigin, page]);

  const handleMoviePress = (movie: Movie) => {
    const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
    navigation.navigate('Details', {
      id: movie.id,
      type: mediaType as 'movie' | 'tv',
    });
  };

  // Platform konfigürasyonu
  const PLATFORMS = useMemo(() => [
    { key: 'turkish' as OriginType,  label: 'Türk',     emoji: '🇹🇷', color: '#E61806', logo: null,                                           logoW: 0,  logoH: 0 },
    { key: 'foreign' as OriginType,  label: 'Yabancı',  emoji: '🌍', color: '#1E90FF', logo: null,                                           logoW: 0,  logoH: 0 },
    { key: 'netflix' as OriginType,  label: 'Netflix',  emoji: null, color: '#E50914', logo: require('../../../assets/netflix-logo.png'),        logoW: 56, logoH: 22 },
    { key: 'prime' as OriginType,    label: 'Prime',    emoji: null, color: '#00A8E0', logo: require('../../../assets/prime-logo.png'),          logoW: 56, logoH: 22 },
    { key: 'disney' as OriginType,   label: 'Disney+',  emoji: null, color: '#1133B8', logo: require('../../../assets/disney-logo.png'),         logoW: 70, logoH: 28 },
  ], []);

  const renderTypeButton = (type: ContentType, label: string, icon: string) => {
    const isActive = selectedType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[premiumStyles.typeBtn, isActive && premiumStyles.typeBtnActive]}
        onPress={() => { setSelectedType(type); setPage(1); setHasMore(true); contentScrollRef.current?.scrollTo({ y: 0, animated: false }); }}
        activeOpacity={0.8}
      >
        {isActive && (
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text style={[premiumStyles.typeBtnText, isActive && { color: '#000', fontWeight: '800' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPlatformButton = (platform: typeof PLATFORMS[0]) => {
    const isActive = selectedOrigin === platform.key;
    return (
      <TouchableOpacity
        key={platform.key}
        style={[
          premiumStyles.platformBtn,
          isActive && { borderColor: platform.color },
        ]}
        onPress={() => { setSelectedOrigin(platform.key); setPage(1); setHasMore(true); contentScrollRef.current?.scrollTo({ y: 0, animated: false }); }}
        activeOpacity={0.8}
      >
        {isActive && (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: platform.color + '22', borderRadius: 10 }]} />
        )}
        {platform.logo ? (
          <Image
            source={platform.logo}
            style={[
              { width: platform.logoW, height: platform.logoH },
              { tintColor: isActive ? undefined : 'rgba(255,255,255,0.35)' },
            ]}
            resizeMode="contain"
          />
        ) : (
          <>
            <Text style={{ fontSize: 14 }}>{platform.emoji}</Text>
            <Text style={[premiumStyles.platformText, isActive && { color: platform.color, fontWeight: '800' }]}>
              {platform.label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderYearButton = (year: number) => {
    const isActive = selectedYear === year;
    return (
      <TouchableOpacity
        key={year}
        style={[premiumStyles.yearBtn, isActive && { backgroundColor: '#FFD700', borderColor: '#FFD700' }]}
        onPress={() => { setSelectedYear(year); setPage(1); setHasMore(true); contentScrollRef.current?.scrollTo({ y: 0, animated: false }); }}
        activeOpacity={0.8}
      >
        <Text style={[premiumStyles.yearText, isActive && { color: '#000', fontWeight: '800' }]}>
          {year}
        </Text>
      </TouchableOpacity>
    );
  };

  // Masonry layout - farklı yükseklikler
  const getMasonryHeight = (index: number): number => {
    const pattern = [1, 0, 2, 0, 1, 2, 0, 1, 2, 0];
    const size = pattern[index % pattern.length];
    if (size === 0) return SCREEN_WIDTH * 0.72;
    if (size === 1) return SCREEN_WIDTH * 0.58;
    return SCREEN_WIDTH * 0.48;
  };

  const renderMasonryCard = (item: Movie, index: number, colWidth: number) => {
    const title = item?.title || item?.name || 'Bilinmeyen';
    const rating = item?.vote_average || 0;
    const posterUrl = item?.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null;
    const cardHeight = getMasonryHeight(index);

    return (
      <TouchableOpacity
        key={`${item.id}-${index}`}
        activeOpacity={0.88}
        onPress={() => { setSelectedMovie(item); setModalVisible(true); }}
        style={[masonryStyles.card, { width: colWidth, height: cardHeight }]}
      >
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={masonryStyles.poster} resizeMode="cover" />
        ) : (
          <View style={[masonryStyles.poster, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="film" size={32} color="#444" />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']} style={masonryStyles.gradient} />
        <View style={masonryStyles.ratingBadge}>
          <Ionicons name="star" size={10} color="#FFD700" />
          <Text style={masonryStyles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
        <View style={masonryStyles.rankBadge}>
          <Text style={masonryStyles.rankText}>#{index + 1}</Text>
        </View>
        <View style={masonryStyles.titleContainer}>
          <Text style={masonryStyles.title} numberOfLines={2}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMasonryGrid = () => {
    const colWidth = (SCREEN_WIDTH - spacing.md * 2 - spacing.xs) / 2;
    const leftCol: Movie[] = [];
    const rightCol: Movie[] = [];
    movies.forEach((movie, i) => {
      if (i % 2 === 0) leftCol.push(movie);
      else rightCol.push(movie);
    });
    return (
      <View style={masonryStyles.grid}>
        <View style={{ width: colWidth, gap: spacing.xs }}>
          {leftCol.map((item, i) => renderMasonryCard(item, i * 2, colWidth))}
        </View>
        <View style={{ width: colWidth, gap: spacing.xs }}>
          {rightCol.map((item, i) => renderMasonryCard(item, i * 2 + 1, colWidth))}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0D0D0D', '#111118', '#0D0D0D']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Premium Header */}
        <LinearGradient colors={['rgba(255,215,0,0.08)', 'transparent']} style={premiumStyles.header}>
          <View style={premiumStyles.headerLeft}>
            <LinearGradient colors={['#FFD700', '#FFA500']} style={premiumStyles.trophyGrad}>
              <Ionicons name="trophy" size={18} color="#000" />
            </LinearGradient>
            <View>
              <Text style={premiumStyles.headerTitle}>En İyiler</Text>
              <Text style={premiumStyles.headerSubtitle}>TMDB Yüksek Puanlılar</Text>
            </View>
          </View>
          <View style={premiumStyles.headerBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={premiumStyles.headerBadgeText}>Top Rated</Text>
          </View>
        </LinearGradient>

        {/* Altın çizgi */}
        <LinearGradient colors={['transparent', '#FFD700', 'transparent']} start={{x:0,y:0}} end={{x:1,y:0}} style={premiumStyles.divider} />

        {/* Film / Dizi / Oscar tabs */}
        <View style={premiumStyles.typeContainer}>
          {renderTypeButton('movie', 'Film', '🎬')}
          {renderTypeButton('tv', 'Dizi', '📺')}
          {renderTypeButton('oscar', 'Oscar', '🏆')}
        </View>

        {/* Platform filtreleri */}
        {selectedType !== 'oscar' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={premiumStyles.platformContainer}>
            {PLATFORMS.map(p => renderPlatformButton(p))}
          </ScrollView>
        )}

        {/* Oscar yıl filtresi */}
        {selectedType === 'oscar' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={premiumStyles.yearContainer}>
            {[2026, 2025, 2024, 2023, 2022].map(year => renderYearButton(year))}
          </ScrollView>
        )}

        <LinearGradient colors={['transparent', 'rgba(255,215,0,0.15)', 'transparent']} start={{x:0,y:0}} end={{x:1,y:0}} style={premiumStyles.dividerThin} />

        {/* Content */}
        {loading && page === 1 ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : movies.length === 0 ? (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center', paddingVertical:80 }}>
            <Ionicons name="star-outline" size={64} color={colors.grayLight} />
            <Text style={{ fontSize:16, color:colors.grayLight, fontWeight:'600', marginTop:12 }}>Hiçbir içerik bulunamadı</Text>
          </View>
        ) : (
          <ScrollView
            ref={contentScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) handleLoadMore();
            }}
            scrollEventThrottle={400}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFD700" />}
          >
            {renderMasonryGrid()}
            {loading && page > 1 && <ActivityIndicator size="small" color="#FFD700" style={{ paddingVertical: 20 }} />}
          </ScrollView>
        )}
      </SafeAreaView>

      <FilmModal3D
        item={selectedMovie}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onNavigate={(id, type) => { setModalVisible(false); navigation.navigate('Details', { id, type: type as any }); }}
      />
    </LinearGradient>
  );
};

export default RatingsScreen;

// ---- Premium Header & Filter Styles ----
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#FFD700', fontWeight: '600' },
});

const premiumStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trophyGrad: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 8,
  },
  headerTitle: { color: '#fff', fontSize: scaledFont(22), fontWeight: '900', letterSpacing: 0.5 },
  headerSubtitle: { color: 'rgba(255,215,0,0.6)', fontSize: scaledFont(10), fontWeight: '600', letterSpacing: 1.5, marginTop: 2 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  headerBadgeText: { color: '#FFD700', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  divider: { height: 1, marginHorizontal: spacing.lg, opacity: 0.4, marginBottom: 4 },
  dividerThin: { height: 1, opacity: 0.2, marginVertical: 4 },
  typeContainer: {
    flexDirection: 'row', paddingHorizontal: spacing.md,
    paddingTop: 8, paddingBottom: 6, gap: 8,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 40, borderRadius: 10, gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  typeBtnActive: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  typeBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: scaledFont(13), fontWeight: '700' },
  platformContainer: {
    paddingHorizontal: spacing.md, paddingTop: 6, paddingBottom: 10, gap: 8, flexDirection: 'row',
    alignItems: 'center',
  },
  platformBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, height: 40, borderRadius: 10, gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: 'transparent',
    minWidth: 80, overflow: 'hidden',
  },
  platformLogo: { width: 56, height: 24 },
  platformText: { color: 'rgba(255,255,255,0.5)', fontSize: scaledFont(12), fontWeight: '700' },
  yearContainer: {
    paddingHorizontal: spacing.md, paddingTop: 6, paddingBottom: 10, gap: 8, flexDirection: 'row',
    alignItems: 'center',
  },
  yearBtn: {
    paddingHorizontal: 16, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  yearText: { color: 'rgba(255,255,255,0.6)', fontSize: scaledFont(13), fontWeight: '700' },
});

// ---- Masonry Grid Styles ----
const masonryStyles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  card: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8, position: 'relative',
  },
  poster: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },
  ratingBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)',
  },
  ratingText: { color: '#FFD700', fontSize: 11, fontWeight: '800' },
  rankBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  rankText: { color: '#000', fontSize: 11, fontWeight: '900' },
  titleContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
  title: {
    color: '#fff', fontSize: scaledFont(12), fontWeight: '700', lineHeight: 15,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});

// ---- 3D Modal Styles ----
const modal3DStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  container: { alignItems: 'center', gap: 22 },
  card: {
    width: 220, height: 330, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35, shadowRadius: 24, elevation: 20,
  },
  poster: { width: '100%', height: '100%' },
  spine: { position: 'absolute', left: 0, top: 0, width: 7, height: '100%', opacity: 0.9 },
  ratingBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
  },
  ratingText: { color: '#FFD700', fontSize: 12, fontWeight: '800' },
  hint: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  hintText: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  backContent: { flex: 1, padding: 20, paddingLeft: 22, justifyContent: 'center', gap: 10 },
  backTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 24,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  detailBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
