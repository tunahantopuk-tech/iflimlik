import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  Alert,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../api/user';
import { UserStats } from '../../types';
import { GlassCard, GradientButton } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState<UserStats>({});
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    setUsername(user?.username ?? '');
  }, [user]);

  const loadData = async () => {
    try {
      await refreshUser();
      const statsData = await userApi.getStats();
      setStats(statsData ?? {});
      // Rastgele popüler film backdrop'u çek
      if (!backdropUrl) {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=6095875&language=tr-TR&page=${randomPage}`)
          .then(r => r.json())
          .then(data => {
            const withBackdrop = (data?.results ?? []).filter((m: any) => m?.backdrop_path);
            if (withBackdrop.length > 0) {
              const random = withBackdrop[Math.floor(Math.random() * withBackdrop.length)];
              setBackdropUrl(`https://image.tmdb.org/t/p/w780${random.backdrop_path}`);
            }
          })
          .catch(() => {});
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraflarınıza erişmek için izin gerekiyor');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result?.canceled && result?.assets?.[0]?.uri) {
        // In a real app, you'd upload this to a server
        // For now, just update locally
        await userApi.updateProfile(user?.username, result.assets[0].uri);
        await refreshUser();
        Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi');
      }
    } catch (error) {
      Alert.alert('Hata', error?.message ?? 'Fotoğraf güncellenemedi');
    }
  };

  const handleSaveProfile = async () => {
    if (!username?.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı boş bırakılamaz');
      return;
    }

    setLoading(true);
    try {
      await userApi.updateProfile(username.trim(), user?.photoURL);
      await refreshUser();
      setEditing(false);
      Alert.alert('Başarılı', 'Profil başarıyla güncellendi');
    } catch (error) {
      Alert.alert('Hata', error?.message ?? 'Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz. Tüm verileriniz (listeleriniz, favorileriniz, izledikleriniz) silinecek. Devam etmek istiyor musunuz?'
      );
      if (confirmed) {
        deleteAccountConfirmed();
      }
    } else {
      Alert.alert(
        'Hesabı Sil',
        'Hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz. Tüm verileriniz (listeleriniz, favorileriniz, izledikleriniz) silinecek. Devam etmek istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Hesabı Sil',
            style: 'destructive',
            onPress: deleteAccountConfirmed,
          },
        ]
      );
    }
  };

  const deleteAccountConfirmed = async () => {
    try {
      await userApi.deleteAccount();
      Alert.alert('Başarılı', 'Hesabınız başarıyla silindi.');
      await logout();
    } catch (error) {
      Alert.alert('Hata', 'Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Çıkış yapmak istediğinizden emin misiniz?');
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]);
    }
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Backdrop Header */}
        <View style={styles.backdropContainer}>
          {backdropUrl ? (
            <Image source={{ uri: backdropUrl }} style={styles.backdropImage} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#1a0a2e', '#2d1b4e', '#0a0a14']} style={styles.backdropImage} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(10,10,20,1)']}
            style={styles.backdropGradient}
            locations={[0, 0.6, 1]}
          />
        </View>

        <View style={styles.content}>
          {/* Avatar — backdrop üstüne yerleştirildi */}
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(user?.username ?? user?.email ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>

          <GlassCard style={styles.infoCard}>
            {editing ? (
              <View>
                <Text style={styles.label}>Kullanıcı Adı</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditing(false);
                      setUsername(user?.username ?? '');
                    }}
                  >
                    <Text style={styles.cancelText}>İptal</Text>
                  </TouchableOpacity>
                  <GradientButton
                    title="Kaydet"
                    onPress={handleSaveProfile}
                    loading={loading}
                    style={styles.saveButton}
                  />
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Kullanıcı Adı</Text>
                  <TouchableOpacity onPress={() => setEditing(true)}>
                    <Ionicons name="pencil" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoValue}>{user?.username ?? '—'}</Text>

                <View style={styles.divider} />

                <Text style={styles.infoLabel}>E-posta</Text>
                <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
              </View>
            )}
          </GlassCard>

          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <View style={styles.statsContainer}>
            <GlassCard style={styles.statCard}>
              <Ionicons name="bookmark" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{stats?.watchlistCount ?? 0}</Text>
              <Text style={styles.statLabel}>İzleme Listesi</Text>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <Ionicons name="heart" size={32} color={colors.secondary} />
              <Text style={styles.statValue}>{stats?.favoritesCount ?? 0}</Text>
              <Text style={styles.statLabel}>Favoriler</Text>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.accent} />
              <Text style={styles.statValue}>{stats?.watchedCount ?? 0}</Text>
              <Text style={styles.statLabel}>İzlenenler</Text>
            </GlassCard>
          </View>

          {/* İstatistikler & Rozetler butonu */}
          <TouchableOpacity
            style={styles.statsDetailButton}
            onPress={() => navigation?.navigate?.('Stats' as never)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(157,78,221,0.2)', 'rgba(230,24,6,0.15)']}
              style={styles.statsDetailGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="bar-chart-outline" size={22} color="#9D4EDD" />
              <View style={{ flex: 1 }}>
                <Text style={styles.statsDetailTitle}>Detaylı İstatistikler & Rozetler</Text>
                <Text style={styles.statsDetailSub}>İzleme süren, film/dizi rozetlerin</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={24} color="#FF3B30" />
            <Text style={styles.deleteAccountText}>Hesabı Sil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color={colors.white} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>

          {/* About Link */}
          <TouchableOpacity
            style={styles.privacyLink}
            onPress={() => navigation?.navigate?.('About' as never)}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.privacyText}>Hakkında</Text>
          </TouchableOpacity>

          <View style={styles.footer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backdropContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#292929',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  logo: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
  },
  avatarContainer: {
    alignSelf: 'flex-start',
    marginTop: -55,
    marginLeft: spacing.md,
    marginBottom: 8,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.round,
    backgroundColor: colors.backgroundCard,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.round,
    backgroundColor: colors.backgroundCard,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.gray,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.lg,
  },
  statValue: {
    ...typography.h2,
    color: colors.white,
    marginVertical: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray,
  },

  statsDetailButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(157,78,221,0.3)',
  },
  statsDetailGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  statsDetailTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statsDetailSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF3B30',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  privacyText: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
    textDecorationLine: 'underline',
    textDecorationColor: colors.white,
  },
  footer: {
    height: spacing.xl,
  },
});

export default ProfileScreen;