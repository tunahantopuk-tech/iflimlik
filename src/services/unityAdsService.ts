import { Platform } from 'react-native';
import { UNITY_ADS } from '../config/ads';

// Unity Ads module - wrapped in try-catch for Expo Go/Web compatibility
let UnityAdsModule: any = null;
let isUnityAvailable = false;

try {
  if (Platform.OS !== 'web') {
    UnityAdsModule = require('@mrnitrox/react-native-unity-ads-monetization').default;
    isUnityAvailable = true;
  }
} catch (error) {
  if (__DEV__) { console.warn('⚠️ Unity Ads not available (Expo Go or Web)'); }
  isUnityAvailable = false;
}

let isInitialized = false;
let isInitializing = false;

// Singleton listener guard - native listeners registered only ONCE
let loadListenerRegistered = false;
let showListenerRegistered = false;

// Callback maps per placementId
const loadCallbacks: Map<string, {
  onAdLoaded?: (pid: string) => void;
  onAdFailedToLoad?: (pid: string, error: string) => void;
}> = new Map();

const showCallbacks: Map<string, {
  onAdShown?: (pid: string) => void;
  onAdClicked?: (pid: string) => void;
  onAdCompleted?: (pid: string, state: string) => void;
  onAdFailedToShow?: (pid: string, error: string) => void;
}> = new Map();

const getGameId = (): string => {
  const platformConfig = Platform.OS === 'ios' ? UNITY_ADS.ios : UNITY_ADS.android;
  return platformConfig?.gameId ?? '';
};

export const getPlacementId = (type: 'banner' | 'interstitial' | 'rewarded'): string => {
  const platformConfig = Platform.OS === 'ios' ? UNITY_ADS.ios : UNITY_ADS.android;
  return platformConfig?.[type] ?? '';
};

export const initializeUnityAds = async (): Promise<boolean> => {
  if (!isUnityAvailable || !UnityAdsModule) return false;
  if (isInitialized) return true;
  if (isInitializing) return false;

  const gameId = getGameId();
  if (!gameId) return false;

  try {
    isInitializing = true;
    await UnityAdsModule.initialize(gameId, UNITY_ADS.testMode);
    isInitialized = true;
    isInitializing = false;
    if (__DEV__) { console.log('✅ Unity Ads initialized'); }
    return true;
  } catch (error) {
    isInitializing = false;
    if (__DEV__) { console.error('❌ Unity Ads init failed:', error); }
    return false;
  }
};

export const loadUnityAd = async (placementId: string): Promise<boolean> => {
  if (!isUnityAvailable || !UnityAdsModule || !isInitialized) return false;
  if (!placementId) return false;
  try {
    await UnityAdsModule.loadAd(placementId);
    return true;
  } catch (error) {
    if (__DEV__) { console.error(`❌ Load ad failed ${placementId}:`, error); }
    return false;
  }
};

export const showUnityAd = async (placementId: string): Promise<boolean> => {
  if (!isUnityAvailable || !UnityAdsModule || !isInitialized) return false;
  if (!placementId) return false;
  try {
    await UnityAdsModule.showAd(placementId);
    return true;
  } catch (error) {
    if (__DEV__) { console.error(`❌ Show ad failed ${placementId}:`, error); }
    return false;
  }
};

/**
 * Register callbacks for a placement.
 * Native listeners are registered ONCE (singleton) to prevent TurboModule crashes.
 */
export const setUnityAdsListeners = (listeners: {
  placementId: string;
  onAdLoaded?: (placementId: string) => void;
  onAdFailedToLoad?: (placementId: string, error: any) => void;
  onAdShown?: (placementId: string) => void;
  onAdClicked?: (placementId: string) => void;
  onAdCompleted?: (placementId: string) => void;
  onAdFailedToShow?: (placementId: string, error: any) => void;
}) => {
  if (!isUnityAvailable || !UnityAdsModule) return;

  const { placementId, ...callbacks } = listeners;

  // Store callbacks for this placement
  loadCallbacks.set(placementId, {
    onAdLoaded: callbacks.onAdLoaded,
    onAdFailedToLoad: callbacks.onAdFailedToLoad,
  });
  showCallbacks.set(placementId, {
    onAdShown: callbacks.onAdShown,
    onAdClicked: callbacks.onAdClicked,
    onAdCompleted: callbacks.onAdCompleted,
    onAdFailedToShow: callbacks.onAdFailedToShow,
  });

  // Register native load listener ONCE
  if (!loadListenerRegistered) {
    loadListenerRegistered = true;
    try {
      UnityAdsModule.setOnUnityAdsLoadListener({
        onAdLoaded: (pid: string) => {
          if (__DEV__) { console.log(`✅ Unity Ad loaded: ${pid}`); }
          loadCallbacks.get(pid)?.onAdLoaded?.(pid);
        },
        onAdLoadFailed: (pid: string, message: string) => {
          if (__DEV__) { console.error(`❌ Unity Ad load failed: ${pid}`, message); }
          loadCallbacks.get(pid)?.onAdFailedToLoad?.(pid, message);
        },
      });
    } catch (e) {
      loadListenerRegistered = false;
      if (__DEV__) { console.error('❌ Load listener failed:', e); }
    }
  }

  // Register native show listener ONCE
  if (!showListenerRegistered) {
    showListenerRegistered = true;
    try {
      UnityAdsModule.setOnUnityAdsShowListener({
        onShowStart: (pid: string) => {
          if (__DEV__) { console.log(`🎬 Unity Ad show start: ${pid}`); }
          showCallbacks.get(pid)?.onAdShown?.(pid);
        },
        onShowComplete: (pid: string, state: string) => {
          if (__DEV__) { console.log(`✅ Unity Ad complete: ${pid} state: ${state}`); }
          // setTimeout: Unity'nin native thread'inden React UI thread'ine geçiş için bekle
          // Bu olmadan sayfa donuyor — iOS'ta native→JS köprüsü render döngüsünü blokluyor
          setTimeout(() => {
            showCallbacks.get(pid)?.onAdCompleted?.(pid, state);
          }, 200);
        },
        onShowFailed: (pid: string, message: string) => {
          if (__DEV__) { console.error('Unity Ad show failed: ' + pid, message); }
          // Hata durumunda da setTimeout — UI thread'ini serbest birak
          setTimeout(() => {
            showCallbacks.get(pid)?.onAdFailedToShow?.(pid, message);
          }, 100);
        },
        onShowClick: (pid: string) => {
          showCallbacks.get(pid)?.onAdClicked?.(pid);
        },
      });
    } catch (e) {
      showListenerRegistered = false;
      if (__DEV__) { console.error('❌ Show listener failed:', e); }
    }
  }
};

export const isUnityAdsAvailable = () => isUnityAvailable && isInitialized;
export const isUnityAdsModulePresent = () => isUnityAvailable;
