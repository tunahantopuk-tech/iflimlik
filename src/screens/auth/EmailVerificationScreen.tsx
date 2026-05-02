import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { GradientButton } from '../../components';

type EmailVerificationScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'EmailVerification'
>;
type EmailVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'EmailVerification'>;

interface Props {
  navigation: EmailVerificationScreenNavigationProp;
  route: EmailVerificationScreenRouteProp;
}

const EmailVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, password, username } = route?.params || {};
  const { register } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(900); // 15 minutes in seconds
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Resend timer
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    // Remove whitespace and non-numeric characters
    const cleanText = text.replace(/[^0-9]/g, '');
    
    if (cleanText.length > 1) {
      // Handle paste
      const pastedCode = cleanText.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      if (index + pastedCode.length < 6) {
        inputRefs.current[index + pastedCode.length]?.focus();
      }
    } else {
      const newCode = [...code];
      newCode[index] = cleanText;
      setCode(newCode);

      if (cleanText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('').trim();

    if (verificationCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu girin');
      return;
    }

    // Validate numeric only
    if (!/^\d{6}$/.test(verificationCode)) {
      Alert.alert('Hata', 'Kod sadece rakamlardan oluşmalıdır');
      return;
    }

    try {
      setLoading(true);
      
      // Step 1: Verify email code with lowercase email
      await authApi.verifyEmail(email.toLowerCase().trim(), verificationCode);
      console.log('✅ Email verified successfully');

      // Step 2: Complete registration
      console.log('📝 Completing registration...', { email, username });
      await register(email, password, username);
      console.log('✅ Registration completed successfully!');

      // Success - auth context will handle navigation to main app
    } catch (error) {
      console.error('❌ Verification or registration failed:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Doğrulama başarısız';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) {
      return;
    }

    try {
      setResendLoading(true);
      await authApi.resendVerificationCode(email);
      setResendTimer(30);
      setTimer(900); // Reset to 15 minutes
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Başarılı', 'Yeni doğrulama kodu gönderildi');
    } catch (error) {
      Alert.alert('Hata', error?.response?.data?.message || 'Kod tekrar gönderilemedi');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" translucent={false} />
      <LinearGradient colors={['#2d2d3d', '#1a1a2e', '#4a1a4a', '#6b1f5c']} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation?.goBack?.()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="mail" size={64} color="#E61806" />
              <Text style={styles.title}>Email Doğrulama</Text>
              <Text style={styles.subtitle}>
                <Text style={styles.emailText}>{email}</Text>
                {' '}adresine 6 haneli doğrulama kodu gönderdik.
              </Text>
              
              {/* Spam Warning */}
              <View style={styles.spamWarning}>
                <Ionicons name="information-circle" size={18} color="#E61806" />
                <Text style={styles.spamWarningText}>
                  Email gelmedi mi? Spam/Gereksiz klasörünü kontrol edin!
                </Text>
              </View>
            </View>

            {/* Code Inputs */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Ionicons
                name="time-outline"
                size={18}
                color={timer < 60 ? '#E61806' : colors.white}
              />
              <Text style={[styles.timerText, timer < 60 && styles.timerTextDanger]}>
                Kod {formatTime(timer)} dakika geçerli
              </Text>
            </View>

            {/* Verify Button */}
            <GradientButton
              title="Doğrula"
              onPress={handleVerify}
              loading={loading}
              style={styles.verifyButton}
            />

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Kod gelmedi mi?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendTimer > 0 || resendLoading}
                style={styles.resendButton}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#E61806" />
                ) : (
                  <Text
                    style={[
                      styles.resendButtonText,
                      (resendTimer > 0 || resendLoading) && styles.resendButtonTextDisabled,
                    ]}
                  >
                    {resendTimer > 0 ? `Tekrar Gönder (${resendTimer}s)` : 'Tekrar Gönder'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    color: '#E61806',
    fontWeight: '600',
  },
  spamWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 24, 6, 0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  spamWarningText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    fontSize: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: '#E61806',
    backgroundColor: 'rgba(230, 24, 6, 0.1)',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  timerText: {
    ...typography.caption,
    color: colors.white,
  },
  timerTextDanger: {
    color: '#E61806',
    fontWeight: '600',
  },
  verifyButton: {
    marginBottom: spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  resendText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendButtonText: {
    ...typography.button,
    color: '#E61806',
    fontSize: 14,
  },
  resendButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

export default EmailVerificationScreen;
