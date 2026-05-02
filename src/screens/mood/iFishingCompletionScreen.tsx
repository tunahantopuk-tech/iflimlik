import React, { useEffect, useRef } from 'react';
import { scaledFont, scaleW, scaleH, isSmallScreen } from '../../utils/responsive';
import { lockActivity } from '../../services/activityLockService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types';
import { colors, typography, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type iFishingCompletionScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'iFishingCompletion'>;

interface Props {
  navigation: iFishingCompletionScreenNavigationProp;
}

const iFishingCompletionScreen: React.FC<Props> = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoHome = async () => {
    await lockActivity('ifishing');
    navigation?.navigate?.('HomeScreen');
  };

  return (
    <LinearGradient
      colors={['#E61806', '#8f0083', '#3b0036']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Trophy Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.iconGradient}
            >
              <Ionicons name="trophy" size={80} color="#fff" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>iFishing Tamamlandı!</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            🎣 Harika iş çıkardın! Film önerilerimizi beğendiğini umuyoruz.
          </Text>

          {/* Fish Coins Earned */}
          <View style={styles.rewardContainer}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.1)']}
              style={styles.rewardCard}
            >
              <Text style={styles.rewardIcon}>🐟</Text>
              <Text style={styles.rewardText}>Film keşfini tamamladın!</Text>
            </LinearGradient>
          </View>

          {/* Home Button */}
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.homeButtonGradient}
            >
              <Ionicons name="home" size={24} color="#fff" style={styles.homeIcon} />
              <Text style={styles.homeButtonText}>Ana Sayfa</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Decorative Elements */}
          <View style={styles.decorativeContainer}>
            <Text style={styles.decorativeEmoji}>🎬</Text>
            <Text style={styles.decorativeEmoji}>🍿</Text>
            <Text style={styles.decorativeEmoji}>⭐</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: scaledFont(36),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 26,
    paddingHorizontal: spacing.md,
  },
  rewardContainer: {
    width: '100%',
    marginBottom: spacing.xl * 2,
  },
  rewardCard: {
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: scaledFont(48),
    marginBottom: spacing.sm,
  },
  rewardText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    textAlign: 'center',
  },
  homeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  homeIcon: {
    marginRight: spacing.sm,
  },
  homeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  decorativeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.xl * 2,
    opacity: 0.6,
  },
  decorativeEmoji: {
    fontSize: scaledFont(32),
  },
});

export default iFishingCompletionScreen;
