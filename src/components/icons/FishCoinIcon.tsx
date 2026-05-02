import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  size?: number;
  showGlow?: boolean;
}

const FishCoinIcon: React.FC<Props> = ({ size = 24, showGlow = false }) => {
  return (
    <View style={styles.container}>
      {showGlow && (
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FFD700']}
          style={[
            styles.glow,
            {
              width: size + 8,
              height: size + 8,
              borderRadius: (size + 8) / 2,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <View
        style={[
          styles.coinContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          style={[
            styles.coinGradient,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name="fish"
            size={size * 0.6}
            color="white"
            style={styles.icon}
          />
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    opacity: 0.3,
  },
  coinContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  coinGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default FishCoinIcon;
