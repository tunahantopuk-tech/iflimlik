import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '../../api/user';
import { colors, spacing } from '../../theme';

const { width: W } = Dimensions.get('window');

// ─── ROZET TANIMLARI ───────────────────────────────────────────────────────
const BADGES = [
  // Film rozetleri
  { id: 'film_1',   type: 'movie', count: 1,   icon: '🎬', name: 'İlk Perdede',    desc: '1 film izledin',        color: ['#E65100','#BF360C'],  shape: 'circle'   },
  { id: 'film_10',  type: 'movie', count: 10,  icon: '🍿', name: 'Popcorn Aşığı',  desc: '10 film izledin',       color: ['#F57F17','#E65100'],  shape: 'pentagon' },
  { id: 'film_20',  type: 'movie', count: 20,  icon: '🎥', name: 'Film Kurdu',     desc: '20 film izledin',       color: ['#1565C0','#0D47A1'],  shape: 'hexagon'  },
  { id: 'film_30',  type: 'movie', count: 30,  icon: '🌟', name: 'Sinema Tutkunı', desc: '30 film izledin',       color: ['#6A1B9A','#4A148C'],  shape: 'star'     },
  { id: 'film_40',  type: 'movie', count: 40,  icon: '🎦', name: 'Ekran Bağımlısı',desc: '40 film izledin',       color: ['#00695C','#004D40'],  shape: 'diamond'  },
  { id: 'film_50',  type: 'movie', count: 50,  icon: '🏅', name: 'Yarım Yüzlük',   desc: '50 film izledin',       color: ['#C62828','#B71C1C'],  shape: 'shield'   },
  { id: 'film_60',  type: 'movie', count: 60,  icon: '🎞️', name: 'Film Arşivci',   desc: '60 film izledin',       color: ['#0277BD','#01579B'],  shape: 'circle'   },
  { id: 'film_70',  type: 'movie', count: 70,  icon: '🌠', name: 'Yıldız Avcısı',  desc: '70 film izledin',       color: ['#4527A0','#311B92'],  shape: 'star'     },
  { id: 'film_80',  type: 'movie', count: 80,  icon: '🏆', name: 'Altın Bilet',    desc: '80 film izledin',       color: ['#F9A825','#F57F17'],  shape: 'trophy'   },
  { id: 'film_90',  type: 'movie', count: 90,  icon: '💎', name: 'Elmas Koltuk',   desc: '90 film izledin',       color: ['#00838F','#006064'],  shape: 'diamond'  },
  { id: 'film_100', type: 'movie', count: 100, icon: '👑', name: 'Film Efsanesi',  desc: '100 film izledin',      color: ['#FFD700','#FFA000'],  shape: 'crown'    },
  // Dizi rozetleri
  { id: 'tv_1',     type: 'tv',    count: 1,   icon: '📺', name: 'İlk Bölüm',     desc: '1 dizi izledin',        color: ['#1B5E20','#2E7D32'],  shape: 'circle'   },
  { id: 'tv_10',    type: 'tv',    count: 10,  icon: '🛋️', name: 'Koltuk Filozofu',desc: '10 dizi izledin',       color: ['#006064','#00838F'],  shape: 'pentagon' },
  { id: 'tv_20',    type: 'tv',    count: 20,  icon: '📡', name: 'Sinyal Avcısı', desc: '20 dizi izledin',       color: ['#1A237E','#283593'],  shape: 'hexagon'  },
  { id: 'tv_30',    type: 'tv',    count: 30,  icon: '🎭', name: 'Sahne Ustası',  desc: '30 dizi izledin',       color: ['#880E4F','#AD1457'],  shape: 'star'     },
  { id: 'tv_40',    type: 'tv',    count: 40,  icon: '🌙', name: 'Gece Bekçisi',  desc: '40 dizi izledin',       color: ['#212121','#424242'],  shape: 'diamond'  },
  { id: 'tv_50',    type: 'tv',    count: 50,  icon: '⚡', name: 'Maratoner',     desc: '50 dizi izledin',       color: ['#E91E63','#C2185B'],  shape: 'shield'   },
  { id: 'tv_60',    type: 'tv',    count: 60,  icon: '🔮', name: 'Sezonu Bitmez', desc: '60 dizi izledin',       color: ['#7B1FA2','#6A1B9A'],  shape: 'circle'   },
  { id: 'tv_70',    type: 'tv',    count: 70,  icon: '🌌', name: 'Evren Gezgini', desc: '70 dizi izledin',       color: ['#0D47A1','#1565C0'],  shape: 'star'     },
  { id: 'tv_80',    type: 'tv',    count: 80,  icon: '🦁', name: 'Dizi Aslanı',   desc: '80 dizi izledin',       color: ['#E65100','#BF360C'],  shape: 'trophy'   },
  { id: 'tv_90',    type: 'tv',    count: 90,  icon: '🚀', name: 'Uzay Yolcusu',  desc: '90 dizi izledin',       color: ['#00695C','#004D40'],  shape: 'diamond'  },
  { id: 'tv_100',   type: 'tv',    count: 100, icon: '👑', name: 'Dizi Efsanesi', desc: '100 dizi izledin',      color: ['#B8860B','#DAA520'],  shape: 'crown'    },
];

// Ortalama süreler (dakika)
const AVG_MOVIE_RUNTIME = 110;
const AVG_TV_EPISODE_RUNTIME = 45;
const AVG_TV_SEASONS = 3;
const AVG_EPISODES_PER_SEASON = 10;

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} dk`;
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) return `${hours} saat`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} gün ${remHours > 0 ? remHours + ' saat' : ''}`.trim();
}

// Dönen rozet bileşeni
function BadgeCard({ badge, unlocked }: { badge: any; unlocked: boolean }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const isFlipping = useRef(false);

  const flip = () => {
    if (!unlocked || isFlipping.current) return;
    isFlipping.current = true;
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: flipped ? 0 : 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFlipped(!flipped);
      isFlipping.current = false;
    });
  };

  const frontRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const cardSize = (W - spacing.md * 2 - 30) / 4;

  return (
    <TouchableOpacity onPress={flip} activeOpacity={0.85} style={{ width: cardSize, alignItems: 'center', marginBottom: 16 }}>
      {/* Ön yüz */}
      <Animated.View style={[badgeStyles.card, { width: cardSize, height: cardSize, transform: [{ rotateY: frontRotate }] }, !unlocked && badgeStyles.locked]}>
        <LinearGradient
          colors={unlocked ? badge.color as any : ['#1a1a1a', '#2a2a2a']}
          style={badgeStyles.gradBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {unlocked ? (
            <Text style={{ fontSize: cardSize * 0.38 }}>{badge.icon}</Text>
          ) : (
            <Ionicons name="lock-closed" size={cardSize * 0.32} color="rgba(255,255,255,0.2)" />
          )}
        </LinearGradient>
      </Animated.View>
      {/* Arka yüz */}
      <Animated.View style={[badgeStyles.card, badgeStyles.backCard, { width: cardSize, height: cardSize, transform: [{ rotateY: backRotate }] }]}>
        <LinearGradient colors={badge.color as any} style={badgeStyles.gradBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={[badgeStyles.backTitle, { fontSize: cardSize * 0.13 }]} numberOfLines={2}>{badge.name}</Text>
          <Text style={[badgeStyles.backDesc, { fontSize: cardSize * 0.1 }]} numberOfLines={2}>{badge.desc}</Text>
        </LinearGradient>
      </Animated.View>
      {/* İsim */}
      <Text style={[badgeStyles.badgeName, !unlocked && { color: 'rgba(255,255,255,0.2)' }]} numberOfLines={1}>
        {unlocked ? badge.name : '???'}
      </Text>
    </TouchableOpacity>
  );
}

export default function StatsScreen() {
  const [watched, setWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getWatched().then(data => {
      setWatched(data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const movies = watched.filter(w => w.type === 'movie' || !w.type);
  const tvShows = watched.filter(w => w.type === 'tv');

  const movieMinutes = movies.length * AVG_MOVIE_RUNTIME;
  const tvMinutes = tvShows.length * AVG_TV_SEASONS * AVG_EPISODES_PER_SEASON * AVG_TV_EPISODE_RUNTIME;
  const totalMinutes = movieMinutes + tvMinutes;

  const getUnlockedBadges = () =>
    BADGES.map(b => ({
      ...b,
      unlocked: b.type === 'movie'
        ? movies.length >= b.count
        : tvShows.length >= b.count,
    }));

  const badges = getUnlockedBadges();
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const movieBadges = badges.filter(b => b.type === 'movie');
  const tvBadges = badges.filter(b => b.type === 'tv');

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f0a1e', '#080810']} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>İstatistikler</Text>
              <Text style={styles.headerSub}>{watched.length} içerik izledin</Text>
            </View>
            <View style={styles.headerBadgeBox}>
              <Text style={styles.headerBadgeNum}>{unlockedCount}</Text>
              <Text style={styles.headerBadgeLabel}>rozet</Text>
            </View>
          </View>

          {/* 3 Ana Stat */}
          <View style={styles.statsRow}>
            {/* Toplam Süre */}
            <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Ionicons name="time-outline" size={22} color="#9D4EDD" />
              </View>
              <Text style={styles.statValue}>{formatDuration(totalMinutes)}</Text>
              <Text style={styles.statLabel}>Toplam İzleme{'\n'}Süresi</Text>
            </LinearGradient>

            {/* Film */}
            <LinearGradient colors={['#1a0a00', '#3d1f00']} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(230,81,0,0.2)' }]}>
                <Ionicons name="film-outline" size={22} color="#E65100" />
              </View>
              <Text style={styles.statValue}>{movies.length}</Text>
              <Text style={styles.statLabel}>İzlediğin{'\n'}Film</Text>
            </LinearGradient>

            {/* Dizi */}
            <LinearGradient colors={['#001a0a', '#003d1f']} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(27,94,32,0.2)' }]}>
                <Ionicons name="tv-outline" size={22} color="#2E7D32" />
              </View>
              <Text style={styles.statValue}>{tvShows.length}</Text>
              <Text style={styles.statLabel}>İzlediğin{'\n'}Dizi</Text>
            </LinearGradient>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Rozet Koleksiyonu</Text>
              <Text style={styles.progressSub}>{unlockedCount}/{BADGES.length}</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#E61806', '#9D4EDD']}
                style={[styles.progressFill, { width: `${(unlockedCount / BADGES.length) * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {/* Film Rozetleri */}
          <View style={styles.badgeSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>🎬 Film Rozetleri</Text>
            </View>
            <Text style={styles.sectionHint}>Rozete dokunarak çevir 👆</Text>
            <View style={styles.badgeGrid}>
              {movieBadges.map(b => <BadgeCard key={b.id} badge={b} unlocked={b.unlocked} />)}
            </View>
          </View>

          {/* Dizi Rozetleri */}
          <View style={styles.badgeSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: '#2E7D32' }]} />
              <Text style={styles.sectionTitle}>📺 Dizi Rozetleri</Text>
            </View>
            <Text style={styles.sectionHint}>Rozete dokunarak çevir 👆</Text>
            <View style={styles.badgeGrid}>
              {tvBadges.map(b => <BadgeCard key={b.id} badge={b} unlocked={b.unlocked} />)}
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  loading: { flex: 1, backgroundColor: '#080810', justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  headerBadgeBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 10 },
  headerBadgeNum: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
  headerBadgeLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  // 3 stat kart
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, alignItems: 'center', gap: 8, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  statIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(157,78,221,0.2)', justifyContent: 'center', alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'center', lineHeight: 14 },
  // Progress
  progressSection: { marginBottom: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  progressSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  // Rozet bölümü
  badgeSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionAccent: { width: 3, height: 18, backgroundColor: colors.primary, borderRadius: 2 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionHint: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 12, marginLeft: 11 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
});

const badgeStyles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backfaceVisibility: 'hidden' },
  backCard: { position: 'absolute', top: 0, left: 0 },
  gradBg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6, gap: 4 },
  locked: { opacity: 0.35 },
  backTitle: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  backDesc: { color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  badgeName: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 4, width: '100%' },
});
