import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SilentCinemaStackParamList } from '../../navigation/SilentCinemaNavigator';

type SetupScreenNavigationProp = StackNavigationProp<
  SilentCinemaStackParamList,
  'SilentCinemaSetup'
>;

interface SetupScreenProps {
  navigation: SetupScreenNavigationProp;
}

export default function SetupScreen({ navigation }: SetupScreenProps) {
  const [step, setStep] = useState<number>(1);
  const [team1Name, setTeam1Name] = useState<string>('');
  const [team2Name, setTeam2Name] = useState<string>('');
  const [team1PlayerCount, setTeam1PlayerCount] = useState<number>(0);
  const [team2PlayerCount, setTeam2PlayerCount] = useState<number>(0);
  const [team1Players, setTeam1Players] = useState<string[]>([]);
  const [team2Players, setTeam2Players] = useState<string[]>([]);
  const [rounds, setRounds] = useState<number>(0);

  const handleNext = () => {
    if (step === 1 && team1Name?.trim() && team2Name?.trim()) {
      setStep(2);
    } else if (step === 2 && team1PlayerCount > 0) {
      setTeam1Players(new Array(team1PlayerCount).fill(''));
      setStep(3);
    } else if (step === 3 && team1Players?.every((p) => p?.trim())) {
      setStep(4);
    } else if (step === 4 && team2PlayerCount > 0) {
      setTeam2Players(new Array(team2PlayerCount).fill(''));
      setStep(5);
    } else if (step === 5 && team2Players?.every((p) => p?.trim())) {
      setStep(6);
    } else if (step === 6 && rounds > 0) {
      // Navigate to game screen with setup data
      navigation?.navigate?.('SilentCinemaGame', {
        team1Name,
        team2Name,
        team1Players: JSON.stringify(team1Players),
        team2Players: JSON.stringify(team2Players),
        rounds: rounds.toString(),
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation?.goBack?.();
    }
  };

  const updateTeam1Player = (index: number, value: string) => {
    const newPlayers = [...team1Players];
    newPlayers[index] = value;
    setTeam1Players(newPlayers);
  };

  const updateTeam2Player = (index: number, value: string) => {
    const newPlayers = [...team2Players];
    newPlayers[index] = value;
    setTeam2Players(newPlayers);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return team1Name?.trim() && team2Name?.trim();
      case 2:
        return team1PlayerCount > 0;
      case 3:
        return team1Players?.every((p) => p?.trim());
      case 4:
        return team2PlayerCount > 0;
      case 5:
        return team2Players?.every((p) => p?.trim());
      case 6:
        return rounds > 0;
      default:
        return false;
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sessiz Sinema - Kurulum</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step 1: Team Names */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Takım İsimlerini Girin</Text>
                <Text style={styles.stepSubtitle}>İki takımın adını belirleyin</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>1. Takım Adı</Text>
                  <TextInput
                    style={styles.input}
                    value={team1Name}
                    onChangeText={setTeam1Name}
                    placeholder="Örn: Yıldızlar"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    autoFocus
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>2. Takım Adı</Text>
                  <TextInput
                    style={styles.input}
                    value={team2Name}
                    onChangeText={setTeam2Name}
                    placeholder="Örn: Şampiyonlar"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                </View>
              </View>
            )}

            {/* Step 2: Team 1 Player Count */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>{team1Name} - Oyuncu Sayısı</Text>
                <Text style={styles.stepSubtitle}>Kaç kişi oynayacak? (En fazla 5)</Text>

                <View style={styles.buttonGrid}>
                  {[1, 2, 3, 4, 5].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.gridButton,
                        team1PlayerCount === count && styles.gridButtonActive,
                      ]}
                      onPress={() => setTeam1PlayerCount(count)}
                    >
                      <Text
                        style={[
                          styles.gridButtonText,
                          team1PlayerCount === count && styles.gridButtonTextActive,
                        ]}
                      >
                        {count} Kişi
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 3: Team 1 Player Names */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>{team1Name} - Oyuncu İsimleri</Text>
                <Text style={styles.stepSubtitle}>Oyuncuların isimlerini girin</Text>

                {team1Players?.map((player, index) => (
                  <View key={index} style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{index + 1}. Oyuncu</Text>
                    <TextInput
                      style={styles.input}
                      value={player}
                      onChangeText={(value) => updateTeam1Player(index, value)}
                      placeholder={`Oyuncu ${index + 1}`}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      autoFocus={index === 0}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Step 4: Team 2 Player Count */}
            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>{team2Name} - Oyuncu Sayısı</Text>
                <Text style={styles.stepSubtitle}>Kaç kişi oynayacak? (En fazla 5)</Text>

                <View style={styles.buttonGrid}>
                  {[1, 2, 3, 4, 5].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.gridButton,
                        team2PlayerCount === count && styles.gridButtonActive,
                      ]}
                      onPress={() => setTeam2PlayerCount(count)}
                    >
                      <Text
                        style={[
                          styles.gridButtonText,
                          team2PlayerCount === count && styles.gridButtonTextActive,
                        ]}
                      >
                        {count} Kişi
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 5: Team 2 Player Names */}
            {step === 5 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>{team2Name} - Oyuncu İsimleri</Text>
                <Text style={styles.stepSubtitle}>Oyuncuların isimlerini girin</Text>

                {team2Players?.map((player, index) => (
                  <View key={index} style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{index + 1}. Oyuncu</Text>
                    <TextInput
                      style={styles.input}
                      value={player}
                      onChangeText={(value) => updateTeam2Player(index, value)}
                      placeholder={`Oyuncu ${index + 1}`}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      autoFocus={index === 0}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Step 6: Rounds */}
            {step === 6 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Tur Sayısı</Text>
                <Text style={styles.stepSubtitle}>Kaç tur oynanacak?</Text>

                <View style={styles.buttonGrid}>
                  {[5, 10, 15, 20, 25, 30].map((roundCount) => (
                    <TouchableOpacity
                      key={roundCount}
                      style={[
                        styles.gridButton,
                        rounds === roundCount && styles.gridButtonActive,
                      ]}
                      onPress={() => setRounds(roundCount)}
                    >
                      <Text
                        style={[
                          styles.gridButtonText,
                          rounds === roundCount && styles.gridButtonTextActive,
                        ]}
                      >
                        {roundCount} Tur
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Next Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={
                  canProceed()
                    ? ['#FFD700', '#FFA500']
                    : ['#666', '#444']
                }
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>
                  {step === 6 ? 'Oyuna Başla' : 'İleri'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  progressDotActive: {
    backgroundColor: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: -10,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  gridButton: {
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  gridButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  gridButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  gridButtonTextActive: {
    color: '#000',
  },
  buttonContainer: {
    padding: 20,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
});
