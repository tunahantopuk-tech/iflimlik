import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing } from '../../theme';

type CompareStackParamList = {
  CompareType: undefined;
  CompareGenre: { type: 'movie' | 'tv' };
  CompareGame: { type: 'movie' | 'tv'; genre: string };
  CompareResult: { winner: any };
};

type CompareGenreScreenNavigationProp = StackNavigationProp<CompareStackParamList, 'CompareGenre'>;
type CompareGenreScreenRouteProp = RouteProp<CompareStackParamList, 'CompareGenre'>;

interface Props {
  navigation: CompareGenreScreenNavigationProp;
  route: CompareGenreScreenRouteProp;
}

const GENRES = [
  { id: 28, name: 'Aksiyon', icon: 'flash' },
  { id: 12, name: 'Macera', icon: 'compass' },
  { id: 16, name: 'Animasyon', icon: 'color-palette' },
  { id: 35, name: 'Komedi', icon: 'happy' },
  { id: 80, name: 'Suç', icon: 'finger-print' },
  { id: 99, name: 'Belgesel', icon: 'videocam' },
  { id: 18, name: 'Dram', icon: 'heart-dislike' },
  { id: 10751, name: 'Aile', icon: 'people' },
  { id: 14, name: 'Fantastik', icon: 'sparkles' },
  { id: 36, name: 'Tarih', icon: 'time' },
  { id: 27, name: 'Korku', icon: 'skull' },
  { id: 10402, name: 'Müzikal', icon: 'musical-notes' },
  { id: 9648, name: 'Gizem', icon: 'help-circle' },
  { id: 10749, name: 'Romantik', icon: 'heart' },
  { id: 878, name: 'Bilim Kurgu', icon: 'planet' },
  { id: 53, name: 'Gerilim', icon: 'warning' },
  { id: 10752, name: 'Savaş', icon: 'nuclear' },
  { id: 37, name: 'Vahşi Batı', icon: 'bonfire' },
];

const CompareGenreScreen: React.FC<Props> = ({ navigation, route }) => {
  const { type } = route?.params ?? { type: 'movie' };
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const handleGenreSelect = (genreId: number) => {
    setSelectedGenre(genreId.toString());
  };

  const handleStart = () => {
    if (!selectedGenre) return;
    navigation?.navigate?.('CompareGame', { type, genre: selectedGenre });
  };

  return (
    <LinearGradient
      colors={['#1a0033', '#3b0066', '#5c0099']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                style={styles.titleGradient}
              >
                <Text style={styles.title}>Hangi tür?</Text>
              </LinearGradient>
              <View style={styles.titleGlow} />
            </View>
            <Text style={styles.subtitle}>
              {type === 'movie' ? 'Film' : 'Dizi'} türünü seç
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.genresContainer}
          >
            <View style={styles.genresGrid}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre.id}
                  style={[
                    styles.genreCard,
                    selectedGenre === genre.id.toString() && styles.genreCardSelected,
                  ]}
                  onPress={() => handleGenreSelect(genre.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      selectedGenre === genre.id.toString()
                        ? ['#E61806', '#c41505']
                        : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                    }
                    style={styles.genreGradient}
                  >
                    <Ionicons
                      name={genre.icon as any}
                      size={28}
                      color={
                        selectedGenre === genre.id.toString()
                          ? colors.white
                          : colors.grayLight
                      }
                    />
                    <Text
                      style={[
                        styles.genreText,
                        selectedGenre === genre.id.toString() && styles.genreTextSelected,
                      ]}
                    >
                      {genre.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {selectedGenre && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                style={styles.startGradient}
              >
                <Text style={styles.startText}>Haydi</Text>
                <Ionicons name="arrow-forward" size={24} color={colors.black} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  titleContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  titleGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  titleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFA500',
    opacity: 0.3,
    borderRadius: 20,
    transform: [{ scale: 1.1 }],
    zIndex: -1,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1a0033',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  genresContainer: {
    paddingBottom: spacing.xl,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  genreCard: {
    width: '31.5%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  genreCardSelected: {
    shadowColor: '#E61806',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.05 }],
  },
  genreGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.grayLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  genreTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  startButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: spacing.lg,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  startText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a0033',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default CompareGenreScreen;
