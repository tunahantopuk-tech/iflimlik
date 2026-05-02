// @ts-nocheck
import React, { useState } from 'react';
import { scaledFont, scaleW, scaleH, isSmallScreen } from '../../utils/responsive';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';
import { userApi } from '../../api/user';
import { GradientButton, GlassCard } from '../../components';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';
import { tr } from '../../locales/tr';

type MoodSelectionScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'MoodSelection'>;

interface Props {
  navigation: MoodSelectionScreenNavigationProp;
}

const MOODS = [
  { id: 'happy', label: tr.mood.happy, emoji: '😊' },
  { id: 'sad', label: tr.mood.sad, emoji: '😢' },
  { id: 'excited', label: tr.mood.excited, emoji: '🤩' },
  { id: 'romantic', label: tr.mood.romantic, emoji: '💕' },
  { id: 'stressed', label: tr.mood.stressed, emoji: '😰' },
  { id: 'relaxed', label: tr.mood.relaxed, emoji: '😌' },
];

const CONTENT_TYPES = [
  { id: 'movie', label: tr.mood.movie, emoji: '🎬' },
  { id: 'tv', label: tr.mood.tvShow, emoji: '📺' },
  { id: 'either', label: tr.mood.either, emoji: '🎭' },
];

const GENRES = [
  { id: 'action', label: tr.mood.action },
  { id: 'drama', label: tr.mood.drama },
  { id: 'sci-fi', label: tr.mood.sciFi },
  { id: 'comedy', label: tr.mood.comedy },
  { id: 'thriller', label: tr.mood.thriller },
  { id: 'romance', label: tr.mood.romance },
  { id: 'horror', label: tr.mood.horror },
  { id: 'animation', label: tr.mood.animation },
];

const MoodSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 1 && !selectedMood) {
      Alert.alert(tr.mood.selectMood, tr.mood.selectMoodError);
      return;
    }
    if (step === 2 && !selectedType) {
      Alert.alert(tr.mood.selectType, tr.mood.selectTypeError);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // Auto advance when selection is made
  const handleMoodSelection = (moodId: string) => {
    setSelectedMood(moodId);
    setTimeout(() => {
      setStep(2);
    }, 300);
  };

  const handleTypeSelection = (typeId: string) => {
    setSelectedType(typeId);
    setTimeout(() => {
      setStep(3);
    }, 300);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation?.goBack?.();
    }
  };

  const handleSkip = () => {
    navigation?.goBack?.();
  };

  const handleSubmit = async () => {
    if (!selectedGenre) {
      Alert.alert(tr.mood.selectGenre, tr.mood.selectGenreError);
      return;
    }

    setLoading(true);
    try {
      await userApi.saveMood(selectedMood, selectedType, selectedGenre);
      // Navigate to MoodRecommendations screen
      navigation?.navigate?.('MoodRecommendations', {
        mood: selectedMood,
        type: selectedType,
        genre: selectedGenre,
      } as never);
    } catch (error) {
      Alert.alert(tr.common.error, error?.message ?? 'Failed to save mood');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>{tr.mood.step1}</Text>
            <View style={styles.optionsGrid}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => handleMoodSelection(mood.id)}
                  style={styles.optionButton}
                  activeOpacity={0.8}
                >
                  <GlassCard
                    style={[
                      styles.optionCard,
                      selectedMood === mood.id && styles.selectedCard,
                    ]}
                  >
                    <Text style={styles.emoji}>{mood.emoji}</Text>
                    <Text style={styles.optionLabel}>{mood.label}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>{tr.mood.step2}</Text>
            <View style={styles.optionsGrid}>
              {CONTENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleTypeSelection(type.id)}
                  style={styles.optionButton}
                  activeOpacity={0.8}
                >
                  <GlassCard
                    style={[
                      styles.optionCard,
                      selectedType === type.id && styles.selectedCard,
                    ]}
                  >
                    <Text style={styles.emoji}>{type.emoji}</Text>
                    <Text style={styles.optionLabel}>{type.label}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.question}>{tr.mood.step3}</Text>
            <View style={styles.optionsGrid}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre.id}
                  onPress={() => setSelectedGenre(genre.id)}
                  style={styles.optionButton}
                  activeOpacity={0.8}
                >
                  <GlassCard
                    style={[
                      styles.genreCard,
                      selectedGenre === genre.id && styles.selectedCard,
                    ]}
                  >
                    <Text style={styles.genreLabel}>{genre.label}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#E61806', '#8f0083', '#3b0036']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🐟 iFishing</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{tr.mood.skip}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {renderStep()}

        {step === 3 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>{tr.mood.back}</Text>
            </TouchableOpacity>
            <GradientButton
              title="🐟 iFishing"
              onPress={handleSubmit}
              loading={loading}
              style={styles.nextButton}
            />
          </View>
        )}

        {step < 3 && (
          <View style={styles.singleButtonContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>{step === 1 ? tr.mood.cancel : tr.mood.back}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: scaledFont(32),
    fontWeight: '700',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  progressDotActive: {
    backgroundColor: colors.white,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 1.2 }],
  },
  stepContent: {
    flex: 1,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xxl,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: 32,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  optionButton: {
    width: '45%',
    marginBottom: spacing.sm,
  },
  optionCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedCard: {
    borderColor: '#FFD700',
    borderWidth: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  emoji: {
    fontSize: scaledFont(56),
    marginBottom: spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  genreCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  genreLabel: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  singleButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.xxl,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
  },
});

export default MoodSelectionScreen;