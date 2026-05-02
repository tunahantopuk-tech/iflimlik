import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { lockActivity } from '../../services/activityLockService';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../types';
import { aiApi, ChatMessage, MovieRecommendation } from '../../api/ai';
import { userApi } from '../../api/user';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { tr } from '../../locales/tr';

type ChatScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<HomeStackParamList, 'Chat'>;

interface Props {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

// Parsed part types
interface TextPart { type: 'text'; content: string; }
interface MoviePart { type: 'movie'; content: string; movieData: MovieRecommendation; }
type MessagePart = TextPart | MoviePart;

interface Message extends ChatMessage {
  id: string;
  recommendations?: MovieRecommendation[];
  imageBase64?: string;
  // Cache parsed parts so they don't change between renders
  _cachedParts?: MessagePart[];
}

// ---- Pure parsing function (deterministic) ----
function parseMessageParts(content: string, recommendations: MovieRecommendation[]): MessagePart[] {
  const msgContent = content ?? '';
  const recs = (recommendations ?? []).filter(r => !!r?.poster_path);

  if (!recs?.length) {
    return [{ type: 'text', content: msgContent }];
  }

  const normalize = (s: string) => (s || '').toLowerCase()
    .replace(/[^\w\sğüşıöçâîûêô]/gi, '').replace(/\s+/g, ' ').trim();

  const usedRecIdx = new Set<number>();

  const matchRec = (quotedTitle: string) => {
    const qt = normalize(quotedTitle);
    if (qt.length < 2) return null;

    let bestIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < recs.length; i++) {
      if (usedRecIdx.has(i)) continue;
      const r = recs[i];
      const candidates = [
        normalize(r?.search_query || ''),
        normalize(r?.original_title || ''),
        normalize(r?.original_name || ''),
        normalize(r?.title || ''),
        normalize(r?.name || ''),
      ].filter(c => c.length > 0);

      for (const candidate of candidates) {
        if (candidate === qt) { bestIdx = i; bestScore = 1; break; }
        if (candidate.includes(qt) || qt.includes(candidate)) {
          const score = Math.min(candidate.length, qt.length) / Math.max(candidate.length, qt.length, 1);
          if (score > bestScore && score > 0.3) { bestScore = score; bestIdx = i; }
        }
      }
      if (bestScore === 1) break;
    }

    if (bestIdx >= 0) {
      usedRecIdx.add(bestIdx);
      return recs[bestIdx];
    }
    return null;
  };

  const extractTitle = (line: string): string | null => {
    const m1 = line.match(/["'\u201C\u201D\u2018\u2019]([^"'\u201C\u201D\u2018\u2019]{2,})["'\u201C\u201D\u2018\u2019]/);
    if (m1) return m1[1];
    const m2 = line.match(/\*\*"?([^*"]{2,})"?\*\*/);
    if (m2) return m2[1];
    return null;
  };

  const parts: MessagePart[] = [];
  const lines = msgContent.split('\n');
  let currentText = '';
  let movieBlockText = '';
  let currentMovieData: MovieRecommendation | null = null;

  for (const line of lines) {
    const title = extractTitle(line);
    if (title) {
      const matched = matchRec(title);
      if (matched) {
        if (currentMovieData) {
          parts.push({ type: 'movie', content: movieBlockText.trim(), movieData: currentMovieData });
          movieBlockText = '';
          currentMovieData = null;
        }
        if (currentText.trim()) {
          parts.push({ type: 'text', content: currentText.trim() });
          currentText = '';
        }
        currentMovieData = matched;
        movieBlockText = line + '\n';
        continue;
      }
    }

    if (currentMovieData) {
      if (line.trim() === '') {
        parts.push({ type: 'movie', content: movieBlockText.trim(), movieData: currentMovieData });
        movieBlockText = '';
        currentMovieData = null;
      } else {
        movieBlockText += line + '\n';
      }
    } else {
      currentText += line + '\n';
    }
  }

  if (currentMovieData) {
    parts.push({ type: 'movie', content: movieBlockText.trim(), movieData: currentMovieData });
  }
  if (currentText.trim()) {
    parts.push({ type: 'text', content: currentText.trim() });
  }

  return parts;
}

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const conversationIdParam = route?.params?.conversationId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posterGrid, setPosterGrid] = useState<string[]>([]);

  // Typewriter state
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  // Displayed text for each part being typed: key = "msgId_partIdx"
  const [displayedTexts, setDisplayedTexts] = useState<Record<string, string>>({});
  // How many parts are FULLY revealed (poster can show for completed parts)
  const [fullyRevealedParts, setFullyRevealedParts] = useState<Record<string, number>>({});
  // Which part is currently being typed
  const [currentTypingPart, setCurrentTypingPart] = useState(0);

  const bgFadeAnim = React.useRef(new Animated.Value(0)).current;

  // Poster grid background
  React.useEffect(() => {
    const loadPosterGrid = async () => {
      try {
        const randomPage = Math.floor(Math.random() * 8) + 1;
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=6095875&language=tr-TR&page=${randomPage}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const posters = (data?.results ?? [])
          .filter((m: any) => m?.poster_path)
          .slice(0, 16)
          .map((m: any) => `https://image.tmdb.org/t/p/w185${m.poster_path}`);
        if (posters.length >= 4) {
          for (let i = posters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posters[i], posters[j]] = [posters[j], posters[i]];
          }
          setPosterGrid(posters);
        }
      } catch {}
    };
    loadPosterGrid();
  }, []);

  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(conversationIdParam);

  const scrollViewRef = useRef<ScrollView>(null);
  const tapCountRef = useRef<Record<number, number>>({});
  const tapTimerRef = useRef<Record<number, any>>({});
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd?.({ animated: true });
    }, 80);
  }, []);

  useEffect(() => {
    if (!initialized) {
      loadInitialGreeting();
      setInitialized(true);
    }
  }, [initialized, conversationIdParam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedTexts, fullyRevealedParts]);

  const loadInitialGreeting = async () => {
    setLoading(true);
    try {
      if (conversationIdParam) {
        const conversation = await aiApi.getConversation(conversationIdParam);
        if (conversation?.messages && conversation.messages.length > 0) {
          const loadedMessages: Message[] = conversation.messages.map((msg, index) => ({
            id: index.toString(),
            role: msg.role,
            content: msg.content,
          }));
          setMessages(loadedMessages);
          setConversationId(conversationIdParam);
          setLoading(false);
          return;
        }
      }

      const response = await aiApi.chat('Merhaba', [], conversationIdParam);
      if (response?.conversationId) {
        setConversationId(response.conversationId);
      }
      const aiMessage: Message = {
        id: '0',
        role: 'assistant',
        content: response?.response ?? tr.chat.emptyState,
      };
      setMessages([aiMessage]);
    } catch (error) {
      console.error('Initial greeting error:', error);
      setMessages([{ id: '0', role: 'assistant', content: tr.chat.emptyState }]);
    } finally {
      setLoading(false);
    }
  };

  // Get cached parts for a message (parse once, cache forever)
  const getMessageParts = useCallback((message: Message): MessagePart[] => {
    if (message._cachedParts) return message._cachedParts;
    const parts = parseMessageParts(message.content ?? '', message.recommendations ?? []);
    message._cachedParts = parts;
    return parts;
  }, []);

  // ---- TYPEWRITER ENGINE ----
  // Types one part at a time. After each part's text finishes, reveals the poster (if movie).
  // Uses refs for internal counters to avoid excessive re-renders.
  // Only calls setState in batches (every CHARS_PER_TICK characters) for smooth animation.
  const CHARS_PER_TICK = 3; // characters per frame
  const TICK_INTERVAL = 30; // ms between frames

  const startTypewriter = useCallback((messageId: string, parts: MessagePart[]) => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }

    setTypingMessageId(messageId);
    setCurrentTypingPart(0);
    setFullyRevealedParts(prev => ({ ...prev, [messageId]: 0 }));

    let pIdx = 0;
    let cIdx = 0;

    const tick = () => {
      if (pIdx >= parts.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        setTypingMessageId(null);
        setFullyRevealedParts(prev => ({ ...prev, [messageId]: parts.length }));
        return;
      }

      const currentPart = parts[pIdx];
      const text = currentPart?.content ?? '';

      // Advance multiple characters per tick for speed
      cIdx = Math.min(cIdx + CHARS_PER_TICK, text.length);

      // Update displayed text for this part
      const partKey = `${messageId}_${pIdx}`;
      const slicedText = text.slice(0, cIdx);
      setDisplayedTexts(prev => ({ ...prev, [partKey]: slicedText }));
      setCurrentTypingPart(pIdx);

      if (cIdx >= text.length) {
        // This part done — reveal poster, move to next
        pIdx++;
        cIdx = 0;
        setFullyRevealedParts(prev => ({ ...prev, [messageId]: pIdx }));
        setCurrentTypingPart(pIdx);
      }
    };

    typewriterRef.current = setInterval(tick, TICK_INTERVAL);
  }, []);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  const sendQuestion = async (questionText: string, imageBase64?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: questionText,
      imageBase64: imageBase64,
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiApi.chat(questionText, history, conversationId, imageBase64);

      if (response?.conversationId) {
        setConversationId(response.conversationId);
      }

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: response?.response ?? 'Üzgünüm, yanıt veremiyorum.',
        recommendations: response?.recommendations,
      };

      // Pre-parse and cache parts
      const parts = parseMessageParts(aiMessage.content ?? '', aiMessage.recommendations ?? []);
      aiMessage._cachedParts = parts;

      // Initialize typewriter state BEFORE adding message
      setFullyRevealedParts(prev => ({ ...prev, [aiMessageId]: 0 }));
      setTypingMessageId(aiMessageId);
      setCurrentTypingPart(0);

      setMessages(prev => [...prev, aiMessage]);

      // Start typewriter
      startTypewriter(aiMessageId, parts);

      // Background poster effect
      const firstRec = response?.recommendations?.[0];
      if (firstRec?.poster_path) {
        const newPoster = firstRec?.poster_path ? `https://image.tmdb.org/t/p/w780${firstRec.poster_path}` : null;
        bgFadeAnim.setValue(0);
        Animated.timing(bgFadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
      }
    } catch (error) {
      console.error('Chat error:', error);
      const funnyErrors = [
        'Ay pardon, beynim bir anlığına dondu! 🧊 Bir daha dener misin?',
        'Oops! Sanırım film izlerken uyuyakalmışım 😴 Tekrar söyler misin?',
        'Houston, bir sorunumuz var! 🚀 Ama merak etme, hemen toparlanıyorum. Tekrar dene!',
        'Bağlantım koptu galiba, popcorn\'um mikrodalganın içinde kaldı 🍿 Bir daha dener misin?',
        'Bir saniye... Beyin güncelleme yapıyordu! 🔄 Şimdi hazırım, tekrar yaz!',
      ];
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: funnyErrors[Math.floor(Math.random() * funnyErrors.length)],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.5,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        setSelectedImage(result.assets[0].base64);
      }
    } catch (error) {
      if (__DEV__) console.error('Image pick error:', error);
    }
  };

  const handleSend = async () => {
    if ((!inputText?.trim() && !selectedImage) || loading) return;
    const currentInput = inputText.trim() || '📸 Bu fotoğraftaki film veya diziyi bulabilir misin?';
    const imageToSend = selectedImage;
    setInputText('');
    setSelectedImage(null);
    await sendQuestion(currentInput, imageToSend ?? undefined);
  };

  const handleMoviePress = (id?: number, title?: string, name?: string) => {
    if (id) {
      const type = title ? 'movie' : 'tv';
      navigation?.navigate?.('Detail', { id, type });
    }
  };

  const handleMovieDoubleTap = (movie: MovieRecommendation) => {
    const movieId = movie?.id;
    if (!movieId) return;
    const currentCount = (tapCountRef.current[movieId] || 0) + 1;
    tapCountRef.current[movieId] = currentCount;

    if (tapTimerRef.current[movieId]) clearTimeout(tapTimerRef.current[movieId]);

    if (currentCount === 1) {
      tapTimerRef.current[movieId] = setTimeout(() => {
        tapCountRef.current[movieId] = 0;
        handleMoviePress(movieId, movie?.title, movie?.name);
      }, 300);
    } else if (currentCount === 2) {
      tapCountRef.current[movieId] = 0;
      clearTimeout(tapTimerRef.current[movieId]);
      const type = movie?.title ? 'movie' : 'tv';
      const title = movie?.title || movie?.name || 'Unknown';
      userApi.addToFavorites(movieId, title, movie?.poster_path, type, movie?.vote_average)
        .then(() => Alert.alert('❤️ Favorilere Eklendi', `${title} favorilerinize eklendi!`))
        .catch((error: any) => Alert.alert('Hata', error?.message || 'Film favorilere eklenemedi'));
    }
  };

  // ---- RENDER MESSAGE ----
  const renderMessage = useCallback((message: Message) => {
    const isUser = message.role === 'user';

    if (isUser) {
      return (
        <View key={message.id} style={[styles.messageContainer, styles.userMessageContainer]}>
          <View style={[styles.messageBubble, styles.userBubble]}>
            {message.imageBase64 && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${message.imageBase64}` }}
                style={styles.messageThumbnail}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.messageText, styles.userMessageText]}>
              {message.content}
            </Text>
          </View>
        </View>
      );
    }

    // AI message
    const parts = getMessageParts(message);
    const isThisMessageTyping = typingMessageId === message.id;
    // How many parts are fully done (text fully typed + poster visible)
    const fullyDone = fullyRevealedParts?.[message.id] ?? (isThisMessageTyping ? 0 : parts.length);

    return (
      <View key={message.id} style={styles.messageContainer}>
        {parts.map((part, pIdx) => {
          // Not yet reached this part
          if (pIdx > fullyDone) return null;

          const isPartFullyDone = pIdx < fullyDone;
          const isCurrentlyTypingThisPart = isThisMessageTyping && pIdx === fullyDone && pIdx === currentTypingPart;

          // Determine display text
          let displayText = '';
          if (isPartFullyDone) {
            displayText = part.content ?? '';
          } else if (isCurrentlyTypingThisPart) {
            const partKey = `${message.id}_${pIdx}`;
            displayText = displayedTexts?.[partKey] ?? '';
          } else {
            // This part hasn't started yet
            return null;
          }

          if (part.type === 'text') {
            if (!displayText) return null;
            return (
              <View key={pIdx} style={[styles.messageBubble, styles.aiBubble]}>
                <Text style={styles.messageText}>
                  {displayText}
                  {isCurrentlyTypingThisPart && <Text style={styles.cursor}>▌</Text>}
                </Text>
              </View>
            );
          }

          if (part.type === 'movie') {
            const movieData = part.movieData;
            if (!movieData?.poster_path) return null;

            return (
              <View key={pIdx} style={styles.movieRecommendationBlock}>
                {/* 1) YAZI ÖNCE — daktilo ile yazılır */}
                {displayText ? (
                  <View style={[styles.messageBubble, styles.aiBubble, styles.movieDescriptionBubble]}>
                    <Text style={styles.messageText}>
                      {displayText}
                      {isCurrentlyTypingThisPart && <Text style={styles.cursor}>▌</Text>}
                    </Text>
                  </View>
                ) : null}

                {/* 2) AFİŞ SONRA — sadece yazı bittikten sonra görünür */}
                {isPartFullyDone && (
                  <View style={styles.moviePosterContainer}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleMovieDoubleTap(movieData)}
                    >
                      <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w342${movieData.poster_path}` }}
                        style={chatStyles.moviePoster}
                        resizeMode="cover"
                      />
                      {movieData.overview ? (
                        <View style={chatStyles.movieOverviewBox}>
                          <View style={chatStyles.movieOverviewHeader}>
                            <Text style={chatStyles.movieOverviewTitle} numberOfLines={1}>
                              {movieData.title || movieData.name}
                            </Text>
                            {(movieData.vote_average ?? 0) > 0 && (
                              <View style={chatStyles.movieRatingBadge}>
                                <Ionicons name="star" size={10} color="#FFD700" />
                                <Text style={chatStyles.movieRatingText}>
                                  {movieData.vote_average?.toFixed?.(1) ?? ''}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={chatStyles.movieOverviewText} numberOfLines={2}>
                            {movieData.overview}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                    <Text style={styles.doubleTapHint}>💡 Tıkla: Detay | Çift tıkla: Favorilere ekle</Text>
                  </View>
                )}
              </View>
            );
          }

          return null;
        })}
      </View>
    );
  }, [typingMessageId, currentTypingPart, displayedTexts, fullyRevealedParts, getMessageParts]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.gradient}>
          {/* Poster kolaj arka plan */}
          {posterGrid.length >= 4 && (
            <View style={styles.posterGridBg} pointerEvents="none">
              {posterGrid.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.posterGridItem} resizeMode="cover" />
              ))}
            </View>
          )}
          <View style={styles.posterGridOverlay} pointerEvents="none" />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={async () => {
              if (messages.length > 1) await lockActivity('ifi');
              navigation?.goBack?.();
            }} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.title}>{tr.chat.title}</Text>
              <Text style={styles.subtitle}>Film & Dizi Asistanın</Text>
            </View>
          </View>

          {/* Messages */}
          <View style={styles.chatContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(renderMessage)}

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.loadingText}>{tr.chat.thinking}</Text>
                </View>
              )}
            </ScrollView>

            {/* Hızlı soru butonları */}
            {messages.length <= 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={chatStyles.quickBtnsContainer}
                style={chatStyles.quickBtnsScroll}
              >
                {[
                  { label: '🎬 Film öner', query: 'Bana 5 adet film öner. Sadece FILM öner, dizi önerme.', sendNow: true },
                  { label: '📺 Dizi öner', query: 'Bana 5 adet dizi öner. Sadece DİZİ öner, film önerme.', sendNow: true },
                  { label: '😂 Komedi', query: 'En iyi komedi filmlerinden 5 tanesini öner.', sendNow: true },
                  { label: '😱 Gerilim', query: 'En iyi gerilim filmlerinden 5 tanesini öner.', sendNow: true },
                  { label: '💕 Romantik', query: 'En güzel romantik filmlerden 5 tanesini öner.', sendNow: true },
                  { label: '🔍 Film bul', query: 'Aklımda bir film var ama adını hatırlamıyorum, anlatayım:', sendNow: false },
                  { label: '📸 Fotoğraf tanı', query: null, sendNow: false },
                ].map((btn) => (
                  <TouchableOpacity
                    key={btn.label}
                    style={chatStyles.quickBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (btn.query === null) {
                        handleImagePick();
                      } else if (btn.sendNow) {
                        sendQuestion(btn.query);
                      } else {
                        setInputText(btn.query);
                      }
                    }}
                  >
                    <Text style={chatStyles.quickBtnText}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => setSelectedImage(null)}>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TouchableOpacity onPress={handleImagePick} style={styles.imagePickBtn} disabled={loading}>
                  <Ionicons name="image-outline" size={22} color={selectedImage ? '#FFD700' : 'rgba(255,255,255,0.6)'} />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder={selectedImage ? '📸 Fotoğraf hakkında soru sor...' : tr.chat.placeholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  style={[styles.sendButton, ((!inputText?.trim() && !selectedImage) || loading) && styles.sendButtonDisabled]}
                  disabled={(!inputText?.trim() && !selectedImage) || loading}
                >
                  <Ionicons name="send" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120810' },
  safeArea: { flex: 1 },
  gradient: { flex: 1, backgroundColor: 'rgba(30,15,26,0.97)', position: 'relative' },
  posterGridBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap' },
  posterGridItem: { width: '25%', height: '20%', opacity: 0.2 },
  posterGridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,8,16,0.72)' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: { marginRight: spacing.md },
  headerTitle: { flex: 1 },
  title: { ...typography.h3, color: colors.white, fontWeight: '700' },
  subtitle: { ...typography.caption, color: colors.white },
  chatContainer: { flex: 1 },
  messagesList: { flex: 1 },
  messagesContent: { padding: spacing.md, paddingBottom: spacing.xl },
  messageContainer: { marginBottom: spacing.md, alignItems: 'flex-start' },
  userMessageContainer: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '80%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  aiBubble: {
    backgroundColor: 'rgba(26,16,48,0.92)', borderWidth: 0.5,
    borderColor: '#3a2050', borderTopLeftRadius: 2,
  },
  userBubble: {
    backgroundColor: 'rgba(42,14,24,0.92)', borderWidth: 0.5,
    borderColor: '#5a1a28', borderTopRightRadius: 2,
  },
  messageText: { ...typography.body, color: '#e8dff0' },
  userMessageText: { color: colors.white },
  cursor: { color: '#FFD700' },
  movieRecommendationBlock: { marginBottom: spacing.md, width: '100%' },
  movieDescriptionBubble: { marginBottom: spacing.sm },
  moviePosterContainer: { marginTop: spacing.xs, marginLeft: spacing.md, width: 140 },
  doubleTapHint: { fontSize: 10, color: colors.gray, marginTop: spacing.xs, textAlign: 'center', fontStyle: 'italic' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  loadingText: { ...typography.body, color: colors.white, marginLeft: spacing.sm },
  inputContainer: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  imagePickBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  imagePreviewContainer: { position: 'relative', marginBottom: 8, alignSelf: 'flex-end' },
  imagePreview: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: '#FFD700' },
  imageRemoveBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10 },
  messageThumbnail: { width: 180, height: 120, borderRadius: 8, marginBottom: 6 },
  input: {
    flex: 1, ...typography.body, color: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100, marginRight: spacing.sm,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E61806', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
});

export default ChatScreen;

const chatStyles = StyleSheet.create({
  moviePoster: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#1a1030' },
  movieOverviewBox: {
    backgroundColor: 'rgba(26,16,48,0.95)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    padding: 10, marginTop: -4, borderWidth: 0.5, borderTopWidth: 0, borderColor: '#3a2050',
  },
  movieOverviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  movieOverviewTitle: { color: '#f0e6d0', fontSize: 13, fontWeight: '700', flex: 1 },
  movieRatingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  movieRatingText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  movieOverviewText: { color: 'rgba(224,215,240,0.75)', fontSize: 11, lineHeight: 16 },
  quickBtnsScroll: { maxHeight: 44, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  quickBtnsContainer: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  quickBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
  },
  quickBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
});