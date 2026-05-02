/**
 * Ad Configuration
 *
 * STRATEGY:
 * - Unity Ads: PRIMARY ad provider (Interstitial + Rewarded) - ACTIVE
 * - AdMob: SECONDARY/BACKUP - Waiting for approval
 *
 * AdMob onaylandiginda:
 * 1. USE_ADMOB = true yap
 * 2. AD_PROVIDER = 'both' yap
 */

// Ad Provider Control
export const AD_PROVIDER: 'unity' | 'admob' | 'both' = 'unity';
export const USE_TEST_ADS = false;
export const USE_ADMOB = false;

// Unity Ads Configuration
export const UNITY_ADS = {
  ios: {
    gameId: '6095875',
    banner: 'iFilmlik_Banner',
    interstitial: 'iFilmlik_Interstitial',
    rewarded: 'iFilmlik_Rewarded',
  },
  android: {
    gameId: '',
    banner: '',
    interstitial: '',
    rewarded: '',
  },
  testMode: false,
};

// AdMob Unit IDs (waiting for approval)
export const ADMOB_IDS = {
  ios: {
    appId: 'ca-app-pub-9626557355486148~5983117356',
    banner: 'ca-app-pub-9626557355486148/9258215639',
    interstitial: 'ca-app-pub-9626557355486148/2692807284',
    rewarded: 'ca-app-pub-9626557355486148/4342732626',
  },
  android: {
    appId: 'ca-app-pub-9626557355486148~5983117356',
    banner: 'ca-app-pub-9626557355486148/9258215639',
    interstitial: 'ca-app-pub-9626557355486148/2692807284',
    rewarded: 'ca-app-pub-9626557355486148/4342732626',
  },
};
