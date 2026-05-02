import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
  googleOAuthSignIn: () => Promise<void>;
  appleSignIn: () => Promise<void>;
  signInWithToken: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const savedUser = await AsyncStorage.getItem('authUser');

      if (token && savedUser) {
        // Kullanıcıyı hemen cache'ten yükle — splash ekranı bekletme
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsLoading(false); // Splash'ı hemen kaldır

        // Background'da sessizce refresh et (UX'i bloklamaz)
        authApi.getCurrentUser().then(async (response) => {
          if (response?.user) {
            setUser(response.user);
            await AsyncStorage.setItem('authUser', JSON.stringify(response.user));
          }
        }).catch(() => {
          // Sessiz hata — cache verisi zaten kullanımda
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    } catch (error) {
      setUser(null);
      setIsLoading(false);
    }
  };
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      // CRITICAL: Save token and user to AsyncStorage
      if (response?.token) {
        await AsyncStorage.setItem('authToken', response.token);
        if (__DEV__) { console.log('✅ Token saved after login'); }
      }
      if (response?.user) {
        await AsyncStorage.setItem('authUser', JSON.stringify(response.user));
        if (__DEV__) { console.log('✅ User saved after login'); }
      }
      
      setUser(response?.user ?? null);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await authApi.register({ email, password, username });
      
      // CRITICAL: Save token and user to AsyncStorage
      if (response?.token) {
        await AsyncStorage.setItem('authToken', response.token);
        if (__DEV__) { console.log('✅ Token saved after registration'); }
      }
      if (response?.user) {
        await AsyncStorage.setItem('authUser', JSON.stringify(response.user));
        if (__DEV__) { console.log('✅ User saved after registration'); }
      }
      
      setUser(response?.user ?? null);
    } catch (error) {
      throw error;
    }
  };

  const googleSignIn = async (idToken: string) => {
    try {
      const response = await authApi.googleSignIn(idToken);
      
      // CRITICAL: Save token and user to AsyncStorage
      if (response?.token) {
        await AsyncStorage.setItem('authToken', response.token);
        if (__DEV__) { console.log('✅ Token saved after Google sign-in'); }
      }
      if (response?.user) {
        await AsyncStorage.setItem('authUser', JSON.stringify(response.user));
        if (__DEV__) { console.log('✅ User saved after Google sign-in'); }
      }
      
      setUser(response?.user ?? null);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      
      // Clear local token and user
      await authApi.logout();
      
      // CRITICAL: Remove user data from AsyncStorage
      await AsyncStorage.removeItem('authUser');
      if (__DEV__) { console.log('✅ User cleared from AsyncStorage'); }
      
      setUser(null);
    } catch (error) {
      if (__DEV__) { console.error('Logout error:', error); }
      // Even if Firebase signout fails, clear local state
      await AsyncStorage.removeItem('authUser');
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authApi.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response?.user ?? null);
    } catch (error) {
      if (__DEV__) { console.error('Refresh user error:', error); }
    }
  };

  const googleOAuthSignIn = async () => {
    // This will be called from SocialSignInButtons component
    // The actual OAuth flow is handled in the component
    throw new Error('Use the Google button to initiate OAuth flow');
  };

  const appleSignIn = async () => {
    // This will be called from SocialSignInButtons component
    // The actual Apple Sign In flow is handled in the component
    throw new Error('Use the Apple button to initiate sign-in flow');
  };

  const signInWithToken = async (token: string, user: any) => {
    // This is called from the callback screen after OAuth redirect
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('authUser', JSON.stringify(user));
    setUser(user);
    if (__DEV__) { console.log('✅ Signed in with OAuth token and user saved'); }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleSignIn,
        googleOAuthSignIn,
        appleSignIn,
        signInWithToken,
        logout,
        forgotPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};