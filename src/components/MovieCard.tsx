import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, typography, shadows } from '../theme';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onPress: () => void;
}

const MovieCardComponent: React.FC<MovieCardProps> = ({ movie, onPress }) => {
  const posterUrl = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;

  const title = movie?.title || movie?.name || 'Unknown';
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const year = movie?.release_date
    ? new Date(movie.release_date).getFullYear()
    : movie?.first_air_date
    ? new Date(movie.first_air_date).getFullYear()
    : '';

  if (!posterUrl) {
    return null;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      <View style={styles.posterContainer}>
        <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          style={styles.gradient}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rating}
          >
            <Text style={styles.ratingText}>⭐ {rating}</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {year ? <Text style={styles.year}>{year}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

export const MovieCard = memo(MovieCardComponent);

const styles = StyleSheet.create({
  container: {
    width: 155,
    marginRight: spacing.md,
  },
  posterContainer: {
    width: 155,
    height: 230,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.backgroundCard,
    ...shadows.large,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  rating: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  info: {
    marginTop: spacing.sm + 2,
  },
  title: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  year: {
    ...typography.caption,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '600',
  },
});
