import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Dimensions,
  Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPersonDetails } from '../../api/tmdb';
import { colors, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - 20) / 3;

export default function PersonDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { personId, personName, personPhoto } = route.params;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getPersonDetails(personId);
      setData(res);
      setLoading(false);
    };
    load();
  }, [personId]);

  const details = data?.details;
  const credits = data?.credits;
  const allMovies = [...(credits?.movies ?? []), ...(credits?.tv ?? [])];

  const getAge = () => {
    if (!details?.birthday) return null;
    const birth = new Date(details.birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return details?.deathday ? null : age;
  };

  const age = getAge();
  const birthplace = details?.place_of_birth;

  const photoOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        {allMovies[0]?.backdrop_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w780${allMovies[0].backdrop_path}` }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            blurRadius={0}
          />
        ) : (
          <LinearGradient colors={['#1a0a2e', '#2d1b4e', '#0d0d0d']} style={StyleSheet.absoluteFillObject} />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.5)', 'rgba(10,10,10,1)']}
          style={StyleSheet.absoluteFillObject}
          locations={[0, 0.5, 1]}
        />

        <SafeAreaView edges={['top']} style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        <Animated.View style={[styles.headerContent, { opacity: photoOpacity }]}>
          <View style={styles.photoContainer}>
            {details?.profile_path || personPhoto ? (
              <Image
                source={{ uri: details?.profile_path
                  ? `https://image.tmdb.org/t/p/w342${details.profile_path}`
                  : personPhoto }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="person" size={50} color="rgba(255,255,255,0.3)" />
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.personName}>{details?.name || personName}</Text>
            <View style={styles.knownForBadge}>
              <Text style={styles.knownForText}>
                {details?.known_for_department === 'Acting' ? 'OYUNCU' :
                 details?.known_for_department === 'Directing' ? 'YÖNETMEn' :
                 details?.known_for_department || 'OYUNCU'}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {age ? `${age} yaşında` : ''}
              {age && birthplace ? ' • ' : ''}
              {birthplace || ''}
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ height: 260 }} />

        {details?.biography ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biyografi</Text>
            <Text style={styles.biography} numberOfLines={expanded ? undefined : 4}>
              {details.biography}
            </Text>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
              <Text style={styles.readMore}>{expanded ? 'Daha az göster' : 'Devamını oku'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {allMovies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filmografi</Text>
            <Text style={styles.filmCount}>{allMovies.length} yapım</Text>
            <View style={styles.grid}>
              {allMovies.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={`${item.id}-${idx}`}
                  style={styles.gridCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Detail', {
                    id: item.id,
                    type: item.media_type === 'tv' ? 'tv' : 'movie',
                  })}
                >
                  {item.poster_path ? (
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }}
                      style={styles.gridPoster}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.gridPoster, styles.posterPlaceholder]}>
                      <Ionicons name="film-outline" size={24} color="rgba(255,255,255,0.2)" />
                    </View>
                  )}
                  {item.vote_average > 0 && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={9} color="#FFD700" />
                      <Text style={styles.ratingText}>{item.vote_average?.toFixed(1)}</Text>
                    </View>
                  )}
                  {item.media_type === 'tv' && (
                    <View style={styles.tvBadge}>
                      <Text style={styles.tvBadgeText}>DİZİ</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.gridGradient}
                  />
                  <Text style={styles.gridTitle} numberOfLines={2}>
                    {item.title || item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: 280, zIndex: 10, overflow: 'hidden' },
  headerTop: { paddingHorizontal: spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },
  headerContent: { position: 'absolute', bottom: 20, left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  photoContainer: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 16 },
  photo: { width: 100, height: 140, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  photoPlaceholder: { backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, paddingBottom: 4, gap: 6 },
  personName: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  knownForBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' },
  knownForText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  metaText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: spacing.md, paddingTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  filmCount: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 14 },
  biography: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 22 },
  readMore: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: { width: CARD_WIDTH, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  gridPoster: { width: '100%', height: CARD_WIDTH * 1.5 },
  posterPlaceholder: { backgroundColor: '#1e1e2e', justifyContent: 'center', alignItems: 'center' },
  gridGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  gridTitle: { position: 'absolute', bottom: 6, left: 6, right: 6, color: '#fff', fontSize: 10, fontWeight: '700' },
  ratingBadge: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  ratingText: { color: '#FFD700', fontSize: 10, fontWeight: '700' },
  tvBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(100,0,180,0.85)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  tvBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
});
