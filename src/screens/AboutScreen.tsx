import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';

type AboutScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'About'>;

interface Props {
  navigation: AboutScreenNavigationProp;
}

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <LinearGradient colors={['#0f0624', '#1a0f3e', '#2d1b4e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hakkında</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.appName}>iFilmlik</Text>
            <Text style={styles.version}>Versiyon 1.0.0</Text>
            <Text style={styles.description}>
              Film ve dizi önerileri için en iyi arkadaşınız. Ruh halinize göre
              öneriler alın, oyunlar oynayın ve favori içeriklerinizi keşfedin!
            </Text>
          </View>

          {/* TMDB Attribution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Film ve Dizi Verileri</Text>
            <View style={styles.attributionBox}>
              {/* TMDB Logo - PNG format for React Native compatibility */}
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tmdb.new.logo.svg/512px-Tmdb.new.logo.svg.png' }}
                style={styles.tmdbLogo}
                resizeMode="contain"
              />
              <Text style={styles.attributionText}>
                Bu uygulama TMDB API kullanmaktadır ancak TMDB tarafından
                onaylanmamış veya sertifikalandırılmamıştır.
              </Text>
              <Text style={styles.attributionTextEn}>
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </Text>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => openURL('https://www.themoviedb.org')}
              >
                <Text style={styles.linkText}>www.themoviedb.org</Text>
                <Ionicons name="open-outline" size={16} color="#9D4EDD" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Streaming Services Disclaimer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yayın Platformları</Text>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                Netflix, Prime Video, Disney+, Apple TV+ ve diğer yayın hizmeti
                isimleri, ticari markaları ve logoları ilgili sahiplerinin mülküdür.
                Bu uygulama herhangi bir yayın hizmeti ile bağlantılı, onaylı veya
                desteklenmiş değildir.
              </Text>
              <Text style={styles.disclaimerTextEn}>
                Netflix, Prime Video, Disney+, Apple TV+, and other streaming service
                names, trademarks, and logos are the property of their respective
                owners. This app is not affiliated with, endorsed, or sponsored by
                any streaming service.
              </Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İletişim</Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => openURL('mailto:support@iflimlik.com')}
            >
              <Ionicons name="mail-outline" size={20} color="#9D4EDD" />
              <Text style={styles.contactText}>support@iflimlik.com</Text>
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yasal</Text>
            <TouchableOpacity
              style={styles.legalButton}
              onPress={() => openURL('https://iflimlik.abacusai.app/public/privacy-policy.html')}
            >
              <Text style={styles.legalButtonText}>Gizlilik Politikası</Text>
              <Ionicons name="chevron-forward" size={20} color="#9D4EDD" />
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <View style={styles.footer}>
            <Text style={styles.copyright}>© 2025 iFilmlik</Text>
            <Text style={styles.copyrightSub}>
              Tüm hakları saklıdır. Film ve dizi verileri TMDB tarafından sağlanmaktadır.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  attributionBox: {
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  tmdbLogo: {
    width: 120,
    height: 40,
    alignSelf: 'center',
    marginBottom: 16,
  },
  attributionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  attributionTextEn: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#9D4EDD',
    fontWeight: '600',
  },
  disclaimerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  disclaimerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 12,
  },
  disclaimerTextEn: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(157, 78, 221, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.3)',
  },
  contactText: {
    fontSize: 16,
    color: '#9D4EDD',
    fontWeight: '600',
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  legalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  copyright: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  copyrightSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AboutScreen;
