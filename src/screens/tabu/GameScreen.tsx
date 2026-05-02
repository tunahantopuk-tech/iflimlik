import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, Alert, Platform, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { scaleW, scaleH, scaledFont, isSmallScreen, SCREEN_HEIGHT } from '../../utils/responsive';
import { RouteProp } from '@react-navigation/native';
import { TabuStackParamList } from '../../navigation/TabuNavigator';
import { tabuApi } from '../../api/tabu';
import { useInterstitialAd } from '../../hooks/useInterstitialAd';
import { useRewardedAd } from '../../hooks/useRewardedAd';

interface TabuCard {
  id: number;
  title: string;
  poster_path: string;
  forbidden_words: string[];
}

type GameScreenNavigationProp = StackNavigationProp<TabuStackParamList, 'TabuGame'>;
type GameScreenRouteProp = RouteProp<TabuStackParamList, 'TabuGame'>;

export default function GameScreen({ navigation, route }: { navigation?: GameScreenNavigationProp; route?: GameScreenRouteProp }) {
  const { team1Name, team2Name, team1Players, team2Players, rounds } = route?.params ?? {};

  const team1PlayersArray = JSON.parse(team1Players ?? '[]');
  const team2PlayersArray = JSON.parse(team2Players ?? '[]');
  const totalRounds = parseInt(rounds ?? '0', 10);

  const [currentRound, setCurrentRound] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(1);
  // Her takım için ayrı oyuncu indeksi - böylece takım değiştiğinde sıfırlanmaz
  const [team1PlayerIdx, setTeam1PlayerIdx] = useState(0);
  const [team2PlayerIdx, setTeam2PlayerIdx] = useState(0);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  
  // Oyuncu bazlı puan sistemi
  const [team1PlayerScores, setTeam1PlayerScores] = useState<number[]>(
    new Array(team1PlayersArray.length).fill(0)
  );
  const [team2PlayerScores, setTeam2PlayerScores] = useState<number[]>(
    new Array(team2PlayersArray.length).fill(0)
  );
  
  const [team1PassUsed, setTeam1PassUsed] = useState(0);
  const [team2PassUsed, setTeam2PassUsed] = useState(0);
  const [currentCard, setCurrentCard] = useState<TabuCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(80);
  const [timerActive, setTimerActive] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [usedMovieIds, setUsedMovieIds] = useState<Set<number>>(new Set());
  const [shouldShowAdBeforeRound, setShouldShowAdBeforeRound] = useState<boolean>(false);
  // Spotlight: arka plan afiş animasyonu
  const bgFadeAnim = React.useRef(new Animated.Value(0)).current;
  const [bgPosterUrl, setBgPosterUrl] = useState<string | null>(null);

  // Derived: mevcut oyuncu indeksi (takıma göre)
  const currentPlayerIndex = currentTeam === 1 ? team1PlayerIdx : team2PlayerIdx;
  const currentPlayers = currentTeam === 1 ? team1PlayersArray : team2PlayersArray;
  const currentPlayerName = currentPlayers?.[currentPlayerIndex] ?? '';
  const currentPassCount = currentTeam === 1 ? team1PassUsed : team2PassUsed;

  // Reklam yönetimi
  const { showAdNow, preloadAd } = useInterstitialAd();
  const { showRewardedAd, loaded: rewardedLoaded, loading: rewardedLoading } = useRewardedAd();
  
  // Rewarded reklam ile kazanılan ekstra PAS hakları
  const [team1ExtraPass, setTeam1ExtraPass] = useState(0);
  const [team2ExtraPass, setTeam2ExtraPass] = useState(0);
  const currentExtraPass = currentTeam === 1 ? team1ExtraPass : team2ExtraPass;

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('beforeRemove', (e) => {
      if (!showCard) return;
      // @ts-ignore
      e?.preventDefault?.();
      const message = 'Anlat Bakalım oyununu bırakmak istediğinizden emin misiniz?';
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
  }, [navigation, showCard]);

  // "Sıradaki Oyuncu" ekranı açılınca HEMEN reklam göster
  useEffect(() => {
    if (shouldShowAdBeforeRound && !showCard && !loading) {
      if (__DEV__) { console.log('🎮 [Tabu NextPlayer] "Sıradaki Oyuncu" ekranı gösterildi, HEMEN reklam gösteriliyor...'); }

      // Ekran render edildikten hemen sonra reklam göster (100ms - rendering için)
      const timer = setTimeout(() => {
        if (__DEV__) { console.log('🎮 [Tabu NextPlayer] ✅ REKLAM GÖSTERİLİYOR...'); }
        showAdNow(() => {
          if (__DEV__) { console.log('🎮 [Tabu NextPlayer] Reklam bitti, devam ediliyor...'); }
          setShouldShowAdBeforeRound(false);
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldShowAdBeforeRound, showCard, loading]);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timerActive, timeLeft]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      // Backend'e gösterilen ID'leri gönder — mükerrer önlenir
      const excludeIds = Array.from(usedMovieIds).slice(-50); // Son 50 ID
      const response = await tabuApi.getRandomCard(excludeIds);
      const newCard = response?.card ?? null;

      if (__DEV__) { console.log('Tabu API Response:', newCard); }

      // Filmi kullanılanlar listesine ekle
      if (newCard?.id) {
        setUsedMovieIds(prev => new Set(prev).add(newCard.id));
      }

      // Sahne Işığı: arka plan afişini güncelle
      if (newCard?.poster_path) {
        const newUrl = `https://image.tmdb.org/t/p/w780${newCard.poster_path}`;
        bgFadeAnim.setValue(0);
        setBgPosterUrl(newUrl);
        Animated.timing(bgFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }
      setCurrentCard(newCard);
    } catch (error) {
      if (__DEV__) { console.error('Error fetching tabu card:', error); }
    } finally {
      setLoading(false);
    }
  };

  const startRound = async () => {
    if (__DEV__) { console.log('🎮 [Tabu startRound] BAŞLAT butonuna basıldı!'); }
    
    // Reklam zaten "Sıradaki Oyuncu" ekranında gösterildi, direkt oyuna başla
    setLoading(true);
    setShowCard(false);
    setTimeLeft(80);
    setTimerActive(false);
    setCurrentCard(null);
    await fetchCard();
    setLoading(false);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setShowCard(true);
    setTimerActive(true);
  };

  const handleCorrect = async () => {
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
    
    setTimeout(async () => {
      setShowFeedback(null);
      setCurrentCard(null);
      await fetchCard();
    }, 800);
  };

  const handleWrong = async () => {
    setShowFeedback('wrong');
    if (currentTeam === 1) setTeam1Score((prev) => prev - 1);
    else setTeam2Score((prev) => prev - 1);
    setTimeout(async () => {
      setShowFeedback(null);
      setCurrentCard(null);
      await fetchCard();
    }, 800);
  };

  const handlePass = async () => {
    if (currentPassCount >= 3 && currentExtraPass <= 0) {
      // No pass available - shouldn't happen since button shows ad option
      return;
    }
    
    if (currentPassCount >= 3 && currentExtraPass > 0) {
      // Using extra pass from rewarded ad
      if (currentTeam === 1) setTeam1ExtraPass((prev) => prev - 1);
      else setTeam2ExtraPass((prev) => prev - 1);
    } else {
      // Using normal pass
      if (currentTeam === 1) setTeam1PassUsed((prev) => prev + 1);
      else setTeam2PassUsed((prev) => prev + 1);
    }
    
    setCurrentCard(null);
    await fetchCard();
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
    nextTurn();
  };

  // Stale closure sorununu önlemek için ref'ler
  const nextTurn = () => {
    setShowCard(false);
    setTimerActive(false);
    preloadAd();

    // setState callback ile güncel state'i oku — closure sorunu yok
    setCurrentTeam((prevTeam) => {
      if (__DEV__) console.log(`[nextTurn] currentTeam=${prevTeam}`);

      if (prevTeam === 1) {
        // T1 oynadı → T2'ye geç, indeksler değişmez
        if (__DEV__) console.log(`[nextTurn] T1→T2, indeksler değişmedi`);
        return 2;
      } else {
        // T2 oynadı → her iki indeksi birlikte ilerlet, T1'e dön
        setTeam1PlayerIdx((prevT1Idx) => {
          const nextIdx = prevT1Idx + 1;
          const bothDone = nextIdx >= team1PlayersArray.length;

          if (__DEV__) console.log(`[nextTurn] T2→T1, prevT1Idx=${prevT1Idx}, nextIdx=${nextIdx}, bothDone=${bothDone}`);

          if (bothDone) {
            // Tur tamamlandı
            setCurrentRound((prevRound) => {
              if (prevRound >= totalRounds) {
                // Son tur: endGame içinde reklam gösterilir
                setTimeout(() => endGame(), 0);
                return prevRound;
              }
              setShouldShowAdBeforeRound(true); // Tur arası reklam
              return prevRound + 1;
            });
            setTeam2PlayerIdx(0);
            setTeam1PassUsed(0);
            setTeam2PassUsed(0);
            return 0; // T1 idx sıfırla
          } else {
            setTeam2PlayerIdx(nextIdx);
            return nextIdx;
          }
        });
        return 1;
      }
    });
  };

  const endGame = () => {
    // Oyun bittiğinde kullanıcıya bilgi veren alert göster
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Oyun Bitti\n\nSkorları görmek için ilerle.');
      if (confirmed) {
        navigation?.replace?.('TabuResult', {
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
              navigation?.replace?.('TabuResult', {
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

  return (
    <View style={styles.container}>
      {/* Spotlight arka plan afişi */}
      {bgPosterUrl && (
        <Animated.Image
          source={{ uri: bgPosterUrl }}
          style={[tabuPremiumStyles.bgPoster, { opacity: bgFadeAnim.interpolate({ inputRange: [0,1], outputRange: [0, 0.15] }) }]}
          resizeMode="cover"
          blurRadius={4}
        />
      )}
      <LinearGradient colors={['rgba(15,6,36,0.92)', 'rgba(26,15,62,0.88)', 'rgba(45,27,78,0.92)']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.quitButton}>
            <Ionicons name="close" size={24} color="#FF006E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ANLAT BAKALIM</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.scoreBoardContainer}>
          <LinearGradient colors={['rgba(157,78,221,0.15)', 'rgba(0,217,255,0.08)']} style={[styles.scoreBoard, tabuPremiumStyles.scoreBoard]}>
            <View style={tabuPremiumStyles.teamBlock}>
              <LinearGradient colors={['#9D4EDD', '#7B2CBF']} style={tabuPremiumStyles.teamAvatar}>
                <Text style={tabuPremiumStyles.teamAvatarText}>{team1Name?.charAt(0)?.toUpperCase()}</Text>
              </LinearGradient>
              <Text style={tabuPremiumStyles.teamName}>{team1Name}</Text>
              <Text style={tabuPremiumStyles.teamScore}>{team1Score}</Text>
            </View>
            <View style={tabuPremiumStyles.vsDivider}>
              <Text style={tabuPremiumStyles.vsText}>VS</Text>
            </View>
            <View style={tabuPremiumStyles.teamBlock}>
              <LinearGradient colors={['#00D9FF', '#00B4D8']} style={tabuPremiumStyles.teamAvatar}>
                <Text style={tabuPremiumStyles.teamAvatarText}>{team2Name?.charAt(0)?.toUpperCase()}</Text>
              </LinearGradient>
              <Text style={tabuPremiumStyles.teamName}>{team2Name}</Text>
              <Text style={tabuPremiumStyles.teamScore}>{team2Score}</Text>
            </View>
          </LinearGradient>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9D4EDD" />
            <Text style={styles.loadingText}>Kart Yükleniyor...</Text>
          </View>
        )}

        {!showCard && !loading && (
          <View style={styles.playerContainer}>
            <LinearGradient colors={['rgba(157,78,221,0.1)', 'rgba(0,217,255,0.05)']} style={styles.playerCard}>
              <View style={styles.playerIconContainer}>
                <LinearGradient colors={currentTeam === 1 ? ['#9D4EDD', '#7B2CBF'] : ['#00D9FF', '#00B4D8']} style={styles.playerIcon}>
                  <Ionicons name="person" size={40} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.playerLabel}>Sıradaki Oyuncu</Text>
              <Text style={styles.playerTeam}>{currentTeam === 1 ? team1Name : team2Name}</Text>
              <Text style={styles.playerName}>{currentPlayerName}</Text>
              <TouchableOpacity style={styles.startButton} onPress={startRound}>
                <LinearGradient colors={['#9D4EDD', '#7B2CBF']} style={styles.startButtonGradient}>
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.startButtonText}>BAŞLAT</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {showCard && currentCard && !loading && (
          <ScrollView style={styles.gameScrollContainer} contentContainerStyle={styles.gameContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.roundInfoInGame}>
              <LinearGradient colors={['rgba(157,78,221,0.2)', 'rgba(0,217,255,0.1)']} style={styles.roundBadge}>
                <Ionicons name="trophy" size={12} color="#9D4EDD" />
                <Text style={styles.roundText}>TUR {currentRound} / {totalRounds}</Text>
              </LinearGradient>
            </View>

            <View style={styles.timerContainer}>
              <View style={tabuPremiumStyles.timerOuter}>
                {/* Progress ring — SVG yoksa gradient ile simüle */}
                <LinearGradient
                  colors={timeLeft <= 20 ? ['#FF006E', '#C9184A'] : ['#9D4EDD', '#00D9FF']}
                  style={[tabuPremiumStyles.timerRing, {
                    opacity: timeLeft <= 20 ? 1 : 0.8,
                  }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={tabuPremiumStyles.timerInner}>
                    <Animated.Text style={[tabuPremiumStyles.timerNum, timeLeft <= 20 && tabuPremiumStyles.timerWarning]}>
                      {timeLeft}
                    </Animated.Text>
                    <Text style={tabuPremiumStyles.timerSn}>SN</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.cardContainer}>
              <View style={styles.posterSection}>
                <LinearGradient colors={['rgba(157,78,221,0.08)', 'rgba(0,217,255,0.05)']} style={styles.posterFrame}>
                  <Image source={{ uri: `https://image.tmdb.org/t/p/w500${currentCard.poster_path}` }} style={styles.poster} resizeMode="cover" />
                </LinearGradient>
              </View>

              <View style={styles.forbiddenSection}>
                <LinearGradient colors={['rgba(255,0,110,0.15)', 'rgba(255,0,110,0.05)']} style={styles.forbiddenCard}>
                  <View style={styles.movieTitleContainer}>
                    <Text style={styles.movieTitle}>{currentCard.title}</Text>
                  </View>
                  <View style={styles.forbiddenHeader}>
                    <Ionicons name="warning" size={18} color="#FF006E" />
                    <Text style={styles.forbiddenTitle}>YASAK KELİMELER</Text>
                  </View>
                  {currentCard.forbidden_words?.map((word, idx) => (
                    <View key={idx} style={styles.forbiddenItem}>
                      <View style={styles.forbiddenBullet} />
                      <Text style={styles.forbiddenWord}>{word}</Text>
                    </View>
                  ))}
                </LinearGradient>
              </View>
            </View>

            <View style={styles.passContainer}>
              {(currentPassCount < 3 || currentExtraPass > 0) ? (
                <TouchableOpacity style={styles.passButton} onPress={handlePass}>
                  <LinearGradient colors={['#FF8C00', '#CC6600']} style={styles.passButtonGradient}>
                    <Ionicons name="play-forward" size={18} color="#fff" />
                    <Text style={styles.passButtonText}>
                      {currentPassCount >= 3 && currentExtraPass > 0
                        ? `PAS GEÇ (${currentExtraPass} EKSTRA HAK)`
                        : `PAS GEÇ (${3 - currentPassCount} HAK)`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.passButton} onPress={handleRewardedPass}>
                  <LinearGradient colors={['#9D4EDD', '#7B2CBF']} style={styles.passButtonGradient}>
                    <Ionicons name="play-circle" size={18} color="#FFD700" />
                    <Text style={[styles.passButtonText, { color: '#FFD700' }]}>
                      🎬 Reklam İzle +1 PAS
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.wrongButton} onPress={handleWrong}>
                <LinearGradient colors={['#FF006E', '#C9184A']} style={styles.actionButtonGradient}>
                  <Ionicons name="close" size={36} color="#fff" />
                  <Text style={styles.actionButtonText}>YANLIŞ</Text>
                  <Text style={styles.actionButtonScore}>-1</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.correctButton} onPress={handleCorrect}>
                <LinearGradient colors={['#00D9FF', '#00B4D8']} style={styles.actionButtonGradient}>
                  <Ionicons name="checkmark" size={36} color="#fff" />
                  <Text style={styles.actionButtonText}>DOĞRU</Text>
                  <Text style={styles.actionButtonScore}>+1</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {showFeedback && (
          <Reanimated.View entering={ZoomIn.springify()} exiting={FadeOut} style={styles.feedbackOverlay}>
            <LinearGradient colors={showFeedback === 'correct' ? ['rgba(0,217,255,0.95)', 'rgba(0,180,216,0.95)'] : ['rgba(255,0,110,0.95)', 'rgba(201,24,74,0.95)']} style={styles.feedbackContent}>
              <Ionicons name={showFeedback === 'correct' ? 'checkmark-circle' : 'close-circle'} size={100} color="#fff" />
              <Text style={styles.feedbackText}>{showFeedback === 'correct' ? 'DOĞRU!' : 'YANLIŞ!'}</Text>
              <Text style={styles.feedbackSubtext}>{showFeedback === 'correct' ? '+1 Puan' : '-1 Puan'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  quitButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,0,110,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#9D4EDD', letterSpacing: 2 },
  placeholder: { width: 36 },
  scoreBoardContainer: { marginHorizontal: scaleW(20), marginTop: scaleH(8), borderRadius: 16, overflow: 'hidden' },
  scoreBoard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: scaleH(10), paddingHorizontal: scaleW(16), borderRadius: 16, borderWidth: 1, borderColor: 'rgba(157,78,221,0.2)' },
  teamScore: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamBadge: { width: scaleW(28), height: scaleW(28), borderRadius: scaleW(14), backgroundColor: '#9D4EDD', alignItems: 'center', justifyContent: 'center' },
  team2Badge: { backgroundColor: '#00D9FF' },
  teamInitial: { fontSize: scaledFont(13), fontWeight: '900', color: '#fff' },
  teamNameCompact: { fontSize: scaledFont(11), fontWeight: '600', color: 'rgba(255,255,255,0.7)', flex: 1 },
  scoreCompact: { fontSize: scaledFont(18), fontWeight: '900', color: '#9D4EDD' },
  scoreDivider: { paddingHorizontal: 8 },
  scoreDividerText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.3)' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  playerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  playerCard: { width: '100%', maxWidth: 350, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(157,78,221,0.2)' },
  playerIconContainer: { marginBottom: 20 },
  playerIcon: { width: scaleW(72), height: scaleW(72), borderRadius: scaleW(36), alignItems: 'center', justifyContent: 'center' },
  playerLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  playerTeam: { fontSize: 14, fontWeight: '600', color: '#9D4EDD', marginBottom: 4 },
  playerName: { fontSize: scaledFont(22), fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 24 },
  startButton: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  startButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  startButtonText: { fontSize: scaledFont(16), fontWeight: '900', color: '#fff', letterSpacing: 2 },
  gameScrollContainer: { flex: 1 },
  gameContainer: { paddingHorizontal: scaleW(16), paddingTop: scaleH(isSmallScreen ? 6 : 10), paddingBottom: scaleH(16) },
  roundInfoInGame: { alignItems: 'center', marginBottom: 12 },
  roundBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  roundText: { fontSize: scaledFont(11), fontWeight: '700', color: '#9D4EDD', letterSpacing: 1 },
  timerContainer: { alignItems: 'center', marginBottom: scaleH(isSmallScreen ? 8 : 14) },
  timerCircle: { width: scaleW(isSmallScreen ? 64 : 76), height: scaleW(isSmallScreen ? 64 : 76), borderRadius: scaleW(isSmallScreen ? 32 : 38), alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(157,78,221,0.4)' },
  timerText: { fontSize: 32, fontWeight: '900', color: '#9D4EDD' },
  timerWarning: { color: '#FF006E' },
  timerLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  cardContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  posterSection: { flex: 1 },
  posterFrame: { borderRadius: 12, padding: 3 },
  poster: { width: '100%', height: 280, borderRadius: 10 },
  forbiddenSection: { flex: 1 },
  forbiddenCard: { borderRadius: 12, padding: 12, borderWidth: 2, borderColor: 'rgba(255,0,110,0.3)' },
  movieTitleContainer: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(157,78,221,0.3)' },
  movieTitle: { fontSize: 16, fontWeight: '900', color: '#9D4EDD', textAlign: 'center', letterSpacing: 0.5 },
  forbiddenHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  forbiddenTitle: { fontSize: 11, fontWeight: '800', color: '#FF006E', letterSpacing: 1 },
  forbiddenItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  forbiddenBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF006E', marginTop: 6 },
  forbiddenWord: { fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
  passContainer: { marginBottom: 12 },
  passButton: { borderRadius: 12, overflow: 'hidden' },
  passButtonDisabled: { opacity: 0.5 },
  passButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  passButtonText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  passButtonTextDisabled: { color: '#999' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  wrongButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  correctButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  actionButtonGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 4 },
  actionButtonText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  actionButtonScore: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  feedbackOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  feedbackContent: { width: '75%', maxWidth: 300, alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30, borderRadius: 28 },
  feedbackText: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 2, marginTop: 16 },
  feedbackSubtext: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 8 },
});

const tabuPremiumStyles = StyleSheet.create({
  bgPoster: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  scoreBoard: {
    borderWidth: 1,
    borderColor: 'rgba(157,78,221,0.3)',
  },
  teamBlock: {
    flex: 1, alignItems: 'center' as const, gap: 4,
  },
  teamAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6, shadowRadius: 6, elevation: 6,
  },
  teamAvatarText: {
    color: '#fff', fontSize: 16, fontWeight: '900' as const,
  },
  teamName: {
    color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' as const,
  },
  teamScore: {
    color: '#fff', fontSize: 28, fontWeight: '900' as const, letterSpacing: -1,
  },
  vsDivider: {
    paddingHorizontal: 8, justifyContent: 'center' as const,
  },
  vsText: {
    color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '800' as const, letterSpacing: 2,
  },
  timerOuter: {
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  timerRing: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    padding: 4,
    shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 12, elevation: 10,
  },
  timerInner: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(15,6,36,0.95)',
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  timerNum: {
    color: '#fff', fontSize: 26, fontWeight: '900' as const, letterSpacing: -1,
  },
  timerSn: {
    color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' as const,
    marginTop: -2,
  },
  timerWarning: {
    color: '#FF006E',
  },
});
