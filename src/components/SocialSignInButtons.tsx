import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

// Dismiss browser after redirect
WebBrowser.maybeCompleteAuthSession();

interface Props {
  onGooglePress?: () => void;
  onApplePress?: () => void;
}

const SocialSignInButtons: React.FC<Props> = ({ onGooglePress, onApplePress }) => {
  const { signInWithToken } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Check Apple authentication availability
  React.useEffect(() => {
    checkAppleAvailability();
  }, []);

  const checkAppleAvailability = async () => {
    if (Platform.OS === 'ios') {
      const available = await AppleAuthentication.isAvailableAsync();
      setAppleAvailable(available);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const baseUrl = apiUrl?.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      
      // Create redirect URI for callback
      const redirectUri = AuthSession.makeRedirectUri({
        path: 'auth/callback',
      });
      
      console.log('🔵 Google OAuth initiated', { baseUrl, redirectUri });
      
      // Open browser to backend OAuth endpoint
      const authUrl = `${baseUrl}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success') {
        const { url } = result;

        // # fragment varsa temizle, sonra query string'i parse et
        const cleanUrl = url.split('#')[0];
        const queryString = cleanUrl.includes('?') ? cleanUrl.split('?')[1] : '';
        const params = new URLSearchParams(queryString);
        const token = params.get('token');
        const userJson = params.get('user');
        const error = params.get('error');

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (token && userJson) {
          try {
            const user = JSON.parse(decodeURIComponent(userJson));
            await signInWithToken(token, user);
            if (__DEV__) { console.log('✅ Google OAuth successful'); }
          } catch {
            throw new Error('Kullanıcı bilgisi işlenemedi');
          }
        } else {
          throw new Error('Missing token or user data');
        }
      } else if (result.type === 'dismiss') {
        console.log('ℹ️ User dismissed Google OAuth');
      }
    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      Alert.alert('Google Giriş Başarısız', error?.message || 'Bir hata oluştu');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('🍎 Apple credential received', { identityToken: credential.identityToken });
      
      // Send to backend
      const response = await authApi.appleSignIn(
        credential.identityToken,
        credential.fullName ? {
          email: credential.email || undefined,
          name: {
            firstName: credential.fullName.givenName || undefined,
            lastName: credential.fullName.familyName || undefined,
          },
        } : undefined
      );
      
      if (response?.token && response?.user) {
        await signInWithToken(response.token, response.user);
        console.log('✅ Apple Sign In successful');
      }
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('ℹ️ User canceled Apple Sign In');
      } else {
        console.error('❌ Apple Sign In failed:', error);
        Alert.alert('Apple Giriş Başarısız', error?.message || 'Bir hata oluştu');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Google Sign In Button */}
      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={onGooglePress || handleGoogleSignIn}
        disabled={googleLoading}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {googleLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="logo-google" size={20} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.googleButtonText}>
          {googleLoading ? 'Yükleniyor...' : 'Google hesabınla giriş yap'}
        </Text>
      </TouchableOpacity>

      {/* Apple Sign In Button - Only on iOS */}
      {Platform.OS === 'ios' && appleAvailable && (
        <TouchableOpacity
          style={[styles.button, styles.appleButton]}
          onPress={onApplePress || handleAppleSignIn}
          disabled={appleLoading}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            {appleLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.appleButtonText}>
            {appleLoading ? 'Yükleniyor...' : 'Apple hesabınla giriş yap'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  appleButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SocialSignInButtons;
