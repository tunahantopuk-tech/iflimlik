import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../theme';

const SplashScreen = () => {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(20)).current;
  const loaderFade = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline entrance (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(taglineSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    // Loader fade in (more delayed)
    setTimeout(() => {
      Animated.timing(loaderFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Continuous glow pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  return (
    <LinearGradient 
      colors={['#0a0a0f', '#1a0a1f', '#0f0515', '#050508']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background glow effect */}
      <View style={styles.glowContainer}>
        <Animated.View 
          style={[
            styles.glowCircle,
            {
              transform: [{ scale: glowPulse }],
              opacity: logoOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(230, 24, 6, 0.4)', 'rgba(157, 78, 221, 0.3)', 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </View>

      <View style={styles.content}>
        {/* Logo with premium shadow */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoShadow}>
            <Image 
              source={require('../../assets/ifilmlik-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
        
        {/* Premium tagline with gradient text effect */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineFade,
              transform: [{ translateY: taglineSlide }],
            },
          ]}
        >
          <Text style={styles.tagline}>
            Yapay Zeka Asistanı{' '}
            <Text style={styles.taglineHighlight}>"iFi"</Text>{' '}
            ile{'\n'}
            Filmini Bul, Filmliğini Oluştur ve{'\n'}
            Arkadaşlarınla Eğlen
          </Text>
        </Animated.View>
        
        {/* Premium loader */}
        <Animated.View 
          style={[
            styles.loaderContainer,
            { opacity: loaderFade },
          ]}
        >
          <ActivityIndicator size="large" color="#E61806" style={styles.loader} />
          <Text style={styles.loadingText}>Hazırlanıyor...</Text>
        </Animated.View>
      </View>

      {/* Bottom shine effect */}
      <LinearGradient
        colors={['transparent', 'rgba(230, 24, 6, 0.05)', 'transparent']}
        style={styles.bottomShine}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    transform: [{ translateX: -200 }],
  },
  glowCircle: {
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoShadow: {
    shadowColor: '#E61806',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoImage: {
    width: 240,
    height: 240,
  },
  taglineContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    paddingHorizontal: spacing.md,
  },
  taglineHighlight: {
    fontWeight: '900',
    color: '#E61806',
    fontSize: 18,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(230, 24, 6, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  loaderContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  loader: {
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bottomShine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
});

export default SplashScreen;