/**
 * Responsive Utility
 *
 * Tüm ekran boyutlarında tutarlı görünüm için ölçekleme fonksiyonları.
 * Referans ekran: iPhone 12 (390 x 844)
 */

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Referans boyutlar (iPhone 12)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Yatay ölçekleme — yatay mesafeler, font boyutları için
export const scaleW = (size: number): number =>
  Math.round((width / BASE_WIDTH) * size);

// Dikey ölçekleme — yükseklikler, dikey boşluklar için
export const scaleH = (size: number): number =>
  Math.round((height / BASE_HEIGHT) * size);

// Ölçeklenmiş font — küçük ekranlarda daha küçük, büyük ekranlarda daha büyük
// factor: ne kadar ölçeklensin (0 = hiç, 1 = tam)
export const scaledFont = (size: number, factor = 0.5): number => {
  const scale = width / BASE_WIDTH;
  const delta = size * (scale - 1);
  return Math.round(size + delta * factor);
};

// Ekran küçük mü? (iPhone SE, 6, 7, 8 — width < 375)
export const isSmallScreen = width < 375;

// Ekran orta boy mu? (iPhone 12, 13, 14 — 375 <= width < 428)
export const isMediumScreen = width >= 375 && width < 428;

// Ekran büyük mü? (iPhone Plus, Pro Max — width >= 428)
export const isLargeScreen = width >= 428;

// Güvenli alan için platform bazlı padding
export const safeBottom = Platform.OS === 'ios' ? (isSmallScreen ? 20 : 34) : 16;
export const safeTop = Platform.OS === 'ios' ? (isSmallScreen ? 20 : 44) : 24;

// Ekran genişliği ve yüksekliği
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
