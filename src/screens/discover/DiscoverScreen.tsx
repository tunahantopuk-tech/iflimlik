import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../theme';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - spacing.md * 2 - 10) / 2;
const CARD_H = CARD_W * 1.1;

// Her kategorinin arka planı için TMDB movie ID'leri
const CATEGORY_IMAGES: Record<string, string> = {
  horror:      'https://image.tmdb.org/t/p/w500/qV9cAFD5qKahzm8Q2fmUCfqHKEm.jpg', // It
  action:      'https://image.tmdb.org/t/p/w500/fIE3f0LzGTgS1Ce7MCJEP7Dn2pT.jpg', // John Wick
  scifi:       'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', // Matrix
  drama:       'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLest0M78KHD.jpg', // Godfather
  comedy:      'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', // Joker
  romance:     'https://image.tmdb.org/t/p/w500/qAZ0pzat24kLdO3o8ejmbLxyOac.jpg', // Titanic
  animation:   'https://image.tmdb.org/t/p/w500/IG3niKMBeaUmgBpFxVITW0zo0Oy.jpg', // Lion King
  thriller:    'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Se7en
  oscar:       'https://image.tmdb.org/t/p/w500/b9oonkVBr0oWMNMT9h5RLeFTCN4.jpg', // Oppenheimer
  bafta:       'https://image.tmdb.org/t/p/w500/iuFNMS8vlucpLwrs8v8DTog9c0o.jpg', // 1917
  upcoming:    'https://image.tmdb.org/t/p/w500/dBcZCIKsyAr3wUdPKSJp6v0SQl0.jpg', // Dune 2
  turkish:     'https://image.tmdb.org/t/p/w500/xCRiRiMrS2CfPdMoZ1EG2FZWBAT.jpg', // Ayla
  documentary: 'https://image.tmdb.org/t/p/w500/oy8cOfAFG3W2K9VZWK5fFrjPP7L.jpg', // Free Solo
  adventure:   'https://image.tmdb.org/t/p/w500/gp18R42TbSUlw9VnXFqyecm52lq.jpg', // Indiana Jones
  crime:       'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg', // Pulp Fiction
  family:      'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', // Up
  history:     'https://image.tmdb.org/t/p/w500/v7T0RpackVNBVBNqKpJHkEFXMrz.jpg', // Gladiator
  music:       'https://image.tmdb.org/t/p/w500/xDSsGEyGDaAuXHSFZTxm7s0Lz4.jpg',  // Bohemian Rhapsody
  war:         'https://image.tmdb.org/t/p/w500/iuFNMS8vlucpLwrs8v8DTog9c0o.jpg', // 1917
  western:     'https://image.tmdb.org/t/p/w500/d7YQpZ03aNp47q6JEUoUXpFPJeT.jpg', // Good Bad Ugly
  fantasy:     'https://image.tmdb.org/t/p/w500/56zTpe2xvasfpMWZRuNjPDsDf9j.jpg', // LOTR
  mystery:     'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Se7en
};

interface DiscoverCategory {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  imageKey: string;
  accentColor: string;
  overlayColors: [string, string];
  params: any;
}

const sections = [
  {
    title: 'Türler',
    accentColor: colors.primary,
    items: [
      { id: 'action',    title: 'Aksiyon',      subtitle: 'Nefes kesen sahneler',  emoji: '💥', imageKey: 'action',    accentColor: '#E65100', overlayColors: ['rgba(230,81,0,0.4)',    'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 28,    genreName: 'Aksiyon',      type: 'movie' } },
      { id: 'horror',    title: 'Korku',         subtitle: 'Gerilim & Korku',       emoji: '👻', imageKey: 'horror',    accentColor: '#8B0000', overlayColors: ['rgba(139,0,0,0.5)',    'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 27,    genreName: 'Korku',        type: 'movie' } },
      { id: 'scifi',     title: 'Bilim Kurgu',   subtitle: 'Gelecek & Uzay',        emoji: '🚀', imageKey: 'scifi',     accentColor: '#0d47a1', overlayColors: ['rgba(13,71,161,0.5)',  'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 878,   genreName: 'Bilim Kurgu',  type: 'movie' } },
      { id: 'drama',     title: 'Drama',         subtitle: 'Derin hikayeler',       emoji: '🎭', imageKey: 'drama',     accentColor: '#4A148C', overlayColors: ['rgba(74,20,140,0.5)',  'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 18,    genreName: 'Drama',        type: 'movie' } },
      { id: 'comedy',    title: 'Komedi',        subtitle: 'Güldür güldür',         emoji: '😂', imageKey: 'comedy',    accentColor: '#1565C0', overlayColors: ['rgba(21,101,192,0.4)', 'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 35,    genreName: 'Komedi',       type: 'movie' } },
      { id: 'thriller',  title: 'Gerilim',       subtitle: 'Koltuk kenarı',         emoji: '😰', imageKey: 'thriller',  accentColor: '#263238', overlayColors: ['rgba(38,50,56,0.6)',   'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 53,    genreName: 'Gerilim',      type: 'movie' } },
      { id: 'animation', title: 'Animasyon',     subtitle: 'Her yaşa uygun',        emoji: '🎨', imageKey: 'animation', accentColor: '#F57F17', overlayColors: ['rgba(245,127,23,0.4)', 'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 16,    genreName: 'Animasyon',    type: 'movie' } },
      { id: 'documentary',title: 'Belgesel',     subtitle: 'Gerçek hikayeler',      emoji: '🎥', imageKey: 'documentary',accentColor: '#2E7D32', overlayColors: ['rgba(46,125,50,0.5)',  'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 99,    genreName: 'Belgesel',     type: 'movie' } },
      { id: 'romance',   title: 'Romantik',      subtitle: 'Aşk hikayeleri',        emoji: '💕', imageKey: 'romance',   accentColor: '#880E4F', overlayColors: ['rgba(136,14,79,0.5)',  'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 10749, genreName: 'Romantik',     type: 'movie' } },
      { id: 'adventure', title: 'Macera',        subtitle: 'Keşfet & Yolculuk',     emoji: '🗺️', imageKey: 'adventure', accentColor: '#1B5E20', overlayColors: ['rgba(27,94,32,0.5)',   'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 12,    genreName: 'Macera',       type: 'movie' } },
      { id: 'crime',     title: 'Suç & Polisiye',subtitle: 'Gizem & Suç',           emoji: '🕵️', imageKey: 'crime',     accentColor: '#37474F', overlayColors: ['rgba(55,71,79,0.6)',   'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 80,    genreName: 'Suç',          type: 'movie' } },
      { id: 'family',    title: 'Aile',          subtitle: 'Birlikte izleyin',      emoji: '👨‍👩‍👧', imageKey: 'family',    accentColor: '#00838F', overlayColors: ['rgba(0,131,143,0.5)', 'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 10751, genreName: 'Aile',         type: 'movie' } },
      { id: 'history',   title: 'Tarih',         subtitle: 'Tarihi yapımlar',       emoji: '⚔️', imageKey: 'history',   accentColor: '#5D4037', overlayColors: ['rgba(93,64,55,0.6)',   'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 36,    genreName: 'Tarih',        type: 'movie' } },
      { id: 'music',     title: 'Müzik',         subtitle: 'Müzikal & Biyografi',   emoji: '🎵', imageKey: 'music',     accentColor: '#6A1B9A', overlayColors: ['rgba(106,27,154,0.5)', 'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 10402, genreName: 'Müzik',        type: 'movie' } },
      { id: 'war',       title: 'Savaş',         subtitle: 'Savaş filmleri',        emoji: '🪖', imageKey: 'war',       accentColor: '#455A64', overlayColors: ['rgba(69,90,100,0.6)',  'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 10752, genreName: 'Savaş',        type: 'movie' } },
      { id: 'western',   title: 'Kovboy',        subtitle: 'Vahşi Batı',            emoji: '🤠', imageKey: 'western',   accentColor: '#BF360C', overlayColors: ['rgba(191,54,12,0.5)',  'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 37,    genreName: 'Kovboy',       type: 'movie' } },
      { id: 'fantasy',   title: 'Fantezi',       subtitle: 'Büyü & Efsane',         emoji: '🧙', imageKey: 'fantasy',   accentColor: '#1A237E', overlayColors: ['rgba(26,35,126,0.5)',  'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 14,    genreName: 'Fantezi',      type: 'movie' } },
      { id: 'mystery',   title: 'Gizem',         subtitle: 'Kim yaptı?',            emoji: '🔍', imageKey: 'mystery',   accentColor: '#4E342E', overlayColors: ['rgba(78,52,46,0.6)',   'rgba(0,0,0,0.88)'] as [string,string], params: { genre: 9648,  genreName: 'Gizem',        type: 'movie' } },
    ],
  },
  {
    title: 'Ödüller',
    accentColor: '#FFD700',
    items: [
      { id: 'oscar', title: 'Oscar', subtitle: '2022 - 2026 Ödüllü', emoji: '🏆', imageKey: 'oscar', accentColor: '#E65100', overlayColors: ['rgba(230,81,0,0.4)', 'rgba(0,0,0,0.88)'] as [string,string], params: { special: 'oscar', genreName: 'Oscar Ödüllü', type: 'movie' } },
      { id: 'bafta', title: 'BAFTA', subtitle: 'İngiliz Film Ödülleri', emoji: '🎖️', imageKey: 'bafta', accentColor: '#311b92', overlayColors: ['rgba(49,27,146,0.5)', 'rgba(0,0,0,0.88)'] as [string,string], params: { special: 'bafta', genreName: 'BAFTA Ödüllü', type: 'movie' } },
    ],
  },
  {
    title: 'Özel Listeler',
    accentColor: '#00C853',
    items: [
      { id: 'upcoming', title: '2026 Beklenenler', subtitle: 'Yakında vizyonda',    emoji: '📅', imageKey: 'upcoming', accentColor: '#1B5E20', overlayColors: ['rgba(27,94,32,0.5)',   'rgba(0,0,0,0.88)'] as [string,string], params: { special: 'upcoming', genreName: '2026 Beklenenler', type: 'movie' } },
      { id: 'turkish',  title: 'Türk Yapımlar',  subtitle: 'Yerli sinema',          emoji: '🇹🇷', imageKey: 'turkish',  accentColor: '#b71c1c', overlayColors: ['rgba(183,28,28,0.5)', 'rgba(0,0,0,0.88)'] as [string,string], params: { special: 'turkish',  genreName: 'Türk Yapımlar',   type: 'movie' } },
    ],
  },
];

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();

  const handleCategoryPress = (item: any) => {
    navigation.navigate('DiscoverDetail', {
      title: item.title,
      imageUrl: CATEGORY_IMAGES[item.imageKey],
      accentColor: item.accentColor,
      params: item.params,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f0a1e', '#080810']} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="compass" size={26} color={colors.primary} />
            <View>
              <Text style={styles.headerTitle}>Keşfet</Text>
              <Text style={styles.headerSub}>Ne izlemek istiyorsun?</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Platformlar */}
          <View style={styles.platformsSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: '#fff' }]} />
              <Text style={styles.sectionTitle}>Platformlar</Text>
            </View>
            <View style={styles.platformsRow}>
              {[
                {
                  id: 'netflix',
                  name: 'Netflix',
                  bg: '#000',
                  border: '#E50914',
                  providerId: 8,
                  imageUrl: 'https://image.tmdb.org/t/p/w500/b9oonkVBr0oWMNMT9h5RLeFTCN4.jpg',
                  logo: null,
                  color: '#E50914',
                  letter: 'N',
                  letterColor: '#fff',
                  letterBg: '#E50914',
                },
                {
                  id: 'disney',
                  name: 'Disney+',
                  bg: '#000F5E',
                  border: '#00A8E0',
                  providerId: 337,
                  imageUrl: 'https://image.tmdb.org/t/p/w500/IG3niKMBeaUmgBpFxVITW0zo0Oy.jpg',
                  logo: null,
                  color: '#00A8E0',
                  letter: 'D+',
                  letterColor: '#fff',
                  letterBg: '#000F5E',
                },
                {
                  id: 'prime',
                  name: 'Prime Video',
                  bg: '#00A8E0',
                  border: '#00A8E0',
                  providerId: 9,
                  imageUrl: 'https://image.tmdb.org/t/p/w500/dBcZCIKsyAr3wUdPKSJp6v0SQl0.jpg',
                  logo: null,
                  color: '#00A8E0',
                  letter: 'prime',
                  letterColor: '#fff',
                  letterBg: '#00A8E0',
                },
                {
                  id: 'hbomax',
                  name: 'HBO Max',
                  bg: '#000',
                  border: '#6C2BD9',
                  providerId: 384,
                  imageUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                  logo: null,
                  color: '#6C2BD9',
                  letter: 'HBO',
                  letterColor: '#fff',
                  letterBg: '#6C2BD9',
                },
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.platformCard, { borderColor: p.border + '80' }]}
                  activeOpacity={0.82}
                  onPress={() => navigation.navigate('DiscoverDetail', {
                    title: p.name,
                    imageUrl: p.imageUrl,
                    accentColor: p.color,
                    params: { special: 'provider', providerId: p.providerId, genreName: p.name, type: 'movie' },
                  })}
                >
                  <LinearGradient
                    colors={[p.bg, p.bg === '#000' ? '#111' : p.bg]}
                    style={styles.platformGrad}
                  >
                    {/* Logo text simülasyonu — gerçek logoya en yakın */}
                    <View style={[styles.platformLogoBox, { backgroundColor: p.letterBg }]}>
                      <Text style={[styles.platformLogoText, {
                        color: p.letterColor,
                        fontSize: p.letter.length > 2 ? 11 : p.letter === 'N' ? 22 : 16,
                        fontStyle: p.letter === 'prime' ? 'italic' : 'normal',
                        fontWeight: p.letter === 'N' ? '900' : '800',
                      }]}>{p.letter}</Text>
                    </View>
                    <Text style={styles.platformName} numberOfLines={1}>{p.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              {/* Bölüm başlığı */}
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionAccent, { backgroundColor: section.accentColor }]} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() => handleCategoryPress(item)}
                    activeOpacity={0.88}
                  >
                    {/* Arka plan görseli */}
                    <Image
                      source={{ uri: CATEGORY_IMAGES[item.imageKey] }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    {/* Gradient overlay */}
                    <LinearGradient
                      colors={item.overlayColors}
                      style={styles.cardOverlay}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.3, y: 1 }}
                    />
                    {/* Glassmorphism üst yansıma */}
                    <View style={styles.cardGlass} />
                    {/* Emoji */}
                    <Text style={styles.cardEmoji}>{item.emoji}</Text>
                    {/* Alt bilgi */}
                    <View style={styles.cardBottom}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 1 },
  scroll: { paddingHorizontal: spacing.md },
  section: { marginBottom: 20 },
  platformsSection: { marginBottom: 20 },
  platformsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  platformCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  platformGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  platformLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformLogoText: {
    letterSpacing: -0.5,
  },
  platformName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1a1a2e' },
  cardImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardGlass: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(255,255,255,0.06)', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardEmoji: { position: 'absolute', top: 12, right: 12, fontSize: 26 },
  cardBottom: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cardSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 2 },
});
