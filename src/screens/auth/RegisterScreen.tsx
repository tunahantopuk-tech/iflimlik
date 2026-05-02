import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { GradientButton } from '../../components';
import SocialSignInButtons from '../../components/SocialSignInButtons';
import { authApi } from '../../api/auth';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';
import { tr } from '../../locales/tr';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Şifre güç hesabı
  const passwordStrength = useMemo(() => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Zayıf', color: '#ef4444', width: '33%' };
    if (score <= 2) return { label: 'Orta', color: '#f59e0b', width: '66%' };
    return { label: 'Güçlü', color: '#10b981', width: '100%' };
  }, [password]);

  const handleRegister = async () => {
    console.log('🟢 Register button pressed', { email, username });
    
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      console.log('⚠️ Validation failed: empty fields');
      Alert.alert(tr.common.error, tr.auth.fillAllFields);
      return;
    }

    if (password.length < 8) {
      Alert.alert(tr.common.error, 'Şifre en az 8 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      console.log('📧 Sending email verification code...', { email: email.trim() });
      
      // Send verification code
      await authApi.sendVerificationCode(email.trim());
      
      console.log('✅ Verification code sent! Navigating to EmailVerification screen...');
      
      // Navigate to email verification screen
      navigation.navigate('EmailVerification', {
        email: email.trim(),
        password,
        username: username.trim(),
      });
    } catch (error) {
      console.error('❌ Send verification code failed:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      let errorMessage = error?.response?.data?.message ?? 'Doğrulama kodu gönderilemedi';
      
      // Network hatası
      if (error?.message?.includes('Network') || error?.code === 'ERR_NETWORK') {
        errorMessage = 'İnternet bağlantınızı kontrol edin';
      }
      // Timeout hatası
      else if (error?.message?.includes('timeout')) {
        errorMessage = 'Sunucu yanıt vermiyor, lütfen tekrar deneyin';
      }
      // Email zaten kayıtlı
      else if (error?.response?.status === 409) {
        errorMessage = 'Bu e-posta adresi zaten kayıtlı';
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1a1a2e"
        translucent={false}
      />
      <LinearGradient 
        colors={['#2d2d3d', '#1a1a2e', '#4a1a4a', '#6b1f5c']} 
        style={styles.container}
      >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Image 
              source={require('../../../assets/ifilmlik-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Hesap Oluşturun</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Kullanıcı Adı</Text>
                <TextInput
                  style={styles.input}
                  placeholder="kullanıcı adı"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şifre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="En az 8 karakter"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {passwordStrength && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarBg}>
                      <View style={[styles.strengthBarFill, { width: passwordStrength.width as any, backgroundColor: passwordStrength.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                  </View>
                )}
              </View>

              <GradientButton
                title={tr.auth.register}
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <SocialSignInButtons />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={() => navigation?.navigate?.('Login')}>
                  <Text style={styles.loginLink}>Giriş Yapın</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xl,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  registerButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginText: {
    ...typography.body,
    color: colors.white,
  },
  loginLink: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 44,
    textAlign: 'right',
  },
});

export default RegisterScreen;