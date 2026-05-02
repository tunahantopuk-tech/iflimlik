import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Production API URL - use Constants.expoConfig for production builds
const RAW_API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://iflimlik.abacusai.app/';

// Ensure the base URL always ends with /api/
const API_URL = RAW_API_URL?.endsWith('/api/') 
  ? RAW_API_URL 
  : RAW_API_URL?.endsWith('/') 
    ? `${RAW_API_URL}api/` 
    : `${RAW_API_URL}/api/`;

if (__DEV__) {
  console.log('🌐 API URL:', API_URL);
}

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [
    (data, headers) => {
      // React Native bridge fix: ensure data is serialized as JSON string
      if (data && typeof data === 'object') {
        return JSON.stringify(data);
      }
      return data;
    },
  ],
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // silently ignore token read errors
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (__DEV__) {
      console.error('❌ API Error:', error?.response?.status, error?.response?.data || error.message);
    }
    const originalRequest = error?.config;

    // Handle 401 - token expired
    if (error?.response?.status === 401 && originalRequest) {
      try {
        await AsyncStorage.removeItem('authToken');
      } catch (e) {
        // ignore
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;