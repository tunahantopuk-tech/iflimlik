import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllLocks, unlockActivity, ActivityKey } from '../../services/activityLockService';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { colors, spacing } from '../../theme';

const { width: W } = Dimensions.get('window');
const CARD_SIZE = (W - spacing.md * 2 - 12) / 2;

interface GameCard {
  key: ActivityKey;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  colors: [string, string, string];
  navigate: () => void;
  available: boolean;
}

export default function GamesScreen() {
  const navigation = useNavigation<any>();
  const { showRewardedAd } = useRewardedAd();
  const [locks, setLocks] = React.useState<Record<string, boolean>>({
    silentcinema: false,
    tabu: false,
    ifishing: false,
  });

  useFocusEffect(
    useCallback(() => {
      getAllLocks().then((allLocks) => {
        setLocks({
          silentcinema: allLocks?.silentcinema ?? false,
          tabu: allLocks?.tabu ?? false,
          ifishing: allLocks?.ifishing ?? false,
        });
      });
    }, [])
  );

  const handleUnlock = (key: ActivityKey, navigateFn: () => void) => {
    showRewardedAd(async () => {
      await unlockActivity(key);
      setLocks(prev => ({ ...prev, [key]: false }));
      navigateFn();
    });
  };

  const games: GameCard[] = [
    {
      key: 'silentcinema' as ActivityKey,
      emoji: '🎬',
      title: 'Sessiz Sinema',
      subtitle: 'Film Tahmin Oyunu',
      description: 'Film afişine bakarak adını bul!',
      colors: ['#FF6B00', '#C2185B', '#880E4F'],
      navigate: () => navigation.dispatch(
        CommonActions.navigate({ name: 'Home', params: { screen: 'SilentCinema', params: { screen: 'SilentCinemaSetup' } } })
      ),
      available: true,
    },
    {
      key: 'tabu' as ActivityKey,
      emoji: '🎭',
      title: 'Anlat Bakalım',
      subtitle: 'Tabu Oyunu',
      description: 'Filmi söylemeden anlat, takım arkadaşın bulsun!',
      colors: ['#6A1B9A', '#4A148C', '#880E4F'],
      navigate: () => navigation.dispatch(
        CommonActions.navigate({ name: 'Home', params: { screen: 'Tabu', params: { screen: 'TabuSetup' } } })
      ),
      available: true,
    },
    {
      key: 'ifishing' as ActivityKey,
      emoji: '🎣',
      title: 'iFishing',
      subtitle: 'Film Keşif Oyunu',
      description: 'Ruh haline göre film keşfet!',
      colors: ['#FF6B00', '#E91E63', '#C2185B'],
      navigate: () => navigation.dispatch(
        CommonActions.navigate({ name: 'Home', params: { screen: 'MoodSelection' } })
      ),
      available: true,
    },
    {
      key: 'ifishing' as ActivityKey,
      emoji: '🎲',
      title: 'Film Yarışması',
      subtitle: 'Yakında',
      description: 'Filmler hakkında bilgi yarışması',
      colors: ['#1a2a1a', '#0d1a0d', '#0a150a'],
      navigate: () => {},
      available: false,
    },
    {
      key: 'ifishing' as ActivityKey,
      emoji: '🏆',
      title: 'Sıralama',
      subtitle: 'Yakında',
      description: 'Haftalık film sıralamaları',
      colors: ['#2a1a0a', '#1a0d00', '#150a00'],
      navigate: () => {},
      available: false,
    },
    {
      key: 'ifishing' as ActivityKey,
      emoji: '🎯',
      title: 'Film Dedektifi',
      subtitle: 'Yakında',
      description: 'İpuçlarından filmi bul',
      colors: ['#0a1a2a', '#050d15', '#030a10'],
      navigate: () => {},
      available: false,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f0a1e', '#0a0a0f', '#080810']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Dekoratif arka plan daireler */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Oyunlar</Text>
            <Text style={styles.headerSub}>Film dünyasında eğlen</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>6</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Aktif Oyunlar başlığı */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Aktif Oyunlar</Text>
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {games.map((game, idx) => {
              const isLocked = game.available && locks[game.key];
              const isComingSoon = !game.available;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.card, isComingSoon && styles.cardDim]}
                  activeOpacity={isComingSoon ? 1 : 0.85}
                  onPress={() => {
                    if (isComingSoon) return;
                    if (isLocked) {
                      handleUnlock(game.key, game.navigate);
                    } else {
                      game.navigate();
                    }
                  }}
                >
                  <LinearGradient
                    colors={game.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGrad}
                  >
                    {/* Glassmorphism üst yansıma */}
                    <View style={styles.cardGlass} />

                    {/* Kilit badge */}
                    {isLocked && (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={11} color="#FFD700" />
                      </View>
                    )}

                    {/* Yakında badge */}
                    {isComingSoon && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Yakında</Text>
                      </View>
                    )}

                    {/* Emoji */}
                    <Text style={styles.cardEmoji}>{game.emoji}</Text>

                    {/* Başlık */}
                    <Text style={[styles.cardTitle, isComingSoon && styles.cardTitleDim]}>
                      {game.title}
                    </Text>
                    <Text style={styles.cardSubtitle}>{game.subtitle}</Text>

                    {/* Açıklama */}
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {game.description}
                    </Text>

                    {/* Oyna butonu */}
                    {!isComingSoon && (
                      <View style={[styles.playBtn, isLocked && styles.playBtnLocked]}>
                        <Ionicons
                          name={isLocked ? "lock-closed" : "play"}
                          size={12}
                          color={isLocked ? "#FFD700" : "#fff"}
                        />
                        <Text style={[styles.playBtnText, isLocked && styles.playBtnTextLocked]}>
                          {isLocked ? 'Kilidi Aç' : 'Oyna'}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  safeArea: { flex: 1 },
  bgCircle1: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: 150, top: -80, right: -80,
    backgroundColor: 'rgba(106,27,154,0.12)',
  },
  bgCircle2: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, bottom: 100, left: -60,
    backgroundColor: 'rgba(255,107,0,0.08)',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  headerBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700' },
  scrollContent: { paddingHorizontal: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionAccent: { width: 3, height: 18, backgroundColor: colors.primary, borderRadius: 2 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: CARD_SIZE, height: CARD_SIZE * 1.15, borderRadius: 20, overflow: 'hidden' },
  cardDim: { opacity: 0.55 },
  cardGrad: { flex: 1, padding: 16, justifyContent: 'flex-end', position: 'relative' },
  cardGlass: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '45%', backgroundColor: 'rgba(255,255,255,0.07)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  lockBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 0.5, borderColor: 'rgba(255,215,0,0.4)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
  },
  comingSoonBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
  },
  comingSoonText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  cardEmoji: { fontSize: 36, marginBottom: 6 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  cardTitleDim: { color: 'rgba(255,255,255,0.5)' },
  cardSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 },
  cardDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 15, marginBottom: 10 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  playBtnLocked: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.35)',
  },
  playBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  playBtnTextLocked: { color: '#FFD700' },
});
