import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme';
import { Cast } from '../types';

interface CastAvatarProps {
  cast: Cast;
}

export const CastAvatar: React.FC<CastAvatarProps> = ({ cast }) => {
  const profileUrl = cast?.profile_path
    ? `https://image.tmdb.org/t/p/w185${cast.profile_path}`
    : 'https://upload.wikimedia.org/wikipedia/commons/2/24/Missing_avatar.svg';

  return (
    <View style={styles.container}>
      <Image source={{ uri: profileUrl }} style={styles.avatar} />
      <Text style={styles.name} numberOfLines={2}>
        {cast?.name ?? 'Unknown'}
      </Text>
      <Text style={styles.character} numberOfLines={2}>
        {cast?.character ?? ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    backgroundColor: colors.backgroundCard,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  character: {
    ...typography.caption,
    color: colors.gray,
    marginTop: 2,
    textAlign: 'center',
  },
});
