import React, { useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { GradientButton } from '../GradientButton';
import { AD_PROVIDER } from '../../config/ads';
import {
  initializeUnityAds,
  loadUnityAd,
  showUnityAd,
  setUnityAdsListeners,
  getPlacementId,
  isUnityAdsAvailable,
} from '../../services/unityAdsService';

interface RewardedAdButtonProps {
  title: string;
  onRewarded: () => void;
  rewardMessage?: string;
}

export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  title,
  onRewarded,
  rewardMessage = 'Tebrikler! Ödülünüzü kazandınız! 🎉',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const placementId = getPlacementId('rewarded');
  const onRewardedRef = useRef(onRewarded);
  const rewardMessageRef = useRef(rewardMessage);

  // Keep refs updated
  useEffect(() => {
    onRewardedRef.current = onRewarded;
    rewardMessageRef.current = rewardMessage;
  }, [onRewarded, rewardMessage]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const useUnity = AD_PROVIDER === 'unity' || AD_PROVIDER === 'both';

    if (useUnity && placementId) {
      setUnityAdsListeners({
        placementId,
        onAdLoaded: (id) => {
          if (id === placementId) {
            setLoaded(true);
            setLoading(false);
            console.log('✅ [Unity Rewarded] Ad loaded');
          }
        },
        onAdFailedToLoad: (id, error) => {
          if (id === placementId) {
            setLoading(false);
            console.error('❌ [Unity Rewarded] Load failed:', error);
          }
        },
        onAdCompleted: (id) => {
          if (id === placementId) {
            console.log('✅ [Unity Rewarded] Ad completed - giving reward');
            setLoaded(false);
            Alert.alert('🎉 Ödül Kazandınız!', rewardMessageRef.current, [
              {
                text: 'Harika!',
                onPress: () => onRewardedRef.current?.(),
              },
            ]);
            // Reload next ad
            setTimeout(() => {
              setLoading(true);
              loadUnityAd(placementId);
            }, 1000);
          }
        },
        onAdFailedToShow: (id, error) => {
          if (id === placementId) {
            setLoaded(false);
            console.error('❌ [Unity Rewarded] Show failed:', error);
            Alert.alert('Hata', 'Reklam yüklenemedi. Lütfen tekrar deneyin.');
            setLoading(true);
            loadUnityAd(placementId);
          }
        },
      });

      // Initialize and load first ad
      const initAndLoad = async () => {
        setLoading(true);
        const initialized = await initializeUnityAds();
        if (initialized && placementId) {
          loadUnityAd(placementId);
        } else {
          setLoading(false);
        }
      };
      initAndLoad();
    }
  }, []);

  const handlePress = async () => {
    if (Platform.OS === 'web') {
      onRewarded();
      return;
    }

    if (loaded && placementId) {
      try {
        await showUnityAd(placementId);
      } catch (error) {
        console.error('❌ Rewarded ad show error:', error);
        Alert.alert('Hata', 'Reklam yüklenemedi. Lütfen tekrar deneyin.');
      }
    } else {
      Alert.alert('Yükleniyor', 'Reklam yükleniyor, lütfen bekleyin...');
      if (placementId && isUnityAdsAvailable()) {
        setLoading(true);
        loadUnityAd(placementId);
      }
    }
  };

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <GradientButton
      title={title}
      onPress={handlePress}
      loading={loading}
      disabled={!loaded && !loading}
    />
  );
};