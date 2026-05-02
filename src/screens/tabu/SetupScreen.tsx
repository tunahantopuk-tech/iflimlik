import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { TabuStackParamList } from '../../navigation/TabuNavigator';

type SetupScreenNavigationProp = StackNavigationProp<TabuStackParamList, 'TabuSetup'>;

export default function SetupScreen({ navigation }: { navigation: SetupScreenNavigationProp }) {
  const [step, setStep] = useState(1);
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team1PlayerCount, setTeam1PlayerCount] = useState(0);
  const [team2PlayerCount, setTeam2PlayerCount] = useState(0);
  const [team1Players, setTeam1Players] = useState<string[]>([]);
  const [team2Players, setTeam2Players] = useState<string[]>([]);
  const [rounds, setRounds] = useState(0);

  const handleNext = () => {
    if (step === 1 && team1Name?.trim() && team2Name?.trim()) setStep(2);
    else if (step === 2 && team1PlayerCount > 0) { setTeam1Players(new Array(team1PlayerCount).fill('')); setStep(3); }
    else if (step === 3 && team1Players?.every(p => p?.trim())) setStep(4);
    else if (step === 4 && team2PlayerCount > 0) { setTeam2Players(new Array(team2PlayerCount).fill('')); setStep(5); }
    else if (step === 5 && team2Players?.every(p => p?.trim())) setStep(6);
    else if (step === 6 && rounds > 0) {
      navigation?.navigate?.('TabuGame', {
        team1Name, team2Name,
        team1Players: JSON.stringify(team1Players),
        team2Players: JSON.stringify(team2Players),
        rounds: rounds.toString(),
      });
    }
  };

  const updateTeam1Player = (idx: number, val: string) => {
    const newPlayers = [...team1Players];
    newPlayers[idx] = val;
    setTeam1Players(newPlayers);
  };

  const updateTeam2Player = (idx: number, val: string) => {
    const newPlayers = [...team2Players];
    newPlayers[idx] = val;
    setTeam2Players(newPlayers);
  };

  const canProceed = () => {
    if (step === 1) return team1Name?.trim() && team2Name?.trim();
    if (step === 2) return team1PlayerCount > 0;
    if (step === 3) return team1Players?.every(p => p?.trim());
    if (step === 4) return team2PlayerCount > 0;
    if (step === 5) return team2Players?.every(p => p?.trim());
    if (step === 6) return rounds > 0;
    return false;
  };

  return (
    <LinearGradient colors={['#0f0624', '#1a0f3e', '#2d1b4e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation?.goBack?.()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#9D4EDD" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ANLAT BAKALIM</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5, 6].map(s => (
              <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
            ))}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Ionicons name="people" size={60} color="#9D4EDD" style={styles.stepIcon} />
                <Text style={styles.stepTitle}>Takım İsimleri</Text>
                <TextInput style={styles.input} placeholder="1. Takım İsmi" placeholderTextColor="rgba(255,255,255,0.4)" value={team1Name} onChangeText={setTeam1Name} />
                <TextInput style={styles.input} placeholder="2. Takım İsmi" placeholderTextColor="rgba(255,255,255,0.4)" value={team2Name} onChangeText={setTeam2Name} />
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContainer}>
                <Ionicons name="person-add" size={60} color="#00D9FF" style={styles.stepIcon} />
                <Text style={styles.stepTitle}>{team1Name} - Oyuncu Sayısı</Text>
                <View style={styles.counterRow}>
                  {[1, 2, 3, 4, 5].map(c => (
                    <TouchableOpacity key={c} style={[styles.counterButton, team1PlayerCount === c && styles.counterButtonActive]} onPress={() => setTeam1PlayerCount(c)}>
                      <Text style={[styles.counterText, team1PlayerCount === c && styles.counterTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContainer}>
                <Ionicons name="create" size={60} color="#FF006E" style={styles.stepIcon} />
                <Text style={styles.stepTitle}>{team1Name} - Oyuncu İsimleri</Text>
                {team1Players?.map((p, idx) => (
                  <TextInput key={idx} style={styles.input} placeholder={`${idx + 1}. Oyuncu`} placeholderTextColor="rgba(255,255,255,0.4)" value={p} onChangeText={v => updateTeam1Player(idx, v)} />
                ))}
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContainer}>
                <Ionicons name="person-add" size={60} color="#00D9FF" style={styles.stepIcon} />
                <Text style={styles.stepTitle}>{team2Name} - Oyuncu Sayısı</Text>
                <View style={styles.counterRow}>
                  {[1, 2, 3, 4, 5].map(c => (
                    <TouchableOpacity key={c} style={[styles.counterButton, team2PlayerCount === c && styles.counterButtonActive]} onPress={() => setTeam2PlayerCount(c)}>
                      <Text style={[styles.counterText, team2PlayerCount === c && styles.counterTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {step === 5 && (
              <View style={styles.stepContainer}>
                <Ionicons name="create" size={60} color="#FF006E" style={styles.stepIcon} />
                <Text style={styles.stepTitle}>{team2Name} - Oyuncu İsimleri</Text>
                {team2Players?.map((p, idx) => (
                  <TextInput key={idx} style={styles.input} placeholder={`${idx + 1}. Oyuncu`} placeholderTextColor="rgba(255,255,255,0.4)" value={p} onChangeText={v => updateTeam2Player(idx, v)} />
                ))}
              </View>
            )}

            {step === 6 && (
              <View style={styles.stepContainer}>
                <Ionicons name="timer" size={60} color="#9D4EDD" style={styles.stepIcon} />
                <Text style={styles.stepTitle}>Tur Sayısı</Text>
                <View style={styles.roundsGrid}>
                  {[5, 10, 15, 20, 25, 30].map(r => (
                    <TouchableOpacity key={r} style={[styles.roundButton, rounds === r && styles.roundButtonActive]} onPress={() => setRounds(r)}>
                      <Text style={[styles.roundText, rounds === r && styles.roundTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]} onPress={handleNext} disabled={!canProceed()}>
            <LinearGradient colors={canProceed() ? ['#9D4EDD', '#7B2CBF'] : ['#555', '#333']} style={styles.nextButtonGradient}>
              <Text style={styles.nextButtonText}>{step === 6 ? 'OYUNU BAŞLAT' : 'İLERİ'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(157,78,221,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#9D4EDD', letterSpacing: 2 },
  placeholder: { width: 40 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  progressDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(157,78,221,0.2)' },
  progressDotActive: { backgroundColor: '#9D4EDD' },
  content: { flex: 1, paddingHorizontal: 20 },
  stepContainer: { alignItems: 'center', paddingVertical: 20 },
  stepIcon: { marginBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 24, textAlign: 'center' },
  input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(157,78,221,0.2)' },
  counterRow: { flexDirection: 'row', gap: 12 },
  counterButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(157,78,221,0.2)' },
  counterButtonActive: { backgroundColor: '#9D4EDD', borderColor: '#9D4EDD' },
  counterText: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  counterTextActive: { color: '#fff' },
  roundsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  roundButton: { width: 80, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(157,78,221,0.2)' },
  roundButtonActive: { backgroundColor: '#9D4EDD', borderColor: '#9D4EDD' },
  roundText: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  roundTextActive: { color: '#fff' },
  nextButton: { marginHorizontal: 20, marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  nextButtonText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
});
