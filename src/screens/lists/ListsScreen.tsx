import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Image,
  Dimensions,
  Modal,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { ListsStackParamList, UserListItem } from '../../types';
import { userApi } from '../../api/user';
import { BannerAd } from '../../components/ads';
import { colors, typography, spacing, borderRadius } from '../../theme';

const { width, height } = Dimensions.get('window');
const SHELF_COLUMNS = 3;
const ITEM_WIDTH = (width - spacing.md * 2 - spacing.sm * (SHELF_COLUMNS - 1)) / SHELF_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.52;

type ListsScreenNavigationProp = StackNavigationProp<ListsStackParamList, 'ListsScreen'>;
interface Props { navigation: ListsScreenNavigationProp; }
type TabType = 'watchlist' | 'favorites' | 'watched';

// --- 3D DVD Modal ---
const DVDModal: React.FC<{
  item: UserListItem | null;
  visible: boolean;
  onClose: () => void;
  onNavigate: (id: number, type: string) => void;
  onRemove: (id: number) => void;
  activeTab: TabType;
}> = ({ item, visible, onClose, onNavigate, onRemove, activeTab }) => {
  const rotateY = useRef(new Animated.Value(0)).current;
  const rotateX = useRef(new Animated.Value(0)).current;
  const lastRotateY = useRef(0);
  const lastRotateX = useRef(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = lastRotateY.current + gestureState.dx * 0.4;
        const newX = lastRotateX.current - gestureState.dy * 0.4;
        rotateY.setValue(Math.max(-60, Math.min(60, newY)));
        rotateX.setValue(Math.max(-30, Math.min(30, newX)));
      },
      onPanResponderRelease: (_, gestureState) => {
        lastRotateY.current = Math.max(-60, Math.min(60, lastRotateY.current + gestureState.dx * 0.4));
        lastRotateX.current = Math.max(-30, Math.min(30, lastRotateX.current - gestureState.dy * 0.4));

        // 60 derece geçince flip
        if (Math.abs(lastRotateY.current) >= 55) {
          setIsFlipped(f => !f);
          lastRotateY.current = 0;
          lastRotateX.current = 0;
          Animated.spring(rotateY, { toValue: 0, useNativeDriver: true }).start();
          Animated.spring(rotateX, { toValue: 0, useNativeDriver: true }).start();
        } else {
          // Geri döndür
          Animated.spring(rotateY, { toValue: 0, useNativeDriver: true, tension: 40, friction: 6 }).start();
          Animated.spring(rotateX, { toValue: 0, useNativeDriver: true, tension: 40, friction: 6 }).start();
          lastRotateY.current = 0;
          lastRotateX.current = 0;
        }
      },
    })
  ).current;

  const rotateYInterp = rotateY.interpolate({ inputRange: [-60, 60], outputRange: ['-60deg', '60deg'] });
  const rotateXInterp = rotateX.interpolate({ inputRange: [-30, 30], outputRange: ['30deg', '-30deg'] });

  const posterUrl = item?.posterPath
    ? `https://image.tmdb.org/t/p/w500${item.posterPath.startsWith('/') ? item.posterPath : `/${item.posterPath}`}`
    : null;

  const tabColor = activeTab === 'watchlist' ? '#F97316' : activeTab === 'favorites' ? '#E11D48' : '#10B981';
  const tabIcon = activeTab === 'watchlist' ? 'bookmark' : activeTab === 'favorites' ? 'heart' : 'checkmark-circle';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={dvdStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={dvdStyles.container}>
          {/* 3D Card */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              dvdStyles.card,
              {
                transform: [
                  { perspective: 800 },
                  { rotateY: rotateYInterp },
                  { rotateX: rotateXInterp },
                ],
              },
            ]}
          >
            {!isFlipped ? (
              // ÖN YÜZ — Afiş
              <View style={dvdStyles.face}>
                {posterUrl ? (
                  <Image source={{ uri: posterUrl }} style={dvdStyles.poster} resizeMode="cover" />
                ) : (
                  <View style={[dvdStyles.poster, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="film" size={60} color="#444" />
                  </View>
                )}
                {/* DVD kenar şeridi */}
                <LinearGradient
                  colors={[tabColor + 'CC', tabColor + '44']}
                  style={dvdStyles.spine}
                />
                {/* Puan */}
                {typeof item?.voteAverage === 'number' && item.voteAverage > 0 && (
                  <View style={dvdStyles.rating}>
                    <Ionicons name="star" size={11} color="#FFD700" />
                    <Text style={dvdStyles.ratingText}>{item.voteAverage.toFixed(1)}</Text>
                  </View>
                )}
                {/* Döndür ipucu */}
                <View style={dvdStyles.hint}>
                  <Ionicons name="sync-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={dvdStyles.hintText}>Döndür</Text>
                </View>
              </View>
            ) : (
              // ARKA YÜZ — Film Detayları
              <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={dvdStyles.backFace}>
                <View style={[dvdStyles.backSpine, { backgroundColor: tabColor }]} />
                <View style={dvdStyles.backContent}>
                  <Ionicons name={tabIcon as any} size={28} color={tabColor} />
                  <Text style={dvdStyles.backTitle} numberOfLines={3}>{item?.title}</Text>
                  {typeof item?.voteAverage === 'number' && item.voteAverage > 0 && (
                    <View style={dvdStyles.backRating}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={dvdStyles.backRatingText}>{item.voteAverage.toFixed(1)} / 10</Text>
                    </View>
                  )}
                  <Text style={dvdStyles.backType}>{item?.type === 'tv' ? 'Dizi' : 'Film'}</Text>
                  {item?.addedAt && (
                    <Text style={dvdStyles.backDate}>
                      Eklenme: {new Date(item.addedAt).toLocaleDateString('tr-TR')}
                    </Text>
                  )}
                  {/* Döndür ipucu */}
                  <View style={[dvdStyles.hint, { marginTop: 12 }]}>
                    <Ionicons name="sync-outline" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={[dvdStyles.hintText, { color: 'rgba(255,255,255,0.4)' }]}>Geri döndür</Text>
                  </View>
                </View>
              </LinearGradient>
            )}
          </Animated.View>

          {/* Butonlar */}
          <View style={dvdStyles.actions}>
            <TouchableOpacity
              style={dvdStyles.actionBtn}
              onPress={() => { onClose(); item?.movieId && onNavigate(item.movieId, item.type ?? 'movie'); }}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[tabColor, tabColor + 'AA']} style={dvdStyles.actionBtnGrad}>
                <Ionicons name="play-circle" size={18} color="#fff" />
                <Text style={dvdStyles.actionBtnText}>Detaylar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={dvdStyles.actionBtn}
              onPress={() => { onClose(); item?.movieId && onRemove(item.movieId); }}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#E11D48', '#9f1239']} style={dvdStyles.actionBtnGrad}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={dvdStyles.actionBtnText}>Kaldır</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// --- Ana Ekran ---
const ListsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('watchlist');
  const [watchlist, setWatchlist] = useState<UserListItem[]>([]);
  const [favorites, setFavorites] = useState<UserListItem[]>([]);
  const [watched, setWatched] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserListItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const initialLoadedRef = useRef(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (!initialLoadedRef.current || forceRefresh) setLoading(true);
      const [watchlistData, favoritesData, watchedData] = await Promise.all([
        userApi.getWatchlist().catch(() => []),
        userApi.getFavorites().catch(() => []),
        userApi.getWatched().catch(() => []),
      ]);
      setWatchlist(watchlistData ?? []);
      setFavorites(favoritesData ?? []);
      setWatched(watchedData ?? []);
      initialLoadedRef.current = true;
    } catch (error) {
      if (__DEV__) { console.error('Error loading lists:', error); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const handleRefresh = () => { setRefreshing(true); loadData(true); };

  const handleRemoveItem = async (movieId: number) => {
    try {
      if (activeTab === 'watchlist') await userApi.removeFromWatchlist(movieId);
      else if (activeTab === 'favorites') await userApi.removeFromFavorites(movieId);
      else await userApi.removeFromWatched(movieId);
      await loadData(true);
    } catch (error) {
      if (__DEV__) { console.error('Remove error:', error); }
    }
  };

  const tabColor = activeTab === 'watchlist' ? '#F97316' : activeTab === 'favorites' ? '#E11D48' : '#10B981';

  const renderShelfItem = ({ item, index }: { item: UserListItem; index: number }) => {
    const cleanPosterPath = item?.posterPath?.startsWith('/')
      ? item.posterPath
      : item?.posterPath ? `/${item.posterPath}` : null;
    const imageUri = cleanPosterPath ? `https://image.tmdb.org/t/p/w342${cleanPosterPath}` : null;

    // Hafif perspektif efekti — raftaki pozisyona göre
    const colIndex = index % SHELF_COLUMNS;
    const tiltAngle = (colIndex - 1) * 1.2; // sol:-1.2, orta:0, sağ:1.2

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => { setSelectedItem(item); setModalVisible(true); }}
        style={[styles.shelfItem, { transform: [{ rotateZ: `${tiltAngle}deg` }] }]}
      >
        {/* DVD spine (sol kenar cilt) */}
        <View style={[styles.spine, { backgroundColor: tabColor }]} />

        {/* Afiş */}
        <View style={styles.posterWrapper}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={[styles.poster, styles.placeholder]}>
              <Ionicons name="film-outline" size={32} color="#555" />
            </View>
          )}

          {/* Alt gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.posterGradient}
          />

          {/* Puan */}
          {typeof item?.voteAverage === 'number' && item.voteAverage > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {item.voteAverage.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Alt bilgi */}
        <Text style={styles.itemTitle} numberOfLines={1}>{item?.title}</Text>
      </TouchableOpacity>
    );
  };

  // Raf ayırıcı — her satır sonunda çizgi
  const renderShelfSeparator = () => <View style={styles.shelfLine} />;

  const currentData = activeTab === 'watchlist' ? watchlist : activeTab === 'favorites' ? favorites : watched;

  const tabConfig: { key: TabType; label: string; icon: string; activeIcon: string; color: string }[] = [
    { key: 'watchlist', label: 'İzleme', icon: 'bookmark-outline', activeIcon: 'bookmark', color: '#F97316' },
    { key: 'favorites', label: 'Favoriler', icon: 'heart-outline', activeIcon: 'heart', color: '#E11D48' },
    { key: 'watched', label: 'İzlenenler', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle', color: '#10B981' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0D0D12', '#141420', '#0D0D12']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Film Kitaplığım</Text>
          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>{currentData.length} film</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabConfig.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(activeTab === tab.key ? tab.activeIcon : tab.icon) as any}
                size={18}
                color={activeTab === tab.key ? tab.color : '#666'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color }]}>
                {tab.label}
              </Text>
              {currentData.length > 0 && activeTab === tab.key && (
                <View style={[styles.tabBadge, { backgroundColor: tab.color }]}>
                  <Text style={styles.tabBadgeText}>{currentData.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Raf görseli */}
        <FlatList
          data={currentData}
          renderItem={renderShelfItem}
          keyExtractor={(item, index) => `${item?.movieId ?? ''}-${index}`}
          numColumns={SHELF_COLUMNS}
          contentContainerStyle={styles.shelfContent}
          columnWrapperStyle={styles.shelfRow}
          ItemSeparatorComponent={renderShelfSeparator}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="library-outline" size={72} color="#333" />
                <Text style={styles.emptyTitle}>Kitaplık Boş</Text>
                <Text style={styles.emptySubtitle}>Film detayından {
                  activeTab === 'watchlist' ? 'izleme listene' :
                  activeTab === 'favorites' ? 'favorilerine' : 'izlediklerine'
                } ekleyebilirsin</Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tabColor} />
          }
        />

        <BannerAd position="bottom" />
      </LinearGradient>

      {/* 3D DVD Modal */}
      <DVDModal
        item={selectedItem}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onNavigate={(id, type) => navigation.navigate('Detail', { id, type: type as any })}
        onRemove={handleRemoveItem}
        activeTab={activeTab}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D12' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerCountText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { color: '#666', fontWeight: '700', fontSize: 12 },
  tabBadge: {
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginLeft: 2,
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  shelfContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  shelfRow: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: 2,
    paddingTop: spacing.xs,
    paddingBottom: 8,
  },
  shelfLine: {
    height: 6,
    marginHorizontal: -spacing.md,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  shelfItem: {
    width: ITEM_WIDTH,
    alignItems: 'flex-start',
  },
  spine: {
    width: 5,
    height: ITEM_HEIGHT,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
    opacity: 0.9,
  },
  posterWrapper: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  poster: { width: '100%', height: '100%' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  posterGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '45%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  ratingText: { color: '#FFD700', fontSize: 10, fontWeight: '700' },
  itemTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
    width: ITEM_WIDTH,
    paddingHorizontal: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: { color: '#555', fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});

const dvdStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { alignItems: 'center', gap: 24 },
  card: {
    width: 220,
    height: 330,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  face: { width: '100%', height: '100%', position: 'relative' },
  poster: { width: '100%', height: '100%' },
  spine: {
    position: 'absolute',
    left: 0, top: 0,
    width: 8,
    height: '100%',
    opacity: 0.9,
  },
  rating: {
    position: 'absolute',
    top: 10, right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  ratingText: { color: '#FFD700', fontSize: 12, fontWeight: '700' },
  hint: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  backFace: { flex: 1, position: 'relative' },
  backSpine: { position: 'absolute', left: 0, top: 0, width: 8, height: '100%' },
  backContent: {
    flex: 1,
    padding: 20,
    paddingLeft: 22,
    justifyContent: 'center',
    gap: 8,
  },
  backTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  backRating: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backRatingText: { color: '#FFD700', fontSize: 14, fontWeight: '700' },
  backType: { color: '#888', fontSize: 13 },
  backDate: { color: '#666', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { borderRadius: 20, overflow: 'hidden' },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default ListsScreen;
