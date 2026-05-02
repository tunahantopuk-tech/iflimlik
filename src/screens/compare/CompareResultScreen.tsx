import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../../theme';

type CompareStackParamList = {
  CompareType: undefined;
  CompareGenre: { type: 'movie' | 'tv' };
  CompareGame: { type: 'movie' | 'tv'; genre: string };
  CompareResult: { winner: any };
};

type CompareResultScreenNavigationProp = StackNavigationProp<CompareStackParamList, 'CompareResult'>;
type CompareResultScreenRouteProp = RouteProp<CompareStackParamList, 'CompareResult'>;

interface Props {
  navigation: CompareResultScreenNavigationProp;
  route: CompareResultScreenRouteProp;
}

const CompareResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { winner } = route?.params ?? { winner: null };

  const posterUrl = winner?.poster_path
    ? `https://image.tmdb.org/t/p/w500${winner.poster_path}`
    : 'https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Poster';

  const handlePlayAgain = () => {
    navigation?.navigate?.('CompareType');
  };

  return (
    <LinearGradient colors={['#1a0033', '#3b0066', '#5c0099']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Kazanan!</Text>

          {winner ? (
            <View style={styles.winnerContainer}>
              <Image
                source={{ uri: posterUrl }}
                style={styles.poster}
                resizeMode="cover"
              />
              
              <Text style={styles.winnerTitle}>
                {winner?.title ?? winner?.name ?? 'Unknown'}
              </Text>

              {winner?.vote_average && winner.vote_average > 0 ? (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {winner.vote_average.toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.tieText}>Berabere!</Text>
          )}

          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#E61806', '#c41505']}
              style={styles.playAgainGradient}
            >
              <Ionicons name="refresh" size={24} color={colors.white} />
              <Text style={styles.playAgainText}>Tekrar Oyna</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.white,
    marginBottom: spacing.xl,
  },
  winnerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  poster: {
    width: 200,
    height: 300,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  winnerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  tieText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xl * 2,
  },
  playAgainButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  playAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  playAgainText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CompareResultScreen;
