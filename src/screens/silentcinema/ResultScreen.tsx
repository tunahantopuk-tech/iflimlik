import React from 'react';
import { scaledFont, scaleW, scaleH, isSmallScreen } from '../../utils/responsive';
import { lockActivity } from '../../services/activityLockService';
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
import { SilentCinemaStackParamList } from '../../navigation/SilentCinemaNavigator';

type ResultScreenNavigationProp = StackNavigationProp<
  SilentCinemaStackParamList,
  'SilentCinemaResult'
>;

type ResultScreenRouteProp = RouteProp<SilentCinemaStackParamList, 'SilentCinemaResult'>;

interface ResultScreenProps {
  navigation: ResultScreenNavigationProp;
  route: ResultScreenRouteProp;
}

export default function ResultScreen({ navigation, route }: ResultScreenProps) {
  const { 
    team1Name, 
    team2Name, 
    team1Score, 
    team2Score, 
    team1Players, 
    team2Players,
    team1PlayerScores,
    team2PlayerScores
  } = route?.params ?? {};
  
  const team1ScoreNum = parseInt(team1Score ?? '0', 10);
  const team2ScoreNum = parseInt(team2Score ?? '0', 10);
  
  // Parse player arrays
  const team1PlayersArray = JSON.parse(team1Players ?? '[]');
  const team2PlayersArray = JSON.parse(team2Players ?? '[]');
  
  // Parse player scores
  const team1PlayerScoresArray = JSON.parse(team1PlayerScores ?? '[]');
  const team2PlayerScoresArray = JSON.parse(team2PlayerScores ?? '[]');

  const winner =
    team1ScoreNum > team2ScoreNum
      ? team1Name
      : team2ScoreNum > team1ScoreNum
        ? team2Name
        : 'Berabere';
  
  const isTeam1Winner = team1ScoreNum > team2ScoreNum;
  const isTeam2Winner = team2ScoreNum > team1ScoreNum;

  const handlePlayAgain = () => {
    navigation?.navigate?.('SilentCinemaSetup');
  };

  const handleGoHome = async () => {
    await lockActivity('silentcinema');
    navigation?.navigate?.('HomeScreen' as any);
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Winner Animation */}
        <View style={styles.animationContainer}>
          {winner !== 'Berabere' ? (
            <>
              <Ionicons name="trophy" size={120} color="#FFD700" />
              <Text style={styles.congratsText}>Tebrikler!</Text>
              <Text style={styles.winnerText}>{winner}</Text>
              <Text style={styles.winnerSubtext}>Kazandı! 🎉</Text>
            </>
          ) : (
            <>
              <Ionicons name="people" size={120} color="#FFD700" />
              <Text style={styles.congratsText}>Berabere!</Text>
              <Text style={styles.winnerSubtext}>İki takım da harika oynadı! 🤝</Text>
            </>
          )}
        </View>

        {/* Final Scores */}
        <View style={styles.scoresContainer}>
          <Text style={styles.scoresTitle}>Final Skorları</Text>

          <View style={styles.scoreRow}>
            <View style={styles.teamScoreContainer}>
              <Text style={styles.teamName}>{team1Name}</Text>
              <View style={[styles.scoreBox, isTeam1Winner && styles.scoreBoxWinner]}>
                <Text style={styles.finalScore}>{team1ScoreNum}</Text>
              </View>
            </View>

            <Text style={styles.vs}>VS</Text>

            <View style={styles.teamScoreContainer}>
              <Text style={styles.teamName}>{team2Name}</Text>
              <View style={[styles.scoreBox, isTeam2Winner && styles.scoreBoxWinner]}>
                <Text style={styles.finalScore}>{team2ScoreNum}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Team Rosters - Scoreboard Style */}
        <View style={styles.rosterContainer}>
          <Text style={styles.rosterTitle}>📋 Takım Kadroları</Text>
          
          <View style={styles.teamsRow}>
            {/* Team 1 */}
            <View style={[styles.teamRoster, isTeam1Winner && styles.teamRosterWinner]}>
              <View style={styles.teamHeader}>
                <Text style={styles.teamHeaderText}>{team1Name}</Text>
                {isTeam1Winner && <Ionicons name="trophy" size={20} color="#FFD700" />}
              </View>
              <View style={styles.playersList}>
                {team1PlayersArray?.map?.((player: string, index: number) => (
                  <View key={index} style={styles.playerItem}>
                    <View style={styles.playerInfo}>
                      <Ionicons name="person" size={14} color="#FFD700" />
                      <Text style={styles.playerName}>{player}</Text>
                    </View>
                    <View style={styles.playerScoreBadge}>
                      <Text style={styles.playerScoreText}>
                        {team1PlayerScoresArray?.[index] ?? 0} puan
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Team 2 */}
            <View style={[styles.teamRoster, isTeam2Winner && styles.teamRosterWinner]}>
              <View style={styles.teamHeader}>
                <Text style={styles.teamHeaderText}>{team2Name}</Text>
                {isTeam2Winner && <Ionicons name="trophy" size={20} color="#FFD700" />}
              </View>
              <View style={styles.playersList}>
                {team2PlayersArray?.map?.((player: string, index: number) => (
                  <View key={index} style={styles.playerItem}>
                    <View style={styles.playerInfo}>
                      <Ionicons name="person" size={14} color="#FFD700" />
                      <Text style={styles.playerName}>{player}</Text>
                    </View>
                    <View style={styles.playerScoreBadge}>
                      <Text style={styles.playerScoreText}>
                        {team2PlayerScoresArray?.[index] ?? 0} puan
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handlePlayAgain}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.buttonGradient}
            >
              <Ionicons name="refresh" size={24} color="#000" />
              <Text style={styles.buttonText}>Tekrar Oyna</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleGoHome}>
            <LinearGradient
              colors={['#4A5568', '#2D3748']}
              style={styles.buttonGradient}
            >
              <Ionicons name="home" size={24} color="#fff" />
              <Text style={[styles.buttonText, { color: '#fff' }]}>Ana Sayfa</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  congratsText: {
    fontSize: scaledFont(28),
    fontWeight: '700',
    color: '#FFD700',
    marginTop: 20,
  },
  winnerText: {
    fontSize: scaledFont(36),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  winnerSubtext: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
  },
  scoresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 24,
    marginBottom: 40,
  },
  scoresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamScoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoreBoxWinner: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  finalScore: {
    fontSize: scaledFont(48),
    fontWeight: '700',
    color: '#FFD700',
  },
  vs: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 20,
  },
  buttonsContainer: {
    gap: 15,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  rosterContainer: {
    marginBottom: 30,
  },
  rosterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  teamRoster: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  teamRosterWinner: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  teamHeader: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  teamHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  playersList: {
    padding: 12,
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 6,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  playerScoreBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  playerScoreText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700',
  },
});
