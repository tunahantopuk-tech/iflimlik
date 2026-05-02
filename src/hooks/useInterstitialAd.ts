import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { AD_PROVIDER } from '../config/ads';
import {
  initializeUnityAds,
  loadUnityAd,
  showUnityAd,
  setUnityAdsListeners,
  getPlacementId,
  isUnityAdsAvailable,
} from '../services/unityAdsService';

// ─── MODÜL SEVİYESİ STATE ─────────────────────────────────────────────────────
let adLoaded = false;
let adLoading = false;
let globalShowCount = 0;
let initialized = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [10000, 20000, 30000];

// Reklam bittikten sonra çalışacak callback — donma sorununu çözer
const completionCallbacks: Set<() => void> = new Set();

function setLoaded(val: boolean) { adLoaded = val; }
function setLoading(val: boolean) { adLoading = val; }
// ─────────────────────────────────────────────────────────────────────────────

export const useInterstitialAd = () => {
  const placementId = getPlacementId('interstitial');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const useUnity = AD_PROVIDER === 'unity' || AD_PROVIDER === 'both';
    if (!useUnity || !placementId) return;

    setUnityAdsListeners({
      placementId,
      onAdLoaded: (id) => {
        if (id === placementId) {
          setLoaded(true);
          setLoading(false);
          retryCount = 0;
          if (__DEV__) { console.log('✅ [Interstitial] Loaded'); }
        }
      },
      onAdFailedToLoad: (id, error) => {
        if (id === placementId) {
          setLoading(false);
          if (__DEV__) { console.error('❌ [Interstitial] Load failed:', error); }
          const delay = RETRY_DELAYS[Math.min(retryCount, MAX_RETRIES - 1)];
          retryCount = Math.min(retryCount + 1, MAX_RETRIES);
          setTimeout(() => {
            if (!adLoading) { setLoading(true); loadUnityAd(placementId); }
          }, delay);
        }
      },
      onAdCompleted: (id) => {
        if (id === placementId) {
          setLoaded(false);
          if (__DEV__) { console.log('✅ [Interstitial] Completed'); }

          // Tüm completion callback'lerini çalıştır
          // InteractionManager ile bir sonraki frame'e ertele — UI thread serbest kalır
          const callbacks = Array.from(completionCallbacks);
          completionCallbacks.clear();
          setTimeout(() => {
            callbacks.forEach(cb => { try { cb(); } catch {} });
          }, 150);

          // Sonraki reklamı yükle
          setTimeout(() => { setLoading(true); loadUnityAd(placementId); }, 1000);
        }
      },
      onAdFailedToShow: (id, error) => {
        if (id === placementId) {
          setLoaded(false);
          if (__DEV__) { console.error('❌ [Interstitial] Show failed:', error); }
          // Hata durumunda da callback'leri çalıştır — kullanıcı devam edebilsin
          const callbacks = Array.from(completionCallbacks);
          completionCallbacks.clear();
          setTimeout(() => {
            callbacks.forEach(cb => { try { cb(); } catch {} });
          }, 100);
          setLoading(true);
          loadUnityAd(placementId);
        }
      },
    });

    if (!initialized) {
      initialized = true;
      initializeUnityAds().then((ok) => {
        if (ok && placementId) { setLoading(true); loadUnityAd(placementId); }
      });
    }
  }, []);

  const preloadAd = () => {
    if (Platform.OS === 'web' || adLoaded || adLoading) return;
    if (placementId && isUnityAdsAvailable()) {
      setLoading(true);
      loadUnityAd(placementId);
    }
  };

  // showAdNow: reklamı göster, bittikten sonra onComplete çalışır
  // async/await KULLANMA — iOS'ta UI'ı blokluyor
  const showAdNow = (onComplete?: () => void) => {
    if (Platform.OS === 'web') {
      onComplete?.();
      return;
    }

    if (onComplete) {
      completionCallbacks.add(onComplete);
    }

    if (adLoaded && placementId && isUnityAdsAvailable()) {
      if (__DEV__) { console.log('🎬 [Interstitial] Showing NOW'); }
      showUnityAd(placementId).catch((error) => {
        if (__DEV__) { console.error('❌ [Interstitial] Show error:', error); }
        // Hata durumunda callback'i yine de çalıştır
        completionCallbacks.delete(onComplete!);
        setTimeout(() => { onComplete?.(); }, 100);
      });
    } else {
      // Reklam hazır değil — direkt devam et
      if (__DEV__) { console.warn('⚠️ [Interstitial] Not loaded, skipping ad'); }
      completionCallbacks.delete(onComplete!);
      setTimeout(() => { onComplete?.(); }, 100);

      // Arka planda yükle
      if (placementId && !adLoading && isUnityAdsAvailable()) {
        setLoading(true);
        loadUnityAd(placementId);
      }
    }
  };

  // showAdNowAsync: eski async arayüz — geriye dönük uyumluluk için
  const showAdNowAsync = (): Promise<void> => {
    return new Promise((resolve) => {
      showAdNow(resolve);
    });
  };

  // showAd: 10 film sayacı
  const showAd = (onComplete?: () => void) => {
    if (Platform.OS === 'web') { onComplete?.(); return; }
    globalShowCount++;
    if (__DEV__) { console.log(`📊 [Interstitial] count: ${globalShowCount}`); }
    if (globalShowCount % 10 === 0) {
      globalShowCount = 0;
      showAdNow(onComplete);
    } else {
      onComplete?.();
    }
  };

  return { showAd, showAdNow, showAdNowAsync, preloadAd, loaded: adLoaded };
};
