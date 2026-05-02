import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export interface SendVerificationCodeResponse {
  message: string;
  expiresIn: number;
}

export interface VerifyEmailResponse {
  message: string;
  verified: boolean;
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('auth/login', data);
    return response.data;
  },

  googleSignIn: async (idToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('auth/google', { idToken });
    return response.data;
  },

  sendVerificationCode: async (email: string): Promise<SendVerificationCodeResponse> => {
    const response = await apiClient.post('auth/send-verification-code', { email });
    return response.data;
  },

  verifyEmail: async (email: string, code: string): Promise<VerifyEmailResponse> => {
    const response = await apiClient.post('auth/verify-email', { email, code });
    return response.data;
  },

  resendVerificationCode: async (email: string): Promise<SendVerificationCodeResponse> => {
    const response = await apiClient.post('auth/resend-verification-code', { email });
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Clear local token
    await AsyncStorage.removeItem('authToken');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('auth/forgot-password', { email });
    return response.data;
  },

  appleSignIn: async (identityToken: string, user?: { email?: string; name?: { firstName?: string; lastName?: string } }): Promise<AuthResponse> => {
    const response = await apiClient.post('auth/apple', { identityToken, user });
    return response.data;
  },
};
