import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing } from '../theme';

export const ShimmerCard: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.shimmer}>
        <LinearGradient
          colors={[colors.backgroundCard, colors.backgroundSecondary, colors.backgroundCard]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </View>
      <View style={styles.textContainer}>
        <View style={[styles.textShimmer, styles.titleShimmer]}>
          <LinearGradient
            colors={[colors.backgroundCard, colors.backgroundSecondary, colors.backgroundCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </View>
        <View style={[styles.textShimmer, styles.yearShimmer]}>
          <LinearGradient
            colors={[colors.backgroundCard, colors.backgroundSecondary, colors.backgroundCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: spacing.md,
  },
  shimmer: {
    width: 140,
    height: 210,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundCard,
  },
  gradient: {
    flex: 1,
  },
  textContainer: {
    marginTop: spacing.sm,
  },
  textShimmer: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.backgroundCard,
  },
  titleShimmer: {
    height: 16,
    marginBottom: 4,
  },
  yearShimmer: {
    height: 12,
    width: 40,
  },
});