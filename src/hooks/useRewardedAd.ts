import { useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { AD_PROVIDER } from '../config/ads';
import {
  initializeUnityAds,
  loadUnityAd,
  showUnityAd,
  setUnityAdsListeners,
  getPlacementId,
} from '../services/unityAdsService';

// ─── MODÜL SEVİYESİ STATE ───────────────────────────────────────────────────
let rewardedLoaded = false;
let rewardedLoading = false;
let rewardedInitialized = false;
const rewardCallbackGlobal: { fn: (() => void) | null } = { fn: null };
const closeCallbackGlobal: { fn: (() => void) | null } = { fn: null };

function setRewardedLoaded(val: boolean) { rewardedLoaded = val; }
function setRewardedLoading(val: boolean) { rewardedLoading = val; }
// ─────────────────────────────────────────────────────────────────────────────

export function useRewardedAd() {
  const placementId = getPlacementId('rewarded');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const useUnity = AD_PROVIDER === 'unity' || AD_PROVIDER === 'both';
    if (!useUnity || !placementId) return;

    setUnityAdsListeners({
      placementId,
      onAdLoaded: (id) => {
        if (id === placementId) {
          setRewardedLoaded(true);
          setRewardedLoading(false);
          if (__DEV__) { console.log('✅ [Rewarded] Loaded'); }

          // Bekleyen callback varsa göster
          if (rewardCallbackGlobal.fn) {
            if (__DEV__) { console.log('🎬 [Rewarded] Auto-showing for waiting callback...'); }
            showUnityAd(placementId).catch(() => {
              rewardCallbackGlobal.fn = null;
              closeCallbackGlobal.fn = null;
            });
          }
        }
      },
      onAdFailedToLoad: (id, error) => {
        if (id === placementId) {
          setRewardedLoading(false);
          if (__DEV__) { console.error('❌ [Rewarded] Load failed:', error); }
        }
      },
      onAdCompleted: (id, state) => {
        if (id === placementId) {
          if (__DEV__) { console.log(`✅ [Rewarded] Completed, state=${state}`); }
          setRewardedLoaded(false);
          // Sadece COMPLETED state'inde ödül ver (SKIPPED = atladı, ödül yok)
          if (state === 'COMPLETED') {
            rewardCallbackGlobal.fn?.();
          }
          rewardCallbackGlobal.fn = null;
          closeCallbackGlobal.fn = null;
          setTimeout(() => {
            setRewardedLoading(true);
            loadUnityAd(placementId);
          }, 1000);
        }
      },
      onAdFailedToShow: (id, error) => {
        if (id === placementId) {
          setRewardedLoaded(false);
          if (__DEV__) { console.error('❌ [Rewarded] Show failed:', error); }
          Alert.alert('Hata', 'Reklam gösterilemedi. Lütfen tekrar deneyin.');
          closeCallbackGlobal.fn?.();
          rewardCallbackGlobal.fn = null;
          closeCallbackGlobal.fn = null;
          setRewardedLoading(true);
          loadUnityAd(placementId);
        }
      },
    });

    if (!rewardedInitialized) {
      rewardedInitialized = true;
      initializeUnityAds().then((ok) => {
        if (ok && placementId) {
          setRewardedLoading(true);
          loadUnityAd(placementId);
        } else {
          setRewardedLoading(false);
        }
      });
    }
  }, []);

  const showRewardedAd = useCallback((onRewarded: () => void, onClose?: () => void) => {
    if (Platform.OS === 'web') {
      onRewarded();
      return;
    }

    rewardCallbackGlobal.fn = onRewarded;
    closeCallbackGlobal.fn = onClose ?? null;

    if (rewardedLoaded && placementId) {
      if (__DEV__) { console.log('🎬 [Rewarded] Showing now...'); }
      showUnityAd(placementId).catch((error) => {
        if (__DEV__) { console.error('❌ [Rewarded] Show error:', error); }
        Alert.alert('Hata', 'Reklam gösterilemedi. Lütfen tekrar deneyin.');
        closeCallbackGlobal.fn?.();
        rewardCallbackGlobal.fn = null;
        closeCallbackGlobal.fn = null;
      });
    } else if (placementId) {
      if (__DEV__) { console.log('⏳ [Rewarded] Not loaded, loading... will auto-show when ready'); }
      if (!rewardedLoading) {
        setRewardedLoading(true);
        loadUnityAd(placementId);
      }
      Alert.alert('Hazırlanıyor', 'Reklam yükleniyor, lütfen birkaç saniye bekleyin ve tekrar deneyin.');
    } else {
      Alert.alert('Reklam Yok', 'Şu an reklam mevcut değil.');
      closeCallbackGlobal.fn?.();
      rewardCallbackGlobal.fn = null;
      closeCallbackGlobal.fn = null;
    }
  }, [placementId]);

  return {
    loaded: rewardedLoaded,
    loading: rewardedLoading,
    showRewardedAd,
  };
}
