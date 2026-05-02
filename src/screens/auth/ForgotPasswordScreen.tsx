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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { GradientButton } from '../../components';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSendReset = async () => {
    if (!email?.trim()) {
      Alert.alert('Hata', 'Lütfen email adresinizi girin');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
      Alert.alert(
        'Başarılı! ✅', 
        'Şifre sıfırlama email\'i gönderildi!\n\nifilmlik.noreply@gmail.com adresinden gelen email\'i kontrol edin.\n\nSpam klasörünü de kontrol etmeyi unutmayın! 📧'
      );
    } catch (error) {
      Alert.alert('Hata', error?.message ?? 'Email gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.redToPurple} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => navigation?.goBack?.()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>🔐 Şifremi Unuttum</Text>
            <Text style={styles.subtitle}>
              Email adresinizi girin, size şifre sıfırlama linki gönderelim.
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email Adresi"
                placeholderTextColor={colors.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <GradientButton
                title={sent ? 'Tekrar Gönder' : 'Şifre Sıfırlama Email\'i Gönder'}
                onPress={handleSendReset}
                loading={loading}
                style={styles.sendButton}
              />

              <TouchableOpacity
                onPress={() => navigation?.navigate?.('Login')}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>← Giriş Sayfasına Dön</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
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
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sendButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  loginButton: {
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;