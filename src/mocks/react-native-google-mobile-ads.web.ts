// Mock for react-native-google-mobile-ads on web platform
// AdMob only works on native platforms (iOS/Android)

export const TestIds = {
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

export const BannerAdSize = {
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
};

export const AdEventType = {
  LOADED: 'loaded',
  CLOSED: 'closed',
  OPENED: 'opened',
  CLICKED: 'clicked',
  IMPRESSION: 'impression',
  ERROR: 'error',
};

export const RewardedAdEventType = {
  LOADED: 'loaded',
  EARNED_REWARD: 'earned_reward',
};

// Mock BannerAd component
export const BannerAd = () => null;

// Mock InterstitialAd class
export class InterstitialAd {
  static createForAdRequest() {
    return {
      addAdEventListener: () => () => {},
      load: () => {},
      show: () => Promise.resolve(),
    };
  }
}

// Mock RewardedAd class
export class RewardedAd {
  static createForAdRequest() {
    return {
      addAdEventListener: () => () => {},
      load: () => {},
      show: () => Promise.resolve(),
    };
  }
}

export default {
  TestIds,
  BannerAdSize,
  AdEventType,
  RewardedAdEventType,
  BannerAd,
  InterstitialAd,
  RewardedAd,
};