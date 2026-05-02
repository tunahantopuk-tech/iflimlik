import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, Dimensions,
  Animated, StatusBar, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tmdbApi } from '../../api/tmdb';
import { colors, spacing } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');
const POSTER_W = (W - spacing.md * 2 - 20) / 3;
const POSTER_H = POSTER_W * 1.5;

const GENRE_LIST = [
  { id: 0,     name: 'Tümü' },
  { id: 28,    name: 'Aksiyon' },
  { id: 12,    name: 'Macera' },
  { id: 16,    name: 'Animasyon' },
  { id: 35,    name: 'Komedi' },
  { id: 80,    name: 'Suç' },
  { id: 99,    name: 'Belgesel' },
  { id: 18,    name: 'Dram' },
  { id: 14,    name: 'Fantastik' },
  { id: 27,    name: 'Korku' },
  { id: 10749, name: 'Romantik' },
  { id: 878,   name: 'Bilim Kurgu' },
  { id: 53,    name: 'Gerilim' },
  { id: 10752, name: 'Savaş' },
  { id: 37,    name: 'Kovboy' },
  { id: 9648,  name: 'Gizem' },
  { id: 10751, name: 'Aile' },
  { id: 36,    name: 'Tarih' },
  { id: 10402, name: 'Müzik' },
];

export default function DiscoverDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { title, imageUrl, accentColor, params } = route.params;

  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Filtreler
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [sortBy, setSortBy] = useState<'popularity' | 'vote_average'>('popularity');
  const [selectedGenre, setSelectedGenre] = useState<number>(0);
  const [genreModalVisible, setGenreModalVisible] = useState(false);

  // Sadece provider kategorilerde 3 filtre göster
  const isProviderCategory = params.special === 'provider';
  // Sadece tür kategorilerde Film/Dizi filtresi
  const isGenreCategory = !!params.genre;

  const fetchMovies = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      let res: any = null;

      if (params.special === 'oscar') {
        res = await tmdbApi.getTopRated('movie', pageNum, 'oscar');
      } else if (params.special === 'upcoming') {
        res = await tmdbApi.getUpcoming(pageNum);
      } else if (params.special === 'turkish') {
        res = await tmdbApi.getTopRated('movie', pageNum, 'turkish');
      } else if (isProviderCategory) {
        res = await tmdbApi.getByProvider(
          params.providerId,
          mediaType,
          pageNum,
          sortBy,
          selectedGenre || undefined,
        );
      } else if (params.genre) {
        res = await tmdbApi.getByGenre(params.genre, mediaType, pageNum);
      } else {
        res = await tmdbApi.getPopularMovies(pageNum);
      }

      const results = res?.results ?? [];
      if (pageNum === 1) {
        setMovies(results);
      } else {
        setMovies(prev => [...prev, ...results]);
      }
      setHasMore(results.length === 20);
    } catch (e) {
      if (__DEV__) console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    fetchMovies(1);
  }, [mediaType, sortBy, selectedGenre]);

  const selectedGenreName = GENRE_LIST.find(g => g.id === selectedGenre)?.name || 'Tümü';

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.posterCard}
      onPress={() => navigation.navigate('Details', { id: item.id, type: item.media_type || (mediaType === 'tv' ? 'tv' : 'movie') })}
      activeOpacity={0.85}
    >
      {item.poster_path ? (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }}
          style={styles.poster}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Ionicons name="film-outline" size={24} color="rgba(255,255,255,0.2)" />
        </View>
      )}
      {item.vote_average > 0 && (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={9} color="#FFD700" />
          <Text style={styles.ratingText}>{item.vote_average?.toFixed(1)}</Text>
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.posterGrad} />
      <Text style={styles.posterTitle} numberOfLines={2}>{item.title || item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Blur backdrop */}
      <View style={styles.backdropContainer}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.backdropImage} resizeMode="cover" blurRadius={15} />
        )}
        <LinearGradient
          colors={[`${accentColor}55`, 'rgba(8,8,16,0.88)', 'rgba(8,8,16,1)']}
          style={StyleSheet.absoluteFillObject}
          locations={[0, 0.4, 1]}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{title}</Text>
            {movies.length > 0 && (
              <Text style={styles.headerCount}>{movies.length}+ yapım</Text>
            )}
          </View>
        </View>

        <FlatList
          data={movies}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onEndReached={() => {
            if (!loading && hasMore) {
              const next = page + 1;
              setPage(next);
              fetchMovies(next);
            }
          }}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View>
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>{title}</Text>
                <Text style={styles.listHeaderSub}>
                  {movies.length > 0 ? `${movies.length}+ yapım` : 'Yükleniyor...'}
                </Text>
              </View>

              {/* FİLM / DİZİ filtresi — genre VE provider kategorilerde */}
              {(isGenreCategory || isProviderCategory) && (
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterBtn, mediaType === 'movie' && styles.filterBtnActive]}
                    onPress={() => setMediaType('movie')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterBtnText, mediaType === 'movie' && styles.filterBtnTextActive]}>
                      Filmler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterBtn, mediaType === 'tv' && styles.filterBtnActive]}
                    onPress={() => setMediaType('tv')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterBtnText, mediaType === 'tv' && styles.filterBtnTextActive]}>
                      Diziler
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* SIRALAMA + TÜR filtreleri — sadece provider kategorilerde */}
              {isProviderCategory && (
                <View style={styles.chipRow}>
                  {/* Sıralama */}
                  <TouchableOpacity
                    style={[styles.chip, sortBy === 'popularity' && styles.chipActive]}
                    onPress={() => setSortBy(sortBy === 'popularity' ? 'vote_average' : 'popularity')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={sortBy === 'popularity' ? 'flame' : 'star'}
                      size={13}
                      color={sortBy === 'popularity' || sortBy === 'vote_average' ? '#fff' : 'rgba(255,255,255,0.5)'}
                    />
                    <Text style={styles.chipText}>
                      {sortBy === 'popularity' ? 'Popülerlik' : 'En Yüksek Puan'}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>

                  {/* Tür seçici */}
                  <TouchableOpacity
                    style={[styles.chip, selectedGenre > 0 && styles.chipActive]}
                    onPress={() => setGenreModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="grid-outline" size={13} color="#fff" />
                    <Text style={styles.chipText}>{selectedGenreName}</Text>
                    <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          ListFooterComponent={loading ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        />
      </SafeAreaView>

      {/* Tür Seçimi Modal */}
      <Modal
        visible={genreModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGenreModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGenreModalVisible(false)}
        />
        <View style={styles.modalSheet}>
          {/* Kaydırma çubuğu */}
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Tür Seçin</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {GENRE_LIST.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedGenre(genre.id);
                  setGenreModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedGenre === genre.id && styles.modalItemTextActive,
                ]}>
                  {genre.name}
                </Text>
                {selectedGenre === genre.id && (
                  <Ionicons name="checkmark" size={20} color="#00C853" />
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  backdropContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, overflow: 'hidden' },
  backdropImage: { width: '100%', height: '100%' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerCount: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: 30 },
  listHeader: { paddingVertical: 16 },
  listHeaderTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  listHeaderSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  // Film/Dizi toggle
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 11, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' },
  filterBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterBtnText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '600' },
  filterBtnTextActive: { color: '#000', fontWeight: '800' },
  // Chip filtreleri
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.4)' },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  // Grid
  row: { gap: 10, marginBottom: 10 },
  posterCard: { width: POSTER_W, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a2e' },
  poster: { width: '100%', height: POSTER_H },
  posterPlaceholder: { backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center' },
  posterGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  posterTitle: { position: 'absolute', bottom: 6, left: 6, right: 6, color: '#fff', fontSize: 9, fontWeight: '700' },
  ratingBadge: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  ratingText: { color: '#FFD700', fontSize: 9, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: '#141420', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, maxHeight: H * 0.75 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalItemText: { color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: '500' },
  modalItemTextActive: { color: '#fff', fontWeight: '700' },
});
