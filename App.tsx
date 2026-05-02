import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, Alert, Dimensions } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary, SplashScreen } from './src/components';
import { paperTheme } from './src/theme';
import mobileAds from 'react-native-google-mobile-ads';
import * as TrackingTransparency from 'expo-tracking-transparency';
import * as Device from 'expo-device';
import { DebugLogger } from './src/utils/DebugLogger';
import { initializeUnityAds } from './src/services/unityAdsService';
import { USE_ADMOB } from './src/config/ads';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // iOS ATT (App Tracking Transparency) + AdMob initialization
    const initializeApp = async () => {
      try {
        // DEVICE INFO - iPad detection için detaylı bilgi
        const { width, height } = Dimensions.get('window');
        const isTablet = Math.min(width, height) >= 768;
        const deviceInfo = {
          platform: Platform.OS,
          osVersion: Platform.Version,
          deviceType: Device.deviceType,
          deviceName: Device.deviceName,
          modelName: Device.modelName,
          isTablet: isTablet,
          screenWidth: width,
          screenHeight: height,
        };
        
        if (__DEV__) { console.log('═══════════════════════════════════════'); }
        if (__DEV__) { console.log('📱 DEVICE INFORMATION:'); }
        if (__DEV__) { console.log(JSON.stringify(deviceInfo, null, 2)); }
        if (__DEV__) { console.log('═══════════════════════════════════════'); }
        DebugLogger.log(`Device Info: ${JSON.stringify(deviceInfo)}`, 'info');
        
        // ÖNCE iOS ATT izin dialogu (iOS 14+) - TRACKING BAŞLAMADAN ÖNCE!
        // CRITICAL: ATT dialogunu SplashScreen'den ÖNCE göster
        if (Platform.OS === 'ios') {
          if (__DEV__) { console.log('🍎 iOS DETECTED - Starting ATT flow...'); }
          
          // iPad özel mesaj
          if (isTablet) {
            if (__DEV__) { console.log('📱 TABLET DETECTED - iPad specific flow'); }
            DebugLogger.log('iPad detected, will request ATT permission', 'info');
          }
          
          // ATT iznini kontrol et
          if (__DEV__) { console.log('🔍 Step 1: Getting current ATT status...'); }
          const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
          if (__DEV__) { console.log(`📊 Current ATT Status: ${currentStatus}`); }
          DebugLogger.log(`ATT Status: ${currentStatus}`, 'info');
          
          // Eğer henüz sorulmadıysa (undetermined), ŞIMDI SOR!
          if (currentStatus === 'undetermined') {
            if (__DEV__) { console.log('═══════════════════════════════════════'); }
            if (__DEV__) { console.log('🔔 ATT DIALOG SHOULD APPEAR NOW!'); }
            if (__DEV__) { console.log('═══════════════════════════════════════'); }
            
            // iPad'de ekstra bekleme (yavaş olabilir)
            if (isTablet) {
              if (__DEV__) { console.log('⏳ iPad detected - waiting 500ms before request...'); }
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (__DEV__) { console.log('📤 Requesting ATT permission...'); }
            const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
            
            if (__DEV__) { console.log('═══════════════════════════════════════'); }
            if (__DEV__) { console.log(`📱 iOS ATT Status AFTER REQUEST: ${status}`); }
            if (__DEV__) { console.log('═══════════════════════════════════════'); }
            DebugLogger.log(`ATT Response: ${status}`, 'info');
            
            if (status === 'granted') {
              const msg = '✅ Tracking permission GRANTED';
              if (__DEV__) { console.log(msg); }
              DebugLogger.log(msg, 'success');
              
              // Debug Alert (sadece ilk yüklemede göster)
              if (__DEV__) {
                Alert.alert('ATT Permission', 'Tracking GRANTED ✅');
              }
            } else {
              const msg = '⚠️ Tracking permission DENIED';
              if (__DEV__) { console.log(msg); }
              DebugLogger.log(msg, 'warning');
              
              // Debug Alert
              if (__DEV__) {
                Alert.alert('ATT Permission', `Tracking DENIED (${status}) ⚠️\nAds will still work with non-personalized content.`);
              }
            }
          } else {
            if (__DEV__) { console.log(`ℹ️ ATT already answered: ${currentStatus}`); }
            DebugLogger.log(`ATT already answered: ${currentStatus}`, 'info');
            
            // Debug Alert - show current status
            if (__DEV__ && isTablet) {
              Alert.alert('ATT Status', `Already set to: ${currentStatus}\n\nTo test again:\n1. Go to Settings > Privacy > Tracking\n2. Reset for iFilmlik\n3. Delete and reinstall app`);
            }
          }
        }
        
        // Unity Ads initialization (PRIMARY ad provider)
        if (__DEV__) { console.log('🎮 Initializing Unity Ads...'); }
        const unityInitialized = await initializeUnityAds();
        if (unityInitialized) {
          if (__DEV__) { console.log('✅ Unity Ads initialized successfully'); }
          DebugLogger.log('Unity Ads initialized', 'success');
        } else {
          if (__DEV__) { console.log('⚠️ Unity Ads not initialized (may not be available on this platform)'); }
          DebugLogger.log('Unity Ads not initialized', 'warning');
        }

        // AdMob initialization AFTER ATT (backup - waiting for approval)
        if (USE_ADMOB) {
          if (__DEV__) { console.log('📱 Initializing AdMob...'); }
          await mobileAds().initialize();
          const msg4 = '✅ AdMob initialized successfully';
          if (__DEV__) { console.log(msg4); }
          DebugLogger.log(msg4, 'success');
          
          await mobileAds().setRequestConfiguration({
            testDeviceIdentifiers: ['EMULATOR'],
          });
          const msg5 = '✅ Test device configuration set';
          if (__DEV__) { console.log(msg5); }
          DebugLogger.log(msg5, 'success');
        } else {
          if (__DEV__) { console.log('ℹ️ AdMob disabled (waiting for account approval)'); }
          DebugLogger.log('AdMob disabled', 'info');
        }
        
        if (__DEV__) { console.log('═══════════════════════════════════════'); }
        if (__DEV__) { console.log('✅ APP INITIALIZATION COMPLETE'); }
        if (__DEV__) { console.log('═══════════════════════════════════════'); }
        
        // App hazır - şimdi SplashScreen gösterilebilir
        setAppReady(true);
      } catch (error) {
        const msg = `❌ Initialization failed: ${JSON.stringify(error)}`;
        if (__DEV__) { console.error(msg); }
        DebugLogger.log(msg, 'error');
        
        // Debug Alert
        if (__DEV__) {
          Alert.alert('Initialization Error', `Error: ${error}`);
        }
        
        // Hata olsa bile app'i başlat
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // ATT dialogu gösterilene kadar bekle
  if (!appReady) {
    return null; // ATT dialogu gösteriliyor, ekran boş
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <StatusBar barStyle="light-content" />
            <RootNavigator />
          </AuthProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
