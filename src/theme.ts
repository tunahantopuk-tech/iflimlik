import { MD3DarkTheme } from 'react-native-paper';

export const colors = {
  // Backgrounds
  background: '#0a0a0a',
  backgroundSecondary: '#1a1a1a',
  backgroundCard: '#1f1f1f',
  
  // Primary colors
  primary: '#E61806', // iFilm red
  primaryLight: '#ff1a25',
  primaryDark: '#b00710',
  
  // Secondary colors
  secondary: '#8b5cf6', // Purple
  secondaryLight: '#a78bfa',
  secondaryDark: '#7c3aed',
  
  // Accent colors
  accent: '#3b82f6', // Blue
  accentLight: '#60a5fa',
  accentDark: '#2563eb',
  
  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray: '#6b7280',
  grayLight: '#9ca3af',
  grayDark: '#4b5563',
  darkGray: '#4b5563', // Alias for grayDark
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // Glass effect
  glass: 'rgba(31, 31, 31, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Card
  card: '#1f1f1f',
};

export const gradients = {
  redToPurple: ['#E61806', '#8b5cf6'] as const,
  purpleToBlue: ['#8b5cf6', '#3b82f6'] as const,
  darkOverlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)'] as const,
  primary: ['#E61806', '#b00710'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.backgroundCard,
    error: colors.error,
  },
};