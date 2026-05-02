import React, { useState } from 'react';
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
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';
import { tr } from '../../locales/tr';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('🟢 Login button pressed', { email });
    
    if (!email?.trim() || !password?.trim()) {
      console.log('⚠️ Validation failed: empty fields');
      Alert.alert(tr.common.error, tr.auth.fillAllFields);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Calling login API...', { 
        email: email.trim(),
        apiUrl: process.env.EXPO_PUBLIC_API_URL 
      });
      await login(email.trim(), password);
      console.log('✅ Login successful!');
    } catch (error) {
      console.error('❌ Login failed:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      let errorMessage = error?.message ?? 'Giriş başarısız oldu';
      
      // Network hatası
      if (error?.message?.includes('Network') || error?.code === 'ERR_NETWORK') {
        errorMessage = 'İnternet bağlantınızı kontrol edin';
      }
      // Timeout hatası
      else if (error?.message?.includes('timeout')) {
        errorMessage = 'Sunucu yanıt vermiyor, lütfen tekrar deneyin';
      }
      // Yanlış şifre/email
      else if (error?.response?.status === 401) {
        errorMessage = 'E-posta veya şifre hatalı';
      }
      
      Alert.alert('Giriş Başarısız', errorMessage);
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Image 
              source={require('../../../assets/ifilmlik-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>{tr.auth.signInToContinue}</Text>

            <View style={styles.form}>
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
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                onPress={() => navigation?.navigate?.('ForgotPassword')}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>{tr.auth.forgotPassword}</Text>
              </TouchableOpacity>

              <GradientButton
                title={tr.auth.login}
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <SocialSignInButtons />

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>{tr.auth.dontHaveAccount} </Text>
                <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                  <Text style={styles.signupLink}>{tr.auth.register}</Text>
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
    paddingTop: spacing.xl,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
  },
  loginButton: {
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signupText: {
    ...typography.body,
    color: colors.white,
  },
  signupLink: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;