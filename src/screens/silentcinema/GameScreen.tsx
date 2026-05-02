import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { scaleW, scaleH, scaledFont, isSmallScreen } from '../../utils/responsive';
import { RouteProp } from '@react-navigation/native';
import { SilentCinemaStackParamList } from '../../navigation/SilentCinemaNavigator';
import { silentCinemaApi } from '../../api/silentcinema';
import { useInterstitialAd } from '../../hooks/useInterstitialAd';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { DebugLogger } from '../../utils/DebugLogger';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview?: string;
}

type GameScreenNavigationProp = StackNavigationProp<SilentCinemaStackParamList, 'SilentCinemaGame'>;
type GameScreenRouteProp = RouteProp<SilentCinemaStackParamList, 'SilentCinemaGame'>;

interface Props {
  navigation?: GameScreenNavigationProp;
  route?: GameScreenRouteProp;
}

export default function GameScreen({ navigation, route }: Props) {
  const {
    team1Name,
    team2Name,
    team1Players,
    team2Players,
    rounds,
  } = route?.params ?? {};

  const team1PlayersArray = JSON.parse(team1Players ?? '[]');
  const team2PlayersArray = JSON.parse(team2Players ?? '[]');
  const totalRounds = parseInt(rounds ?? '0', 10);

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentTeam, setCurrentTeam] = useState<number>(1);
  // Her takım için ayrı oyuncu indeksi
  const [team1PlayerIdx, setTeam1PlayerIdx] = useState<number>(0);
  const [team2PlayerIdx, setTeam2PlayerIdx] = useState<number>(0);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  
  // Oyuncu bazlı puan sistemi - her oyuncunun kazandığı puanları tutuyoruz
  const [team1PlayerScores, setTeam1PlayerScores] = useState<number[]>(
    new Array(team1PlayersArray.length).fill(0)
  );
  const [team2PlayerScores, setTeam2PlayerScores] = useState<number[]>(
    new Array(team2PlayersArray.length).fill(0)
  );
  
  const [team1PassUsed, setTeam1PassUsed] = useState<boolean>(false);
  const [team2PassUsed, setTeam2PassUsed] = useState<boolean>(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [showMovie, setShowMovie] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [shouldShowAdBeforeRound, setShouldShowAdBeforeRound] = useState<boolean>(false);
  const bgFadeAnim = React.useRef(new Animated.Value(0)).current;
  const [bgPosterUrl, setBgPosterUrl] = useState<string | null>(null);
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const [usedMovieIds, setUsedMovieIds] = useState<Set<number>>(new Set());

  // Derived: mevcut oyuncu indeksi (takıma göre)
  const currentPlayerIndex = currentTeam === 1 ? team1PlayerIdx : team2PlayerIdx;
  const currentPlayers = currentTeam === 1 ? team1PlayersArray : team2PlayersArray;
  const currentPlayerName = currentPlayers?.[currentPlayerIndex] ?? '';
  const currentPassUsed = currentTeam === 1 ? team1PassUsed : team2PassUsed;

  // Reklam yönetimi
  const { showAdNow, preloadAd } = useInterstitialAd();
  const { showRewardedAd, loaded: rewardedLoaded, loading: rewardedLoading } = useRewardedAd();
  
  // Rewarded reklam ile kazanılan ekstra PAS hakları
  const [team1ExtraPass, setTeam1ExtraPass] = useState(0);
  const [team2ExtraPass, setTeam2ExtraPass] = useState(0);
  const currentExtraPass = currentTeam === 1 ? team1ExtraPass : team2ExtraPass;

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('beforeRemove', (e) => {
      if (!showMovie) return;
      // @ts-ignore
      e?.preventDefault?.();
      const message = 'Sessiz Sinema oyununu bırakmak istediğinizden emin misiniz?';
      if (Platform.OS === 'web') {
        if (window.confirm(message)) navigation?.dispatch?.(e?.data?.action);
      } else {
        Alert.alert('Oyundan Çık', message, [
          { text: 'İptal', style: 'cancel' },
          { text: 'Çık', style: 'destructive', onPress: () => navigation?.dispatch?.(e?.data?.action) },
        ]);
      }
    });
    return unsubscribe;
  }, [navigation, showMovie]);

  // "Sıradaki Oyuncu" ekranı açılınca HEMEN reklam göster
  useEffect(() => {
    if (shouldShowAdBeforeRound && !showMovie && !loading) {
      const msg1 = '🎮 [NextPlayer Screen] "Sıradaki Oyuncu" ekranı gösterildi, HEMEN reklam gösteriliyor...';
      if (__DEV__) { console.log(msg1); }
      DebugLogger.log(msg1, 'warning');

      // Ekran render edildikten hemen sonra reklam göster (100ms - rendering için)
      const timer = setTimeout(() => {
        if (__DEV__) { console.log('🎮 [NextPlayer Screen] ✅ REKLAM GÖSTERİLİYOR...'); }
        showAdNow(() => {
          if (__DEV__) { console.log('🎮 [NextPlayer Screen] Reklam bitti, devam ediliyor...'); }
          setShouldShowAdBeforeRound(false);
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldShowAdBeforeRound, showMovie, loading]);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timerActive, timeLeft]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      let attempts = 0;
      let newMovie = null;
      
      // Aynı filmi gösterme - maksimum 10 deneme yap
      while (attempts < 10) {
        const response = await silentCinemaApi.getRandomMovie();
        newMovie = response?.movie ?? null;
        
        // Film yoksa veya daha önce gösterilmediyse kullan
        if (!newMovie?.id || !usedMovieIds.has(newMovie.id)) {
          break;
        }
        
        if (__DEV__) { console.log(`🎬 Film ${newMovie.title} daha önce gösterildi, yeni film çekiliyor... (Deneme: ${attempts + 1})`); }
        attempts++;
      }
      
      if (__DEV__) { console.log('API Response:', newMovie); }
      if (__DEV__) { console.log('Movie:', newMovie); }
      
      // Filmi kullanılanlar listesine ekle
      if (newMovie?.id) {
        setUsedMovieIds(prev => new Set(prev).add(newMovie.id));
        if (__DEV__) { console.log(`✅ Film eklendi: ${newMovie.title} (ID: ${newMovie.id})`); }
        if (__DEV__) { console.log(`📋 Kullanılan film sayısı: ${usedMovieIds.size + 1}`); }
      }
      
      // Sinema Salonu: arka plan afişini güncelle + slide animasyonu
      if (newMovie?.poster_path) {
        const newUrl = `https://image.tmdb.org/t/p/w780${newMovie.poster_path}`;
        bgFadeAnim.setValue(0);
        slideAnim.setValue(50);
        setBgPosterUrl(newUrl);
        Animated.parallel([
          Animated.timing(bgFadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        ]).start();
      }
      setCurrentMovie(newMovie);
      // Sinema Salonu: arka plan afişini güncelle
      if (newMovie?.poster_path) {
        const newUrl = `https://image.tmdb.org/t/p/w780${newMovie.poster_path}`;
        bgFadeAnim.setValue(0);
        slideAnim.setValue(50);
        setBgPosterUrl(newUrl);
        Animated.parallel([
          Animated.timing(bgFadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        ]).start();
      }
    } catch (error) {
      if (__DEV__) { console.error('Error fetching movie:', error); }
    } finally {
      setLoading(false);
    }
  };

  const startRound = async () => {
    const msg1 = '🎮 [startRound] BAŞLAT butonuna basıldı!';
    if (__DEV__) { console.log(msg1); }
    DebugLogger.log(msg1, 'info');
    
    // Reklam zaten "Sıradaki Oyuncu" ekranında gösterildi, direkt oyuna başla
    setLoading(true);
    setShowMovie(false);
    setTimeLeft(60);
    setTimerActive(false);
    setCurrentMovie(null);
    await fetchMovie();
    setLoading(false);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setShowMovie(true);
    setTimerActive(true);
  };

  const handleCorrect = () => {
    setTimerActive(false);
    setShowFeedback('correct');
    
    // Takım puanını artır
    if (currentTeam === 1) {
      setTeam1Score((prev) => prev + 1);
      // Oyuncunun puanını artır
      setTeam1PlayerScores((prev) => {
        const newScores = [...prev];
        newScores[currentPlayerIndex] = (newScores[currentPlayerIndex] || 0) + 1;
        return newScores;
      });
    } else {
      setTeam2Score((prev) => prev + 1);
      // Oyuncunun puanını artır
      setTeam2PlayerScores((prev) => {
        const newScores = [...prev];
        newScores[currentPlayerIndex] = (newScores[currentPlayerIndex] || 0) + 1;
        return newScores;
      });
    }
    
    setTimeout(() => {
      setShowFeedback(null);
      nextTurn();
    }, 1500);
  };

  const handleWrong = () => {
    setTimerActive(false);
    setShowFeedback('wrong');
    setTimeout(() => {
      setShowFeedback(null);
      nextTurn();
    }, 1500);
  };

  const handlePass = async () => {
    // Check normal pass first, then extra pass from rewarded ads
    if (currentPassUsed && currentExtraPass <= 0) {
      // No pass available at all - this shouldn't happen since button shows ad option
      return;
    }
    
    if (currentPassUsed && currentExtraPass > 0) {
      // Using extra pass from rewarded ad
      if (currentTeam === 1) setTeam1ExtraPass((prev) => prev - 1);
      else setTeam2ExtraPass((prev) => prev - 1);
    } else {
      // Using normal pass
      if (currentTeam === 1) setTeam1PassUsed(true);
      else setTeam2PassUsed(true);
    }
    
    setTimerActive(false);
    setTimeLeft(60);
    await fetchMovie();
    setTimerActive(true);
  };

  const handleRewardedPass = () => {
    showRewardedAd(() => {
      // Reward earned - grant +1 extra PAS
      if (currentTeam === 1) setTeam1ExtraPass((prev) => prev + 1);
      else setTeam2ExtraPass((prev) => prev + 1);
    });
  };

  const handleTimeUp = () => {
    setTimerActive(false);
    const message = 'Süre doldu!';
    Platform.OS === 'web' ? window.alert(message) : Alert.alert('Süre Doldu', message);
    nextTurn();
  };

  const nextTurn = async () => {
    setShowMovie(false);
    setTimerActive(false);
    preloadAd();

    // DOĞRU SIRA: T1-P0 → T2-P0 → T1-P1 → T2-P1 → ... → TUR SONU (Reklam)
    if (currentTeam === 1) {
      // T1 oynadı → sadece T2'ye geç, reklam YOK
      setCurrentTeam(2);
    } else {
      // T2 oynadı → her iki indeksi birlikte ilerlet
      const nextIdx = team1PlayerIdx + 1;
      const bothDone = nextIdx >= team1PlayersArray.length;

      if (bothDone) {
        // Tüm oyuncular oynadı → TUR TAMAMLANDI → Reklam
        if (currentRound >= totalRounds) {
          setShouldShowAdBeforeRound(true);
          endGame();
          return;
        }
        setCurrentRound((prev) => prev + 1);
        setTeam1PlayerIdx(0);
        setTeam2PlayerIdx(0);
        setTeam1PassUsed(false);
        setTeam2PassUsed(false);
        setShouldShowAdBeforeRound(true); // Tur sonu reklamı
      } else {
        // Sıradaki oyuncu çiftine geç, reklam YOK
        setTeam1PlayerIdx(nextIdx);
        setTeam2PlayerIdx(nextIdx);
        setTeam1PassUsed(false);
        setTeam2PassUsed(false);
      }

      setCurrentTeam(1);
    }
  };

  const endGame = () => {
    // Oyun bittiğinde kullanıcıya bilgi veren alert göster
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Oyun Bitti\n\nSkorları görmek için ilerle.');
      if (confirmed) {
        navigation?.replace?.('SilentCinemaResult', {
          team1Name: team1Name ?? '',
          team2Name: team2Name ?? '',
          team1Score: team1Score.toString(),
          team2Score: team2Score.toString(),
          team1Players: team1Players ?? '[]',
          team2Players: team2Players ?? '[]',
          team1PlayerScores: JSON.stringify(team1PlayerScores),
          team2PlayerScores: JSON.stringify(team2PlayerScores),
        });
      }
    } else {
      Alert.alert(
        'Oyun Bitti',
        'Skorları görmek için ilerle.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              navigation?.replace?.('SilentCinemaResult', {
                team1Name: team1Name ?? '',
                team2Name: team2Name ?? '',
                team1Score: team1Score.toString(),
                team2Score: team2Score.toString(),
                team1Players: team1Players ?? '[]',
                team2Players: team2Players ?? '[]',
                team1PlayerScores: JSON.stringify(team1PlayerScores),
                team2PlayerScores: JSON.stringify(team2PlayerScores),
              });
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  const handleQuit = () => {
    const message = 'Oyundan çıkmak istediğinizden emin misiniz?';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) navigation?.goBack?.();
    } else {
      Alert.alert('Çıkış', message, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış', style: 'destructive', onPress: () => navigation?.goBack?.() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {bgPosterUrl && (
        <Animated.Image
          source={{ uri: bgPosterUrl }}
          style={[scStyles.bgPoster, { opacity: bgFadeAnim.interpolate({ inputRange: [0,1], outputRange: [0, 0.18] }) }]}
          resizeMode="cover"
          blurRadius={3}
        />
      )}
      <LinearGradient colors={['rgba(10,10,10,0.92)', 'rgba(26,26,46,0.88)', 'rgba(22,33,62,0.92)']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
            <Ionicons name="close" size={24} color="#ff4444" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SESSIZ SINEMA</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Compact Score Board */}
        <View style={styles.scoreBoardContainer}>
          <LinearGradient colors={['rgba(255,215,0,0.1)', 'rgba(255,165,0,0.05)']} style={[styles.scoreBoard, scStyles.scoreBoard]}>
            <View style={scStyles.teamBlock}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={scStyles.teamAvatar}>
                <Text style={scStyles.teamAvatarText}>{team1Name?.charAt(0)?.toUpperCase()}</Text>
              </LinearGradient>
              <Text style={scStyles.teamName}>{team1Name}</Text>
              <Text style={scStyles.teamScore}>{team1Score}</Text>
            </View>
            <View style={scStyles.vsDivider}>
              <Ionicons name="film" size={18} color="rgba(255,215,0,0.4)" />
            </View>
            <View style={scStyles.teamBlock}>
              <LinearGradient colors={['#4CAF50', '#2E7D32']} style={scStyles.teamAvatar}>
                <Text style={scStyles.teamAvatarText}>{team2Name?.charAt(0)?.toUpperCase()}</Text>
              </LinearGradient>
              <Text style={scStyles.teamName}>{team2Name}</Text>
              <Text style={scStyles.teamScore}>{team2Score}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Loading Screen */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Film Yükleniyor...</Text>
          </View>
        )}

        {/* Current Player - Ready Screen */}
        {!showMovie && !loading && (
          <View style={styles.playerContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
              style={styles.playerCard}
            >
              <View style={styles.playerIconContainer}>
                <LinearGradient
                  colors={currentTeam === 1 ? ['#FFD700', '#FFA500'] : ['#4CAF50', '#2E7D32']}
                  style={styles.playerIcon}
                >
                  <Ionicons name="person" size={40} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.playerLabel}>Sıradaki Oyuncu</Text>
              <Text style={styles.playerTeam}>{currentTeam === 1 ? team1Name : team2Name}</Text>
              <Text style={styles.playerName}>{currentPlayerName}</Text>

              <TouchableOpacity style={styles.startButton} onPress={startRound}>
                <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.startButtonGradient}>
                  <Ionicons name="play" size={24} color="#000" />
                  <Text style={styles.startButtonText}>BAŞLAT</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Movie Display */}
        {showMovie && currentMovie && !loading && (
          <ScrollView
            style={styles.movieScrollContainer}
            contentContainerStyle={styles.movieContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Round Info */}
            <View style={styles.roundInfoInGame}>
              <LinearGradient
                colors={['rgba(255,215,0,0.2)', 'rgba(255,165,0,0.1)']}
                style={styles.roundBadge}
              >
                <Ionicons name="trophy" size={12} color="#FFD700" />
                <Text style={styles.roundText}>TUR {currentRound} / {totalRounds}</Text>
              </LinearGradient>
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <LinearGradient
                colors={timeLeft <= 10 ? ['#FF4444', '#CC0000'] : ['#FFD700', '#FFA500']}
                style={scStyles.timerRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={scStyles.timerInner}>
                  <Text style={[scStyles.timerNum, timeLeft <= 10 && scStyles.timerWarning]}>{timeLeft}</Text>
                  <Text style={scStyles.timerSn}>SN</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Movie Poster */}
            <Animated.View style={[scStyles.posterCard, { transform: [{ translateY: slideAnim }] }]}>
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` }}
                style={scStyles.posterImg}
                resizeMode="cover"
              />
              {/* Altın köşe ışığı */}
              <LinearGradient
                colors={['rgba(255,215,0,0.3)', 'transparent', 'transparent', 'rgba(255,215,0,0.15)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Pass Button - normal or extra from rewarded ad */}
            {(!currentPassUsed || currentExtraPass > 0) ? (
              <TouchableOpacity
                style={styles.passButton}
                onPress={handlePass}
              >
                <LinearGradient
                  colors={['#FF8C00', '#FF6B00']}
                  style={styles.passButtonGradient}
                >
                  <Ionicons name="play-forward" size={18} color="#fff" />
                  <Text style={styles.passButtonText}>
                    {currentPassUsed && currentExtraPass > 0
                      ? `PAS GEÇ (${currentExtraPass} EKSTRA HAK)`
                      : 'PAS GEÇ (1 HAK)'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.passButton}
                onPress={handleRewardedPass}
              >
                <LinearGradient
                  colors={['#9D4EDD', '#7B2CBF']}
                  style={styles.passButtonGradient}
                >
                  <Ionicons name="play-circle" size={18} color="#FFD700" />
                  <Text style={[styles.passButtonText, { color: '#FFD700' }]}>
                    🎬 Reklam İzle +1 PAS
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.wrongButton} onPress={handleWrong}>
                <LinearGradient colors={['#ff4444', '#cc0000']} style={styles.actionButtonGradient}>
                  <Ionicons name="close" size={36} color="#fff" />
                  <Text style={styles.actionButtonText}>YANLIŞ</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.correctButton} onPress={handleCorrect}>
                <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.actionButtonGradient}>
                  <Ionicons name="checkmark" size={36} color="#fff" />
                  <Text style={styles.actionButtonText}>DOĞRU</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Feedback Overlay */}
        {showFeedback && (
          <Reanimated.View entering={ZoomIn.springify()} exiting={FadeOut} style={styles.feedbackOverlay}>
            <LinearGradient
              colors={
                showFeedback === 'correct'
                  ? ['rgba(76,175,80,0.95)', 'rgba(46,125,50,0.95)']
                  : ['rgba(255,68,68,0.95)', 'rgba(204,0,0,0.95)']
              }
              style={styles.feedbackContent}
            >
              <Ionicons
                name={showFeedback === 'correct' ? 'checkmark-circle' : 'close-circle'}
                size={100}
                color="#fff"
              />
              <Text style={styles.feedbackText}>
                {showFeedback === 'correct' ? 'DOĞRU!' : 'YANLIŞ!'}
              </Text>
              {showFeedback === 'correct' && <Text style={styles.feedbackSubtext}>+1 Puan</Text>}
            </LinearGradient>
          </Reanimated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 2,
  },
  placeholder: { width: 36 },

  // Compact Scoreboard
  scoreBoardContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  teamScore: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  team2Badge: {
    backgroundColor: '#4CAF50',
  },
  teamInitial: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
  teamNameCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  scoreCompact: {
    fontSize: scaledFont(18),
    fontWeight: '900',
    color: '#FFD700',
  },
  scoreDivider: {
    paddingHorizontal: 8,
  },
  scoreDividerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },

  // Player Ready Screen
  playerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  playerCard: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playerIconContainer: {
    marginBottom: 20,
  },
  playerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  playerTeam: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  playerName: {
    fontSize: scaledFont(22),
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },

  // Movie Display
  movieScrollContainer: {
    flex: 1,
  },
  movieContainer: {
    paddingHorizontal: 20,
    paddingTop: scaleH(isSmallScreen ? 6 : 10),
    paddingBottom: 20,
  },
  roundInfoInGame: {
    alignItems: 'center',
    marginBottom: 12,
  },
  roundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  roundText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  timerText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
  },
  timerWarning: {
    color: '#ff4444',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  posterContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  posterFrame: {
    borderRadius: 12,
    padding: 3,
  },
  poster: {
    width: 220,
    height: 320,
    borderRadius: 10,
  },
  passButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  passButtonDisabled: {
    opacity: 0.5,
  },
  passButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  passButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  passButtonTextDisabled: {
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  wrongButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  correctButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },

  // Feedback Overlay
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  feedbackContent: {
    width: '75%',
    maxWidth: 300,
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    borderRadius: 28,
  },
  feedbackText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 16,
  },
  feedbackSubtext: {
    fontSize: scaledFont(18),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
});

const scStyles = StyleSheet.create({
  bgPoster: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  scoreBoard: {
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  teamBlock: {
    flex: 1, alignItems: 'center' as const, gap: 4,
  },
  teamAvatar: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6, shadowRadius: 6, elevation: 6,
  },
  teamAvatarText: {
    color: '#000', fontSize: 16, fontWeight: '900' as const,
  },
  teamName: {
    color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' as const,
  },
  teamScore: {
    color: '#FFD700', fontSize: 28, fontWeight: '900' as const, letterSpacing: -1,
  },
  vsDivider: {
    paddingHorizontal: 10, justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  timerRing: {
    width: 82, height: 82, borderRadius: 41,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    padding: 4,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 14, elevation: 12,
  },
  timerInner: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(10,10,10,0.95)',
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  timerNum: {
    color: '#FFD700', fontSize: 26, fontWeight: '900' as const, letterSpacing: -1,
  },
  timerSn: {
    color: 'rgba(255,215,0,0.5)', fontSize: 10, fontWeight: '700' as const,
    marginTop: -2,
  },
  timerWarning: {
    color: '#FF4444',
  },
  posterCard: {
    width: 200,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden' as const,
    alignSelf: 'center' as const,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  posterImg: {
    width: '100%', height: '100%',
  },
});
