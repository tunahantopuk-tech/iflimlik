import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing } from '../../theme';

type CompareStackParamList = {
  CompareType: undefined;
  CompareGenre: { type: 'movie' | 'tv' };
  CompareGame: { type: 'movie' | 'tv'; genre: string };
  CompareResult: { winner: any };
};

type CompareTypeScreenNavigationProp = StackNavigationProp<CompareStackParamList, 'CompareType'>;

interface Props {
  navigation: CompareTypeScreenNavigationProp;
}

const CompareTypeScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<'movie' | 'tv' | null>(null);

  const handleTypeSelect = (type: 'movie' | 'tv') => {
    setSelectedType(type);
    // Otomatik geçiş - 300ms gecikme ile
    setTimeout(() => {
      navigation?.navigate?.('CompareGenre', { type });
    }, 300);
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
                <Text style={styles.title}>O mu? Bu mu?</Text>
              </LinearGradient>
              <View style={styles.titleGlow} />
            </View>
            <Text style={styles.subtitle}>Ne izlemek istersin?</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.option,
                selectedType === 'movie' && styles.optionSelected,
              ]}
              onPress={() => handleTypeSelect('movie')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedType === 'movie'
                    ? ['#E61806', '#c41505']
                    : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']
                }
                style={styles.optionGradient}
              >
                <View style={styles.iconWrapper}>
                  <View style={[
                    styles.iconGlow,
                    selectedType === 'movie' && styles.iconGlowActive
                  ]} />
                  <Ionicons
                    name="film"
                    size={56}
                    color={selectedType === 'movie' ? colors.white : colors.grayLight}
                  />
                </View>
                <Text
                  style={[
                    styles.optionText,
                    selectedType === 'movie' && styles.optionTextSelected,
                  ]}
                >
                  Film
                </Text>
              </LinearGradient>
              {selectedType === 'movie' && (
                <View style={styles.selectedBorder} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                selectedType === 'tv' && styles.optionSelected,
              ]}
              onPress={() => handleTypeSelect('tv')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedType === 'tv'
                    ? ['#E61806', '#c41505']
                    : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']
                }
                style={styles.optionGradient}
              >
                <View style={styles.iconWrapper}>
                  <View style={[
                    styles.iconGlow,
                    selectedType === 'tv' && styles.iconGlowActive
                  ]} />
                  <Ionicons
                    name="tv"
                    size={56}
                    color={selectedType === 'tv' ? colors.white : colors.grayLight}
                  />
                </View>
                <Text
                  style={[
                    styles.optionText,
                    selectedType === 'tv' && styles.optionTextSelected,
                  ]}
                >
                  Dizi
                </Text>
              </LinearGradient>
              {selectedType === 'tv' && (
                <View style={styles.selectedBorder} />
              )}
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  titleContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  titleGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 24,
  },
  titleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFA500',
    opacity: 0.3,
    borderRadius: 24,
    transform: [{ scale: 1.1 }],
    zIndex: -1,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1a0033',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  option: {
    borderRadius: 24,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  optionSelected: {
    shadowColor: '#E61806',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
    transform: [{ scale: 1.02 }],
  },
  optionGradient: {
    padding: spacing.xl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
  },
  iconGlowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  optionText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.grayLight,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  optionTextSelected: {
    color: colors.white,
  },
  selectedBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
});

export default CompareTypeScreen;
