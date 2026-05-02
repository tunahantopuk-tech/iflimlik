import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Required for expo-auth-session to work properly
WebBrowser.maybeCompleteAuthSession();

interface Props {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const GoogleSignInButton: React.FC<Props> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const { googleSignIn } = useAuth();

  // Configure Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '748896774890-8kk9r4j4v3q3h7q8j9j9j9j9j9j9j9j9.apps.googleusercontent.com',
    iosClientId: '748896774890-iosiosiosiosiosiosiosiosiosiosios.apps.googleusercontent.com',
    webClientId: '748896774890-8kk9r4j4v3q3h7q8j9j9j9j9j9j9j9j9.apps.googleusercontent.com',
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      console.error('❌ Google Auth error:', response.error);
      Alert.alert('Hata', 'Google ile giriş başarısız oldu');
      setLoading(false);
      onError?.(new Error(response?.error?.message ?? 'Google authentication failed'));
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      console.log('ℹ️ Google Sign-In cancelled by user');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      console.log('🔵 Processing Google OAuth response...');

      const { authentication } = response;
      
      if (!authentication?.idToken) {
        throw new Error('No ID token received from Google');
      }

      console.log('✅ Google ID token obtained');

      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(authentication.idToken);
      
      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, credential);
      
      // Get Firebase ID token
      const firebaseIdToken = await userCredential?.user?.getIdToken();
      
      if (!firebaseIdToken) {
        throw new Error('Failed to get Firebase ID token');
      }

      console.log('✅ Firebase authentication successful');

      // Send token to backend
      await googleSignIn(firebaseIdToken);
      
      console.log('✅ Backend authentication successful');
      onSuccess?.();

    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      Alert.alert('Hata', error?.message ?? 'Google ile giriş başarısız oldu');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log('🔵 Google Sign-In button pressed');
      
      // Prompt user to sign in with Google
      await promptAsync();
      
    } catch (error) {
      console.error('❌ Failed to open Google Sign-In:', error);
      Alert.alert('Hata', 'Google giriş penceresi açılamadı');
      setLoading(false);
      onError?.(error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleSignIn}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.text}>Google ile Giriş Yap</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB4437', // Google red
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;
