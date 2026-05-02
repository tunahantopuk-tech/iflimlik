import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { USE_ADMOB, USE_TEST_ADS, ADMOB_IDS } from '../../config/ads';

// AdMob imports wrapped in try-catch for Expo Go compatibility
let GoogleBannerAd: any;
let BannerAdSize: any;
let TestIds: any;
try {
  const admob = require('react-native-google-mobile-ads');
  GoogleBannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  TestIds = admob.TestIds;
} catch (error) {
  console.warn('⚠️ AdMob not available (Expo Go) - Banner disabled');
}

const getBannerAdUnitId = () => {
  if (!TestIds) return '';
  return USE_TEST_ADS
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({
        ios: ADMOB_IDS.ios.banner,
        android: ADMOB_IDS.android.banner,
      }) ?? TestIds.ADAPTIVE_BANNER;
};

interface BannerAdProps {
  position?: 'top' | 'bottom';
}

export const BannerAd: React.FC<BannerAdProps> = ({ position = 'bottom' }) => {
  // Skip banner if AdMob is disabled, not available, or on web
  if (!USE_ADMOB || !GoogleBannerAd || !BannerAdSize || !TestIds || Platform.OS === 'web') {
    return null;
  }

  const adUnitId = getBannerAdUnitId();

  return (
    <View style={[styles.container, position === 'top' ? styles.top : styles.bottom]}>
      <View style={styles.adWrapper}>
        <GoogleBannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={() => console.log('✅ [BannerAd] Loaded')}
          onAdFailedToLoad={(error: any) => console.error('❌ [BannerAd] Failed:', error)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 2,
  },
  adWrapper: {
    transform: [{ scaleY: 0.8 }],
    overflow: 'hidden',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});